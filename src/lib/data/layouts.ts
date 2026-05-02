/**
 * Catalogo de layouts (mosaicos) que el usuario puede aplicar a su funda.
 *
 * Cada layout define `slots`: cajas relativas al canvas (0..1) que indican
 * donde va cada foto. El editor + el preview + el export usan el MISMO
 * dataset, asi lo que el cliente disena es exactamente lo que se imprime.
 *
 * Coordenadas: (0,0) arriba-izquierda, (1,1) abajo-derecha. Aspect ratio
 * del canvas es vertical (~1:2 segun el modelo), pero los slots son
 * relativos asi que escalan.
 */

export type LayoutCategory = "single" | "grid" | "asymmetric";

export interface LayoutSlot {
  /** Posicion top-left del slot, en fracciones del canvas (0..1). */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LayoutDef {
  id: string;
  name: string;
  category: LayoutCategory;
  count: number;
  slots: LayoutSlot[];
}

/* Helper para no escribir 1.0 todo el rato */
const F = (x: number, y: number, w: number, h: number): LayoutSlot => ({
  x,
  y,
  w,
  h,
});

export const LAYOUTS: LayoutDef[] = [
  // ============================================================
  // 1 FOTO
  // ============================================================
  {
    id: "1-full",
    name: "1 foto · pantalla completa",
    category: "single",
    count: 1,
    slots: [F(0, 0, 1, 1)],
  },

  // ============================================================
  // 2 FOTOS
  // ============================================================
  {
    id: "2-vertical",
    name: "2 fotos · vertical",
    category: "grid",
    count: 2,
    slots: [F(0, 0, 1, 0.5), F(0, 0.5, 1, 0.5)],
  },
  {
    id: "2-horizontal",
    name: "2 fotos · horizontal",
    category: "grid",
    count: 2,
    slots: [F(0, 0, 0.5, 1), F(0.5, 0, 0.5, 1)],
  },

  // ============================================================
  // 3 FOTOS — asimetricos
  // ============================================================
  {
    id: "3-hero-left",
    name: "3 fotos · grande izquierda + 2 stack",
    category: "asymmetric",
    count: 3,
    slots: [
      F(0, 0, 0.6, 1),
      F(0.6, 0, 0.4, 0.5),
      F(0.6, 0.5, 0.4, 0.5),
    ],
  },
  {
    id: "3-pano-top",
    name: "3 fotos · panoramica + 2 abajo",
    category: "asymmetric",
    count: 3,
    slots: [
      F(0, 0, 1, 0.5),
      F(0, 0.5, 0.5, 0.5),
      F(0.5, 0.5, 0.5, 0.5),
    ],
  },

  // ============================================================
  // 4 FOTOS
  // ============================================================
  {
    id: "4-grid",
    name: "4 fotos · cuadrantes",
    category: "grid",
    count: 4,
    slots: [
      F(0, 0, 0.5, 0.5),
      F(0.5, 0, 0.5, 0.5),
      F(0, 0.5, 0.5, 0.5),
      F(0.5, 0.5, 0.5, 0.5),
    ],
  },
  {
    id: "4-hero-row",
    name: "4 fotos · hero + 3 fila",
    category: "asymmetric",
    count: 4,
    slots: [
      F(0, 0, 1, 0.65),
      F(0, 0.65, 1 / 3, 0.35),
      F(1 / 3, 0.65, 1 / 3, 0.35),
      F(2 / 3, 0.65, 1 / 3, 0.35),
    ],
  },

  // ============================================================
  // 5 FOTOS
  // ============================================================
  {
    id: "5-magazine",
    name: "5 fotos · magazine",
    category: "asymmetric",
    count: 5,
    slots: [
      F(0, 0, 0.5, 0.5),
      F(0.5, 0, 0.5, 0.5),
      F(0, 0.5, 1 / 3, 0.5),
      F(1 / 3, 0.5, 1 / 3, 0.5),
      F(2 / 3, 0.5, 1 / 3, 0.5),
    ],
  },

  // ============================================================
  // 6 FOTOS
  // ============================================================
  {
    id: "6-grid",
    name: "6 fotos · grid 2x3",
    category: "grid",
    count: 6,
    slots: [
      F(0, 0, 0.5, 1 / 3),
      F(0.5, 0, 0.5, 1 / 3),
      F(0, 1 / 3, 0.5, 1 / 3),
      F(0.5, 1 / 3, 0.5, 1 / 3),
      F(0, 2 / 3, 0.5, 1 / 3),
      F(0.5, 2 / 3, 0.5, 1 / 3),
    ],
  },
  {
    id: "6-hero-stack",
    name: "6 fotos · hero izquierda + 5 stack",
    category: "asymmetric",
    count: 6,
    slots: [
      F(0, 0, 0.55, 1),
      F(0.55, 0, 0.45, 0.2),
      F(0.55, 0.2, 0.45, 0.2),
      F(0.55, 0.4, 0.45, 0.2),
      F(0.55, 0.6, 0.45, 0.2),
      F(0.55, 0.8, 0.45, 0.2),
    ],
  },

  // ============================================================
  // 9 FOTOS
  // ============================================================
  {
    id: "9-grid",
    name: "9 fotos · grid 3x3",
    category: "grid",
    count: 9,
    slots: Array.from({ length: 9 }).map((_, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      return F(col / 3, row / 3, 1 / 3, 1 / 3);
    }),
  },
];

export function findLayout(id: string): LayoutDef | undefined {
  return LAYOUTS.find((l) => l.id === id);
}

export const LAYOUTS_BY_COUNT = LAYOUTS.reduce<Record<number, LayoutDef[]>>(
  (acc, l) => {
    (acc[l.count] ??= []).push(l);
    return acc;
  },
  {},
);
