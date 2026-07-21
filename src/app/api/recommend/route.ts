import { NextResponse } from "next/server";
import { z } from "zod";
import { aiProvider } from "@/lib/ai";
import { CURRENCIES, WEATHER_PREFERENCES } from "@/types/enums";
import { zEnum } from "@/lib/validation/common";

const schema = z.object({
  originCity: z.string().optional(),
  budgetPerDay: z.number().positive().optional(),
  currency: zEnum(CURRENCIES).optional(),
  durationDays: z.number().int().positive().optional(),
  weather: zEnum(WEATHER_PREFERENCES).optional(),
  maxFlightHours: z.number().positive().optional(),
  styles: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error" }, { status: 422 });
  }
  try {
    const recommendations = await aiProvider.recommendDestinations(parsed.data);
    return NextResponse.json({ recommendations });
  } catch {
    return NextResponse.json({ error: "recommend_failed" }, { status: 500 });
  }
}
