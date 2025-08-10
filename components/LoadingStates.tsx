"use client";

import { Loader2, MessageSquare, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  };

  return (
    <Loader2 className={cn("animate-spin text-neutral-400 dark:text-neutral-600", sizeClasses[size], className)} />
  );
}

export function ConversationListLoading() {
  return (
    <div className="space-y-2 p-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-3 animate-pulse">
          <div className="flex items-start justify-between mb-2">
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-16"></div>
          </div>
          <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-20"></div>
        </Card>
      ))}
    </div>
  );
}

export function MessagesLoading() {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className={`flex gap-3 ${i % 2 === 0 ? "flex-row-reverse" : ""}`}>
          <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-700 rounded-full animate-pulse"></div>
          <div className="max-w-[70%] space-y-2">
            <Card className="p-3 animate-pulse">
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full mb-2"></div>
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
            </Card>
            <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-16"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ConversationLoading() {
  return (
    <div className="flex-1 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="relative mb-6">
          <MessageSquare className="h-12 w-12 mx-auto text-neutral-300 dark:text-neutral-700" />
          <div className="absolute inset-0 flex items-center justify-center">
            <LoadingSpinner size="sm" />
          </div>
        </div>
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          Loading conversation...
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 text-sm">
          Fetching your messages and conversation history
        </p>
      </div>
    </div>
  );
}

export function AuthenticationLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="relative mb-6">
          <Zap className="h-12 w-12 mx-auto text-neutral-300 dark:text-neutral-700" />
          <div className="absolute inset-0 flex items-center justify-center">
            <LoadingSpinner size="sm" />
          </div>
        </div>
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          Preparing your experience...
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 text-sm">
          Setting up authentication and loading your data
        </p>
      </div>
    </div>
  );
}