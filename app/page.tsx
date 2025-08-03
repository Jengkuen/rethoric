"use client";

import {
  Authenticated,
  Unauthenticated,
} from "convex/react";
import Link from "next/link";
import { SignUpButton } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useAuthQuery } from "@/hooks/useAuthenticatedQuery";
import { api } from "@/convex/_generated/api";

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-10 bg-white dark:bg-neutral-950 p-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-row justify-between items-center">
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
          Rethoric
        </h1>
        <div className="flex items-center gap-4">
          <Authenticated>
            <Link href="/chat">
              <Button variant="outline" size="sm">
                Start Thinking
              </Button>
            </Link>
            <UserButton />
          </Authenticated>
          <Unauthenticated>
            <SignInButton mode="modal">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </SignInButton>
          </Unauthenticated>
        </div>
      </header>
      <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <Authenticated>
          <AuthenticatedHome />
        </Authenticated>
        <Unauthenticated>
          <LandingPage />
        </Unauthenticated>
      </main>
    </>
  );
}

function LandingPage() {
  return (
    <div className="container mx-auto px-6 py-16">
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
          Sharpen Your Mind with
          <span className="text-blue-600 dark:text-blue-400"> Critical Thinking</span>
        </h1>
        <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">
          Engage with thought-provoking questions and receive AI-powered coaching 
          to develop your reasoning skills, analyze complex issues, and think more clearly.
        </p>
        
        <div className="flex justify-center gap-4 mb-12">
          <SignUpButton mode="modal">
            <Button size="lg" className="px-8">
              Start Your Journey
            </Button>
          </SignUpButton>
          <SignInButton mode="modal">
            <Button variant="outline" size="lg" className="px-8">
              Sign In
            </Button>
          </SignInButton>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <FeatureCard
            title="Daily Questions"
            description="Explore challenging questions across politics, economics, technology, society, and ethics."
          />
          <FeatureCard
            title="AI Reasoning Coach"
            description="Get personalized feedback and guidance to improve your critical thinking process."
          />
          <FeatureCard
            title="Track Progress"
            description="Build streaks, see your growth, and develop consistent thinking habits."
          />
        </div>
      </div>
    </div>
  );
}

function AuthenticatedHome() {
  const userStats = useAuthQuery(api.users.getUserStats, {});

  // Still loading user data from Convex
  if (userStats === undefined) {
    return (
      <div className="container mx-auto px-6 py-16 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 dark:border-neutral-100"></div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            Loading...
          </h1>
        </div>
      </div>
    );
  }

  // User doesn't exist in Convex yet (webhook still processing)
  if (userStats === null) {
    return (
      <div className="container mx-auto px-6 py-16 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 dark:border-neutral-100"></div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            Setting up your account...
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            This will just take a moment
          </p>
        </div>
      </div>
    );
  }

  // User exists in Convex, show normal home page
  return (
    <div className="container mx-auto px-6 py-16 text-center">
      <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
        Welcome Back to Rethoric
      </h1>
      <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8">
        Ready to challenge your thinking today?
      </p>
      
      <div className="flex justify-center gap-4">
        <Link href="/chat">
          <Button size="lg" className="px-8">
            Start Thinking
          </Button>
        </Link>
        <Link href="/profile">
          <Button variant="outline" size="lg" className="px-8">
            View Profile
          </Button>
        </Link>
      </div>
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="text-center p-6">
      <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
        {title}
      </h3>
      <p className="text-neutral-600 dark:text-neutral-400">
        {description}
      </p>
    </div>
  );
}
