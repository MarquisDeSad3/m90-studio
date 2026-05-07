import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { updateCustomer } from "@/lib/data/customers-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  name: z.string().max(120).nullable().optional(),
  tags: z.array(z.string().min(1).max(40)).max(20).optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ phone: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { phone } = await ctx.params;

  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof z.ZodError
            ? err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
            : "Body invalido",
      },
      { status: 400 },
    );
  }

  const updated = await updateCustomer(phone, parsed);
  if (!updated) {
    return NextResponse.json(
      { error: `Cliente con phone "${phone}" no encontrado` },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, customer: updated });
}
