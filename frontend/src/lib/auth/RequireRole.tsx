"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import type { Role } from "@/lib/types/auth";

/**
 * Gates a page to callers holding `role` (any one of them, if given a list). Client-side only —
 * a real permission boundary lives server-side per endpoint (e.g. `@PreAuthorize` on the
 * controller); this just keeps someone without the role from landing on a page that would only
 * 403 anyway.
 */
export function RequireRole({ role, children }: { role: Role | Role[]; children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const allowed = Array.isArray(role) ? role : [role];

  const authorized = !!user && user.roles.some((r) => allowed.includes(r));

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    } else if (!authorized) {
      router.replace("/");
    }
  }, [loading, user, authorized, router]);

  if (loading || !authorized) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-sm text-slate-500">{t("requireRole.loading")}</p>
      </main>
    );
  }

  return <>{children}</>;
}
