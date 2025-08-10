import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
// Phase 4.2 imports - will be activated when fully implementing agent
// import { Agent } from "@convex-dev/agent";
// import { google } from "@ai-sdk/google";
// import { components } from "./_generated/api"; // Will be available after proper agent setup

// Agent tools for conversation analysis and guidance
const agentTools = {
  // Tool for analyzing conversation patterns
  analyzeConversation: {
    description: "Analyze the conversation flow and identify areas for deeper questioning",
    parameters: {
      type: "object",
      properties: {
        messages: {
          type: "array",
          items: { type: "object" },
          description: "Recent conversation messages"
        },
        currentTopic: {
          type: "string", 
          description: "The current topic being discussed"
        }
      },
      required: ["messages", "currentTopic"]
    },
    handler: async (args: any) => {
      // Analyze conversation depth and suggest follow-up questions
      const messageCount = args.messages.length;
      const analysis = {
        depth: messageCount > 5 ? "deep" : messageCount > 2 ? "moderate" : "surface",
        suggestedQuestions: generateFollowUpQuestions(args.currentTopic, messageCount),
        conversationStage: getConversationStage(messageCount)
      };
      return analysis;
    }
  },

  // Tool for checking critical thinking patterns
  assessThinking: {
    description: "Assess the quality of user's critical thinking and suggest improvements",
    parameters: {
      type: "object",
      properties: {
        userResponse: {
          type: "string",
          description: "The user's latest response to analyze"
        },
        context: {
          type: "object",
          description: "Conversation context for analysis"
        }
      },
      required: ["userResponse"]
    },
    handler: async (args: any) => {
      // Assess critical thinking elements
      const assessment = {
        hasEvidence: args.userResponse.includes("because") || args.userResponse.includes("evidence"),
        considersAlternatives: args.userResponse.includes("however") || args.userResponse.includes("alternatively"),
        questionsConcepts: args.userResponse.includes("?") || args.userResponse.includes("what if"),
        thinkingDepth: args.userResponse.length > 100 ? "detailed" : "brief",
        suggestions: generateThinkingImprovement(args.userResponse)
      };
      return assessment;
    }
  }
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

// Configure the reasoning coach agent with Gemini 2.5 Flash
// Note: This will be fully activated in Phase 4.2 when components are available
const createReasoningCoachAgent = (_components: any) => {
  try {
    // TODO: Phase 4.2 - Full agent implementation
    // For now, return a mock configuration to avoid API issues
    return {
      name: "ReasoningCoach",
      model: "gemini-2.5-flash",
      instructions: `You are a Socratic mentor helping users develop critical thinking skills through thoughtful questioning and guided discovery.`,
      tools: agentTools,
      ready: false, // Will be true in Phase 4.2
    };
    
    // Phase 4.2 implementation will use:
    // return new Agent(components.agent, {
    //   name: "ReasoningCoach", 
    //   chat: google("gemini-2.5-flash"),
    //   instructions: `...full instructions...`,
    //   tools: agentTools,
    // });
  } catch (error) {
    console.error("Failed to create reasoning coach agent:", error);
    throw new Error(`Agent initialization failed: ${error}`);
  }
};

// Utility to get agent configuration (Phase 4.2 ready)
export const getAgentConfig = action({
  args: {},
  handler: async (_ctx) => {
    // This uses createReasoningCoachAgent to avoid linter warnings
    const agentConfig = createReasoningCoachAgent(null);
    return {
      success: true,
      config: {
        name: agentConfig.name,
        model: agentConfig.model,
        ready: agentConfig.ready,
        phase: "4.1-setup-complete"
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
        // Note: This will be uncommented once components are properly available
        // const reasoningCoach = createReasoningCoachAgent(components);
        
        // Build the conversation context
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
        
        // TODO: Phase 4.2 - Replace with actual agent implementation
        // const { threadId: newThreadId, thread } = threadId 
        //   ? await reasoningCoach.getThread(threadId)
        //   : await reasoningCoach.createThread(ctx);
        
        // const result = await thread.generateText({
        //   prompt: userMessage,
        //   // Additional context from conversation
        //   context: contextResult.context
        // });
        
        // Placeholder implementation with error handling - will be replaced in Phase 4.2
        const aiResponse = await generateSocraticResponseWithRetry(userMessage, contextResult.context, attempt);
        
        return {
          success: true,
          response: aiResponse,
          threadId: threadId || `thread_${conversationId}_${Date.now()}`,
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
        
        // Check if we should retry
        const errorResult = await AgentErrorHandler.handleAPIError(error, 'generateResponse', attempt);
        
        if (errorResult.shouldRetry && attempt < maxRetries) {
          attempt = errorResult.attempt;
          continue; // Retry the operation
        }
        
        // Return fallback response or final error
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
    
    // This should never be reached, but TypeScript requires it
    return {
      success: false,
      error: "Maximum retries exceeded",
      attempts: maxRetries,
    };
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
      // TODO: Phase 4.2 - Replace with actual agent implementation
      // const reasoningCoach = createReasoningCoachAgent(components);
      // const { threadId, thread } = await reasoningCoach.createThread(ctx);
      
      // For now, create a deterministic thread ID
      const threadId = `thread_${conversationId}_${Date.now()}`;
      
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