/**
 * Catalogo inicial de modelos de telefono que M90 Studio soporta.
 *
 * Cada entrada agrupa modelos con la MISMA carcasa fisica (mismo molde de
 * funda) bajo un solo `slug`. Asi una plantilla de impresion sirve para
 * varios telefonos comerciales y no inflamos el catalogo a 300 SKUs.
 *
 * Las dimensiones (mm) son las del cuerpo del telefono. La camara se anota
 * como bbox aproximado desde la esquina superior izquierda; sirve para
 * dibujar el recorte visual en el editor (no es print-ready).
 *
 * Fuente: specs publicas (Apple, Samsung, GSMArena). Verificar antes de
 * pasar a impresion real con plantilla del proveedor.
 */

export type PhoneBrand =
  | "apple"
  | "samsung"
  | "xiaomi"
  | "huawei"
  | "motorola"
  | "other";

export interface PhoneModelDef {
  slug: string;
  brand: PhoneBrand;
  name: string;
  /** Modelos comerciales que comparten este molde fisico. */
  aliases: string[];
  widthMm: number;
  heightMm: number;
  cornerRadiusMm: number;
  /** bbox aprox de la zona de camara [x, y, w, h] desde top-left, en mm. */
  camera: [number, number, number, number] | null;
  popularity: number; // 0..100 — cuanto mas alto, mas arriba aparece en Cuba
}

