import { action, mutation, query } from '../_generated/server';
import { ConvexError } from 'convex/values';
import {
  customAction,
  customCtx,
  customMutation,
  customQuery,
} from 'convex-helpers/server/customFunctions';
import type { QueryCtx, MutationCtx, ActionCtx } from '../_generated/server';
import type { Doc, Id } from '../_generated/dataModel';

/** Custom query that requires authentication */
export const authQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    await AuthenticationRequired({ ctx });
    return {};
  }),
);

/** Custom mutation that requires authentication */
export const authMutation = customMutation(
  mutation,
  customCtx(async (ctx) => {
    await AuthenticationRequired({ ctx });
    return {};
  }),
);

/** Custom action that requires authentication */
export const authAction = customAction(
  action,
  customCtx(async (ctx) => {
    await AuthenticationRequired({ ctx });
    return {};
  }),
);

/** 
 * Checks if the current user is authenticated. Throws if not.
 */
export async function AuthenticationRequired({
  ctx,
}: {
  ctx: QueryCtx | MutationCtx | ActionCtx;
}) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    throw new ConvexError('Not authenticated!');
  }
}

/**
 * Gets the current authenticated user. Must be called after AuthenticationRequired.
 */
export async function getCurrentUser(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError('Not authenticated!');
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .first();

  if (!user) {
    throw new ConvexError('User not found!');
  }

  return user;
}

/**
 * Validates that a user owns a specific conversation
 */
export async function validateConversationOwnership(
  ctx: QueryCtx | MutationCtx,
  conversationId: Id<"conversations">,
  userId: Id<"users">
): Promise<Doc<"conversations">> {
  const conversation = await ctx.db.get(conversationId);
  if (!conversation) {
    throw new ConvexError("Conversation not found");
  }
  
  if (conversation.userId !== userId) {
    throw new ConvexError("Access denied: You don't own this conversation");
  }
  
  return conversation;
}