import { NextResponse } from "next/server";

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://127.0.0.1:8000";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const symbol = new URL(request.url).searchParams.get("symbol")?.trim().toUpperCase() ?? "";

  if (!symbol) {
    return NextResponse.json({ insights: [] });
  }

  try {
    const response = await fetch(`${FASTAPI_BASE_URL}/api/insights?symbol=${encodeURIComponent(symbol)}`, {
      cache: "no-store",
    });
    const payload = await response.json();

    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ insights: [], error: "Insights backend unavailable." }, { status: 503 });
  }
}
