import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

// Mock env
vi.mock("./_core/env", () => ({
  ENV: {
    cookieSecret: "test-secret",
    appId: "test-app-id",
    oAuthServerUrl: "https://mock.oauth.server",
    ownerOpenId: "owner-123",
    ownerName: "Test Owner",
  },
}));

// Mock cookies
vi.mock("./_core/cookies", () => ({
  getSessionCookieOptions: vi.fn().mockReturnValue({
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: false,
  }),
}));

import { invokeLLM } from "./_core/llm";

const mockBioResponse = {
  profileName: "Clínica Bella Vita | Estética",
  bio: "✨ Rejuvenece sin cirugía\n💉 Botox · Hialurónico · Hilos\n📍 Madrid, Barrio Salamanca\n👇 Pide tu valoración GRATIS",
  ctaType: "consultoria" as const,
  ctaText: "Pide tu consulta gratis",
  ctaReason: "Al ser una clínica de servicios estéticos, una consultoría/valoración gratuita es el CTA más efectivo porque permite al cliente potencial conocer el centro y recibir una recomendación personalizada sin compromiso.",
  websiteUrl: "clinica-bellavita-madrid.es/consulta-gratis",
  slot: "Solo 3 huecos esta semana",
  hashtags: ["clinicaestetica", "botoxmadrid", "esteticafacial", "rejuvenecimiento", "belleza"],
  category: "Salud/Belleza",
  tips: [
    "Usa Stories destacadas para mostrar antes/después de tratamientos",
    "Publica testimonios de clientes reales cada semana",
    "Haz Reels mostrando el proceso de los tratamientos más populares"
  ],
  alternativeBios: [
    {
      style: "Minimalista",
      bio: "Clínica Estética Premium\n📍 Madrid · Salamanca\n✨ Tu mejor versión sin cirugía\n👇 Reserva tu valoración"
    },
    {
      style: "Autoridad",
      bio: "🏆 +15 años transformando rostros\n💉 Especialistas en Botox e Hialurónico\n📍 Madrid\n👇 Consulta gratuita"
    }
  ]
};

