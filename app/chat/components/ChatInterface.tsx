"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useAuthQuery } from "@/hooks/useAuthenticatedQuery";
import { api } from "@/convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { Sidebar } from "./Sidebar";
import { MainContent } from "./MainContent";
import { NewConversationStart } from "./NewConversationStart";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CheckCircle, AlertTriangle } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

// Use Convex's generated type for conversation data
type ConversationData = FunctionReturnType<typeof api.conversations.getConversationMessages>;

export function ChatInterface() {
  const [selectedConversationId, setSelectedConversationId] = useState<Id<"conversations"> | undefined>();
  const [showNewConversationMode, setShowNewConversationMode] = useState(false);
  const [showEndConversationModal, setShowEndConversationModal] = useState(false);
  const [conversationToEnd, setConversationToEnd] = useState<Id<"conversations"> | undefined>();
  
  const updateConversationStatus = useMutation(api.conversations.updateConversationStatus);
  
  // Query conversation data for the selected conversation
  const conversationData: ConversationData | undefined = useAuthQuery(
    api.conversations.getConversationMessages,
    selectedConversationId ? { conversationId: selectedConversationId } : "skip"
  );

  const handleConversationSelect = (conversationId: Id<"conversations">) => {
    setSelectedConversationId(conversationId);
    setShowNewConversationMode(false);
  };

  const handleNewConversation = () => {
    setSelectedConversationId(undefined);
    setShowNewConversationMode(true);
  };

  const handleConversationCreated = (conversationId: Id<"conversations">) => {
    setSelectedConversationId(conversationId);
    setShowNewConversationMode(false);
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
      {/* Fixed Sidebar - Never moves */}
      <div className={`${selectedConversationId || showNewConversationMode ? 'hidden md:block' : 'block'} w-80 flex-shrink-0`}>
        <ErrorBoundary>
          <Sidebar
            selectedConversationId={selectedConversationId}
            onConversationSelect={handleConversationSelect}
            onNewConversation={handleNewConversation}
          />
        </ErrorBoundary>
      </div>

      {/* Main Content Area */}
      <div className={`${selectedConversationId || showNewConversationMode ? 'flex-1' : 'hidden md:flex md:flex-1'} flex flex-col`}>
        {/* Fixed Header - Never moves */}
        <header className="flex items-center justify-between px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex-shrink-0">
          <div className="flex items-center gap-2">
            {conversationData?.conversation?.question?.title ? (
              <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                {conversationData.conversation.question.title}
              </h2>
            ) : (
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                Critical Thinking Coach
              </span>
            )}
          </div>
          <ThemeToggle />
        </header>

        {/* Chat Content - Only this scrolls */}
        <div className="flex-1 overflow-hidden">
          <ErrorBoundary>
            {showNewConversationMode ? (
              <NewConversationStart onConversationCreated={handleConversationCreated} />
            ) : (
              <MainContent
                conversationId={selectedConversationId}
                conversationData={conversationData}
                onEndConversation={handleEndConversation}
                onBackToSidebar={() => setSelectedConversationId(undefined)}
              />
            )}
          </ErrorBoundary>
        </div>
      </div>

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