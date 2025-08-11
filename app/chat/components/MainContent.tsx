"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthQuery } from "@/hooks/useAuthenticatedQuery";
import { api } from "@/convex/_generated/api";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ConversationLoading } from "@/components/LoadingStates";
import { MessageSquare, CheckCircle, Clock, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";

interface MainContentProps {
  conversationId?: Id<"conversations">;
  onEndConversation?: (conversationId: Id<"conversations">) => void;
  onBackToSidebar?: () => void;
}

// Temporary type for optimistic messages
interface OptimisticMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isOptimistic: true;
  isPending?: boolean;
  hasError?: boolean;
}

export function MainContent({ conversationId, onEndConversation, onBackToSidebar }: MainContentProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<OptimisticMessage[]>([]);
  const [isAIThinking, setIsAIThinking] = useState(false);
  
  const conversationData = useAuthQuery(
    api.conversations.getConversationMessages,
    conversationId ? { conversationId } : "skip"
  );

  // Clear optimistic messages when conversation changes
  useEffect(() => {
    setOptimisticMessages([]);
    setIsAIThinking(false);
  }, [conversationId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (conversationData?.messages || optimisticMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversationData?.messages, optimisticMessages]);

  // Optimistic message management functions
  const addOptimisticMessage = useCallback((content: string) => {
    const optimisticMessage: OptimisticMessage = {
      id: `optimistic-${Date.now()}-${Math.random()}`,
      role: "user",
      content,
      timestamp: Date.now(),
      isOptimistic: true,
      isPending: true,
    };
    
    setOptimisticMessages(prev => [...prev, optimisticMessage]);
    return optimisticMessage.id;
  }, []);

  const removeOptimisticMessage = useCallback((id: string) => {
    setOptimisticMessages(prev => prev.filter(msg => msg.id !== id));
  }, []);

  const markOptimisticMessageAsError = useCallback((id: string) => {
    setOptimisticMessages(prev => 
      prev.map(msg => 
        msg.id === id 
          ? { ...msg, isPending: false, hasError: true }
          : msg
      )
    );
  }, []);

  if (!conversationId) {
    return (
      <div className="flex-1 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-neutral-400 dark:text-neutral-600" />
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            No conversation selected
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Choose a conversation from the sidebar or start a new one to begin your critical thinking journey.
          </p>
        </div>
      </div>
    );
  }

  if (conversationData === undefined) {
    return <ConversationLoading />;
  }

  const { messages, conversation } = conversationData;
  const isCompleted = conversation.status === "completed";

  // Combine real messages with optimistic messages
  const allMessages = [
    ...messages.map(msg => ({ ...msg, isOptimistic: false as const })),
    ...optimisticMessages
  ].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="flex-1 flex flex-col bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {/* Mobile back button */}
            {onBackToSidebar && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToSidebar}
                className="md:hidden"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to conversations</span>
              </Button>
            )}
            
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                {conversation.question?.title || "Question"}
              </h1>
              <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>
                  Started {new Date(conversation.startedAt).toLocaleDateString()}
                </span>
              </div>
              <div className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                isCompleted
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
              )}>
                {isCompleted ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <MessageSquare className="h-3 w-3" />
                )}
                <span>{isCompleted ? "Completed" : "Active"}</span>
              </div>
              </div>
            </div>
          </div>
          
          {!isCompleted && onEndConversation && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEndConversation(conversationId)}
              className="text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              End Conversation
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 scroll-smooth">
        {allMessages.length === 0 && (
          <div className="text-center py-8">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-neutral-400 dark:text-neutral-600" />
            <p className="text-neutral-600 dark:text-neutral-400 text-sm">
              No messages yet. Start the conversation below.
            </p>
          </div>
        )}

        {allMessages.map((message) => (
          <MessageBubble
            key={message.isOptimistic ? message.id : message._id}
            role={message.role}
            content={message.content}
            timestamp={message.timestamp}
            isOptimistic={message.isOptimistic}
            isPending={message.isOptimistic ? message.isPending : false}
            hasError={message.isOptimistic ? message.hasError : false}
          />
        ))}

        {/* AI Thinking Indicator */}
        {isAIThinking && (
          <div className="flex justify-start mb-4">
            <div className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl px-4 py-3 max-w-[80%]">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                  <div className="w-2 h-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                  <div className="w-2 h-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                </div>
                <span className="text-neutral-600 dark:text-neutral-400 text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        {/* Completion Message */}
        {isCompleted && (
          <>
            <Separator className="my-6" />
            <Card className="p-4 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300 mb-2">
                <CheckCircle className="h-5 w-5" />
                <h3 className="font-medium">Conversation Completed</h3>
              </div>
              <p className="text-green-600 dark:text-green-400 text-sm">
                Great work! You&apos;ve successfully explored this question. Your insights and reasoning have been valuable 
                in developing your critical thinking skills.
              </p>
              {conversation.completedAt && (
                <p className="text-green-600 dark:text-green-400 text-xs mt-2">
                  Completed on {new Date(conversation.completedAt).toLocaleString()}
                </p>
              )}
            </Card>
          </>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      {!isCompleted && (
        <MessageInput
          conversationId={conversationId}
          onMessageSent={() => {
            // Scroll to bottom after sending
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
          }}
          addOptimisticMessage={addOptimisticMessage}
          removeOptimisticMessage={removeOptimisticMessage}
          markOptimisticMessageAsError={markOptimisticMessageAsError}
          onAIThinkingChange={setIsAIThinking}
        />
      )}
    </div>
  );
}