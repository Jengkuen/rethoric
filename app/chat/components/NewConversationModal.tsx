"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useAuthQuery } from "@/hooks/useAuthenticatedQuery";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, Star, Calendar } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface NewConversationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationCreated: (conversationId: Id<"conversations">) => void;
}

export function NewConversationModal({ 
  open, 
  onOpenChange, 
  onConversationCreated 
}: NewConversationModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  
  const startNewConversation = useMutation(api.conversations.startNewConversation);
  
  // Get the next question for the current user (auth is handled inside the query)
  const nextQuestionData = useAuthQuery(
    api.questions.getNextQuestionForUser,
    {}
  );

  const handleStartConversation = async () => {
    if (!nextQuestionData?.question) return;

    setIsCreating(true);
    try {
      const result = await startNewConversation({
        questionId: nextQuestionData.question._id,
      });
      
      onConversationCreated(result.conversationId);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to start conversation:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Start New Conversation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {nextQuestionData === undefined && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
              <span className="ml-2 text-neutral-600 dark:text-neutral-400">
                Finding your next question...
              </span>
            </div>
          )}

          {nextQuestionData && nextQuestionData.type === "completed" && (
            <Card className="p-6 text-center">
              <Star className="h-8 w-8 mx-auto mb-3 text-yellow-500" />
              <h3 className="font-semibold text-lg mb-2">Congratulations!</h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                {nextQuestionData.message}
              </p>
            </Card>
          )}

          {nextQuestionData && nextQuestionData.question && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                {nextQuestionData.type === "daily" && (
                  <>
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">Today&apos;s Featured Question</span>
                  </>
                )}
                {nextQuestionData.type === "random" && (
                  <>
                    <MessageSquare className="h-4 w-4" />
                    <span className="font-medium">Next Question for You</span>
                  </>
                )}
              </div>

              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                      {nextQuestionData.question.title}
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {nextQuestionData.question.description}
                    </p>
                  </div>

                  {nextQuestionData.question.tags && nextQuestionData.question.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {nextQuestionData.question.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {nextQuestionData.type === "daily" && (
                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-sm">
                        <Star className="h-4 w-4" />
                        <span className="font-medium">Daily Question</span>
                      </div>
                      <p className="text-blue-600 dark:text-blue-400 text-sm mt-1">
                        This is today&apos;s featured question, specially selected for deeper exploration.
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStartConversation}
                  disabled={isCreating}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Start Conversation
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}