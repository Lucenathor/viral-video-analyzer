import { describe, it, expect } from "vitest";
import * as db from "./db";

describe("User Management", () => {
  describe("Database Functions", () => {
    it("getAllUsers returns an array", async () => {
      const users = await db.getAllUsers();
      expect(Array.isArray(users)).toBe(true);
    });

    it("getAllUsers returns users with expected fields", async () => {
      const users = await db.getAllUsers();
      if (users.length > 0) {
        const user = users[0];
        expect(user).toHaveProperty("id");
        expect(user).toHaveProperty("name");
        expect(user).toHaveProperty("email");
        expect(user).toHaveProperty("role");
        expect(user).toHaveProperty("createdAt");
        expect(user).toHaveProperty("lastSignedIn");
        // Should have openId for owner check
        expect(user).toHaveProperty("openId");
      }
    });

    it("getAllUsers returns users with valid role values", async () => {
      const users = await db.getAllUsers();
      for (const user of users) {
        expect(["admin", "user"]).toContain(user.role);
      }
    });

    it("getAdminCount returns a non-negative number", async () => {
      const count = await db.getAdminCount();
      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it("getTotalUserCount returns a non-negative number", async () => {
      const count = await db.getTotalUserCount();
      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it("admin count should be less than or equal to total user count", async () => {
      const adminCount = await db.getAdminCount();
      const totalCount = await db.getTotalUserCount();
      expect(adminCount).toBeLessThanOrEqual(totalCount);
    });

    it("getUserById returns undefined for non-existent user", async () => {
      const user = await db.getUserById(999999);
      expect(user).toBeUndefined();
    });

    it("getUserById returns user with valid structure for existing user", async () => {
      const users = await db.getAllUsers();
      if (users.length > 0) {
        const user = await db.getUserById(users[0].id);
        expect(user).toBeDefined();
        expect(user!.id).toBe(users[0].id);
        expect(user!.role).toBeDefined();
      }
    });
  });

  describe("Role Validation", () => {
    it("owner should always be admin", async () => {
      const ownerOpenId = process.env.OWNER_OPEN_ID;
      if (ownerOpenId) {
        const owner = await db.getUserByOpenId(ownerOpenId);
        if (owner) {
          expect(owner.role).toBe("admin");
        }
      }
    });

    it("getAllUsers sorted by lastSignedIn descending", async () => {
      const users = await db.getAllUsers();
      if (users.length >= 2) {
        for (let i = 0; i < users.length - 1; i++) {
          const current = new Date(users[i].lastSignedIn).getTime();
          const next = new Date(users[i + 1].lastSignedIn).getTime();
          expect(current).toBeGreaterThanOrEqual(next);
        }
      }
    });
  });
});
