import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <SignUp 
          path="/sign-up" 
          routing="path"
          appearance={{
            elements: {
              formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
              card: "shadow-lg",
              formFieldInput: "mb-2",
              formFieldLabel: "mb-2",
            },
          }}
          signInUrl="/sign-in"
          afterSignUpUrl="/dashboard"
          forceRedirectUrl="/dashboard"
        />
      </div>
    </div>
  );
}
