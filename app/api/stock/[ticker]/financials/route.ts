import { NextResponse } from "next/server";
import { getStockFinancials } from "@/lib/stock-detail";

export const dynamic = "force-dynamic";

type FinancialsRouteProps = {
  params: Promise<{ ticker: string }>;
};

export async function GET(_request: Request, { params }: FinancialsRouteProps) {
  const { ticker } = await params;
  const symbol = ticker.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, "");

  if (!symbol) {
    return NextResponse.json({ financials: {}, error: "Ticker is required." }, { status: 400 });
  }

  try {
    const financials = await getStockFinancials(symbol);
    return NextResponse.json({ symbol, financials });
  } catch (error) {
    return NextResponse.json(
      {
        symbol,
        financials: {},
        error: error instanceof Error ? error.message : "Unable to load stock financials.",
      },
      { status: 502 }
    );
  }
}
