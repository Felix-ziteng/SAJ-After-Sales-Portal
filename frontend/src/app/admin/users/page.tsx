"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api/client";
import { RequireRole } from "@/lib/auth/RequireRole";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useConfirm } from "@/lib/confirm/ConfirmProvider";
import { usePageTitle } from "@/lib/hooks/usePageTitle";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { ALL_ROLES, type Role } from "@/lib/types/auth";
import type { CreateUserRequest, UpdateUserRequest, User } from "@/lib/types/user";
import { PasswordInput } from "@/components/PasswordInput";

function RoleCheckboxes({ selected, onChange }: { selected: Role[]; onChange: (roles: Role[]) => void }) {
  const { role: roleLabel } = useTranslation();
  function toggle(role: Role) {
    onChange(selected.includes(role) ? selected.filter((r) => r !== role) : [...selected, role]);
  }

  return (
    <div className="flex flex-wrap gap-3">
      {ALL_ROLES.map((role) => (
        <label key={role} className="flex items-center gap-1.5 text-sm text-slate-700">
          <input type="checkbox" checked={selected.includes(role)} onChange={() => toggle(role)} />
          {roleLabel(role)}
        </label>
      ))}
    </div>
  );
}

function RoleBadges({ roles }: { roles: Role[] }) {
  const { role: roleLabel } = useTranslation();
  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((role) => (
        <span key={role} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {roleLabel(role)}
        </span>
      ))}
    </div>
  );
}

