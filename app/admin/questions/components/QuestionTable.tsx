"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EditQuestionModal } from "./EditQuestionModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { Id } from "@/convex/_generated/dataModel";

interface Question {
  _id: Id<"questions">;
  title: string;
  description: string;
  tags: string[];
  isDaily: boolean;
  dailyDate?: string;
  createdAt: number;
}

interface QuestionTableProps {
  questions: Question[];
}

export function QuestionTable({ questions }: QuestionTableProps) {
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<Id<"questions"> | null>(null);
  const [deletingQuestionTitle, setDeletingQuestionTitle] = useState("");

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
  };

  const handleDelete = (question: Question) => {
    setDeletingQuestionId(question._id);
    setDeletingQuestionTitle(question.title);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Daily</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.map((question) => (
              <TableRow key={question._id}>
                <TableCell className="font-medium">
                  {question.title}
                </TableCell>
                <TableCell className="max-w-md truncate">
                  {question.description}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {question.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {question.isDaily ? (
                    <Badge variant="default">
                      {question.dailyDate || "Daily"}
                    </Badge>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  {formatDate(question.createdAt)}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(question)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(question)}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {questions.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No questions found. Create your first question to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <EditQuestionModal
        open={editingQuestion !== null}
        onClose={() => setEditingQuestion(null)}
        question={editingQuestion}
      />

      <DeleteConfirmModal
        open={deletingQuestionId !== null}
        onClose={() => {
          setDeletingQuestionId(null);
          setDeletingQuestionTitle("");
        }}
        questionId={deletingQuestionId}
        questionTitle={deletingQuestionTitle}
      />
    </>
  );
}