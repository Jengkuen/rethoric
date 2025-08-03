"use client";

import { api } from "@/convex/_generated/api";
import { useAuthQuery } from "@/hooks/useAuthenticatedQuery";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, MessageSquare, Clock } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface SidebarProps {
  selectedConversationId?: Id<"conversations">;
  onConversationSelect: (conversationId: Id<"conversations">) => void;
  onNewConversation: () => void;
}

export function Sidebar({ 
  selectedConversationId, 
  onConversationSelect, 
  onNewConversation 
}: SidebarProps) {
  const conversations = useAuthQuery(api.conversations.getUserConversations, {});

  return (
    <div className="w-80 bg-neutral-100 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
        <Button 
          onClick={onNewConversation}
          className="w-full flex items-center gap-2"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          Start New Conversation
        </Button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {conversations === undefined && (
          <div className="space-y-2">
            {/* Loading skeleton */}
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-3 animate-pulse">
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded mb-2"></div>
                <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
              </Card>
            ))}
          </div>
        )}

        {conversations && conversations.length === 0 && (
          <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs">Start your first conversation above</p>
          </div>
        )}

        {conversations && conversations.map((conversation) => (
          <Card 
            key={conversation._id}
            className={`p-3 cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800 ${
              selectedConversationId === conversation._id 
                ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800' 
                : ''
            }`}
            onClick={() => onConversationSelect(conversation._id)}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <h3 className="font-medium text-sm text-neutral-900 dark:text-neutral-100 line-clamp-2 flex-1">
                  {conversation.question?.title || "Untitled Question"}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0 ${
                  conversation.status === 'active' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                }`}>
                  {conversation.status === 'active' ? 'Active' : 'Completed'}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <Clock className="h-3 w-3" />
                <span>
                  {new Date(conversation.startedAt).toLocaleDateString()}
                </span>
              </div>
              
              {conversation.question?.tags && conversation.question.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {conversation.question.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                  {conversation.question.tags.length > 2 && (
                    <span className="px-2 py-1 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-xs">
                      +{conversation.question.tags.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Separator />
      
      {/* Footer */}
      <div className="p-4 text-center">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {conversations && conversations.length > 0 && (
            <>
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </>
          )}
        </p>
      </div>
    </div>
  );
}