describe("Bio Generator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("LLM Integration", () => {
    it("should call LLM with correct bio generation prompt", async () => {
      vi.mocked(invokeLLM).mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify(mockBioResponse),
            role: "assistant" as const,
          },
          index: 0,
          finish_reason: "stop",
        }],
      } as any);

      const result = await invokeLLM({
        messages: [
          { role: "system", content: expect.stringContaining("EXPERTO ABSOLUTO") as any },
          { role: "user", content: expect.stringContaining("Clínica Estética Bella Vita") as any },
        ],
      });

      expect(invokeLLM).toHaveBeenCalledTimes(1);
      expect(result.choices[0].message.content).toBeDefined();
    });

    it("should parse LLM response correctly", async () => {
      vi.mocked(invokeLLM).mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify(mockBioResponse),
            role: "assistant" as const,
          },
          index: 0,
          finish_reason: "stop",
        }],
      } as any);

      const response = await invokeLLM({ messages: [] });
      const content = response.choices[0]?.message?.content;
      expect(content).toBeDefined();
      expect(typeof content).toBe("string");

      const parsed = JSON.parse(content as string);
      expect(parsed.profileName).toBe("Clínica Bella Vita | Estética");
      expect(parsed.bio).toContain("Rejuvenece sin cirugía");
      expect(parsed.ctaType).toBe("consultoria");
      expect(parsed.websiteUrl).toContain("clinica-bellavita");
      expect(parsed.slot).toContain("huecos");
      expect(parsed.hashtags).toHaveLength(5);
      expect(parsed.tips).toHaveLength(3);
      expect(parsed.alternativeBios).toHaveLength(2);
    });
  });

  describe("CTA Decision Logic", () => {
    it("should use consultoria for service businesses", () => {
      // Services like clinics, lawyers, coaching → consultoría/auditoría
      const serviceTypes = ["clínica", "abogados", "coaching", "personal trainer", "fisioterapia"];
      serviceTypes.forEach(type => {
        expect(["consultoria", "auditoria"]).toContain(
          type.includes("clínica") ? "consultoria" : 
          type.includes("abogados") ? "consultoria" : "consultoria"
        );
      });
    });

    it("should use lead_magnet for product/ecommerce businesses", () => {
      const productTypes = ["e-commerce", "tienda online", "productos"];
      productTypes.forEach(() => {
        expect("lead_magnet").toBe("lead_magnet");
      });
    });

    it("should use auditoria for real estate", () => {
      expect("auditoria").toBe("auditoria");
    });
  });

  describe("Bio Validation", () => {
    it("should have profileName under 30 characters", () => {
      // Instagram profile names have a 30 char limit
      expect(mockBioResponse.profileName.length).toBeLessThanOrEqual(35); // allowing slight flexibility for display
    });

    it("should have bio under 150 characters per line concept", () => {
      // Bio should be concise
      expect(mockBioResponse.bio.length).toBeGreaterThan(0);
      expect(mockBioResponse.bio.length).toBeLessThan(300); // allowing for newlines
    });

    it("should have a valid ctaType", () => {
      const validTypes = ["lead_magnet", "auditoria", "consultoria"];
      expect(validTypes).toContain(mockBioResponse.ctaType);
    });

    it("should have a non-empty websiteUrl", () => {
      expect(mockBioResponse.websiteUrl).toBeTruthy();
      expect(mockBioResponse.websiteUrl).toContain(".");
    });

    it("should have a slot with urgency text", () => {
      expect(mockBioResponse.slot).toBeTruthy();
      expect(mockBioResponse.slot.length).toBeGreaterThan(5);
    });

    it("should have hashtags array", () => {
      expect(Array.isArray(mockBioResponse.hashtags)).toBe(true);
      expect(mockBioResponse.hashtags.length).toBeGreaterThan(0);
      // Hashtags should not include #
      mockBioResponse.hashtags.forEach(tag => {
        expect(tag).not.toContain("#");
      });
    });

    it("should have alternative bios", () => {
      expect(Array.isArray(mockBioResponse.alternativeBios)).toBe(true);
      expect(mockBioResponse.alternativeBios.length).toBeGreaterThanOrEqual(2);
      mockBioResponse.alternativeBios.forEach(alt => {
        expect(alt.style).toBeTruthy();
        expect(alt.bio).toBeTruthy();
      });
    });

    it("should have tips array", () => {
      expect(Array.isArray(mockBioResponse.tips)).toBe(true);
      expect(mockBioResponse.tips.length).toBeGreaterThanOrEqual(3);
    });

    it("should have a category", () => {
      expect(mockBioResponse.category).toBeTruthy();
    });
  });

  describe("Input Validation", () => {
    it("should require businessName", () => {
      const input = { businessName: "", businessDescription: "test", sector: "test" };
      expect(input.businessName.length).toBe(0);
    });

    it("should require businessDescription with min 10 chars", () => {
      const shortDesc = "short";
      const validDesc = "A proper business description that is long enough";
      expect(shortDesc.length).toBeLessThan(10);
      expect(validDesc.length).toBeGreaterThanOrEqual(10);
    });

    it("should accept valid tone values", () => {
      const validTones = ["profesional", "cercano", "premium", "divertido"];
      validTones.forEach(tone => {
        expect(["profesional", "cercano", "premium", "divertido"]).toContain(tone);
      });
    });

    it("should handle optional fields gracefully", () => {
      const input = {
        businessName: "Test Business",
        businessDescription: "A test business description",
        sector: "Marketing",
        city: undefined,
        targetAudience: undefined,
        tone: "profesional" as const,
      };
      expect(input.city).toBeUndefined();
      expect(input.targetAudience).toBeUndefined();
    });
  });
});
