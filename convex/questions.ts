import { query } from "./_generated/server";
import { v } from "convex/values";

export const getNextQuestionForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // 1. Check for today's daily question first
    const dailyQuestion = await ctx.db
      .query("questions")
      .withIndex("by_daily", (q) => q.eq("isDaily", true).eq("dailyDate", today))
      .filter((q) => q.eq(q.field("isActive"), true))
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

    // 3. Get all active questions
    const allQuestions = await ctx.db
      .query("questions")
      .withIndex("by_active", (q) => q.eq("isActive", true))
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