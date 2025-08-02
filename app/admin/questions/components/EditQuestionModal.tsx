"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Id } from "@/convex/_generated/dataModel";

interface Question {
  _id: Id<"questions">;
  title: string;
  description: string;
  tags: string[];
  isDaily: boolean;
  dailyDate?: string;
}

interface EditQuestionModalProps {
  open: boolean;
  onClose: () => void;
  question: Question | null;
}

export function EditQuestionModal({ open, onClose, question }: EditQuestionModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [isDaily, setIsDaily] = useState(false);
  const [dailyDate, setDailyDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateQuestion = useMutation(api.questions.updateQuestion);

  useEffect(() => {
    if (question) {
      setTitle(question.title);
      setDescription(question.description);
      setTags(question.tags.join(", "));
      setIsDaily(question.isDaily);
      setDailyDate(question.dailyDate || "");
    }
  }, [question]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question) return;

    setIsSubmitting(true);

    try {
      await updateQuestion({
        questionId: question._id,
        title,
        description,
        tags: tags.split(",").map(tag => tag.trim()).filter(Boolean),
        isDaily,
        dailyDate: isDaily && dailyDate ? dailyDate : undefined,
      });

      onClose();
    } catch (error) {
      console.error("Failed to update question:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!question) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Question</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="technology, ethics, privacy"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isDaily"
              checked={isDaily}
              onCheckedChange={(checked) => setIsDaily(checked as boolean)}
            />
            <Label htmlFor="isDaily">Daily Question</Label>
          </div>

          {isDaily && (
            <div>
              <Label htmlFor="dailyDate">Daily Date</Label>
              <Input
                id="dailyDate"
                type="date"
                value={dailyDate}
                onChange={(e) => setDailyDate(e.target.value)}
              />
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Question"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}