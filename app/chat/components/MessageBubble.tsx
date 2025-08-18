"use client";

import { Card } from "@/components/ui/card";
import { Loader2, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
  isOptimistic?: boolean;
  isPending?: boolean;
  hasError?: boolean;
}

export function MessageBubble({ 
  role, 
  content, 
  isLoading = false, 
  isOptimistic = false, 
  isPending = false, 
  hasError = false 
}: MessageBubbleProps) {
  const isUser = role === "user";
  
  return (
    <div className={cn(
      "flex mb-4",
      isUser ? "justify-end" : "justify-start"
    )}>
      <Card className={cn(
        "px-4 py-3 relative max-w-2xl",
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