"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { login, type LoginState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full">
      {pending && (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    login,
    null,
  );
  const next = useSearchParams().get("next") ?? "";

  return (
    <form
      action={formAction}
      aria-busy={pending}
      className="flex flex-col gap-5"
    >
      <input type="hidden" name="next" value={next} />
      <Input
        label="Passphrase"
        name="passphrase"
        type="password"
        autoComplete="current-password"
        autoFocus
        required
        error={state?.error}
      />
      <SubmitButton />
    </form>
  );
}
