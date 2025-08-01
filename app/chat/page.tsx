"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function ChatPage() {
  return (
    <>
      <Authenticated>
        <AuthenticatedChat />
      </Authenticated>
      <Unauthenticated>
        <UnauthenticatedChat />
      </Unauthenticated>
    </>
  );
}

function UnauthenticatedChat() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
          Start Your Critical Thinking Journey
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mb-8">
          Sign in to access thought-provoking questions and receive AI-powered coaching to sharpen your reasoning skills.
        </p>
        <SignInButton mode="modal">
          <Button size="lg" className="px-8">
            Sign In to Start Thinking
          </Button>
        </SignInButton>
      </div>
    </div>
  );
}

function AuthenticatedChat() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
          Chat Interface
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mb-8">
          This will be implemented in Phase 3: Chat Interface & Real-time Messaging
        </p>
        <Button variant="outline" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    </div>
  );
}