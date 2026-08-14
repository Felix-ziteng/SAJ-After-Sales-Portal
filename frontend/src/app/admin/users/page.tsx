"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api/client";
import { RequireRole } from "@/lib/auth/RequireRole";
import { ALL_ROLES, type Role } from "@/lib/types/auth";
import type { CreateUserRequest, UpdateUserRequest, User } from "@/lib/types/user";

function RoleCheckboxes({ selected, onChange }: { selected: Role[]; onChange: (roles: Role[]) => void }) {
  function toggle(role: Role) {
    onChange(selected.includes(role) ? selected.filter((r) => r !== role) : [...selected, role]);
  }

  return (
    <div className="flex flex-wrap gap-3">
      {ALL_ROLES.map((role) => (
        <label key={role} className="flex items-center gap-1.5 text-sm text-slate-700">
          <input type="checkbox" checked={selected.includes(role)} onChange={() => toggle(role)} />
          {role}
        </label>
      ))}
    </div>
  );
}

function RoleBadges({ roles }: { roles: Role[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((role) => (
        <span key={role} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {role}
        </span>
      ))}
    </div>
  );
}

function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [newRoles, setNewRoles] = useState<Role[]>([]);
  const [creating, setCreating] = useState(false);
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  const [editing, setEditing] = useState<User | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await apiFetch<User[]>("/api/users");
      setUsers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load users.");
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
        setError(err instanceof ApiError ? err.message : "Could not load users.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
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
      };
      await apiFetch<User>("/api/users", { method: "POST", body: JSON.stringify(payload) });
      setNewEmail("");
      setNewName("");
      setNewDepartment("");
      setNewRoles([]);
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

  async function handleSaveEdit() {
    if (!editing) return;
    setSavingEdit(true);
    try {
      const payload: UpdateUserRequest = {
        displayName: editing.displayName,
        department: editing.department ?? undefined,
        status: editing.status,
        roles: editing.roles,
      };
      await apiFetch<User>(`/api/users/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      setEditing(null);
      await loadUsers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save changes.");
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">Admin</p>
        <h1 className="text-lg font-semibold text-slate-900">Users &amp; Roles</h1>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
        {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <section className="mb-8 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">New user</h2>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <input
                  type="email"
                  required
                  placeholder="email@company.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                />
                {createErrors.email && <p className="mt-1 text-xs text-red-600">{createErrors.email}</p>}
              </div>
              <div>
                <input
                  required
                  placeholder="Display name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                />
                {createErrors.displayName && <p className="mt-1 text-xs text-red-600">{createErrors.displayName}</p>}
              </div>
              <input
                placeholder="Department"
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              />
            </div>
            <RoleCheckboxes selected={newRoles} onChange={setNewRoles} />
            {createErrors.roles && <p className="text-xs text-red-600">{createErrors.roles}</p>}
            <div>
              <button
                type="submit"
                disabled={creating || newRoles.length === 0}
                className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {creating ? "Creating…" : "Create user"}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs tracking-wide text-slate-500 uppercase">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Department</th>
                <th className="px-4 py-2">Roles</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    Loading…
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
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setEditing(user)}
                        className="text-sm text-slate-600 underline-offset-2 hover:underline"
                      >
                        Edit
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
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Edit {editing.email}</h2>
            <div className="flex flex-col gap-3">
              <input
                value={editing.displayName}
                onChange={(e) => setEditing({ ...editing, displayName: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              />
              <input
                value={editing.department ?? ""}
                onChange={(e) => setEditing({ ...editing, department: e.target.value })}
                placeholder="Department"
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              />
              <select
                value={editing.status}
                onChange={(e) => setEditing({ ...editing, status: e.target.value as User["status"] })}
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
              <RoleCheckboxes selected={editing.roles} onChange={(roles) => setEditing({ ...editing, roles })} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setEditing(null)}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit || editing.roles.length === 0}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {savingEdit ? "Saving…" : "Save"}
              </button>
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
