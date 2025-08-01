import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table with stats tracking
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  // Questions table with categorization and tagging
  questions: defineTable({
    title: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("politics"), 
      v.literal("economics"), 
      v.literal("technology"), 
      v.literal("society"), 
      v.literal("ethics")
    ),
    tags: v.array(v.string()),
    difficulty: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_difficulty", ["difficulty"])
    .index("by_active", ["isActive"]),

  // Conversations table with proper indexing
  conversations: defineTable({
    userId: v.id("users"),
    questionId: v.id("questions"),
    status: v.union(v.literal("active"), v.literal("completed")),
    messageCount: v.number(),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_question", ["questionId"]),

  // Messages table with conversation relationships
  messages: defineTable({
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    timestamp: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_conversation_timestamp", ["conversationId", "timestamp"]),

  // Reports table for AI-generated analysis
  reports: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    questionId: v.id("questions"),
    analysis: v.string(),
    strengths: v.array(v.string()),
    improvements: v.array(v.string()),
    followUpQuestions: v.array(v.string()),
    reasoning_score: v.number(),
    clarity_score: v.number(),
    depth_score: v.number(),
    generatedAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_user", ["userId"]),

  // Junction table for tracking answered questions with compound indexing
  user_answered_questions: defineTable({
    userId: v.id("users"),
    questionId: v.id("questions"),
    conversationId: v.id("conversations"),
    answeredAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_question", ["userId", "questionId"])
    .index("by_question", ["questionId"]),
});
