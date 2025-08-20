"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useAuthQuery } from "@/hooks/useAuthenticatedQuery";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageSquare, Star, Calendar, Sparkles } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface NewConversationStartProps {
  onConversationCreated: (conversationId: Id<"conversations">) => void;
}

export function NewConversationStart({ onConversationCreated }: NewConversationStartProps) {
  const [customQuestion, setCustomQuestion] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  
  const startNewConversation = useMutation(api.conversations.startNewConversation);
  const startConversationWithCustomQuestion = useMutation(api.conversations.startConversationWithCustomQuestion);
  
  // Get the next suggested question for the current user
  const nextQuestionData = useAuthQuery(
    api.questions.getNextQuestionForUser,
    {}
  );

  const handleStartSuggestedConversation = async () => {
    if (!nextQuestionData?.question) return;

    setIsCreating(true);
    try {
      const result = await startNewConversation({
        questionId: nextQuestionData.question._id,
      });
      
      onConversationCreated(result.conversationId);
    } catch (error) {
      console.error("Failed to start conversation:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartCustomConversation = async () => {
    if (!customQuestion.trim()) return;

    setIsCreatingCustom(true);
    try {
      const result = await startConversationWithCustomQuestion({
        customQuestionText: customQuestion.trim(),
      });
      
      onConversationCreated(result.conversationId);
    } catch (error) {
      console.error("Failed to start custom conversation:", error);
    } finally {
      setIsCreatingCustom(false);
    }
  };

  return (
    <div className="flex-1 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
      <div className="max-w-3xl w-full mx-auto p-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-blue-500 mr-2" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Start Your Critical Thinking Journey
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 text-lg">
            Choose a suggested question or explore your own
          </p>
        </div>

        <div className="space-y-8">
          {/* Section 1: Suggested Question */}
          <div className="space-y-4">
            {nextQuestionData === undefined && (
              <Card className="p-8">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-neutral-400 mr-2" />
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Finding your next question...
                  </span>
                </div>
              </Card>
            )}

            {nextQuestionData && nextQuestionData.type === "completed" && (
              <Card className="p-8 text-center">
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
                      <span className="font-medium">Today's Featured Question</span>
                    </>
                  )}
                  {nextQuestionData.type === "random" && (
                    <>
                      <MessageSquare className="h-4 w-4" />
                      <span className="font-medium">Suggested Question</span>
                    </>
                  )}
                </div>

                <Card 
                  className="p-6 cursor-pointer transition-all hover:shadow-md hover:bg-neutral-50 dark:hover:bg-neutral-900 border-2 hover:border-blue-200 dark:hover:border-blue-800"
                  onClick={handleStartSuggestedConversation}
                >
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                        {nextQuestionData.question.title}
                      </h3>
                    </div>


                    {nextQuestionData.type === "daily" && (
                      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-sm">
                          <Star className="h-4 w-4" />
                          <span className="font-medium">Daily Question</span>
                        </div>
                        <p className="text-blue-600 dark:text-blue-400 text-sm mt-1">
                          Today's featured question for deeper exploration
                        </p>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button
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
                            Start Exploring
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>

          {/* Section 2: Custom Question Input */}
          <div className="space-y-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="flex-1 border-t border-neutral-200 dark:border-neutral-800"></div>
                <span className="px-4 text-sm text-neutral-500 dark:text-neutral-400">or</span>
                <div className="flex-1 border-t border-neutral-200 dark:border-neutral-800"></div>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Explore your own question
              </p>
            </div>

            <Card className="p-6">
              <div className="space-y-4">
                <Textarea
                  placeholder="Enter your own question to explore..."
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  className="min-h-[120px] text-base resize-none border-neutral-200 dark:border-neutral-800 focus:border-blue-500 dark:focus:border-blue-400"
                  disabled={isCreatingCustom}
                />
                
                <div className="flex justify-end">
                  <Button
                    onClick={handleStartCustomConversation}
                    disabled={!customQuestion.trim() || isCreatingCustom}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    {isCreatingCustom ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Start Conversation
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}