export const PHONE_MODELS: PhoneModelDef[] = [
  // ============================================================
  // APPLE — los mas pedidos en Cuba
  // ============================================================
  {
    slug: "iphone-11-xr",
    brand: "apple",
    name: "iPhone 11 / XR",
    aliases: ["iPhone 11", "iPhone XR"],
    widthMm: 75.7,
    heightMm: 150.9,
    cornerRadiusMm: 10,
    camera: [10, 9, 35, 35],
    popularity: 95,
  },
  {
    slug: "iphone-x-xs-11pro",
    brand: "apple",
    name: "iPhone X / XS / 11 Pro",
    aliases: ["iPhone X", "iPhone XS", "iPhone 11 Pro"],
    widthMm: 71.4,
    heightMm: 144.0,
    cornerRadiusMm: 10,
    camera: [10, 9, 30, 30],
    popularity: 80,
  },
  {
    slug: "iphone-12-13-14",
    brand: "apple",
    name: "iPhone 12 / 13 / 14",
    aliases: ["iPhone 12", "iPhone 13", "iPhone 14"],
    widthMm: 71.5,
    heightMm: 146.7,
    cornerRadiusMm: 11,
    camera: [10, 9, 30, 30],
    popularity: 92,
  },
  {
    slug: "iphone-12-13-pro",
    brand: "apple",
    name: "iPhone 12 / 13 Pro",
    aliases: ["iPhone 12 Pro", "iPhone 13 Pro"],
    widthMm: 71.5,
    heightMm: 146.7,
    cornerRadiusMm: 11,
    camera: [10, 9, 35, 35],
    popularity: 85,
  },
  {
    slug: "iphone-14-15-plus",
    brand: "apple",
    name: "iPhone 14 / 15 Plus",
    aliases: ["iPhone 14 Plus", "iPhone 15 Plus"],
    widthMm: 78.1,
    heightMm: 160.8,
    cornerRadiusMm: 12,
    camera: [10, 10, 32, 32],
    popularity: 70,
  },
  {
    slug: "iphone-14-15-16-pro",
    brand: "apple",
    name: "iPhone 14 / 15 / 16 Pro",
    aliases: ["iPhone 14 Pro", "iPhone 15 Pro", "iPhone 16 Pro"],
    widthMm: 71.5,
    heightMm: 147.5,
    cornerRadiusMm: 12,
    camera: [10, 10, 38, 38],
    popularity: 82,
  },
  {
    slug: "iphone-14-15-16-pro-max",
    brand: "apple",
    name: "iPhone 14 / 15 / 16 Pro Max",
    aliases: [
      "iPhone 14 Pro Max",
      "iPhone 15 Pro Max",
      "iPhone 16 Pro Max",
    ],
    widthMm: 77.6,
    heightMm: 160.7,
    cornerRadiusMm: 13,
    camera: [10, 10, 40, 40],
    popularity: 88,
  },
  {
    slug: "iphone-15-16",
    brand: "apple",
    name: "iPhone 15 / 16",
    aliases: ["iPhone 15", "iPhone 16"],
    widthMm: 71.6,
    heightMm: 147.6,
    cornerRadiusMm: 12,
    camera: [10, 10, 32, 32],
    popularity: 75,
  },

  // ============================================================
  // SAMSUNG — gama A media (popular en Cuba) + S series
  // ============================================================
  {
    slug: "galaxy-a14-a15",
    brand: "samsung",
    name: "Galaxy A14 / A15",
    aliases: ["Galaxy A14", "Galaxy A15"],
    widthMm: 76.7,
    heightMm: 167.7,
    cornerRadiusMm: 9,
    camera: [10, 12, 16, 60],
    popularity: 78,
  },
  {
    slug: "galaxy-a24-a25",
    brand: "samsung",
    name: "Galaxy A24 / A25",
    aliases: ["Galaxy A24", "Galaxy A25"],
    widthMm: 76.5,
    heightMm: 162.0,
    cornerRadiusMm: 9,
    camera: [10, 12, 18, 55],
    popularity: 70,
  },
  {
    slug: "galaxy-a54-a55",
    brand: "samsung",
    name: "Galaxy A54 / A55",
    aliases: ["Galaxy A54", "Galaxy A55"],
    widthMm: 76.7,
    heightMm: 158.2,
    cornerRadiusMm: 10,
    camera: [10, 12, 20, 55],
    popularity: 75,
  },
  {
    slug: "galaxy-s22-s23",
    brand: "samsung",
    name: "Galaxy S22 / S23",
    aliases: ["Galaxy S22", "Galaxy S23"],
    widthMm: 70.6,
    heightMm: 146.3,
    cornerRadiusMm: 9,
    camera: [10, 10, 22, 50],
    popularity: 65,
  },
  {
    slug: "galaxy-s23-s24-ultra",
    brand: "samsung",
    name: "Galaxy S23 / S24 Ultra",
    aliases: ["Galaxy S23 Ultra", "Galaxy S24 Ultra"],
    widthMm: 78.1,
    heightMm: 163.4,
    cornerRadiusMm: 4,
    camera: [10, 12, 18, 60],
    popularity: 68,
  },

  // ============================================================
  // XIAOMI / REDMI — muy popular Cuba
  // ============================================================
  {
    slug: "redmi-note-11-12",
    brand: "xiaomi",
    name: "Redmi Note 11 / 12",
    aliases: ["Redmi Note 11", "Redmi Note 12"],
    widthMm: 75.8,
    heightMm: 162.9,
    cornerRadiusMm: 9,
    camera: [10, 10, 32, 50],
    popularity: 85,
  },
  {
    slug: "redmi-note-13-13pro",
    brand: "xiaomi",
    name: "Redmi Note 13 / 13 Pro",
    aliases: ["Redmi Note 13", "Redmi Note 13 Pro"],
    widthMm: 75.5,
    heightMm: 161.1,
    cornerRadiusMm: 10,
    camera: [10, 10, 24, 60],
    popularity: 80,
  },
  {
    slug: "mi-11-lite",
    brand: "xiaomi",
    name: "Mi 11 Lite",
    aliases: ["Mi 11 Lite", "Mi 11 Lite 5G"],
    widthMm: 75.7,
    heightMm: 160.5,
    cornerRadiusMm: 9,
    camera: [10, 10, 35, 30],
    popularity: 60,
  },

  // ============================================================
  // HUAWEI / OTROS
  // ============================================================
  {
    slug: "huawei-p40-lite",
    brand: "huawei",
    name: "Huawei P40 Lite",
    aliases: ["Huawei P40 Lite", "Huawei Nova 7i"],
    widthMm: 76.3,
    heightMm: 159.2,
    cornerRadiusMm: 9,
    camera: [10, 10, 25, 30],
    popularity: 55,
  },
  {
    slug: "huawei-p30",
    brand: "huawei",
    name: "Huawei P30",
    aliases: ["Huawei P30", "Huawei P30 Lite"],
    widthMm: 71.4,
    heightMm: 149.1,
    cornerRadiusMm: 9,
    camera: [10, 10, 25, 30],
    popularity: 50,
  },
  {
    slug: "moto-g-series",
    brand: "motorola",
    name: "Motorola G Series",
    aliases: [
      "Moto G14",
      "Moto G24",
      "Moto G34",
      "Moto G54",
      "Moto G84",
    ],
    widthMm: 74.0,
    heightMm: 162.7,
    cornerRadiusMm: 9,
    camera: [10, 10, 28, 35],
    popularity: 45,
  },
];

export function findPhoneModel(slug: string): PhoneModelDef | undefined {
  return PHONE_MODELS.find((m) => m.slug === slug);
}

export const BRANDS_ORDERED: PhoneBrand[] = [
  "apple",
  "samsung",
  "xiaomi",
  "huawei",
  "motorola",
];

export const BRAND_LABEL: Record<PhoneBrand, string> = {
  apple: "Apple",
  samsung: "Samsung",
  xiaomi: "Xiaomi · Redmi",
  huawei: "Huawei",
  motorola: "Motorola",
  other: "Otro",
};
