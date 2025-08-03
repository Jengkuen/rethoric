"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";

interface MessageInputProps {
  conversationId: Id<"conversations">;
  disabled?: boolean;
  onMessageSent?: () => void;
}

export function MessageInput({ 
  conversationId, 
  disabled = false, 
  onMessageSent 
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  const addMessage = useMutation(api.conversations.addMessage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isSending || disabled) return;
    
    const messageContent = message.trim();
    setMessage("");
    setIsSending(true);
    
    try {
      await addMessage({
        conversationId,
        role: "user",
        content: messageContent,
      });
      
      onMessageSent?.();
    } catch (error) {
      console.error("Failed to send message:", error);
      // Restore the message on error
      setMessage(messageContent);
    } finally {
      setIsSending(false);
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
    <form onSubmit={handleSubmit} className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
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
  );
}