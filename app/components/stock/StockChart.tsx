"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  LiveLineChart,
  type ChartSeriesPoint,
  type MarketStock,
  type RangeOption,
} from "@/components/MarketSummaryLive";
import { getStaticMarketData } from "@/lib/static-demo-data";

const RANGES: RangeOption[] = ["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y"];
const isStaticDeployment = Boolean(process.env.NEXT_PUBLIC_BASE_PATH);

type MarketSummaryResponse = {
  marketSummary: MarketStock | null;
  chartSeries?: ChartSeriesPoint[];
  chartPreviousClose?: number;
  chartSource?: "candles" | "yahoo-chart" | "live-history" | "quote-session" | "unavailable";
  error?: string;
};

export default function StockChart({
  symbol,
  initialSummary,
}: {
  symbol: string;
  initialSummary: MarketStock;
}) {
  const [range, setRange] = useState<RangeOption>("1D");
  const [data, setData] = useState<MarketSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadChart() {
      setIsLoading(true);

      if (isStaticDeployment) {
        const payload = getStaticMarketData(symbol) as MarketSummaryResponse;
        if (isMounted) {
          setData(payload);
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await fetch(
          `/api/market-summary?symbol=${encodeURIComponent(symbol)}&range=${encodeURIComponent(range)}&t=${Date.now()}`,
          {
            cache: "no-store",
          }
        );
        const payload = (await response.json()) as MarketSummaryResponse;
        if (isMounted) setData(payload);
      } catch {
        const payload = getStaticMarketData(symbol) as MarketSummaryResponse;
        if (isMounted) setData(payload);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadChart();

    return () => {
      isMounted = false;
    };
  }, [range, symbol]);

  const summary = data?.marketSummary ?? initialSummary;
  const series = useMemo(() => {
    if (data?.chartSeries?.length) return data.chartSeries;
    return summary.chartPoints.map((price) => ({ price }));
  }, [data?.chartSeries, summary.chartPoints]);

  return (
    <section className="mb-6 rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-sm shadow-black/20">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-4">
          {RANGES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRange(option)}
              className={`border-b-2 pb-2 text-sm font-bold transition-colors ${
                range === option
                  ? "border-emerald-300 text-white"
                  : "border-transparent text-white/45 hover:text-white"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        {isLoading && <Loader2 className="size-4 animate-spin text-white/45" />}
      </div>
      <div className="h-[360px] rounded-lg border border-white/10 bg-black p-4">
        <LiveLineChart
          series={series}
          previousClose={data?.chartPreviousClose ?? summary.previousClose}
          source={data?.chartSource}
          summary={summary}
          selectedRange={range}
        />
      </div>
    </section>
  );
}
