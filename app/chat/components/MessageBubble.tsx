"use client";

import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Bot, User, Loader2, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isLoading?: boolean;
  isOptimistic?: boolean;
  isPending?: boolean;
  hasError?: boolean;
}

export function MessageBubble({ 
  role, 
  content, 
  timestamp, 
  isLoading = false, 
  isOptimistic = false, 
  isPending = false, 
  hasError = false 
}: MessageBubbleProps) {
  const isUser = role === "user";
  
  return (
    <div className={cn(
      "flex gap-3 mb-4",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        <Avatar className={cn(
          "h-8 w-8 flex items-center justify-center",
          isUser 
            ? "bg-blue-500 text-white" 
            : "bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400"
        )}>
          {isUser ? (
            <User className="h-4 w-4" />
          ) : (
            <Bot className="h-4 w-4" />
          )}
        </Avatar>
      </div>

      {/* Message Content */}
      <div className={cn(
        "flex flex-col max-w-[80%] min-w-0",
        isUser ? "items-end" : "items-start"
      )}>
        <Card className={cn(
          "px-4 py-3 relative",
          isUser 
            ? "bg-blue-500 text-white border-blue-500" 
            : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700",
          // Visual indicators for optimistic messages
          isOptimistic && isPending && "opacity-70",
          isOptimistic && hasError && "bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-700"
        )}>
          {/* Error indicator for failed optimistic messages */}
          {isOptimistic && hasError && (
            <div className="absolute top-2 right-2">
              <AlertTriangle className="h-3 w-3 text-red-500" />
            </div>
          )}
          
          {/* Pending indicator for optimistic messages */}
          {isOptimistic && isPending && (
            <div className="absolute top-2 right-2">
              <Clock className="h-3 w-3 text-blue-400 animate-pulse" />
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          ) : (
            <div className={cn(
              "prose prose-sm max-w-none",
              isUser 
                ? "prose-invert text-white" 
                : "prose-neutral dark:prose-invert",
              // Adjust text styling for error states
              isOptimistic && hasError && !isUser && "text-red-700 dark:text-red-300"
            )}>
              <div 
                className="whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{ 
                  __html: formatMessageContent(content)
                }}
              />
            </div>
          )}
        </Card>
        
        {/* Timestamp */}
        <span className={cn(
          "text-xs text-neutral-500 dark:text-neutral-400 mt-1 px-1",
          isUser ? "text-right" : "text-left"
        )}>
          {new Date(timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      </div>
    </div>
  );
}

// Helper function to format markdown-like content
function formatMessageContent(content: string): string {
  return content
    // Bold text **text**
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic text *text*
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Line breaks
    .replace(/\n/g, '<br />');
}