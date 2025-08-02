"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { QuestionTable } from "./components/QuestionTable";
import { CreateQuestionModal } from "./components/CreateQuestionModal";

export default function AdminQuestionsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const isAdmin = useQuery(api.users.isCurrentUserAdmin);
  const questions = useQuery(api.questions.listAllQuestions);

  if (isAdmin === undefined) {
    return <div>Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="mt-2 text-gray-600">You don't have permission to access this page.</p>
      </div>
    );
  }

  if (questions === undefined) {
    return <div>Loading questions...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Question Management</h1>
        <Button onClick={() => setShowCreateModal(true)}>
          Add Question
        </Button>
      </div>

      <QuestionTable questions={questions} />

      <CreateQuestionModal 
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}