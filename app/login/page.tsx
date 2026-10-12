import type { Metadata } from "next";
import { Suspense } from "react";
import { Card, CardDescription, CardTitle } from "@/components/ui";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in · web-app" };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm pt-6 sm:pt-16">
      <Card className="p-8">
        <CardTitle className="text-3xl">Welcome back</CardTitle>
        <CardDescription className="mb-6">
          This site is private. Enter your passphrase to continue.
        </CardDescription>
        <Suspense>
          <LoginForm />
        </Suspense>
      </Card>
    </div>
  );
}
