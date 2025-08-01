import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Join Rethoric
          </h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Create your account to start your critical thinking journey
          </p>
        </div>
        <SignUp 
          appearance={{
            elements: {
              formButtonPrimary: "bg-neutral-900 hover:bg-neutral-800 text-white",
              card: "shadow-lg border border-neutral-200 dark:border-neutral-800"
            }
          }}
        />
      </div>
    </div>
  )
}