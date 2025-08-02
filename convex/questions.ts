import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getNextQuestionForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // 1. Check for today's daily question first
    const dailyQuestion = await ctx.db
      .query("questions")
      .withIndex("by_daily", (q) => q.eq("isDaily", true).eq("dailyDate", today))
      .first();

    if (dailyQuestion) {
      // Check if user has already answered today's daily question
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

    // 2. Get all questions user has answered
    const answeredQuestions = await ctx.db
      .query("user_answered_questions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const answeredQuestionIds = new Set(answeredQuestions.map(aq => aq.questionId));

    // 3. Get all questions
    const allQuestions = await ctx.db
      .query("questions")
      .collect();

    // 4. Filter to unanswered questions
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
export const createQuestion = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    tags: v.array(v.string()),
    isDaily: v.boolean(),
    dailyDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("questions", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const getQuestion = query({
  args: { questionId: v.id("questions") },
  handler: async (ctx, { questionId }) => {
    return await ctx.db.get(questionId);
  },
});

export const updateQuestion = mutation({
  args: {
    questionId: v.id("questions"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isDaily: v.optional(v.boolean()),
    dailyDate: v.optional(v.string()),
  },
  handler: async (ctx, { questionId, ...updates }) => {
    return await ctx.db.patch(questionId, updates);
  },
});

export const deleteQuestion = mutation({
  args: { questionId: v.id("questions") },
  handler: async (ctx, { questionId }) => {
    return await ctx.db.delete(questionId);
  },
});

export const listAllQuestions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("questions").collect();
  },
});