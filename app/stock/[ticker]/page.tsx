import LandingHeader from "@/components/LandingHeader";
import SiteFooter from "@/components/SiteFooter";
import StockDetailView from "@/app/components/stock/StockDetailView";
import { finiteNumber, getStockDetail, type StockDetailData } from "@/lib/stock-detail";
import { getStaticDemoSymbolsText, getStaticStockDetail, STATIC_DEMO_SYMBOLS } from "@/lib/static-demo-data";

type StockPageProps = {
  params: Promise<{ ticker: string }>;
};

const isStaticDeployment = Boolean(process.env.NEXT_PUBLIC_BASE_PATH);
export const dynamicParams = false;

export function generateStaticParams() {
  return STATIC_DEMO_SYMBOLS.map((ticker) => ({ ticker }));
}

export default async function StockPage({ params }: StockPageProps) {
  const { ticker } = await params;
  const symbol = ticker
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9.-]/g, "");

  if (!symbol) {
    return <UnavailableStockPage symbol="UNKNOWN" />;
  }

  const { detail, isStaticDemo } = await loadStockDetail(symbol);

  if (!detail) {
    return <UnavailableStockPage symbol={symbol} />;
  }

  const quote = detail.quote;
  const profile = detail.profile;
  const current = finiteNumber(quote.c);
  const previousClose = finiteNumber(quote.pc);
  const change =
    finiteNumber(quote.d) ??
    (current !== undefined && previousClose !== undefined ? current - previousClose : undefined);
  const changePercent =
    finiteNumber(quote.dp) ??
    (change !== undefined && previousClose ? (change / previousClose) * 100 : undefined);
  const companyName = profile.name ?? symbol;
  const chartPoints = [
    previousClose,
    finiteNumber(quote.o),
    finiteNumber(quote.l),
    finiteNumber(quote.h),
    current,
  ].filter((point): point is number => typeof point === "number" && Number.isFinite(point));

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
    <div className="min-h-screen bg-green-100 text-green-950">
      <LandingHeader
        selectedCompany={{ symbol, name: companyName, price: current, changePercent }}
        hideCta
        surface="light"
      />

      <main className="mx-auto max-w-[1320px] px-5 py-24 sm:px-6 lg:py-28">
        <StockDetailView
          detail={detail}
          current={current}
          change={change}
          changePercent={changePercent}
          previousClose={previousClose}
          summary={summary}
          isStaticDemo={isStaticDemo}
        />
        {isStaticDemo ? (
          <p className="mt-10 text-center text-xs font-semibold leading-5 text-green-950/45">
            Data shown is static for demo purposes. Live prices require the backend service which is currently
            offline to reduce hosting costs.
          </p>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}

async function loadStockDetail(
  symbol: string
): Promise<{ detail: StockDetailData | null; isStaticDemo: boolean }> {
  if (isStaticDeployment) {
    return { detail: getStaticStockDetail(symbol), isStaticDemo: true };
  }

  try {
    return { detail: await getStockDetail(symbol), isStaticDemo: false };
  } catch {
    return { detail: getStaticStockDetail(symbol), isStaticDemo: true };
  }
}

function UnavailableStockPage({ symbol }: { symbol: string }) {
  return (
    <div className="min-h-screen bg-green-100 text-green-950">
      <LandingHeader hideCta surface="light" />
      <main className="mx-auto grid min-h-[70vh] max-w-3xl place-items-center px-5 py-28 text-center">
        <section className="rounded-lg border border-green-900/10 bg-white p-8 shadow-sm shadow-black/10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">{symbol}</p>
          <h1 className="mt-3 text-2xl font-semibold text-green-950">Live data requires the backend</h1>
          <p className="mt-4 text-sm leading-6 text-green-950/60">
            Currently showing demo mode for {getStaticDemoSymbolsText()}.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
