import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { Agent, createTool } from "@convex-dev/agent";
import { google } from "@ai-sdk/google";
import { componentsGeneric } from "convex/server";
import { z } from "zod";

// Agent tools for conversation analysis and guidance (Phase 4.2)
const agentTools = {
  analyzeConversation: createTool({
    description:
      "Analyze recent messages to gauge conversation depth and suggest follow-up questions.",
    args: z.object({
      messages: z
        .array(
          z.object({
            role: z.string(),
            content: z.string(),
            timestamp: z.number().optional(),
          }),
        )
        .min(1),
      currentTopic: z.string().describe("The current topic being discussed"),
    }),
    handler: async (_ctx, args) => {
      const messageCount = args.messages.length;
      const analysis = {
        depth: messageCount > 5 ? "deep" : messageCount > 2 ? "moderate" : "surface",
        suggestedQuestions: generateFollowUpQuestions(args.currentTopic, messageCount),
        conversationStage: getConversationStage(messageCount),
      };
      return analysis;
    },
  }),

  assessThinking: createTool({
    description:
      "Assess the quality of the user's critical thinking and suggest improvements.",
    args: z.object({
      userResponse: z.string(),
      context: z
        .object({
          questionTitle: z.string().optional(),
          tags: z.array(z.string()).optional(),
        })
        .optional(),
    }),
    handler: async (_ctx, args) => {
      const assessment = {
        hasEvidence:
          args.userResponse.includes("because") || args.userResponse.includes("evidence"),
        considersAlternatives:
          args.userResponse.includes("however") || args.userResponse.includes("alternatively"),
        questionsConcepts:
          args.userResponse.includes("?") || args.userResponse.toLowerCase().includes("what if"),
        thinkingDepth: args.userResponse.length > 100 ? "detailed" : "brief",
        suggestions: generateThinkingImprovement(args.userResponse),
      };
      return assessment;
    },
  }),
};

// Helper functions for agent tools
function generateFollowUpQuestions(_topic: string, messageCount: number): string[] {
  const baseQuestions = [
    "What evidence supports this view?",
    "What assumptions are you making?",
    "How might someone disagree with this perspective?",
    "What are the implications of this thinking?"
  ];
  
  if (messageCount < 3) {
    return ["What's your initial reaction to this?", "What comes to mind first?"];
  } else if (messageCount < 6) {
    return baseQuestions.slice(0, 2);
  } else {
    return baseQuestions.slice(2);
  }
}

function getConversationStage(messageCount: number): string {
  if (messageCount < 2) return "opening";
  if (messageCount < 5) return "exploring";
  if (messageCount < 8) return "deepening";
  return "synthesizing";
}

function generateThinkingImprovement(response: string): string[] {
  const suggestions = [];
  if (!response.includes("because") && !response.includes("evidence")) {
    suggestions.push("Consider providing evidence or reasoning for your claims");
  }
  if (!response.includes("however") && !response.includes("but")) {
    suggestions.push("Try exploring alternative viewpoints or counterarguments");
  }
  if (response.length < 50) {
    suggestions.push("Consider expanding on your thoughts with more detail");
  }
  return suggestions;
}

// Error handling and fallback strategies for agent operations
const AgentErrorHandler = {
  // Handle API errors with exponential backoff
  async handleAPIError(error: any, operation: string, attempt: number = 1): Promise<any> {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second
    
    console.error(`Agent ${operation} Error (attempt ${attempt}):`, error);
    
    // Check if it's a retryable error
    if (attempt < maxRetries && this.isRetryableError(error)) {
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Retrying ${operation} in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return { shouldRetry: true, attempt: attempt + 1 };
    }
    
    // Return appropriate fallback response
    return this.getFallbackResponse(operation, error);
  },
  
  isRetryableError(error: any): boolean {
    // Define which errors should trigger retries
    const retryableStatuses = [429, 500, 502, 503, 504]; // Rate limit, server errors
    const retryableMessages = ['timeout', 'network', 'connection'];
    
    if (error.status && retryableStatuses.includes(error.status)) {
      return true;
    }
    
    if (error.message) {
      return retryableMessages.some(msg => 
        error.message.toLowerCase().includes(msg)
      );
    }
    
    return false;
  },
  
  getFallbackResponse(operation: string, error: any): any {
    switch (operation) {
      case 'generateResponse':
        return {
          success: true,
          response: "I'm having some technical difficulties right now, but let's continue our discussion. What aspect of this question would you like to explore further?",
          fallback: true,
          originalError: error.message || 'Unknown error'
        };
      
      case 'createThread':
        return {
          success: true,
          threadId: `fallback_thread_${Date.now()}`,
          fallback: true,
          originalError: error.message || 'Unknown error'
        };
      
      default:
        return {
          success: false,
          error: `Agent operation failed: ${operation}`,
          details: error.message || 'Unknown error',
          fallback: true
        };
    }
  }
};

