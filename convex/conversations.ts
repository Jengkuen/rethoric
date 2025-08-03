import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { authQuery, authMutation, getCurrentUser, validateConversationOwnership } from "./lib/auth";

// Start a new conversation with question selection  
export const startNewConversation = authMutation({
  args: {
    questionId: v.id("questions"),
  },
  handler: async (ctx, { questionId }) => {
    // Auth is guaranteed, get user when needed
    const user = await getCurrentUser(ctx);
    
    // Get the question
    const question = await ctx.db.get(questionId);
    if (!question) {
      throw new Error("Question not found");
    }

    // Create the conversation
    const conversationId = await ctx.db.insert("conversations", {
      userId: user._id,
      questionId,
      status: "active",
      startedAt: Date.now(),
    });

    // Add the initial system message with the question
    await ctx.db.insert("messages", {
      conversationId,
      role: "assistant",
      content: `**${question.title}**\n\n${question.description}`,
      timestamp: Date.now(),
    });

    return {
      conversationId,
      question,
    };
  },
});

// Add a message to an existing conversation
export const addMessage = authMutation({
  args: {
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  },
  handler: async (ctx, { conversationId, role, content }) => {
    // Auth is guaranteed, get user when needed
    const user = await getCurrentUser(ctx);
    
    // Validate conversation ownership
    const conversation = await validateConversationOwnership(ctx, conversationId, user._id);
    
    if (conversation.status !== "active") {
      throw new Error("Cannot add messages to completed conversation");
    }

    // Validate content is not empty
    if (!content.trim()) {
      throw new Error("Message content cannot be empty");
    }

    // Insert the message
    const messageId = await ctx.db.insert("messages", {
      conversationId,
      role,
      content: content.trim(),
      timestamp: Date.now(),
    });

    return messageId;
  },
});

// Get messages for a conversation
export const getConversationMessages = authQuery({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, { conversationId }) => {
    // Auth is guaranteed, get user when needed
    const user = await getCurrentUser(ctx);
    
    // Validate conversation ownership
    const conversation = await validateConversationOwnership(ctx, conversationId, user._id);

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_timestamp", (q) => 
        q.eq("conversationId", conversationId)
      )
      .order("asc")
      .collect();

    // Get the question details
    const question = await ctx.db.get(conversation.questionId);

    return {
      messages,
      conversation: {
        ...conversation,
        question,
      },
    };
  },
});

// Get conversations for current user
export const getUserConversations = authQuery({
  args: {
    status: v.optional(v.union(v.literal("active"), v.literal("completed"))),
  },
  handler: async (ctx, { status }) => {
    // Auth is guaranteed, get user when needed
    const user = await getCurrentUser(ctx);
    
    const conversations = status 
      ? await ctx.db
          .query("conversations")
          .withIndex("by_user_status", (q) => 
            q.eq("userId", user._id).eq("status", status)
          )
          .order("desc")
          .collect()
      : await ctx.db
          .query("conversations")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .order("desc")
          .collect();

    // Enrich conversations with question data
    const enrichedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        const question = await ctx.db.get(conversation.questionId);
        return {
          ...conversation,
          question,
        };
      })
    );

    return enrichedConversations;
  },
});

// Update conversation status
export const updateConversationStatus = authMutation({
  args: {
    conversationId: v.id("conversations"),
    status: v.union(v.literal("active"), v.literal("completed")),
  },
  handler: async (ctx, { conversationId, status }) => {
    // Auth is guaranteed, get user when needed
    const user = await getCurrentUser(ctx);
    
    // Validate conversation ownership
    const conversation = await validateConversationOwnership(ctx, conversationId, user._id);

    const updates: any = { status };
    
    // If completing the conversation, set completion timestamp
    if (status === "completed" && conversation.status === "active") {
      updates.completedAt = Date.now();
      
      // Mark the question as answered by this user
      await ctx.db.insert("user_answered_questions", {
        userId: conversation.userId,
        questionId: conversation.questionId,
        conversationId,
        answeredAt: Date.now(),
      });
    }

    await ctx.db.patch(conversationId, updates);

    return { success: true };
  },
});