import { NextResponse } from "next/server";
import { z } from "zod";
import { aiProvider } from "@/lib/ai";
import { parseModifications } from "@/lib/validation/ai";
import type { Trip } from "@/types";

const bodySchema = z.object({
  // The trip belongs to the requesting session; we accept it as-is and only
  // validate the instruction envelope. AI output is re-validated below.
  trip: z.custom<Trip>((v) => typeof v === "object" && v !== null),
  instruction: z.string().min(1).max(500),
  locale: z.enum(["ar", "en"]).default("ar"),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error" }, { status: 422 });
  }

  try {
    const result = await aiProvider.modifyTrip(parsed.data);
    // Defence in depth: validate the operations again before returning.
    const { valid } = parseModifications(result.modifications);
    return NextResponse.json({ ...result, modifications: valid });
  } catch {
    return NextResponse.json({ error: "modify_failed" }, { status: 500 });
  }
}
