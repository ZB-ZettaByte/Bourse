import { notFound } from "next/navigation";
import LandingHeader from "@/components/LandingHeader";
import AIInsights from "@/app/components/stock/AIInsights";
import StockAbout from "@/app/components/stock/StockAbout";
import StockChart from "@/app/components/stock/StockChart";
import StockHeader from "@/app/components/stock/StockHeader";
import StockNews from "@/app/components/stock/StockNews";
import StockStats from "@/app/components/stock/StockStats";
import { getStockDetail, finiteNumber } from "@/lib/stock-detail";

type StockPageProps = {
  params: Promise<{ ticker: string }>;
};

export default async function StockPage({ params }: StockPageProps) {
  const { ticker } = await params;
  const symbol = ticker.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, "");

  if (!symbol) notFound();

  const detail = await getStockDetail(symbol);
  const quote = detail.quote;
  const profile = detail.profile;
  const metrics = detail.metrics ?? {};
  const current = finiteNumber(quote.c);
  const previousClose = finiteNumber(quote.pc);
  const change = finiteNumber(quote.d) ?? (current !== undefined && previousClose !== undefined ? current - previousClose : undefined);
  const changePercent = finiteNumber(quote.dp) ?? (change !== undefined && previousClose ? (change / previousClose) * 100 : undefined);
  const companyName = profile.name ?? symbol;
  const volume = metrics["10DayAverageTradingVolume"] ?? metrics["3MonthAverageTradingVolume"];
  const chartPoints = [previousClose, finiteNumber(quote.o), finiteNumber(quote.l), finiteNumber(quote.h), current].filter(
    (point): point is number => typeof point === "number" && Number.isFinite(point)
  );

  const summary = {
    symbol,
    name: companyName,
    exchange: profile.exchange ?? "US",
    price: current ?? 0,
    change: change ?? 0,
    changePercent: changePercent ?? 0,
    previousClose: previousClose ?? 0,
    open: finiteNumber(quote.o),
    high: finiteNumber(quote.h),
    low: finiteNumber(quote.l),
    chartPoints,
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <LandingHeader selectedCompany={{ symbol, name: companyName }} />

      <main className="mx-auto max-w-7xl px-6 py-28">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <StockHeader
              companyName={companyName}
              ticker={symbol}
              price={current}
              change={change}
              changePercent={changePercent}
            />
            <StockChart symbol={symbol} initialSummary={summary} />
            <StockStats
              open={finiteNumber(quote.o)}
              high={finiteNumber(quote.h)}
              low={finiteNumber(quote.l)}
              current={current}
              previousClose={previousClose}
              change={change}
              changePercent={changePercent}
              volume={volume}
            />
            <StockAbout profile={profile} metrics={metrics} dayLow={finiteNumber(quote.l)} dayHigh={finiteNumber(quote.h)} />
            <StockNews articles={detail.news} />
          </div>

          <aside className="space-y-4 lg:sticky lg:top-8 lg:col-span-1 lg:self-start">
            <AIInsights symbol={symbol} />
            <button
              type="button"
              className="h-12 w-full rounded-lg border border-white bg-white px-6 text-sm font-bold text-black transition-colors hover:bg-black hover:text-white"
            >
              Add {symbol} to Watchlist
            </button>
          </aside>
        </div>
      </main>
    </div>
  );
}
