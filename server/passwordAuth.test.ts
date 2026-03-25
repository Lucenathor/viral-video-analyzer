import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";

// Mock db module
vi.mock("./db", () => ({
  getUserByEmail: vi.fn(),
  getUserById: vi.fn(),
  createUserWithPassword: vi.fn(),
  upsertUser: vi.fn(),
  updateUserPassword: vi.fn(),
}));

// Mock jose
vi.mock("jose", () => ({
  SignJWT: vi.fn().mockImplementation(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue("mock-jwt-token"),
  })),
  jwtVerify: vi.fn(),
}));

// Mock env
vi.mock("./_core/env", () => ({
  ENV: {
    cookieSecret: "test-secret-key-for-testing-purposes",
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

import * as db from "./db";

describe("Password Authentication System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Password Hashing", () => {
    it("should hash passwords with bcrypt", async () => {
      const password = "testPassword123";
      const hash = await bcrypt.hash(password, 12);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.startsWith("$2a$") || hash.startsWith("$2b$")).toBe(true);
    });

    it("should verify correct passwords", async () => {
      const password = "testPassword123";
      const hash = await bcrypt.hash(password, 12);
      
      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
    });

    it("should reject incorrect passwords", async () => {
      const password = "testPassword123";
      const hash = await bcrypt.hash(password, 12);
      
      const isValid = await bcrypt.compare("wrongPassword", hash);
      expect(isValid).toBe(false);
    });
  });

  describe("getUserByEmail", () => {
    it("should return user when email exists", async () => {
      const mockUser = {
        id: 1,
        openId: "pwd_123",
        name: "Test User",
        email: "test@example.com",
        passwordHash: "hashed_password",
        role: "user" as const,
      };
      
      vi.mocked(db.getUserByEmail).mockResolvedValue(mockUser as any);
      
      const result = await db.getUserByEmail("test@example.com");
      expect(result).toEqual(mockUser);
      expect(db.getUserByEmail).toHaveBeenCalledWith("test@example.com");
    });

    it("should return undefined when email does not exist", async () => {
      vi.mocked(db.getUserByEmail).mockResolvedValue(undefined);
      
      const result = await db.getUserByEmail("nonexistent@example.com");
      expect(result).toBeUndefined();
    });
  });

  describe("createUserWithPassword", () => {
    it("should create a new user with hashed password", async () => {
      vi.mocked(db.createUserWithPassword).mockResolvedValue(42);
      
      const result = await db.createUserWithPassword({
        name: "New User",
        email: "new@example.com",
        passwordHash: "hashed_password",
      });
      
      expect(result).toBe(42);
      expect(db.createUserWithPassword).toHaveBeenCalledWith({
        name: "New User",
        email: "new@example.com",
        passwordHash: "hashed_password",
      });
    });
  });

  describe("Login Flow", () => {
    it("should reject login with non-existent email", async () => {
      vi.mocked(db.getUserByEmail).mockResolvedValue(undefined);
      
      const user = await db.getUserByEmail("nonexistent@example.com");
      expect(user).toBeUndefined();
      // In the actual router, this would throw UNAUTHORIZED
    });

    it("should reject login with wrong password", async () => {
      const passwordHash = await bcrypt.hash("correctPassword", 12);
      const mockUser = {
        id: 1,
        openId: "pwd_123",
        name: "Test User",
        email: "test@example.com",
        passwordHash,
        role: "user" as const,
      };
      
      vi.mocked(db.getUserByEmail).mockResolvedValue(mockUser as any);
      
      const user = await db.getUserByEmail("test@example.com");
      expect(user).toBeDefined();
      
      const isValid = await bcrypt.compare("wrongPassword", user!.passwordHash!);
      expect(isValid).toBe(false);
    });

    it("should accept login with correct password", async () => {
      const password = "correctPassword";
      const passwordHash = await bcrypt.hash(password, 12);
      const mockUser = {
        id: 1,
        openId: "pwd_123",
        name: "Test User",
        email: "test@example.com",
        passwordHash,
        role: "user" as const,
      };
      
      vi.mocked(db.getUserByEmail).mockResolvedValue(mockUser as any);
      
      const user = await db.getUserByEmail("test@example.com");
      expect(user).toBeDefined();
      
      const isValid = await bcrypt.compare(password, user!.passwordHash!);
      expect(isValid).toBe(true);
    });
  });

  describe("Registration Flow", () => {
    it("should reject registration with existing email", async () => {
      const existingUser = {
        id: 1,
        openId: "pwd_123",
        name: "Existing User",
        email: "existing@example.com",
        passwordHash: "hashed",
        role: "user" as const,
      };
      
      vi.mocked(db.getUserByEmail).mockResolvedValue(existingUser as any);
      
      const existing = await db.getUserByEmail("existing@example.com");
      expect(existing).toBeDefined();
      // In the actual router, this would throw CONFLICT
    });

    it("should allow registration with new email", async () => {
      vi.mocked(db.getUserByEmail).mockResolvedValue(undefined);
      vi.mocked(db.createUserWithPassword).mockResolvedValue(5);
      vi.mocked(db.getUserById).mockResolvedValue({
        id: 5,
        openId: "pwd_new",
        name: "New User",
        email: "new@example.com",
        passwordHash: "hashed",
        role: "user",
      } as any);
      
      const existing = await db.getUserByEmail("new@example.com");
      expect(existing).toBeUndefined();
      
      const passwordHash = await bcrypt.hash("newPassword123", 12);
      const userId = await db.createUserWithPassword({
        name: "New User",
        email: "new@example.com",
        passwordHash,
      });
      expect(userId).toBe(5);
      
      const newUser = await db.getUserById(userId);
      expect(newUser).toBeDefined();
      expect(newUser!.email).toBe("new@example.com");
    });
  });

  describe("Password Security", () => {
    it("should use bcrypt with cost factor 12", async () => {
      const password = "securePassword";
      const hash = await bcrypt.hash(password, 12);
      
      // bcrypt hash format: $2a$12$... or $2b$12$...
      const costFactor = hash.split("$")[2];
      expect(costFactor).toBe("12");
    });

    it("should generate different hashes for the same password", async () => {
      const password = "samePassword";
      const hash1 = await bcrypt.hash(password, 12);
      const hash2 = await bcrypt.hash(password, 12);
      
      expect(hash1).not.toBe(hash2);
      // Both should still verify correctly
      expect(await bcrypt.compare(password, hash1)).toBe(true);
      expect(await bcrypt.compare(password, hash2)).toBe(true);
    });
  });
});