// Socratic mentor system prompt
const SOCraticMentorInstructions = `
You are Rethoric, a Socratic mentor. Your goal is to help the user sharpen their reasoning by:
- Asking concise, high-impact questions
- Surfacing assumptions, evidence, alternatives, implications
- Encouraging reflection, not giving answers
- Maintaining psychological safety and curiosity

Guidelines:
- Prefer questions over statements; 1–2 sentences each
- Use plain language; avoid jargon
- Vary question types: assumptions, evidence, counterexamples, implications, definitions, analogies
- Calibrate depth to the stage of conversation (opening, exploring, deepening, synthesizing)
- When appropriate, summarize briefly then ask a follow-up
- If user is stuck, offer 2–3 small directions to choose from
`;

// Configure the reasoning coach agent with Gemini 2.5 Flash (Phase 4.2)
const createReasoningCoachAgent = () => {
  try {
    const genericComponents = componentsGeneric() as unknown as any;
    const agent = new Agent(genericComponents.agent as any, {
      name: "ReasoningCoach",
      // Cast to satisfy Agent's LanguageModelV1 expectation against provider v2 types
      chat: google.chat("gemini-2.5-flash") as unknown as any,
      textEmbedding: google.textEmbedding("text-embedding-004") as unknown as any,
      instructions: SOCraticMentorInstructions,
      tools: agentTools,
      maxSteps: 3,
      maxRetries: 2,
      contextOptions: {
        recentMessages: 12,
        excludeToolMessages: true,
        searchOptions: {
          limit: 6,
          textSearch: true,
          vectorSearch: true,
          vectorScoreThreshold: 0,
          messageRange: { before: 2, after: 1 },
        },
        searchOtherThreads: false,
      },
      storageOptions: { saveMessages: "promptAndOutput" },
    });
    return agent;
  } catch (error) {
    console.error("Failed to create reasoning coach agent:", error);
    throw new Error(`Agent initialization failed: ${error}`);
  }
};

// Utility to get agent configuration (Phase 4.2 ready)
export const getAgentConfig = action({
  args: {},
  handler: async (_ctx) => {
    const agent = createReasoningCoachAgent();
    return {
      success: true,
      config: {
        name: "ReasoningCoach",
        model: "gemini-2.5-flash",
        ready: true,
        phase: "4.2-agent-implemented",
      }
    };
  },
});

// AI response generation using Convex Agent SDK with Gemini 2.5 Flash
export const generateAIResponse = action({
  args: {
    conversationId: v.id("conversations"),
    threadId: v.optional(v.string()), // Optional: will create new thread if not provided
    userMessage: v.string(),
  },
  handler: async (ctx, { conversationId, threadId, userMessage }): Promise<{
    success: boolean;
    response?: string;
    threadId?: string;
    metadata?: any;
    error?: string;
    details?: string;
    attempts?: number;
  }> => {
    let attempt = 1;
    const maxRetries = 3;

    while (attempt <= maxRetries) {
      try {
        const reasoningCoach = createReasoningCoachAgent();

        // Build the conversation context (for extra guidance in system prompt)
        const contextResult: {
          success: boolean;
          context?: any;
          messageCount?: number;
          error?: string;
          details?: string;
        } = await ctx.runAction(api.agents.buildConversationContext, { conversationId });

        if (!contextResult.success) {
          throw new Error(`Failed to build conversation context: ${contextResult.error}`);
        }

        // Ensure a thread exists
        let ensuredThreadId = threadId;
        if (!ensuredThreadId) {
          const identity = await ctx.auth.getUserIdentity();
          const { threadId: newThreadId } = await reasoningCoach.createThread(ctx, {
            userId: identity?.subject ?? undefined,
            title: contextResult.context?.question?.title ?? `Conversation ${conversationId}`,
          });
          ensuredThreadId = newThreadId;
        }

        // Continue the thread and stream the response so deltas are persisted
        const { thread } = await reasoningCoach.continueThread(ctx, {
          threadId: ensuredThreadId!,
          userId: undefined,
        });

        const system = buildDynamicSystemPrompt(contextResult.context);

        const result = await thread.streamText(
          {
            system,
            messages: [{ role: "user", content: userMessage }],
          },
          {
            saveStreamDeltas: true,
            contextOptions: reasoningCoach["options"].contextOptions,
            storageOptions: reasoningCoach["options"].storageOptions,
          },
        );

        // Consume the stream to ensure completion
        await result.consumeStream();

        return {
          success: true,
          response: await result.text,
          threadId: ensuredThreadId,
          metadata: {
            conversationId,
            model: "gemini-2.5-flash",
            messageCount: contextResult.messageCount || 0,
            timestamp: Date.now(),
            attempt,
          },
        };
      } catch (error) {
        console.error(`AI Response Generation Error (attempt ${attempt}):`, error);

        const errorResult = await AgentErrorHandler.handleAPIError(error, "generateResponse", attempt);
        if (errorResult.shouldRetry && attempt < maxRetries) {
          attempt = errorResult.attempt;
          continue;
        }

        if (errorResult.fallback) {
          return {
            ...errorResult,
            threadId: threadId || `thread_${conversationId}_${Date.now()}`,
            metadata: {
              conversationId,
              model: "gemini-2.5-flash",
              timestamp: Date.now(),
              fallback: true,
              attempts: attempt,
            },
          };
        }

        return {
          success: false,
          error: "Failed to generate AI response after retries",
          details: error instanceof Error ? error.message : "Unknown error",
          attempts: attempt,
        };
      }
    }

    return { success: false, error: "Maximum retries exceeded", attempts: maxRetries };
  },
});

