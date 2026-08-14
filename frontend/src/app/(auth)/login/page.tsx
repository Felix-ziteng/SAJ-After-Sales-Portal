"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { AuthenticatedUser } from "@/lib/types/auth";

export default function LoginPage() {
  const router = useRouter();
  const { signInAs } = useAuth();
  const [demoUsers, setDemoUsers] = useState<AuthenticatedUser[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<AuthenticatedUser[]>("/api/auth/demo-users")
      .then(setDemoUsers)
      .catch(() => setError("Could not reach the backend. Is it running on :8080?"));
  }, []);

  async function handleSelect(user: AuthenticatedUser) {
    setPending(user.email);
    try {
      await signInAs(user.email);
      router.push("/");
    } finally {
      setPending(null);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6">
      <div>
        <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
          After-Sales Portal — Dev Sign-in
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Choose a demo identity</h1>
        <p className="mt-2 text-sm text-slate-500">
          Standing in for company SSO until Microsoft Entra ID is wired up. Pick a role to explore the portal as
          that user.
        </p>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex flex-col gap-2">
        {demoUsers.map((user) => (
          <button
            key={user.email}
            onClick={() => handleSelect(user)}
            disabled={pending !== null}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
          >
            <span>
              <span className="block text-sm font-medium text-slate-900">{user.displayName}</span>
              <span className="block text-xs text-slate-500">
                {user.department} · {user.email}
              </span>
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              {user.roles[0]}
            </span>
          </button>
        ))}
      </div>
    </main>
  );
}