function AdminUsersPage() {
  const { t, userStatus: userStatusLabel } = useTranslation();
  usePageTitle(t("admin.title"));
  const { user: currentUser } = useAuth();
  const confirm = useConfirm();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [newRoles, setNewRoles] = useState<Role[]>([]);
  const [newPassword, setNewPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  const [editing, setEditing] = useState<User | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await apiFetch<User[]>("/api/users");
      setUsers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("admin.errorLoadUsers"));
    } finally {
      setLoading(false);
    }
  }

  // Owns its own state updates (rather than delegating to `loadUsers`, which is also called
  // imperatively after create/edit) so this effect can guard against setting state post-unmount.
  useEffect(() => {
    let cancelled = false;

    apiFetch<User[]>("/api/users")
      .then((data) => {
        if (cancelled) return;
        setUsers(data);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : t("admin.errorLoadUsers"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateErrors({});
    try {
      const payload: CreateUserRequest = {
        email: newEmail,
        displayName: newName,
        department: newDepartment || undefined,
        roles: newRoles,
        password: newPassword,
      };
      await apiFetch<User>("/api/users", { method: "POST", body: JSON.stringify(payload) });
      setNewEmail("");
      setNewName("");
      setNewDepartment("");
      setNewRoles([]);
      setNewPassword("");
      await loadUsers();
    } catch (err) {
      if (err instanceof ApiError) {
        setCreateErrors(err.fieldErrors);
        if (Object.keys(err.fieldErrors).length === 0) setError(err.message);
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteEditing() {
    if (!editing) return;
    const ok = await confirm({
      title: t("admin.deleteConfirmTitle"),
      message: t("admin.deleteConfirmMessage", { name: editing.displayName, email: editing.email }),
      confirmLabel: t("common.delete"),
      danger: true,
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await apiFetch<void>(`/api/users/${editing.id}`, { method: "DELETE" });
      setEditing(null);
      setResetPassword("");
      await loadUsers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("admin.errorDeleteUser"));
    } finally {
      setDeleting(false);
    }
  }

  async function handleUnlockEditing() {
    if (!editing) return;
    setUnlocking(true);
    try {
      const updated = await apiFetch<User>(`/api/users/${editing.id}`, {
        method: "PATCH",
        body: JSON.stringify({ unlock: true }),
      });
      setEditing(updated);
      await loadUsers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("admin.errorUnlockUser"));
    } finally {
      setUnlocking(false);
    }
  }

  async function handleSaveEdit() {
    if (!editing) return;
    setSavingEdit(true);
    try {
      const payload: UpdateUserRequest = {
        displayName: editing.displayName,
        department: editing.department ?? undefined,
        status: editing.status,
        roles: editing.roles,
        newPassword: resetPassword || undefined,
      };
      await apiFetch<User>(`/api/users/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      setEditing(null);
      setResetPassword("");
      await loadUsers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("admin.errorSaveChanges"));
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{t("admin.eyebrow")}</p>
        <h1 className="text-lg font-semibold text-slate-900">{t("admin.title")}</h1>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
        {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <section className="mb-8 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">{t("admin.newUserHeading")}</h2>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <input
                  type="email"
                  required
                  placeholder={t("admin.emailPlaceholder")}
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                />
                {createErrors.email && <p className="mt-1 text-xs text-red-600">{createErrors.email}</p>}
              </div>
              <div>
                <input
                  required
                  placeholder={t("admin.displayNamePlaceholder")}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                />
                {createErrors.displayName && <p className="mt-1 text-xs text-red-600">{createErrors.displayName}</p>}
              </div>
              <input
                placeholder={t("admin.departmentPlaceholder")}
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              />
              <div>
                <PasswordInput
                  required
                  minLength={8}
                  placeholder={t("admin.initialPasswordPlaceholder")}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                />
                {createErrors.password && <p className="mt-1 text-xs text-red-600">{createErrors.password}</p>}
              </div>
            </div>
            <RoleCheckboxes selected={newRoles} onChange={setNewRoles} />
            {createErrors.roles && <p className="text-xs text-red-600">{createErrors.roles}</p>}
            <div>
              <button
                type="submit"
                disabled={creating || newRoles.length === 0}
                className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {creating ? t("common.creating") : t("admin.createUser")}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs tracking-wide text-slate-500 uppercase">
                <th className="px-4 py-2">{t("admin.tableName")}</th>
                <th className="px-4 py-2">{t("admin.tableDepartment")}</th>
                <th className="px-4 py-2">{t("admin.tableRoles")}</th>
                <th className="px-4 py-2">{t("admin.tableStatus")}</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    {t("common.loading")}
                  </td>
                </tr>
              )}
              {!loading &&
                users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{user.displayName}</div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{user.department}</td>
                    <td className="px-4 py-3">
                      <RoleBadges roles={user.roles} />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          user.status === "ACTIVE"
                            ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
                            : "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500"
                        }
                      >
                        {userStatusLabel(user.status)}
                      </span>
                      {user.locked && (
                        <span className="ml-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                          {t("admin.locked")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setEditing(user)}
                        className="text-sm text-slate-600 underline-offset-2 hover:underline"
                      >
                        {t("common.edit")}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      </main>

      {editing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">{t("admin.editHeading", { email: editing.email })}</h2>
            {editing.locked && (
              <div className="mb-3 flex items-center justify-between gap-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
                <span>{t("admin.lockedBanner")}</span>
                <button
                  onClick={handleUnlockEditing}
                  disabled={unlocking}
                  className="flex-shrink-0 font-medium underline-offset-2 hover:underline disabled:opacity-50"
                >
                  {unlocking ? t("common.unlocking") : t("common.unlock")}
                </button>
              </div>
            )}
            <div className="flex flex-col gap-3">
              <input
                value={editing.displayName}
                onChange={(e) => setEditing({ ...editing, displayName: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              />
              <input
                value={editing.department ?? ""}
                onChange={(e) => setEditing({ ...editing, department: e.target.value })}
                placeholder={t("admin.departmentPlaceholder")}
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              />
              <select
                value={editing.status}
                onChange={(e) => setEditing({ ...editing, status: e.target.value as User["status"] })}
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              >
                <option value="ACTIVE">{userStatusLabel("ACTIVE")}</option>
                <option value="INACTIVE">{userStatusLabel("INACTIVE")}</option>
              </select>
              <RoleCheckboxes selected={editing.roles} onChange={(roles) => setEditing({ ...editing, roles })} />
              <label className="text-xs text-slate-500">
                {t("admin.resetPasswordLabel")}
                <PasswordInput
                  minLength={8}
                  placeholder={t("admin.resetPasswordPlaceholder")}
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900"
                />
              </label>
            </div>
            <div className="mt-4 flex items-center justify-between gap-2">
              {currentUser && String(editing.id) !== currentUser.id ? (
                <button
                  onClick={handleDeleteEditing}
                  disabled={deleting || savingEdit}
                  className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {deleting ? t("common.deleting") : t("admin.deleteAccount")}
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditing(null);
                    setResetPassword("");
                  }}
                  disabled={deleting}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 disabled:opacity-50"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={savingEdit || deleting || editing.roles.length === 0}
                  className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  {savingEdit ? t("common.saving") : t("common.save")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <RequireRole role="ADMIN">
      <AdminUsersPage />
    </RequireRole>
  );
}
