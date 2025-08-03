"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Sidebar } from "./Sidebar";
import { MainContent } from "./MainContent";
import { NewConversationModal } from "./NewConversationModal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CheckCircle, AlertTriangle } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

export function ChatInterface() {
  const [selectedConversationId, setSelectedConversationId] = useState<Id<"conversations"> | undefined>();
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [showEndConversationModal, setShowEndConversationModal] = useState(false);
  const [conversationToEnd, setConversationToEnd] = useState<Id<"conversations"> | undefined>();
  
  const updateConversationStatus = useMutation(api.conversations.updateConversationStatus);

  const handleConversationSelect = (conversationId: Id<"conversations">) => {
    setSelectedConversationId(conversationId);
  };

  const handleNewConversation = () => {
    setShowNewConversationModal(true);
  };

  const handleConversationCreated = (conversationId: Id<"conversations">) => {
    setSelectedConversationId(conversationId);
    setShowNewConversationModal(false);
  };

  const handleEndConversation = (conversationId: Id<"conversations">) => {
    setConversationToEnd(conversationId);
    setShowEndConversationModal(true);
  };

  const confirmEndConversation = async () => {
    if (!conversationToEnd) return;

    try {
      await updateConversationStatus({
        conversationId: conversationToEnd,
        status: "completed",
      });
      setShowEndConversationModal(false);
      setConversationToEnd(undefined);
    } catch (error) {
      console.error("Failed to end conversation:", error);
    }
  };

  return (
    <div className="h-screen flex bg-neutral-50 dark:bg-neutral-950">
      {/* Sidebar */}
      <Sidebar
        selectedConversationId={selectedConversationId}
        onConversationSelect={handleConversationSelect}
        onNewConversation={handleNewConversation}
      />

      {/* Main Content */}
      <MainContent
        conversationId={selectedConversationId}
        onEndConversation={handleEndConversation}
      />

      {/* New Conversation Modal */}
      <NewConversationModal
        open={showNewConversationModal}
        onOpenChange={setShowNewConversationModal}
        onConversationCreated={handleConversationCreated}
      />

      {/* End Conversation Confirmation Modal */}
      <Dialog open={showEndConversationModal} onOpenChange={setShowEndConversationModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              End Conversation
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this conversation as completed? You won&apos;t be able to add more messages after this action.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-yellow-800 dark:text-yellow-200 font-medium mb-1">
                  This action cannot be undone
                </p>
                <p className="text-yellow-700 dark:text-yellow-300">
                  The conversation will be marked as complete and this question will be marked as answered in your progress.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowEndConversationModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmEndConversation}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              End Conversation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}