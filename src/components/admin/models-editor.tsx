"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BRAND_LABEL,
  BRANDS_ORDERED,
  type PhoneBrand,
  type PhoneModelDef,
} from "@/lib/data/phone-models";

type ModelRow = PhoneModelDef & { active: boolean };

export function ModelsEditor({ initial }: { initial: ModelRow[] }) {
  const router = useRouter();
  const [models, setModels] = useState(initial);
  const [brand, setBrand] = useState<PhoneBrand | "all">("all");
  const [showInactive, setShowInactive] = useState(false);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ModelRow | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return models.filter((m) => {
      if (brand !== "all" && m.brand !== brand) return false;
      if (!showInactive && !m.active) return false;
      if (q) {
        const hay =
          m.name.toLowerCase().includes(q) ||
          m.slug.toLowerCase().includes(q) ||
          m.aliases.some((a) => a.toLowerCase().includes(q));
        if (!hay) return false;
      }
      return true;
    });
  }, [models, brand, showInactive, query]);

  function applyUpdate(slug: string, patch: Partial<ModelRow>) {
    setModels((prev) =>
      prev.map((m) => (m.slug === slug ? { ...m, ...patch } : m)),
    );
  }

  function applyInsert(model: ModelRow) {
    setModels((prev) => [...prev, model]);
  }

  return (
    <>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-[color:var(--color-navy)]/10 bg-white p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[color:var(--color-navy)]/40" />
          <input
            type="text"
            placeholder="Buscar por nombre, slug o alias…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 w-full rounded-full border border-[color:var(--color-navy)]/15 bg-white pl-9 pr-3 font-mono text-[12px] text-[color:var(--color-navy)] focus:border-[color:var(--color-navy)] focus:outline-none"
          />
        </div>
        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value as PhoneBrand | "all")}
          className="h-9 rounded-full border border-[color:var(--color-navy)]/15 bg-white px-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-navy)] focus:border-[color:var(--color-navy)] focus:outline-none"
        >
          <option value="all">Todas las marcas</option>
          {BRANDS_ORDERED.map((b) => (
            <option key={b} value={b}>
              {BRAND_LABEL[b]}
            </option>
          ))}
        </select>
        <label className="inline-flex cursor-pointer items-center gap-2 px-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-navy)]/65">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="h-3.5 w-3.5"
          />
          Mostrar inactivos
        </label>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full bg-[color:var(--color-navy)] px-4 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-cream-soft)] transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
        >
          <Plus className="h-3.5 w-3.5" />
          Nuevo modelo
        </button>
      </div>

      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/55">
        {filtered.length} de {models.length} modelos
      </p>

      {/* Tabla */}
      <div className="overflow-hidden rounded-2xl border border-[color:var(--color-navy)]/10 bg-white">
        <table className="w-full text-left text-[13px] text-[color:var(--color-navy)]">
          <thead className="bg-[color:var(--color-navy)]/[0.04] font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/55">
            <tr>
              <th className="px-3 py-2.5">Marca</th>
              <th className="px-3 py-2.5">Nombre</th>
              <th className="px-3 py-2.5 text-right">W×H mm</th>
              <th className="px-3 py-2.5 text-right">Grosor</th>
              <th className="px-3 py-2.5 text-right">Pop</th>
              <th className="px-3 py-2.5">Estado</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr
                key={m.slug}
                className={cn(
                  "border-t border-[color:var(--color-navy)]/8 transition-colors hover:bg-[color:var(--color-navy)]/[0.03]",
                  !m.active && "opacity-50",
                )}
              >
                <td className="px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-navy-500)]">
                  {BRAND_LABEL[m.brand]}
                </td>
                <td className="px-3 py-2.5">
                  <div className="font-medium">{m.name}</div>
                  <div className="font-mono text-[10px] text-[color:var(--color-navy)]/45">
                    {m.slug}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-[12px] text-[color:var(--color-navy)]/75">
                  {m.widthMm} × {m.heightMm}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-[12px]">
                  <strong>{m.depthMm}</strong>mm
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-[12px] text-[color:var(--color-navy)]/55">
                  {m.popularity}
                </td>
                <td className="px-3 py-2.5">
                  {m.active ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-700">
                      Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                      Inactivo
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <button
                    type="button"
                    onClick={() => setEditing(m)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[color:var(--color-navy)]/15 bg-white px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-navy)]/65 hover:bg-[color:var(--color-navy)]/[0.04]"
                  >
                    <Pencil className="h-3 w-3" />
                    Editar
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-12 text-center font-mono text-[12px] text-[color:var(--color-navy)]/45"
                >
                  No hay modelos con esos filtros
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <ModelEditModal
          model={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            applyUpdate(editing.slug, updated);
            setEditing(null);
            router.refresh();
          }}
        />
      )}

      {creating && (
        <ModelCreateModal
          onClose={() => setCreating(false)}
          onCreated={(created) => {
            applyInsert(created);
            setCreating(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

// ============================================================
// Modal de edición — campos numéricos del modelo
// ============================================================

function ModelEditModal({
  model,
  onClose,
  onSaved,
}: {
  model: ModelRow;
  onClose: () => void;
  onSaved: (updated: ModelRow) => void;
}) {
  const [name, setName] = useState(model.name);
  const [brand, setBrand] = useState<PhoneBrand>(model.brand);
  const [aliasesText, setAliasesText] = useState(model.aliases.join("\n"));
  const [widthMm, setWidthMm] = useState(String(model.widthMm));
  const [heightMm, setHeightMm] = useState(String(model.heightMm));
  const [depthMm, setDepthMm] = useState(String(model.depthMm));
  const [cornerRadiusMm, setCornerRadiusMm] = useState(
    String(model.cornerRadiusMm),
  );
  const [popularity, setPopularity] = useState(String(model.popularity));
  const [active, setActive] = useState(model.active);
  const [cameraX, setCameraX] = useState(
    model.camera ? String(model.camera[0]) : "",
  );
  const [cameraY, setCameraY] = useState(
    model.camera ? String(model.camera[1]) : "",
  );
  const [cameraW, setCameraW] = useState(
    model.camera ? String(model.camera[2]) : "",
  );
  const [cameraH, setCameraH] = useState(
    model.camera ? String(model.camera[3]) : "",
  );
  const [hasCamera, setHasCamera] = useState(!!model.camera);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [, startRefresh] = useTransition();

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      const aliases = aliasesText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const camera = hasCamera
        ? ([
            Number.parseInt(cameraX, 10),
            Number.parseInt(cameraY, 10),
            Number.parseInt(cameraW, 10),
            Number.parseInt(cameraH, 10),
          ] as [number, number, number, number])
        : null;
      if (camera && camera.some((n) => !Number.isFinite(n))) {
        throw new Error("Coordenadas de cámara inválidas");
      }
      const body = {
        name: name.trim(),
        brand,
        aliases,
        widthMm: Number.parseInt(widthMm, 10),
        heightMm: Number.parseInt(heightMm, 10),
        depthMm: Number.parseInt(depthMm, 10),
        cornerRadiusMm: Number.parseInt(cornerRadiusMm, 10),
        popularity: Number.parseInt(popularity, 10),
        active,
        camera,
      };
      const res = await fetch(
        `/api/admin/phone-models/${encodeURIComponent(model.slug)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }
      onSaved({
        ...model,
        ...body,
        camera,
      });
      startRefresh(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error guardando");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      title={`Editar · ${model.slug}`}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex h-9 items-center rounded-full border border-[color:var(--color-navy)]/15 bg-white px-4 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-navy)]/65"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[color:var(--color-navy)] px-4 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-cream-soft)] disabled:opacity-50"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Guardar
          </button>
        </>
      }
    >
      <ModelFormFields
        slug={model.slug}
        slugReadOnly
        name={name}
        setName={setName}
        brand={brand}
        setBrand={setBrand}
        aliasesText={aliasesText}
        setAliasesText={setAliasesText}
        widthMm={widthMm}
        setWidthMm={setWidthMm}
        heightMm={heightMm}
        setHeightMm={setHeightMm}
        depthMm={depthMm}
        setDepthMm={setDepthMm}
        cornerRadiusMm={cornerRadiusMm}
        setCornerRadiusMm={setCornerRadiusMm}
        popularity={popularity}
        setPopularity={setPopularity}
        active={active}
        setActive={setActive}
        hasCamera={hasCamera}
        setHasCamera={setHasCamera}
        cameraX={cameraX}
        setCameraX={setCameraX}
        cameraY={cameraY}
        setCameraY={setCameraY}
        cameraW={cameraW}
        setCameraW={setCameraW}
        cameraH={cameraH}
        setCameraH={setCameraH}
        showActiveToggle
      />
      {error && (
        <p className="mt-3 font-mono text-[11px] text-red-700">{error}</p>
      )}
    </ModalShell>
  );
}

// ============================================================
// Modal de creación — mismo form pero con slug editable
// ============================================================

function ModelCreateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (created: ModelRow) => void;
}) {
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState<PhoneBrand>("apple");
  const [aliasesText, setAliasesText] = useState("");
  const [widthMm, setWidthMm] = useState("75");
  const [heightMm, setHeightMm] = useState("150");
  const [depthMm, setDepthMm] = useState("8");
  const [cornerRadiusMm, setCornerRadiusMm] = useState("10");
  const [popularity, setPopularity] = useState("0");
  const [active, setActive] = useState(true);
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraX, setCameraX] = useState("");
  const [cameraY, setCameraY] = useState("");
  const [cameraW, setCameraW] = useState("");
  const [cameraH, setCameraH] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    setError(null);
    setSaving(true);
    try {
      const aliases = aliasesText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const camera = hasCamera
        ? ([
            Number.parseInt(cameraX, 10),
            Number.parseInt(cameraY, 10),
            Number.parseInt(cameraW, 10),
            Number.parseInt(cameraH, 10),
          ] as [number, number, number, number])
        : null;
      if (camera && camera.some((n) => !Number.isFinite(n))) {
        throw new Error("Coordenadas de cámara inválidas");
      }
      const body = {
        slug: slug.trim().toLowerCase(),
        name: name.trim(),
        brand,
        aliases,
        widthMm: Number.parseInt(widthMm, 10),
        heightMm: Number.parseInt(heightMm, 10),
        depthMm: Number.parseInt(depthMm, 10),
        cornerRadiusMm: Number.parseInt(cornerRadiusMm, 10),
        popularity: Number.parseInt(popularity, 10),
        active,
        camera,
      };
      const res = await fetch(`/api/admin/phone-models`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }
      onCreated({
        ...body,
        camera,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creando");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      title="Nuevo modelo"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex h-9 items-center rounded-full border border-[color:var(--color-navy)]/15 bg-white px-4 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-navy)]/65"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={saving}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[color:var(--color-navy)] px-4 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-cream-soft)] disabled:opacity-50"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Crear
          </button>
        </>
      }
    >
      <div className="mb-3">
        <label className="block font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-navy)]/65">
          Slug (id semántico, sin espacios)
        </label>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="ej. iphone-26-pro"
          className="mt-1 w-full rounded-md border border-[color:var(--color-navy)]/15 bg-white px-3 py-2 font-mono text-[13px] text-[color:var(--color-navy)] focus:border-[color:var(--color-navy)] focus:outline-none"
        />
      </div>
      <ModelFormFields
        slug={slug}
        name={name}
        setName={setName}
        brand={brand}
        setBrand={setBrand}
        aliasesText={aliasesText}
        setAliasesText={setAliasesText}
        widthMm={widthMm}
        setWidthMm={setWidthMm}
        heightMm={heightMm}
        setHeightMm={setHeightMm}
        depthMm={depthMm}
        setDepthMm={setDepthMm}
        cornerRadiusMm={cornerRadiusMm}
        setCornerRadiusMm={setCornerRadiusMm}
        popularity={popularity}
        setPopularity={setPopularity}
        active={active}
        setActive={setActive}
        hasCamera={hasCamera}
        setHasCamera={setHasCamera}
        cameraX={cameraX}
        setCameraX={setCameraX}
        cameraY={cameraY}
        setCameraY={setCameraY}
        cameraW={cameraW}
        setCameraW={setCameraW}
        cameraH={cameraH}
        setCameraH={setCameraH}
      />
      {error && (
        <p className="mt-3 font-mono text-[11px] text-red-700">{error}</p>
      )}
    </ModalShell>
  );
}

// ============================================================
// Form fields compartidos entre crear/editar
// ============================================================

type FormFieldsProps = {
  slug: string;
  slugReadOnly?: boolean;
  name: string;
  setName: (v: string) => void;
  brand: PhoneBrand;
  setBrand: (v: PhoneBrand) => void;
  aliasesText: string;
  setAliasesText: (v: string) => void;
  widthMm: string;
  setWidthMm: (v: string) => void;
  heightMm: string;
  setHeightMm: (v: string) => void;
  depthMm: string;
  setDepthMm: (v: string) => void;
  cornerRadiusMm: string;
  setCornerRadiusMm: (v: string) => void;
  popularity: string;
  setPopularity: (v: string) => void;
  active: boolean;
  setActive: (v: boolean) => void;
  hasCamera: boolean;
  setHasCamera: (v: boolean) => void;
  cameraX: string;
  setCameraX: (v: string) => void;
  cameraY: string;
  setCameraY: (v: string) => void;
  cameraW: string;
  setCameraW: (v: string) => void;
  cameraH: string;
  setCameraH: (v: string) => void;
  showActiveToggle?: boolean;
};

function ModelFormFields(props: FormFieldsProps) {
  return (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Nombre">
          <input
            type="text"
            value={props.name}
            onChange={(e) => props.setName(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Marca">
          <select
            value={props.brand}
            onChange={(e) => props.setBrand(e.target.value as PhoneBrand)}
            className={inputCls}
          >
            {BRANDS_ORDERED.map((b) => (
              <option key={b} value={b}>
                {BRAND_LABEL[b]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Aliases (uno por línea — modelos comerciales que comparten este molde)">
        <textarea
          value={props.aliasesText}
          onChange={(e) => props.setAliasesText(e.target.value)}
          rows={3}
          className={cn(inputCls, "resize-none")}
        />
      </Field>

      <div className="grid gap-3 md:grid-cols-4">
        <Field label="Ancho (mm)">
          <input
            type="number"
            value={props.widthMm}
            onChange={(e) => props.setWidthMm(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Alto (mm)">
          <input
            type="number"
            value={props.heightMm}
            onChange={(e) => props.setHeightMm(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Grosor (mm)">
          <input
            type="number"
            value={props.depthMm}
            onChange={(e) => props.setDepthMm(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Esquina (mm)">
          <input
            type="number"
            value={props.cornerRadiusMm}
            onChange={(e) => props.setCornerRadiusMm(e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Field label="Popularidad (0-100, más alto = más arriba en el listado)">
          <input
            type="number"
            min={0}
            max={100}
            value={props.popularity}
            onChange={(e) => props.setPopularity(e.target.value)}
            className={inputCls}
          />
        </Field>
        {props.showActiveToggle && (
          <Field label="Estado">
            <label className="inline-flex h-9 cursor-pointer items-center gap-2 px-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--color-navy)]/75">
              <input
                type="checkbox"
                checked={props.active}
                onChange={(e) => props.setActive(e.target.checked)}
                className="h-4 w-4"
              />
              {props.active ? "Activo" : "Inactivo"}
            </label>
          </Field>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-[color:var(--color-navy)]/10 bg-[color:var(--color-cream-soft)]/30 p-3">
        <label className="inline-flex cursor-pointer items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-navy)]/75">
          <input
            type="checkbox"
            checked={props.hasCamera}
            onChange={(e) => props.setHasCamera(e.target.checked)}
            className="h-3.5 w-3.5"
          />
          Tiene zona de cámara (recorte visual)
        </label>
        {props.hasCamera && (
          <div className="mt-3 grid gap-2 md:grid-cols-4">
            <Field label="cam X (mm)">
              <input
                type="number"
                value={props.cameraX}
                onChange={(e) => props.setCameraX(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="cam Y (mm)">
              <input
                type="number"
                value={props.cameraY}
                onChange={(e) => props.setCameraY(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="cam W (mm)">
              <input
                type="number"
                value={props.cameraW}
                onChange={(e) => props.setCameraW(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="cam H (mm)">
              <input
                type="number"
                value={props.cameraH}
                onChange={(e) => props.setCameraH(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
        )}
      </div>
    </>
  );
}

const inputCls =
  "w-full h-9 rounded-md border border-[color:var(--color-navy)]/15 bg-white px-3 font-mono text-[12px] text-[color:var(--color-navy)] focus:border-[color:var(--color-navy)] focus:outline-none";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-navy)]/65">
        {label}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

// ============================================================
// Modal shell
// ============================================================

function ModalShell({
  title,
  onClose,
  footer,
  children,
}: {
  title: string;
  onClose: () => void;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[color:var(--color-navy)]/40 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[color:var(--color-navy)]/10 px-5 py-3">
          <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-navy)]">
            · {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-[color:var(--color-navy)]/55 hover:bg-[color:var(--color-navy)]/[0.06]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        <div className="flex justify-end gap-2 border-t border-[color:var(--color-navy)]/10 bg-[color:var(--color-cream-soft)]/30 px-5 py-3">
          {footer}
        </div>
      </div>
    </div>
  );
}
