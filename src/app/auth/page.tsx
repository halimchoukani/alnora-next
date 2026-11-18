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
  const { user, signIn, signUp, signInWithGoogle } = useAuth();
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
        <>
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

          {/* Google OAuth separator + button */}
          {mode !== "forgot" && (
            <div className="mt-6">
              <div className="flex items-center gap-4 my-5">
                <div className="flex-1 h-px bg-border" />
                <span className="eyebrow text-[10px] sm:text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <button
                type="button"
                onClick={() => signInWithGoogle(redirect || undefined)}
                className="w-full flex items-center justify-center gap-3 border px-4 py-3 text-sm hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4l3.56-2.77z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.65 14.97 0 12 0 7.7 0 3.99 2.47 2.18 6.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>
            </div>
          )}
        </>
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

