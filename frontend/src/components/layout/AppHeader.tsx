"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useConfirm } from "@/lib/confirm/ConfirmProvider";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

/** The one persistent way to get Home or sign out from anywhere in the app — every page used to
 * bury its own header/actions with no escape hatch except the browser's back button. Hidden on
 * `/login` (nothing to navigate away from yet) and `/confirm/[token]` (the anonymous guest page
 * has no staff session and shouldn't imply one). */
export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const confirm = useConfirm();
  const { t, role: roleLabel } = useTranslation();

  if (!user || pathname === "/login" || pathname.startsWith("/confirm/")) {
    return null;
  }

  async function handleSignOut() {
    const ok = await confirm({
      title: t("confirmDialog.signOutTitle"),
      message: t("confirmDialog.signOutMessage"),
      confirmLabel: t("confirmDialog.signOutConfirm"),
    });
    if (!ok) return;
    await signOut();
    router.push("/login");
  }

  return (
    <div className="flex items-center justify-between bg-slate-900 px-6 py-2 text-white">
      <div className="flex items-center gap-5">
        <Link href="/" className="text-sm font-semibold tracking-wide">
          {t("nav.portalName")}
        </Link>
        <nav className="flex items-center gap-4 text-xs text-slate-300">
          {(user.roles.includes("TECHNICIAN") ||
            user.roles.includes("MANAGER") ||
            user.roles.includes("WAREHOUSE") ||
            user.roles.includes("ADMIN")) && (
            <Link href="/overview" className="hover:text-white">
              {t("nav.overview")}
            </Link>
          )}
          {(user.roles.includes("TECHNICIAN") || user.roles.includes("ADMIN")) && (
            <Link href="/technician" className="hover:text-white">
              {t("nav.requests")}
            </Link>
          )}
          {(user.roles.includes("MANAGER") || user.roles.includes("ADMIN")) && (
            <Link href="/manager/approvals" className="hover:text-white">
              {t("nav.approvals")}
            </Link>
          )}
          {(user.roles.includes("WAREHOUSE") || user.roles.includes("ADMIN")) && (
            <Link href="/warehouse" className="hover:text-white">
              {t("nav.warehouse")}
            </Link>
          )}
          {user.roles.includes("ADMIN") && (
            <Link href="/analytics" className="hover:text-white">
              {t("nav.analytics")}
            </Link>
          )}
          {user.roles.includes("ADMIN") && (
            <Link href="/admin/users" className="hover:text-white">
              {t("nav.usersRoles")}
            </Link>
          )}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-300">
          {user.displayName} · {user.roles.map(roleLabel).join(", ")}
        </span>
        <LanguageSwitcher dark />
        <Link href="/account" className="rounded-md border border-slate-600 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-800">
          {t("nav.changePassword")}
        </Link>
        <button
          onClick={handleSignOut}
          className="rounded-md border border-slate-600 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-800"
        >
          {t("nav.signOut")}
        </button>
      </div>
    </div>
  );
}
