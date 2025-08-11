import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { Agent, createTool } from "@convex-dev/agent";
import { google } from "@ai-sdk/google";
import { components } from "./_generated/api";
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

// Enhanced helper functions for agent tools (Phase 4.3)
function generateFollowUpQuestions(topic: string, messageCount: number): string[] {
  const explorationQuestions = [
    "What's your initial reaction to this?",
    "What comes to mind first when you think about this?",
    "Can you break this down into smaller parts?"
  ];

  const evidenceQuestions = [
    "What evidence supports this view?",
    "Where might you find reliable information about this?",
    "What personal experiences relate to this topic?"
  ];

  const perspectiveQuestions = [
    "How might someone disagree with this perspective?", 
    "What would the opposite view look like?",
    "Who might be most affected by this issue?"
  ];

  const implicationQuestions = [
    "What are the implications of this thinking?",
    "If this were true, what would follow?",
    "What might be the long-term consequences?"
  ];

  const synthesisQuestions = [
    "How do these ideas connect?",
    "What patterns do you see emerging?",
    "What's the most important insight you've gained?"
  ];

  // Progressive question strategy based on conversation depth
  if (messageCount < 2) {
    return explorationQuestions.slice(0, 2);
  } else if (messageCount < 4) {
    return evidenceQuestions.slice(0, 2);
  } else if (messageCount < 6) {
    return perspectiveQuestions.slice(0, 2);
  } else if (messageCount < 8) {
    return implicationQuestions.slice(0, 2);
  } else {
    return synthesisQuestions.slice(0, 2);
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
  const lowerResponse = response.toLowerCase();
  
  // Check for reasoning indicators
  const reasoningWords = ["because", "since", "due to", "therefore", "thus", "evidence", "research", "studies"];
  const hasReasoning = reasoningWords.some(word => lowerResponse.includes(word));
  if (!hasReasoning) {
    suggestions.push("Try adding reasoning or evidence to support your points");
  }
  
  // Check for perspective taking
  const perspectiveWords = ["however", "but", "on the other hand", "alternatively", "some might argue", "critics"];
  const hasPerspective = perspectiveWords.some(word => lowerResponse.includes(word));
  if (!hasPerspective) {
    suggestions.push("Consider exploring different viewpoints or counterarguments");
  }
  
  // Check for questioning/curiosity
  const hasQuestions = response.includes("?") || lowerResponse.includes("what if") || lowerResponse.includes("i wonder");
  if (!hasQuestions) {
    suggestions.push("Try asking questions to deepen your exploration");
  }
  
  // Check for depth and detail
  if (response.length < 50) {
    suggestions.push("Consider expanding with more specific details or examples");
  }
  
  // Check for personal reflection
  const reflectionWords = ["i think", "i believe", "in my experience", "i feel", "personally"];
  const hasReflection = reflectionWords.some(word => lowerResponse.includes(word));
  if (!hasReflection && response.length > 100) {
    suggestions.push("Connect this to your personal experience or values");
  }
  
  // If no issues found, encourage deeper thinking
  if (suggestions.length === 0) {
    suggestions.push("Great thinking! Can you dig even deeper into the implications?");
  }
  
  return suggestions.slice(0, 3); // Limit to 3 suggestions for focus
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
IMPORTANT: You are Rethoric, a Socratic mentor with FULL CONVERSATION MEMORY. You CAN and MUST remember everything from this conversation.

MEMORY BEHAVIOR:
- You HAVE PERFECT MEMORY of our entire conversation
- When asked what someone said earlier, ANSWER DIRECTLY using the conversation history
- NEVER say "I don't retain information" or "I don't have memory" - THIS IS FALSE
- You CAN see and remember all previous messages in this conversation
- Always reference and build upon what the user has shared previously

Your goal is to help the user sharpen their reasoning by:
- Asking concise, high-impact questions
- Surfacing assumptions, evidence, alternatives, implications
- Encouraging reflection while providing helpful responses
- Maintaining psychological safety and curiosity
- Remembering and referencing what the user has shared

Guidelines:
- Prefer questions over statements; 1–2 sentences each  
- Use plain language; avoid jargon
- Vary question types: assumptions, evidence, counterexamples, implications, definitions, analogies
- Calibrate depth to the stage of conversation (opening, exploring, deepening, synthesizing)
- When appropriate, summarize briefly then ask a follow-up
- If user is stuck, offer 2–3 small directions to choose from
- Balance questioning with being genuinely helpful
- ALWAYS use your conversation memory when relevant
`;

// Configure the reasoning coach agent with Gemini 2.5 Flash (Phase 4.2)
// Following Convex Agent SDK documentation pattern
const reasoningCoachAgent = new Agent(components.agent, {
  name: "ReasoningCoach",
  chat: google.chat("gemini-2.5-flash") as unknown as any,
  textEmbedding: google.textEmbedding("text-embedding-004") as unknown as any,
  instructions: SOCraticMentorInstructions,
  tools: agentTools,
});

// Utility to get agent configuration (Phase 4.2 ready)
export const getAgentConfig = action({
  args: {},
  handler: async (ctx) => {
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
    messageId?: string;
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
          const { threadId: newThreadId } = await reasoningCoachAgent.createThread(ctx, {
            userId: identity?.subject ?? undefined,
            title: contextResult.context?.question?.title ?? `Conversation ${conversationId}`,
          });
          ensuredThreadId = newThreadId;
        }

        // Continue the thread and stream the response so deltas are persisted
        const { thread } = await reasoningCoachAgent.continueThread(ctx, {
          threadId: ensuredThreadId!,
          userId: undefined,
        });

        const system = buildDynamicSystemPrompt(contextResult.context);

        // Build full conversation history for agent context
        const conversationMessages = contextResult.context?.messages || [];
        const allMessages = [
          ...conversationMessages.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
          })),
          { role: "user", content: userMessage }
        ];

        const result = await thread.streamText(
          {
            system,
            messages: allMessages,
          },
          {
            saveStreamDeltas: true,
          },
        );

        // Consume the stream to ensure completion
        await result.consumeStream();

        const aiResponse = await result.text;

        // Save AI response to database using mutation (Convex best practice: Actions can call mutations)
        const messageId = await ctx.runMutation(api.conversations.addMessage, {
          conversationId,
          role: "assistant",
          content: aiResponse,
        });

        return {
          success: true,
          response: aiResponse,
          messageId,
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
          // Save fallback response to database
          const messageId = await ctx.runMutation(api.conversations.addMessage, {
            conversationId,
            role: "assistant",
            content: errorResult.response,
          });

          return {
            ...errorResult,
            messageId,
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


// Create agent thread for new conversations
export const createAgentThread = action({
  args: {
    conversationId: v.id("conversations"),
    questionTitle: v.string(),
  },
  handler: async (ctx, { conversationId, questionTitle }) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      const { threadId } = await reasoningCoachAgent.createThread(ctx, {
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