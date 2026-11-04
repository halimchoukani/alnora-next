"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { getAppwriteClient } from "@/lib/appwrite/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    const password = String(new FormData(e.currentTarget).get("password"));

    const { account, isConfigured } = getAppwriteClient();
    if (isConfigured && account) {
      try {
        // Appwrite password update
        await account.updatePassword(password);
        toast.success("Password updated");
        router.push("/account");
        return;
      } catch (err: any) {
        toast.error(err.message || "Failed to update password");
        setBusy(false);
        return;
      }
    }

    toast.success("Password updated");
    router.push("/account");
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-12 sm:py-24">
      <h1 className="text-3xl sm:text-4xl md:text-5xl text-center">New password</h1>
      <form onSubmit={submit} className="mt-8 sm:mt-12 space-y-4">
        <input
          name="password"
          type="password"
          required
          minLength={6}
          placeholder="New password"
          className="w-full border bg-background px-4 py-3 text-base sm:text-sm outline-none focus:border-primary min-h-[44px]"
        />
        <button disabled={busy} className="btn-luxe w-full cursor-pointer">
          {busy ? "Saving…" : "Save password"}
        </button>
      </form>
    </div>
  );
}

