import { describe, it, expect } from "vitest";
import { GoogleGenAI } from "@google/genai";

describe("Gemini Direct API", () => {
  it("should have GEMINI_API_KEY configured", () => {
    const key = process.env.GEMINI_API_KEY;
    expect(key).toBeTruthy();
    expect(key!.length).toBeGreaterThan(10);
  });

  it("should connect to Gemini API with valid key", async () => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY not set");
    
    const ai = new GoogleGenAI({ apiKey: key });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: "Reply with just the word OK" }] }],
    });
    
    expect(response.text).toBeTruthy();
    expect(response.text!.toLowerCase()).toContain("ok");
  }, 30000);
});
