import { NextResponse } from "next/server";

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://127.0.0.1:8000";

export const dynamic = "force-dynamic";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatPayload = {
  reply?: string;
  error?: string;
  detail?: string;
  type?: "comparison";
  text?: string;
  stocks?: Array<{
    ticker: string;
    price: number;
    change: number;
    candles: number[];
    times?: number[];
  }>;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { message?: string; history?: ChatMessage[] };
    const message = body.message?.trim() ?? "";

    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const response = await fetch(`${FASTAPI_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        message,
        history: Array.isArray(body.history) ? body.history.slice(-6) : [],
      }),
    });
    const payload = (await response.json()) as ChatPayload;

    return NextResponse.json(
      {
        ...payload,
        error: payload.error ?? payload.detail,
      },
      { status: response.status }
    );
  } catch {
    return NextResponse.json({ reply: "", error: "Bourse AI backend unavailable." }, { status: 503 });
  }
}
