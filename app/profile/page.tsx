"use client";

import { useMutation, Authenticated, Unauthenticated } from "convex/react";
import { useUser, SignInButton } from "@clerk/nextjs";
import { useAuthQuery } from "@/hooks/useAuthenticatedQuery";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

export default function ProfilePage() {
  return (
    <>
      <Authenticated>
        <AuthenticatedProfile />
      </Authenticated>
      <Unauthenticated>
        <UnauthenticatedProfile />
      </Unauthenticated>
    </>
  );
}

function UnauthenticatedProfile() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
          View Your Profile
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mb-8">
          Sign in to access your profile, track your progress, and manage your critical thinking journey.
        </p>
        <SignInButton mode="modal">
          <Button size="lg" className="px-8">
            Sign In to Continue
          </Button>
        </SignInButton>
      </div>
    </div>
  );
}

function AuthenticatedProfile() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const userStats = useAuthQuery(api.users.getUserStats, {});
  const updateProfile = useMutation(api.users.updateProfile);
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");

  const handleSave = async () => {
    await updateProfile({ name: name || undefined });
    setIsEditing(false);
  };

  // Handle different loading states explicitly
  if (!clerkLoaded || !clerkUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (userStats === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading profile data...</p>
        </div>
      </div>
    );
  }

  if (userStats === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
            Welcome to Rethoric!
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8">
            Your profile will be created when you interact with the app. Try editing your profile or starting a conversation.
          </p>
          <Button 
            onClick={() => updateProfile({ name: clerkUser?.fullName || undefined })}
          >
            Initialize Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            Profile
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2">
            Manage your account and view your progress
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={clerkUser.imageUrl} />
                  <AvatarFallback>
                    {clerkUser.firstName?.[0]}{clerkUser.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-semibold">
                    {userStats.name || clerkUser.fullName || "User"}
                  </h2>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    {userStats.email}
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Display Name</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={userStats.name || clerkUser.fullName || ""}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave} size="sm">
                      Save
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setName(userStats.name || "");
                    setIsEditing(true);
                  }}
                >
                  Edit Profile
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>Your Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-neutral-600 dark:text-neutral-400">Current Streak</span>
                <span className="font-semibold text-2xl text-orange-600">
                  0 🔥
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-neutral-600 dark:text-neutral-400">Total Conversations</span>
                <span className="font-semibold text-lg">
                  0
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-neutral-600 dark:text-neutral-400">Questions Answered</span>
                <span className="font-semibold text-lg">
                  0
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-neutral-600 dark:text-neutral-400">Member Since</span>
                <span className="font-semibold text-lg">
                  {new Date(userStats.createdAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}