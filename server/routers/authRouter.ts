/**
 * Auth Router - Simple username/password authentication
 */
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { SignJWT } from "jose";
import { ENV } from "../_core/env";
import bcrypt from "bcryptjs";
import * as db from "../db";

function getSessionSecret() {
  return new TextEncoder().encode(ENV.cookieSecret);
}

async function createSessionToken(userId: number, name: string): Promise<string> {
  const secretKey = getSessionSecret();
  const expiresInMs = ONE_YEAR_MS;
  const expirationSeconds = Math.floor((Date.now() + expiresInMs) / 1000);

  return new SignJWT({
    userId,
    name,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(secretKey);
}

export const authRouter = router({
  /**
   * Get current user
   */
  me: publicProcedure.query(opts => opts.ctx.user),

  /**
   * Login with email and password
   */
  login: publicProcedure
    .input(z.object({
      email: z.string().email("Email no válido"),
      password: z.string().min(1, "La contraseña es obligatoria"),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await db.getUserByEmail(input.email);
      
      if (!user || !user.passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Email o contraseña incorrectos",
        });
      }

      const isValid = await bcrypt.compare(input.password, user.passwordHash);
      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Email o contraseña incorrectos",
        });
      }

      // Update last signed in
      await db.upsertUser({
        openId: user.openId,
        lastSignedIn: new Date(),
      });

      // Create session token
      const sessionToken = await createSessionToken(user.id, user.name || "");
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    }),

  /**
   * Register a new account
   */
  register: publicProcedure
    .input(z.object({
      name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
      email: z.string().email("Email no válido"),
      password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if email already exists
      const existing = await db.getUserByEmail(input.email);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Ya existe una cuenta con este email",
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(input.password, 12);

      // Create user
      const userId = await db.createUserWithPassword({
        name: input.name,
        email: input.email,
        passwordHash,
      });

      // Get the created user
      const user = await db.getUserById(userId);
      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error al crear la cuenta",
        });
      }

      // Create session token and set cookie
      const sessionToken = await createSessionToken(user.id, user.name || "");
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    }),

  /**
   * Logout - clear session cookie
   */
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
});
