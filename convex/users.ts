import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";


// Get current user stats
export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", q => q.eq("clerkId", identity.subject))
      .first();

    // If user doesn't exist, return null - they need to trigger a mutation first
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

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      createdAt: Date.now(),
    });

    return userId;
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", q => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }
    
    await ctx.db.patch(user._id, {
      name: args.name,
    });

    return { success: true };
  },
});

