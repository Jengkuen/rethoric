"use client";

import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { useAuthQuery } from "@/hooks/useAuthenticatedQuery";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConversationListLoading } from "@/components/LoadingStates";
import { Plus, MessageSquare, User, Settings, LogOut } from "lucide-react";
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
  const [showProfileModal, setShowProfileModal] = useState(false);

  return (
    <div className="w-full bg-neutral-100 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col h-screen">
      {/* App Name */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
          Rethoric
        </h1>
      </div>
      
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
      <div className="flex-1 overflow-y-auto">
        {conversations === undefined && <ConversationListLoading />}

        {conversations && conversations.length === 0 && (
          <div className="text-center py-8 text-neutral-500 dark:text-neutral-400 p-4">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs">Start your first conversation above</p>
          </div>
        )}

        {conversations && conversations.length > 0 && (
          <div className="p-4 space-y-2">
            {conversations.map((conversation) => (
          <Card 
            key={conversation._id}
            className={`p-3 cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800 ${
              selectedConversationId === conversation._id 
                ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800' 
                : ''
            }`}
            onClick={() => onConversationSelect(conversation._id)}
          >
            <h3 className="font-medium text-sm text-neutral-900 dark:text-neutral-100 line-clamp-2">
              {conversation.question?.title || "Untitled Question"}
            </h3>
          </Card>
            ))}
          </div>
        )}
      </div>

      <Separator />
      
      {/* Profile Section */}
      <div className="p-4">
        <Button
          variant="ghost"
          onClick={() => setShowProfileModal(true)}
          className="w-full justify-start gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          <User className="h-4 w-4" />
          <span>Profile</span>
        </Button>
      </div>

      {/* Profile Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={() => window.location.href = '/profile'}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
              onClick={() => window.location.href = '/api/auth/signout'}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}