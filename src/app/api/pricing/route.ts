import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { coverPricing } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Endpoint publico — el editor del cliente lee los precios actuales para
    mostrar en el step de confirm. Es solo numeros, sin riesgo de filtrar
    nada sensible. */
export async function GET() {
  try {
    const rows = await db
      .select({
        type: coverPricing.type,
        priceUsdCents: coverPricing.priceUsdCents,
        priceCup: coverPricing.priceCup,
      })
      .from(coverPricing);

    const map: Record<string, { usdCents: number; cup: number }> = {};
    for (const r of rows) {
      map[r.type] = { usdCents: r.priceUsdCents, cup: r.priceCup };
    }
    return NextResponse.json({
      normal: map.normal ?? { usdCents: 700, cup: 2100 },
      coated: map.coated ?? { usdCents: 1500, cup: 4500 },
    });
  } catch {
    // DB caida — devolvemos defaults para que el editor no rompa.
    return NextResponse.json({
      normal: { usdCents: 700, cup: 2100 },
      coated: { usdCents: 1500, cup: 4500 },
    });
  }
}
