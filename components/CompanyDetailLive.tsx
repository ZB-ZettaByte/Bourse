"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowDownRight, ArrowUpRight, Bell, ChevronRight, Database, Loader2, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type RangeOption = "1D" | "5D" | "1M" | "6M" | "YTD" | "1Y" | "5Y" | "Max";

type ChartSeriesPoint = {
  price: number;
  time?: number;
};

type MarketStock = {
  symbol: string;
  name: string;
  exchange: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  open?: number;
  high?: number;
  low?: number;
  chartPoints: number[];
};

type MarketSummaryResponse = {
  updatedAt?: string;
  range?: RangeOption;
  selectedSymbol?: string;
  marketSummary: MarketStock | null;
  chartSeries?: ChartSeriesPoint[];
  chartPreviousClose?: number;
  chartSource?: "candles" | "yahoo-chart" | "live-history" | "quote-session" | "unavailable";
  trendingStocks: MarketStock[];
  watchlistPreview: MarketStock[];
  error?: string;
};

const RANGE_OPTIONS: RangeOption[] = ["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y", "Max"];
const LIVE_REFRESH_MS = 15000;

const COMPANY_DOMAINS: Record<string, string> = {
  AAPL: "apple.com",
  MSFT: "microsoft.com",
  GOOGL: "abc.xyz",
  GOOG: "abc.xyz",
  AMZN: "amazon.com",
  TSLA: "tesla.com",
  NVDA: "nvidia.com",
  META: "meta.com",
  AMD: "amd.com",
  SPY: "ssga.com",
  QQQ: "invesco.com",
};

