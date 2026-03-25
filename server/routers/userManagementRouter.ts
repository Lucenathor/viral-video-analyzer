/**
 * User Management Router - Admin endpoints for managing users and roles
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { ENV } from "../_core/env";
import * as db from "../db";

// Admin-only procedure - checks role or owner
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin' && ctx.user.openId !== ENV.ownerOpenId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Solo los administradores pueden acceder a esta función',
    });
  }
  return next({ ctx });
});

export const userManagementRouter = router({
  /**
   * Get all users with their roles
   */
  getUsers: adminProcedure.query(async () => {
    const users = await db.getAllUsers();
    return users.map(u => ({
      ...u,
      isOwner: u.openId === ENV.ownerOpenId,
    }));
  }),

  /**
   * Get admin stats (total users, admins count)
   */
  getStats: adminProcedure.query(async () => {
    const totalUsers = await db.getTotalUserCount();
    const adminCount = await db.getAdminCount();
    return {
      totalUsers,
      adminCount,
      regularUsers: totalUsers - adminCount,
    };
  }),

  /**
   * Promote a user to admin
   */
  promoteToAdmin: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Get the target user
      const targetUser = await db.getUserById(input.userId);
      if (!targetUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Usuario no encontrado',
        });
      }

      // Already admin?
      if (targetUser.role === 'admin') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Este usuario ya es administrador',
        });
      }

      await db.updateUserRole(input.userId, 'admin');
      console.log(`[Admin] User ${ctx.user.name} promoted user ${targetUser.name} (ID: ${input.userId}) to admin`);
      
      return { success: true, message: `${targetUser.name || 'Usuario'} ahora es administrador` };
    }),

  /**
   * Demote an admin to regular user
   */
  demoteToUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Get the target user
      const targetUser = await db.getUserById(input.userId);
      if (!targetUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Usuario no encontrado',
        });
      }

      // Can't demote the owner
      if (targetUser.openId === ENV.ownerOpenId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No se puede quitar el rol de admin al propietario de la plataforma',
        });
      }

      // Can't demote yourself
      if (targetUser.id === ctx.user.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No puedes quitarte el rol de admin a ti mismo',
        });
      }

      // Not admin?
      if (targetUser.role !== 'admin') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Este usuario no es administrador',
        });
      }

      await db.updateUserRole(input.userId, 'user');
      console.log(`[Admin] User ${ctx.user.name} demoted user ${targetUser.name} (ID: ${input.userId}) to user`);
      
      return { success: true, message: `${targetUser.name || 'Usuario'} ya no es administrador` };
    }),
});
