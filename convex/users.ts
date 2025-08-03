import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { authQuery, authMutation, getCurrentUser as getCurrentUserHelper } from "./lib/auth";


// Get current user stats
export const getUserStats = authQuery({
  args: {},
  handler: async (ctx) => {
    // Auth is guaranteed, get current user
    const user = await getCurrentUserHelper(ctx);
    return user;
  },
});


// Internal mutation for webhook handling
export const createUserFromWebhook = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists (idempotency)
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", q => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      console.log(`User already exists for Clerk ID: ${args.clerkId}`);
      return existing._id;
    }

    // Create new user with default 'user' role
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      role: "user", // Default role for new users
      createdAt: Date.now(),
    });

    return userId;
  },
});

// Update user profile
export const updateProfile = authMutation({
  args: {
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Auth is guaranteed, get current user
    const user = await getCurrentUserHelper(ctx);
    
    await ctx.db.patch(user._id, {
      name: args.name,
    });

    return { success: true };
  },
});

// Get current authenticated user (note: this exports a query, the helper function is in auth.ts)
export const getCurrentUser = authQuery({
  args: {},
  handler: async (ctx) => {
    // Auth is guaranteed, get current user using the helper
    return await getCurrentUserHelper(ctx);
  },
});

// Check if current user is admin
export const isCurrentUserAdmin = authQuery({
  args: {},
  handler: async (ctx) => {
    // Auth is guaranteed, get current user
    const user = await getCurrentUserHelper(ctx);
    return user.role === "admin";
  },
});

