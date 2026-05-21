import { notFound } from "next/navigation";
import LandingHeader from "@/components/LandingHeader";
import SiteFooter from "@/components/SiteFooter";
import StockDetailView from "@/app/components/stock/StockDetailView";
import { getStockDetail, finiteNumber } from "@/lib/stock-detail";

type StockPageProps = {
  params: Promise<{ ticker: string }>;
};

const staticStockSymbols = ["AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "GOOGL", "AMD", "IBM", "SPY", "QQQ"];

export function generateStaticParams() {
  return staticStockSymbols.map((ticker) => ({ ticker }));
}

export default async function StockPage({ params }: StockPageProps) {
  const { ticker } = await params;
  const symbol = ticker.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, "");

  if (!symbol) notFound();

  const detail = await getStockDetail(symbol);
  const quote = detail.quote;
  const profile = detail.profile;
  const current = finiteNumber(quote.c);
  const previousClose = finiteNumber(quote.pc);
  const change = finiteNumber(quote.d) ?? (current !== undefined && previousClose !== undefined ? current - previousClose : undefined);
  const changePercent = finiteNumber(quote.dp) ?? (change !== undefined && previousClose ? (change / previousClose) * 100 : undefined);
  const companyName = profile.name ?? symbol;
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
    updatedAt: finiteNumber(quote.t),
    chartPoints,
  };

  return (
    <div className="min-h-screen bg-green-900 text-white">
      <LandingHeader selectedCompany={{ symbol, name: companyName, price: current, changePercent }} hideCta />

      <main className="mx-auto max-w-[1320px] px-5 py-24 sm:px-6 lg:py-28">
        <StockDetailView
          detail={detail}
          current={current}
          change={change}
          changePercent={changePercent}
          previousClose={previousClose}
          summary={summary}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
