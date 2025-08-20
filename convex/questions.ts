import { v } from "convex/values";
import { authQuery, authMutation, getCurrentUser } from "./lib/auth";

export const getNextQuestionForUser = authQuery({
  args: {},
  handler: async (ctx) => {
    // Auth is guaranteed, get current user
    const user = await getCurrentUser(ctx);
    const userId = user._id;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // 1. Check for today's daily question first (with efficient compound index)
    const dailyQuestion = await ctx.db
      .query("questions")
      .withIndex("by_daily", (q) => q.eq("isDaily", true).eq("dailyDate", today))
      .first();

    if (dailyQuestion) {
      // Check if user has already answered today's daily question (O(log n) lookup)
      const hasAnswered = await ctx.db
        .query("user_answered_questions")
        .withIndex("by_user_answered", (q) => 
          q.eq("userId", userId).eq("questionId", dailyQuestion._id)
        )
        .first();

      if (!hasAnswered) {
        return {
          type: "daily",
          question: dailyQuestion,
          message: "Here's today's featured question"
        };
      }
    }

    // 2. Batch retrieval: Get all questions user has answered efficiently
    const answeredQuestions = await ctx.db
      .query("user_answered_questions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Extract question IDs for efficient filtering
    const answeredQuestionIds = new Set(answeredQuestions.map(aq => aq.questionId));

    // 3. Get all questions (cached by Convex automatically)
    const allQuestions = await ctx.db
      .query("questions")
      .collect();

    // 4. Client-side filtering: Filter to unanswered questions using Set for O(1) lookup
    const unansweredQuestions = allQuestions.filter(q => !answeredQuestionIds.has(q._id));

    if (unansweredQuestions.length === 0) {
      return {
        type: "completed",
        question: null,
        message: "Congratulations! You've answered all available questions. Check back later for new content."
      };
    }

    // 5. Deterministic randomization using userId + date
    const seed = `${userId}_${today}`;
    const hash = seed.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const randomIndex = Math.abs(hash) % unansweredQuestions.length;
    const selectedQuestion = unansweredQuestions[randomIndex];

    return {
      type: "random",
      question: selectedQuestion,
      message: "Here's a question for you to explore"
    };
  },
});

// CRUD Operations for Admin Dashboard
export const createQuestion = authMutation({
  args: {
    title: v.string(),
    isDaily: v.boolean(),
    dailyDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Auth is guaranteed - in a full implementation, you might want to check for admin role here
    return await ctx.db.insert("questions", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const getQuestion = authQuery({
  args: { questionId: v.id("questions") },
  handler: async (ctx, { questionId }) => {
    // Auth is guaranteed
    return await ctx.db.get(questionId);
  },
});

export const updateQuestion = authMutation({
  args: {
    questionId: v.id("questions"),
    title: v.optional(v.string()),
    isDaily: v.optional(v.boolean()),
    dailyDate: v.optional(v.string()),
  },
  handler: async (ctx, { questionId, ...updates }) => {
    // Auth is guaranteed - in a full implementation, you might want to check for admin role here
    return await ctx.db.patch(questionId, updates);
  },
});

export const deleteQuestion = authMutation({
  args: { questionId: v.id("questions") },
  handler: async (ctx, { questionId }) => {
    // Auth is guaranteed - in a full implementation, you might want to check for admin role here
    return await ctx.db.delete(questionId);
  },
});

export const listAllQuestions = authQuery({
  args: {},
  handler: async (ctx) => {
    // Auth is guaranteed - in a full implementation, you might want to check for admin role here
    return await ctx.db.query("questions").collect();
  },
});