const COMPANY_BACKGROUNDS: Record<string, string> = {
  AAPL:
    "Apple designs consumer devices, software, and services used across phones, personal computers, wearables, subscriptions, and digital marketplaces.",
  MSFT:
    "Microsoft builds software, cloud infrastructure, productivity tools, gaming platforms, and enterprise services for consumers and organizations.",
  GOOGL:
    "Alphabet operates Google Search, YouTube, cloud services, advertising platforms, Android, and a portfolio of technology bets.",
  GOOG:
    "Alphabet operates Google Search, YouTube, cloud services, advertising platforms, Android, and a portfolio of technology bets.",
  AMZN:
    "Amazon operates ecommerce, cloud infrastructure, logistics, advertising, media, and subscription businesses across global consumer and enterprise markets.",
  TSLA:
    "Tesla designs electric vehicles, energy storage, charging infrastructure, and related software for transportation and energy markets.",
  NVDA:
    "NVIDIA designs GPUs, accelerated computing platforms, networking products, and software used in gaming, AI, data centers, and visualization.",
  META:
    "Meta operates social platforms, messaging apps, advertising products, and immersive computing initiatives across its family of apps.",
  AMD:
    "AMD designs CPUs, GPUs, adaptive computing products, and data-center chips used across PCs, gaming, embedded systems, and cloud infrastructure.",
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

function formatCurrency(value?: number) {
  return typeof value === "number" && Number.isFinite(value) ? currencyFormatter.format(value) : "N/A";
}

function formatPercent(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "N/A";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatSignedCurrency(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "N/A";
  return `${value >= 0 ? "+" : "-"}${currencyFormatter.format(Math.abs(value))}`;
}

function formatChartTime(point: ChartSeriesPoint, index: number, total: number, range: RangeOption) {
  if (point.time) {
    const date = new Date(point.time * 1000);
    if (range === "1D") return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  if (range === "1D") return index === 0 ? "Open" : index === total - 1 ? "Now" : "";
  return index === 0 ? "Start" : index === total - 1 ? "Now" : "";
}

function CompanyLineChart({
  series,
  previousClose,
  isUp,
  range,
}: {
  series: ChartSeriesPoint[];
  previousClose?: number;
  isUp: boolean;
  range: RangeOption;
}) {
  const width = 1000;
  const height = 360;
  const paddingX = 8;
  const paddingY = 18;
  const color = isUp ? "#089981" : "#f23645";
  const fillId = isUp ? "company-up-fill" : "company-down-fill";

  const validSeries = series.filter((point) => Number.isFinite(point.price));
  const prices = validSeries.map((point) => point.price);
  const min = Math.min(...prices, previousClose ?? Number.POSITIVE_INFINITY);
  const max = Math.max(...prices, previousClose ?? Number.NEGATIVE_INFINITY);
  const spread = max - min || 1;
  const yTicks = Array.from({ length: 5 }, (_, index) => min + (spread / 4) * index).reverse();
  const points = validSeries.map((point, index) => {
    const x = paddingX + (index / Math.max(validSeries.length - 1, 1)) * (width - paddingX * 2);
    const y = paddingY + ((max - point.price) / spread) * (height - paddingY * 2);
    return { ...point, x, y };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ");
  const areaPath = points.length
    ? `${path} L ${points[points.length - 1].x.toFixed(2)} ${height - paddingY} L ${points[0].x.toFixed(2)} ${height - paddingY} Z`
    : "";
  const previousY =
    typeof previousClose === "number"
      ? paddingY + ((max - previousClose) / spread) * (height - paddingY * 2)
      : undefined;
  const labels = points.length
    ? [points[0], points[Math.floor(points.length / 3)], points[Math.floor((points.length / 3) * 2)], points[points.length - 1]]
    : [];

  if (points.length < 2) {
    return (
      <div className="grid h-[360px] place-items-center rounded-lg border border-dashed border-black/10 text-sm text-black/45">
        Waiting for enough live price points to draw this symbol.
      </div>
    );
  }

  return (
    <div className="relative h-[390px]">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full overflow-visible">
        <defs>
          <linearGradient id={fillId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.24" />
            <stop offset="72%" stopColor={color} stopOpacity="0.04" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {yTicks.map((tick) => {
          const y = paddingY + ((max - tick) / spread) * (height - paddingY * 2);
          return (
            <g key={tick}>
              <line x1={paddingX} x2={width - paddingX} y1={y} y2={y} stroke="#e5e5e5" strokeWidth="1" />
              <text x={width - 4} y={y - 6} textAnchor="end" className="fill-black/45 text-[11px] font-semibold">
                {numberFormatter.format(tick)}
              </text>
            </g>
          );
        })}
        {typeof previousY === "number" && (
          <>
            <line x1={paddingX} x2={width - paddingX} y1={previousY} y2={previousY} stroke="#9ca3af" strokeDasharray="4 5" />
            <text x={width - 4} y={previousY - 8} textAnchor="end" className="fill-black/50 text-[11px] font-bold">
              Prev close {numberFormatter.format(previousClose ?? 0)}
            </text>
          </>
        )}
        <path d={areaPath} fill={`url(#${fillId})`} />
        <path d={path} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
        {points[points.length - 1] && (
          <g>
            <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="4" fill={color} />
            <rect
              x={Math.min(points[points.length - 1].x + 6, width - 68)}
              y={points[points.length - 1].y - 12}
              width="58"
              height="20"
              rx="3"
              fill={color}
            />
            <text
              x={Math.min(points[points.length - 1].x + 10, width - 60)}
              y={points[points.length - 1].y + 4}
              className="fill-white text-[11px] font-bold"
            >
              {numberFormatter.format(points[points.length - 1].price)}
            </text>
          </g>
        )}
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex justify-between text-xs font-semibold text-black/55">
        {labels.map((point, index) => (
          <span key={`${point.time ?? point.price}-${index}`}>{formatChartTime(point, index, labels.length, range)}</span>
        ))}
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-black/10 py-3 last:border-b-0">
      <span className="text-sm text-black/55">{label}</span>
      <span className="text-sm font-bold text-black">{value}</span>
    </div>
  );
}

function RelatedStock({ stock, onSelectCompany }: { stock: MarketStock; onSelectCompany?: (symbol: string) => void }) {
  const isUp = stock.changePercent >= 0;

  return (
    <button
      type="button"
      onClick={() => onSelectCompany?.(stock.symbol)}
      className="rounded-lg border border-black/10 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5"
    >
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-full bg-black text-xs font-bold text-white">{stock.symbol.slice(0, 3)}</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{stock.name}</p>
          <p className="text-xs text-black/45">{stock.symbol}</p>
        </div>
      </div>
      <div className="mt-5">
        <p className="text-sm font-semibold">{formatCurrency(stock.price)}</p>
        <p className={`text-sm font-bold ${isUp ? "text-emerald-700" : "text-red-500"}`}>{formatPercent(stock.changePercent)}</p>
      </div>
    </button>
  );
}

export default function CompanyDetailLive({
  symbol,
  embedded = false,
  onBackToMarkets,
  onSelectCompany,
}: {
  symbol: string;
  embedded?: boolean;
  onBackToMarkets?: () => void;
  onSelectCompany?: (symbol: string) => void;
}) {
  const cleanSymbol = symbol.trim().toUpperCase();
  const [range, setRange] = useState<RangeOption>("1D");
  const [data, setData] = useState<MarketSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load(showLoading = false) {
      try {
        if (showLoading) {
          setIsLoading(true);
          setError(null);
        }
        const response = await fetch(`/api/market-summary?range=${encodeURIComponent(range)}&symbol=${encodeURIComponent(cleanSymbol)}&t=${Date.now()}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as MarketSummaryResponse;

        if (!response.ok) {
          throw new Error(payload.error || "Failed to fetch company data.");
        }

        if (isMounted) setData(payload);
      } catch (loadError) {
        if (isMounted && showLoading) setError(loadError instanceof Error ? loadError.message : "Failed to fetch company data.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load(true);
    const intervalId = window.setInterval(() => load(false), LIVE_REFRESH_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [cleanSymbol, range]);

  const stock = data?.marketSummary;
  const chartSeries = useMemo(() => {
    if (data?.chartSeries?.length) return data.chartSeries;
    if (stock?.chartPoints?.length) return stock.chartPoints.map((price) => ({ price }));
    return [];
  }, [data?.chartSeries, stock?.chartPoints]);
  const isUp = (stock?.changePercent ?? 0) >= 0;
  const updatedAt = data?.updatedAt ? new Date(data.updatedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Live";
  const rangeValue = stock?.high && stock.low ? stock.high - stock.low : undefined;
  const relatedStocks = [...(data?.trendingStocks ?? []), ...(data?.watchlistPreview ?? [])]
    .filter((item, index, list) => item.symbol !== cleanSymbol && list.findIndex((other) => other.symbol === item.symbol) === index)
    .slice(0, 6);
  const domain = COMPANY_DOMAINS[stock?.symbol ?? cleanSymbol];
  const background =
    COMPANY_BACKGROUNDS[stock?.symbol ?? cleanSymbol] ??
    `${stock?.name ?? cleanSymbol} is shown with live quote, price movement, and source-backed market context from the existing market data pipeline.`;

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center bg-[#f7f7f7] text-black">
        <div className="flex items-center gap-3 text-sm font-semibold text-black/55">
          <Loader2 className="size-5 animate-spin" />
          Loading live company data...
        </div>
      </div>
    );
  }

  if (error || !stock) {
    return (
      <div className="mx-auto max-w-[92rem] px-5 py-20 md:px-8">
        <div className="rounded-lg border border-black/10 bg-white p-10 text-center shadow-sm">
          <h1 className="text-3xl font-black">Company data unavailable</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-black/55">
            {error ?? "The backend did not return a quote for this symbol yet."}
          </p>
          <button type="button" onClick={onBackToMarkets} className="mt-6 inline-flex rounded-full bg-black px-5 py-2 text-sm font-bold text-white">
            Back to markets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f7f7f7] text-black">
      {!embedded && <header className="sticky top-0 z-40 border-t-4 border-black bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[92rem] items-center gap-6 px-5 py-3 md:px-8">
          <Link href="/" aria-label="Bourse home" className="flex shrink-0 items-center">
            <Image src="/assets/icons/logo.svg" alt="Bourse" width={164} height={36} className="h-10 w-auto brightness-0" />
          </Link>
          <Link
            href="/"
            className="hidden w-full max-w-[16rem] items-center gap-2 rounded-full bg-black/[0.04] px-4 py-2 text-sm font-semibold text-black/55 md:flex"
          >
            <Search className="size-4" />
            Search markets
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-semibold text-black lg:flex">
            <Link href="/" className="transition-colors hover:text-blue-600">Products</Link>
            <Link href="/" className="transition-colors hover:text-blue-600">Community</Link>
            <Link href="/" className="text-blue-600">Markets</Link>
            <Link href="/" className="transition-colors hover:text-blue-600">Brokers</Link>
            <Link href="/" className="transition-colors hover:text-blue-600">More</Link>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/" className="rounded-lg bg-gradient-to-r from-sky-500 to-fuchsia-600 px-4 py-2 text-sm font-bold text-white">
              Back to markets
            </Link>
          </div>
        </div>
      </header>}

      <section id="company-summary" className="mx-auto max-w-[92rem] px-5 pb-10 pt-24 md:px-8 md:pt-28">
        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="flex items-center gap-5">
            <div className="grid size-24 place-items-center overflow-hidden rounded-full bg-[#111318] text-4xl font-black text-white md:size-32">
              {domain ? (
                <Image
                  src={`https://logo.clearbit.com/${domain}`}
                  alt={`${stock.name} logo`}
                  width={80}
                  height={80}
                  unoptimized
                  className="size-16 object-contain md:size-20"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                stock.symbol.slice(0, 1)
              )}
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-[-0.04em] md:text-6xl">{stock.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-black/65">
                <span className="rounded-md border border-black/10 bg-white px-2 py-1">{stock.symbol}</span>
                <span>•</span>
                <span>{stock.exchange}</span>
                <span className="rounded-md bg-blue-50 px-2 py-1 text-blue-600">Live quote</span>
              </div>
            </div>
          </div>

          <button type="button" onClick={onBackToMarkets} className="inline-flex w-fit items-center gap-2 rounded-full border border-black/15 bg-white px-4 py-2 text-sm font-bold shadow-sm transition hover:border-black">
            <Search className="size-4" />
            Search markets
          </button>
        </div>

        <article className="rounded-lg border border-black/10 bg-white p-5 shadow-sm md:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.95fr_0.9fr]">
            <div>
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <div className="flex flex-wrap items-baseline gap-3">
                      <span className="text-5xl font-black tracking-[-0.04em]">{numberFormatter.format(stock.price)}</span>
                      <span className="text-sm font-bold uppercase text-black/45">USD</span>
                      <span className={`inline-flex items-center gap-1 text-lg font-black ${isUp ? "text-emerald-700" : "text-red-500"}`}>
                        {isUp ? <ArrowUpRight className="size-5" /> : <ArrowDownRight className="size-5" />}
                        {formatSignedCurrency(stock.change)} {formatPercent(stock.changePercent)}
                      </span>
                    </div>
                    <p className="mt-2 text-lg text-black/65">Live price</p>
                    <p className="mt-1 text-sm text-black/45">Updated {updatedAt}</p>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-baseline gap-3">
                      <span className="text-4xl font-black tracking-[-0.04em]">{formatCurrency(stock.previousClose)}</span>
                    </div>
                    <p className="mt-2 text-lg text-black/65">Previous close</p>
                    <p className="mt-1 text-sm text-black/45">Provided by the live market backend</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button type="button" className="rounded-full bg-black px-5 py-2 text-sm font-bold text-white">Insights</button>
                  <button type="button" className="rounded-full border border-black px-5 py-2 text-sm font-bold">Learn</button>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {RANGE_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option}
                    onClick={() => setRange(option)}
                    className={`rounded-full px-4 py-2 text-sm font-black transition ${
                      option === range ? "bg-black text-white" : "bg-black/[0.04] text-black hover:bg-black/10"
                    }`}
                  >
                    {option.toLowerCase()}
                  </button>
                ))}
              </div>

              <div className="mt-7">
                <CompanyLineChart series={chartSeries} previousClose={data?.chartPreviousClose ?? stock.previousClose} isUp={isUp} range={range} />
              </div>
            </div>

            <aside className="rounded-lg border border-black/10 bg-[#fafafa] p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black">Price Momentum</h2>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${isUp ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                  {isUp ? "Up today" : "Down today"}
                </span>
              </div>
              <p className="mt-5 text-lg leading-7">
                {stock.symbol} is trading <span className={isUp ? "font-black text-emerald-700" : "font-black text-red-600"}>
                  {isUp ? "above" : "below"}
                </span>{" "}
                its previous close by <span className="font-black">{formatSignedCurrency(stock.change)}</span>.
              </p>
              <div className="mt-6 divide-y divide-black/10">
                <MetricRow label="Open" value={formatCurrency(stock.open)} />
                <MetricRow label="High" value={formatCurrency(stock.high)} />
                <MetricRow label="Low" value={formatCurrency(stock.low)} />
                <MetricRow label="Previous close" value={formatCurrency(stock.previousClose)} />
                <MetricRow label="Day range" value={typeof rangeValue === "number" ? numberFormatter.format(rangeValue) : "N/A"} />
              </div>
            </aside>
          </div>
        </article>
      </section>

      <section id="company-background" className="mx-auto grid max-w-[92rem] gap-8 px-5 py-10 md:px-8 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-lg border border-black/10 bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-3xl font-black">Company background</h2>
          <p className="mt-6 max-w-2xl text-base leading-8 text-black/65">
            {background}
          </p>
          <div className="mt-8 grid gap-x-12 md:grid-cols-2">
            <MetricRow label="Symbol" value={stock.symbol} />
            <MetricRow label="Exchange" value={stock.exchange} />
            <MetricRow label="Current price" value={formatCurrency(stock.price)} />
            <MetricRow label="Change %" value={formatPercent(stock.changePercent)} />
            <MetricRow label="Website" value={domain ?? "N/A"} />
          </div>
        </article>

        <article className="rounded-lg border border-black/10 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-3xl font-black">Live status</h2>
            <Bell className="size-6 text-black/45" />
          </div>
          <div className="mt-7 space-y-5">
            <div>
              <p className="text-sm font-bold text-black/45">Quote source</p>
              <p className="mt-1 text-xl font-black capitalize">{data?.chartSource?.replace("-", " ") ?? "Live backend"}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-black/45">Movement</p>
              <p className={isUp ? "mt-1 text-xl font-black text-emerald-700" : "mt-1 text-xl font-black text-red-600"}>
                {formatSignedCurrency(stock.change)} today
              </p>
            </div>
            <button type="button" onClick={() => onSelectCompany?.(stock.symbol)} className="inline-flex items-center gap-2 text-sm font-black text-blue-600">
              Refresh selected company
              <ChevronRight className="size-4" />
            </button>
          </div>
        </article>
      </section>

      <section id="company-sources" className="mx-auto max-w-[92rem] px-5 py-10 md:px-8">
        <article className="rounded-lg border border-black/10 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center gap-3">
            <Database className="size-6 text-black/45" />
            <h2 className="text-3xl font-black">Market data sources</h2>
          </div>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {[
              ["Yahoo Finance", "Historical price series and previous close fallback are pulled through the backend Yahoo chart feed when Finnhub candles are unavailable."],
              ["TradingView style", "The company view mirrors TradingView's clean market layout while using native components instead of embedded widgets."],
              ["CNN Business", "Business-news and deeper company story modules are structured here for a future backend connector; no fake headlines are shown."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-lg border border-black/10 bg-[#fafafa] p-5">
                <h3 className="text-lg font-black">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-black/55">{body}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="mx-auto max-w-[92rem] px-5 py-10 md:px-8">
        <div className="flex items-center justify-between gap-5">
          <h2 className="text-3xl font-black">Related stocks</h2>
          <Link href="/" className="inline-flex items-center gap-1 text-sm font-black text-blue-600">
            See markets
            <ChevronRight className="size-4" />
          </Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {relatedStocks.length > 0 ? (
            relatedStocks.map((item) => <RelatedStock key={item.symbol} stock={item} onSelectCompany={onSelectCompany} />)
          ) : (
            <div className="rounded-lg border border-dashed border-black/10 bg-white p-6 text-sm text-black/45">
              No related stocks returned by the backend.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
