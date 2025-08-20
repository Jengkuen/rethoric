"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface CreateQuestionModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateQuestionModal({ open, onClose }: CreateQuestionModalProps) {
  const [title, setTitle] = useState("");
  const [isDaily, setIsDaily] = useState(false);
  const [dailyDate, setDailyDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createQuestion = useMutation(api.questions.createQuestion);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createQuestion({
        title,
        isDaily,
        dailyDate: isDaily && dailyDate ? dailyDate : undefined,
      });

      // Reset form
      setTitle("");
      setIsDaily(false);
      setDailyDate("");
      onClose();
    } catch (error) {
      console.error("Failed to create question:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Question</DialogTitle>
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
              {isSubmitting ? "Creating..." : "Create Question"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}