// Temporary helper function for Socratic responses with retry logic (will be replaced by agent in Phase 4.2)
async function generateSocraticResponseWithRetry(_userMessage: string, context: any, attempt: number): Promise<string> {
  // This is a temporary implementation that will be replaced by the actual agent
  const question = context?.question;
  const messageCount = context?.messages?.length || 0;
  
  // Simulate potential failures for testing error handling
  if (attempt === 1 && Math.random() < 0.1) { // 10% chance of initial failure for testing
    throw new Error("Simulated API timeout for testing");
  }
  
  // Simple logic based on conversation stage
  if (messageCount === 0) {
    return `Great question! Let's explore "${question?.title}" together. What's your initial reaction to this challenge? What thoughts or feelings come up for you first?`;
  } else if (messageCount < 3) {
    return `That's an interesting perspective. What assumptions might you be making here? Can you think of any alternative ways to view this situation?`;
  } else {
    return `I can see you're thinking deeply about this. What evidence supports your current thinking? Are there any counterarguments you haven't considered yet?`;
  }
}

// Create agent thread for new conversations
export const createAgentThread = action({
  args: {
    conversationId: v.id("conversations"),
    questionTitle: v.string(),
  },
  handler: async (_ctx, { conversationId, questionTitle }) => {
    try {
      const reasoningCoach = createReasoningCoachAgent();
      const identity = await _ctx.auth.getUserIdentity();
      const { threadId } = await reasoningCoach.createThread(_ctx, {
        userId: identity?.subject ?? undefined,
        title: questionTitle,
      });

      return {
        success: true,
        threadId,
        metadata: {
          conversationId,
          questionTitle,
          agentName: "ReasoningCoach",
          model: "gemini-2.5-flash",
          createdAt: Date.now(),
        },
      };
    } catch (error) {
      console.error("Agent Thread Creation Error:", error);
      
      // Use error handler for consistent fallback behavior
      const errorResult = await AgentErrorHandler.handleAPIError(error, 'createThread');
      
      if (errorResult.fallback) {
        return {
          ...errorResult,
          metadata: {
            conversationId,
            questionTitle,
            agentName: "ReasoningCoach",
            model: "gemini-2.5-flash",
            createdAt: Date.now(),
            fallback: true,
          },
        };
      }
      
      return {
        success: false,
        error: "Failed to create agent thread",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

// Placeholder for conversation context building
export const buildConversationContext = action({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, { conversationId }): Promise<{
    success: boolean;
    context?: any;
    messageCount?: number;
    error?: string;
    details?: string;
  }> => {
    try {
      // Fetch conversation and messages for context
      const conversation = await ctx.runQuery(api.conversations.getConversationMessages, {
        conversationId,
      });
      
      if (!conversation) {
        throw new Error("Conversation not found");
      }
      
      // Build context for agent
      const context: {
        question: {
          title?: string;
          description?: string;
          tags?: string[];
        };
        messages: Array<{
          role: string;
          content: string;
          timestamp: number;
        }>;
        conversationMeta: {
          status: string;
          startedAt: number;
          completedAt?: number;
        };
      } = {
        question: {
          title: conversation.conversation.question?.title,
          description: conversation.conversation.question?.description,
          tags: conversation.conversation.question?.tags,
        },
        messages: conversation.messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
        })),
        conversationMeta: {
          status: conversation.conversation.status,
          startedAt: conversation.conversation.startedAt,
          completedAt: conversation.conversation.completedAt,
        },
      };
      
      return {
        success: true,
        context,
        messageCount: conversation.messages.length,
      };
      
    } catch (error) {
      console.error("Context Building Error:", error);
      
      return {
        success: false,
        error: "Failed to build conversation context",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

function buildDynamicSystemPrompt(context: any | undefined): string {
  const title = context?.question?.title;
  const description = context?.question?.description;
  const tags = context?.question?.tags as string[] | undefined;
  const stage = getConversationStage(context?.messages?.length ?? 0);
  const topicLine = title ? `Topic: ${title}` : undefined;
  const descLine = description ? `Context: ${description}` : undefined;
  const tagsLine = tags && tags.length > 0 ? `Tags: ${tags.join(", ")}` : undefined;
  const stageLine = `Stage: ${stage}`;
  const extras = [topicLine, descLine, tagsLine, stageLine].filter(Boolean).join("\n");
  return `${SOCraticMentorInstructions}\n\n${extras}`.trim();
}