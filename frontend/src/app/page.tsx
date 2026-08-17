"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { usePageTitle } from "@/lib/hooks/usePageTitle";
import { useTranslation, type TranslationKey } from "@/lib/i18n/LocaleProvider";
import type { Role } from "@/lib/types/auth";

interface QuickLink {
  href: string;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  roles?: Role[];
}

/** Guest (VIEWER) matches none of these `roles` lists on purpose — that role is scoped to the
 * ticket-number lookup below and nothing else, so it should see zero cards here. */
const QUICK_LINKS: QuickLink[] = [
  {
    href: "/overview",
    titleKey: "home.overviewTitle",
    descriptionKey: "home.overviewDesc",
    roles: ["TECHNICIAN", "MANAGER", "WAREHOUSE", "ADMIN"],
  },
  { href: "/technician", titleKey: "home.requestsTitle", descriptionKey: "home.requestsDesc", roles: ["TECHNICIAN", "ADMIN"] },
  { href: "/manager/approvals", titleKey: "home.approvalsTitle", descriptionKey: "home.approvalsDesc", roles: ["MANAGER", "ADMIN"] },
  { href: "/warehouse", titleKey: "home.warehouseTitle", descriptionKey: "home.warehouseDesc", roles: ["WAREHOUSE", "ADMIN"] },
  { href: "/analytics", titleKey: "home.analyticsTitle", descriptionKey: "home.analyticsDesc", roles: ["ADMIN"] },
  { href: "/admin/users", titleKey: "home.usersTitle", descriptionKey: "home.usersDesc", roles: ["ADMIN"] },
];

export default function Home() {
  const { t } = useTranslation();
  usePageTitle(t("home.title"));
  const router = useRouter();
  const { user, loading } = useAuth();
  const [ticketId, setTicketId] = useState("");

  function openTicket(e: React.FormEvent) {
    e.preventDefault();
    if (ticketId.trim()) {
      router.push(`/tickets/${encodeURIComponent(ticketId.trim())}`);
    }
  }

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-sm text-slate-500">{t("common.loading")}</p>
      </main>
    );
  }

  const links = QUICK_LINKS.filter((link) => !link.roles || link.roles.some((r) => user.roles.includes(r)));

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{t("home.eyebrow")}</p>
        <h1 className="text-lg font-semibold text-slate-900">{t("home.title")}</h1>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <p className="text-sm text-slate-500">{t("home.signedInAs", { email: user.email })}</p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-300 hover:bg-slate-50"
            >
              <p className="text-sm font-medium text-slate-900">{t(link.titleKey)}</p>
              <p className="mt-1 text-xs text-slate-500">{t(link.descriptionKey)}</p>
            </Link>
          ))}
        </div>

        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-1 text-sm font-semibold text-slate-900">{t("home.lookupHeading")}</h2>
          <p className="mb-3 text-xs text-slate-500">{t("home.lookupHint")}</p>
          <form onSubmit={openTicket} className="flex gap-2">
            <input
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              placeholder={t("home.ticketPlaceholder")}
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">
              {t("home.open")}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
