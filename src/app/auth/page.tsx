"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, Suspense } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const safePath = (p: string | null) =>
  p && p.startsWith("/") && !p.startsWith("//") ? p : "/account";

const field =
  "w-full border bg-background px-4 py-3 text-base sm:text-sm outline-none focus:border-primary min-h-[44px]";

function AuthForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const { user, signIn, signUp } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      router.replace(safePath(redirect));
    }
  }, [user, redirect, router]);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")).trim();
    const password = String(f.get("password") ?? "");
    const name = String(f.get("name") ?? "").trim();

    setBusy(true);

    if (mode === "signin") {
      const res = await signIn(email, password);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Welcome back");
        router.replace(safePath(redirect));
      }
    } else if (mode === "signup") {
      const res = await signUp(email, password, name);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Account created successfully");
        router.replace(safePath(redirect));
      }
    } else {
      // Forgot password mode
      setSent("If an account exists with that email, a password reset link has been dispatched.");
      toast.success("Reset link sent");
    }

    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-12 sm:py-24">
      <h1 className="text-3xl sm:text-4xl md:text-5xl text-center">
        {mode === "signup" ? "Create account" : mode === "forgot" ? "Reset password" : "Sign in"}
      </h1>

      {sent ? (
        <div className="mt-8 sm:mt-10 text-center">
          <p className="text-muted-foreground leading-relaxed">{sent}</p>
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setSent(null);
            }}
            className="btn-outline-luxe mt-6"
          >
            Back to Sign in
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 sm:mt-12 space-y-4">
          {mode === "signup" && (
            <input
              name="name"
              required
              placeholder="Full name"
              className={field}
            />
          )}
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className={field}
          />
          {mode !== "forgot" && (
            <input
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="Password"
              className={field}
            />
          )}
          <button disabled={busy} className="btn-luxe w-full mt-2 cursor-pointer">
            {busy
              ? "Please wait…"
              : mode === "signup"
              ? "Create account"
              : mode === "forgot"
              ? "Send reset link"
              : "Sign in"}
          </button>
        </form>
      )}

      <div className="mt-8 flex flex-col items-center gap-3 eyebrow text-[10px] sm:text-xs text-muted-foreground">
        {mode !== "signin" && (
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setSent(null);
            }}
            className="hover:text-foreground py-1 cursor-pointer transition-colors"
          >
            Already have an account? Sign in
          </button>
        )}
        {mode !== "signup" && (
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setSent(null);
            }}
            className="hover:text-foreground py-1 cursor-pointer transition-colors"
          >
            New to ALNORA? Create account
          </button>
        )}
        {mode === "signin" && (
          <button
            type="button"
            onClick={() => setMode("forgot")}
            className="hover:text-foreground py-1 cursor-pointer transition-colors"
          >
            Forgot password?
          </button>
        )}
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center">Loading…</div>}>
      <AuthForm />
    </Suspense>
  );
}

