import { NextResponse } from "next/server";
import { planFormSchema } from "@/lib/validation/plan";
import { tripService } from "@/services/trip-service";

/**
 * Trip generation runs server-side so a real AI key never reaches the client.
 * Input is validated with Zod before it touches the provider.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = planFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    const result = await tripService.generate(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    // Never leak internals; the client shows a friendly retry state.
    return NextResponse.json({ error: "generation_failed" }, { status: 500 });
  }
}
