"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";

interface MessageInputProps {
  conversationId: Id<"conversations">;
  disabled?: boolean;
  onMessageSent?: () => void;
  // Optimistic update functions from parent
  addOptimisticMessage?: (content: string) => string;
  removeOptimisticMessage?: (id: string) => void;
  markOptimisticMessageAsError?: (id: string) => void;
}

export function MessageInput({ 
  conversationId, 
  disabled = false, 
  onMessageSent,
  addOptimisticMessage,
  removeOptimisticMessage,
  markOptimisticMessageAsError
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  
  const addMessage = useMutation(api.conversations.addMessage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isSending || disabled) return;
    
    const messageContent = message.trim();
    setMessage("");
    setIsSending(true);
    setError(null);
    setLastFailedMessage(null);
    
    // Add optimistic message immediately if function is available
    const optimisticMessageId = addOptimisticMessage?.(messageContent);
    
    try {
      await addMessage({
        conversationId,
        role: "user",
        content: messageContent,
      });
      
      // Remove optimistic message on success (real message will replace it)
      if (optimisticMessageId && removeOptimisticMessage) {
        removeOptimisticMessage(optimisticMessageId);
      }
      
      onMessageSent?.();
    } catch (err) {
      console.error("Failed to send message:", err);
      
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Failed to send message. Please try again.";
      
      // Mark optimistic message as error or handle fallback
      if (optimisticMessageId && markOptimisticMessageAsError) {
        markOptimisticMessageAsError(optimisticMessageId);
      } else {
        // Fallback to original error handling if optimistic updates not available
        setError(errorMessage);
        setLastFailedMessage(messageContent);
        setMessage(messageContent); // Restore the message
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleRetry = () => {
    if (lastFailedMessage) {
      setMessage(lastFailedMessage);
      setError(null);
      setLastFailedMessage(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const canSend = message.trim().length > 0 && !isSending && !disabled;

  return (
    <div className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
      {/* Error Message */}
      {error && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-950/50 border-b border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRetry}
              className="ml-auto text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex gap-3 items-end">
        <div className="flex-1">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "Conversation completed" : "Type your message... (Enter to send, Shift+Enter for new line)"}
            disabled={disabled || isSending}
            className={cn(
              "min-h-[60px] max-h-[120px] resize-none",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            rows={2}
          />
        </div>
        
        <Button
          type="submit"
          size="sm"
          disabled={!canSend}
          className={cn(
            "h-[60px] px-4 flex-shrink-0 transition-colors",
            canSend 
              ? "bg-blue-500 hover:bg-blue-600 text-white" 
              : "bg-neutral-200 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500 cursor-not-allowed"
          )}
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          <span className="sr-only">Send message</span>
        </Button>
      </div>
      
      {message.length > 0 && (
        <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400 text-right">
          {message.length} characters
        </div>
      )}
      </form>
    </div>
  );
}