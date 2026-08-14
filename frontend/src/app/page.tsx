"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function Home() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-sm text-slate-500">Loading…</p>
      </main>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">After-Sales Portal</p>
          <h1 className="text-lg font-semibold text-slate-900">Ticket Workspace</h1>
        </div>
        <div className="flex items-center gap-3">
          {user.roles.includes("ADMIN") && (
            <Link
              href="/admin/users"
              className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              Users &amp; Roles
            </Link>
          )}
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">{user.displayName}</p>
            <p className="text-xs text-slate-500">
              {user.roles.join(", ")} · {user.department}
            </p>
          </div>
          <button
            onClick={signOut}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6">
        <div className="max-w-md text-center">
          <p className="text-sm text-slate-500">
            Signed in as <span className="font-medium text-slate-700">{user.email}</span> — Phase 1 scaffolding is
            wired end to end (Next.js ↔ Spring Boot ↔ auth abstraction). The Ticket Workspace, Service Requests, and
            role-specific dashboards arrive in Phases 3+.
          </p>
        </div>
      </main>
    </div>
  );
}
