"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Edit2,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { useConfirm } from "@/components/ui/confirm-provider";

type Role = "owner" | "manager" | "staff";

export type AdminUserRow = {
  id: string;
  email: string;
  name: string;
  role: Role;
  lastLoginAt: string | null;
  deletedAt: string | null;
  createdAt: string;
};

const ROLE_LABEL: Record<Role, string> = {
  owner: "Owner",
  manager: "Manager",
  staff: "Staff",
};

const ROLE_BADGE: Record<Role, string> = {
  owner: "bg-violet-100 text-violet-800",
  manager: "bg-blue-100 text-blue-800",
  staff: "bg-[color:var(--color-navy)]/10 text-[color:var(--color-navy)]/75",
};

export function AdminUsersManager({
  initial,
  currentAdminId,
}: {
  initial: AdminUserRow[];
  currentAdminId: string;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const active = initial.filter((u) => !u.deletedAt);

  async function createUser(payload: {
    email: string;
    name: string;
    password: string;
    role: Role;
  }) {
    setBusyId("__create__");
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? "Error");
      }
      setCreating(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusyId(null);
    }
  }

  async function updateUser(
    id: string,
    payload: { name?: string; role?: Role; password?: string },
  ) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? "Error");
      }
      setEditingId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteUser(id: string) {
    const ok = await confirm({
      title: "¿Borrar este usuario?",
      message: "No va a poder loguearse más al admin.",
      confirmLabel: "Borrar usuario",
      variant: "danger",
    });
    if (!ok) return;
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? "Error");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="rounded-2xl border border-[color:var(--color-navy)]/12 bg-white p-5 md:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h2 className="font-display text-[20px] leading-tight text-[color:var(--color-navy)] md:text-[22px]">
            Usuarios admin
          </h2>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-navy)]/55 md:text-[11px]">
            Quién entra al panel m90.studio/admin
          </p>
        </div>
        {!creating && (
          <button
            type="button"
            onClick={() => {
              setCreating(true);
              setError(null);
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-navy)] px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-cream-soft)] transition-all hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <Plus className="h-3 w-3" />
            Nuevo usuario
          </button>
        )}
      </div>

      {creating && (
        <div className="mt-5">
          <CreateForm
            busy={busyId === "__create__"}
            onSubmit={createUser}
            onCancel={() => {
              setCreating(false);
              setError(null);
            }}
          />
        </div>
      )}

      <ul className="mt-5 flex flex-col gap-2.5">
        {active.map((u) => (
          <li
            key={u.id}
            className="rounded-xl border border-[color:var(--color-navy)]/10 bg-[color:var(--color-paper)] p-4"
          >
            {editingId === u.id ? (
              <EditForm
                user={u}
                isSelf={u.id === currentAdminId}
                busy={busyId === u.id}
                onSubmit={(payload) => updateUser(u.id, payload)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-display text-[16px] leading-tight text-[color:var(--color-navy)]">
                      {u.name}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] ${ROLE_BADGE[u.role]}`}
                    >
                      {ROLE_LABEL[u.role]}
                    </span>
                    {u.id === currentAdminId && (
                      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-emerald-700">
                        · vos
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] text-[color:var(--color-navy)]/60">
                    <span className="font-mono">{u.email}</span>
                    <span>·</span>
                    <span>
                      {u.lastLoginAt
                        ? `Último login ${fmt(u.lastLoginAt)}`
                        : "Nunca entró"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-shrink-0 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(u.id);
                      setError(null);
                    }}
                    disabled={busyId !== null}
                    className="inline-flex h-8 items-center gap-1 rounded-full border border-[color:var(--color-navy)]/15 bg-white px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-navy)]/65 hover:bg-[color:var(--color-navy)]/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span className="hidden sm:inline">Editar</span>
                  </button>
                  {u.id !== currentAdminId && (
                    <button
                      type="button"
                      onClick={() => deleteUser(u.id)}
                      disabled={busyId !== null}
                      className="inline-flex h-8 items-center gap-1 rounded-full bg-red-100 px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-red-800 hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {busyId === u.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                      <span className="hidden sm:inline">Borrar</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {error && <p className="mt-3 text-[12px] text-red-700">{error}</p>}

      <p className="mt-5 text-[11px] leading-relaxed text-[color:var(--color-navy)]/55 md:text-[12px]">
        <strong>Roles:</strong> <code>owner</code> puede ver/crear/editar/borrar usuarios. <code>manager</code> y <code>staff</code> solo entran al dashboard. No podés borrarte a vos mismo ni dejar el sistema sin ningún owner.
      </p>
    </div>
  );
}

/* ============================================================
   FORMS
   ============================================================ */

function CreateForm({
  busy,
  onSubmit,
  onCancel,
}: {
  busy: boolean;
  onSubmit: (payload: {
    email: string;
    name: string;
    password: string;
    role: Role;
  }) => void;
  onCancel: () => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("staff");

  const valid =
    email.trim().length > 4 && name.trim().length > 0 && password.length >= 8;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        onSubmit({
          email: email.trim().toLowerCase(),
          name: name.trim(),
          password,
          role,
        });
      }}
      className="rounded-xl border border-[color:var(--color-navy)]/15 bg-[color:var(--color-paper)] p-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          autoFocus
        />
        <Field label="Nombre" value={name} onChange={setName} />
        <Field
          label="Contraseña (min 8)"
          type="password"
          value={password}
          onChange={setPassword}
        />
        <RoleSelect value={role} onChange={setRole} />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="inline-flex h-9 items-center gap-1 rounded-full border border-[color:var(--color-navy)]/15 bg-white px-4 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-navy)]/65 hover:bg-[color:var(--color-navy)]/[0.04]"
        >
          <X className="h-3 w-3" />
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!valid || busy}
          className="inline-flex h-9 items-center gap-1 rounded-full bg-[color:var(--color-navy)] px-5 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-cream-soft)] transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Check className="h-3 w-3" strokeWidth={3} />
          )}
          Crear
        </button>
      </div>
    </form>
  );
}

function EditForm({
  user,
  isSelf,
  busy,
  onSubmit,
  onCancel,
}: {
  user: AdminUserRow;
  isSelf: boolean;
  busy: boolean;
  onSubmit: (payload: {
    name?: string;
    role?: Role;
    password?: string;
  }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState<Role>(user.role);
  const [password, setPassword] = useState("");
  const [resetPass, setResetPass] = useState(false);

  const passwordOk = !resetPass || password.length >= 8;
  const valid = name.trim().length > 0 && passwordOk;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        const payload: { name?: string; role?: Role; password?: string } = {};
        if (name.trim() !== user.name) payload.name = name.trim();
        if (role !== user.role) payload.role = role;
        if (resetPass && password) payload.password = password;
        onSubmit(payload);
      }}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/55">
            Email
          </span>
          <span className="mt-1 block font-mono text-[13px] text-[color:var(--color-navy)]">
            {user.email}{" "}
            <span className="text-[10px] text-[color:var(--color-navy)]/45">
              (no editable)
            </span>
          </span>
        </div>
        <Field label="Nombre" value={name} onChange={setName} />
        {!isSelf && <RoleSelect value={role} onChange={setRole} />}
        <div className={isSelf ? "sm:col-span-2" : ""}>
          <label className="block font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/65">
            <input
              type="checkbox"
              checked={resetPass}
              onChange={(e) => setResetPass(e.target.checked)}
              className="mr-2 align-middle"
            />
            Resetear contraseña
          </label>
          {resetPass && (
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nueva contraseña (min 8)"
              className="mt-1.5 h-10 w-full rounded-full border border-[color:var(--color-navy)]/15 bg-white px-4 text-[13px] focus:border-[color:var(--color-navy-500)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-navy-500)]/15"
            />
          )}
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="inline-flex h-9 items-center gap-1 rounded-full border border-[color:var(--color-navy)]/15 bg-white px-4 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-navy)]/65 hover:bg-[color:var(--color-navy)]/[0.04]"
        >
          <RotateCcw className="h-3 w-3" />
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!valid || busy}
          className="inline-flex h-9 items-center gap-1 rounded-full bg-[color:var(--color-navy)] px-5 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-cream-soft)] hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Check className="h-3 w-3" strokeWidth={3} />
          )}
          Guardar
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  type = "text",
  value,
  onChange,
  autoFocus = false,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label className="block font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/65">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        className="mt-1.5 h-10 w-full rounded-full border border-[color:var(--color-navy)]/15 bg-white px-4 text-[13px] focus:border-[color:var(--color-navy-500)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-navy-500)]/15"
      />
    </div>
  );
}

function RoleSelect({
  value,
  onChange,
}: {
  value: Role;
  onChange: (r: Role) => void;
}) {
  return (
    <div>
      <label className="block font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/65">
        Rol
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Role)}
        className="mt-1.5 h-10 w-full rounded-full border border-[color:var(--color-navy)]/15 bg-white px-4 text-[13px] focus:border-[color:var(--color-navy-500)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-navy-500)]/15"
      >
        <option value="staff">Staff</option>
        <option value="manager">Manager</option>
        <option value="owner">Owner</option>
      </select>
    </div>
  );
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleString("es-CU", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Havana",
  });
}
