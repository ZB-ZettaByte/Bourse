import { NextResponse } from "next/server";
import { getStockNews } from "@/lib/stock-detail";

export const dynamic = "force-dynamic";

type NewsRouteProps = {
  params: Promise<{ ticker: string }>;
};

export async function GET(_request: Request, { params }: NewsRouteProps) {
  const { ticker } = await params;
  const symbol = ticker
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9.-]/g, "");

  if (!symbol) {
    return NextResponse.json({ news: [], error: "Ticker is required." }, { status: 400 });
  }

  try {
    const news = await getStockNews(symbol);
    return NextResponse.json({
      symbol,
      news,
      count: news.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        symbol,
        news: [],
        error: error instanceof Error ? error.message : "Unable to load stock news.",
      },
      { status: 502 }
    );
  }
}
