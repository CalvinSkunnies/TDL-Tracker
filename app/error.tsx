"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

/** Route-level error boundary: catches render errors below the root layout. */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="font-display text-3xl font-medium tracking-tight">
        Something went wrong
      </h1>
      <p className="text-ink-muted mt-3 text-sm">
        An unexpected error stopped this page. Your tasks are still saved in this
        browser.
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button variant="secondary" onClick={() => router.push("/tdl/tracker")}>
          Go to tasks
        </Button>
      </div>
    </div>
  );
}
