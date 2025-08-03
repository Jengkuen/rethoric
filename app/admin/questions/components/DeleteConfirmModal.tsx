"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Id } from "@/convex/_generated/dataModel";

interface DeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  questionId: Id<"questions"> | null;
  questionTitle: string;
}

export function DeleteConfirmModal({ open, onClose, questionId, questionTitle }: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteQuestion = useMutation(api.questions.deleteQuestion);

  const handleDelete = async () => {
    if (!questionId) return;

    setIsDeleting(true);
    try {
      await deleteQuestion({ questionId });
      onClose();
    } catch (error) {
      console.error("Failed to delete question:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Question</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{questionTitle}&quot;? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}