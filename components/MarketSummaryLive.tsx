"use client";

import Link from "next/link";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  ChevronRight,
  LineChart,
  Loader2,
  Star,
} from "lucide-react";
import { PointerEvent, useEffect, useMemo, useRef, useState } from "react";

export type MarketStock = {
  symbol: string;
  name: string;
  exchange: string;
  logo?: string;
  code?: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  open?: number;
  high?: number;
  low?: number;
  chartPoints: number[];
};

export type MarketSummarySelection = MarketStock;

type MarketSummaryResponse = {
  updatedAt?: string;
  range?: RangeOption;
  selectedSymbol?: string;
  marketSummary: MarketStock | null;
  majorIndices: MarketStock[];
  topGainers: MarketStock[];
  topLosers: MarketStock[];
  trendingStocks: MarketStock[];
  watchlistPreview: MarketStock[];
  chartPoints: number[];
  chartSeries?: ChartSeriesPoint[];
  chartPreviousClose?: number;
  chartSource?: "candles" | "yahoo-chart" | "live-history" | "quote-session" | "unavailable";
  error?: string;
};

export type ChartSeriesPoint = {
  price: number;
  time?: number;
};

export type RangeOption = "1D" | "5D" | "1M" | "6M" | "YTD" | "1Y" | "5Y" | "Max";

const RANGE_OPTIONS: RangeOption[] = ["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y", "Max"];
const MAX_LIVE_SAMPLES = 48;
const LIVE_REFRESH_MS = 15000;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

function formatCurrency(value: number) {
  return Number.isFinite(value) ? currencyFormatter.format(value) : "N/A";
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "N/A";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatChange(value: number) {
  if (!Number.isFinite(value)) return "N/A";
  return `${value >= 0 ? "+" : ""}${currencyFormatter.format(value)}`;
}

function useValueDirection(value: number | undefined) {
  const previousValueRef = useRef(value);
  const [direction, setDirection] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (!Number.isFinite(value) || !Number.isFinite(previousValueRef.current)) {
      previousValueRef.current = value;
      return;
    }

    const previousValue = previousValueRef.current;
    if (typeof value === "number" && typeof previousValue === "number" && value !== previousValue) {
      setDirection(value > previousValue ? "up" : "down");
      previousValueRef.current = value;
      const timeoutId = window.setTimeout(() => setDirection(null), 900);

      return () => window.clearTimeout(timeoutId);
    }
  }, [value]);

  return direction;
}

function tickerCharWidth(char: string) {
  if (char === ".") return "0.32ch";
  if (char === "," || char === "%") return "0.5ch";
  if (char === "$" || char === "+" || char === "-") return "0.65ch";
  return "1ch";
}

function AnimatedValue({
  value,
  className = "",
  formatter = numberFormatter.format,
}: {
  value: number | undefined;
  className?: string;
  formatter?: (value: number) => string;
}) {
  const direction = useValueDirection(value);
  const formattedValue = Number.isFinite(value) ? formatter(Number(value)) : "N/A";
  const currentValueRef = useRef(formattedValue);
  const [previousValue, setPreviousValue] = useState(formattedValue);
  const [currentValue, setCurrentValue] = useState(formattedValue);
  const [isSliding, setIsSliding] = useState(false);
  const flashClass = direction === "up" ? "text-emerald-800" : direction === "down" ? "text-red-600" : "";
  const previousChars = previousValue.split("");
  const currentChars = currentValue.split("");

  useEffect(() => {
    if (formattedValue === currentValueRef.current) return;

    setPreviousValue(currentValueRef.current);
    setCurrentValue(formattedValue);
    setIsSliding(false);

    const frameId = requestAnimationFrame(() => setIsSliding(true));
    const timeoutId = window.setTimeout(() => {
      currentValueRef.current = formattedValue;
      setPreviousValue(formattedValue);
      setIsSliding(false);
    }, 1700);

    return () => {
      cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [formattedValue]);

  if (!Number.isFinite(value)) return <span className={className}>N/A</span>;

  return (
    <span className={`inline-block tabular-nums transition-colors duration-700 ${flashClass} ${className}`}>
      <span className="inline-flex" style={{ fontVariantNumeric: "tabular-nums", lineHeight: "1.15em" }}>
        {currentChars.map((currentChar, index) => {
          const previousChar = previousChars[index] ?? currentChar;
          const changed = previousChar !== currentChar;
          const charWidth = tickerCharWidth(currentChar);

          if (!changed) {
            return (
              <span key={`${currentChar}-${index}`} className="inline-block">
                {currentChar}
              </span>
            );
          }

          return (
            <span
              key={`${previousChar}-${currentChar}-${index}`}
              className="relative inline-grid overflow-hidden align-baseline text-center"
              style={{ height: "1.15em", width: charWidth }}
            >
              <span
                className="col-start-1 row-start-1 transition-all duration-[1600ms] ease-in-out"
                style={{
                  opacity: isSliding ? 0 : 1,
                  transform: isSliding ? "translateY(115%)" : "translateY(0)",
                }}
              >
                {previousChar}
              </span>
              <span
                className="col-start-1 row-start-1 transition-all duration-[1600ms] ease-in-out"
                style={{
                  opacity: isSliding ? 1 : 0,
                  transform: isSliding ? "translateY(0)" : "translateY(-115%)",
                }}
              >
                {currentChar}
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}

function buildChartPath(points: number[], width = 720, height = 220) {
  if (points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);

  const coordinates = points.map((point, index) => {
    const x = index * step;
    const y = height - ((point - min) / range) * (height * 0.72) - height * 0.14;
    return [x, y] as const;
  });

  return coordinates.map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
}

function buildMarketChart(series: ChartSeriesPoint[], previousClose?: number, width = 720, height = 250) {
  const values = [...series.map((point) => point.price), previousClose].filter((point): point is number => Number.isFinite(point));

  if (series.length < 2 || values.length < 2) return null;

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const padding = Math.max((maxValue - minValue) * 0.18, maxValue * 0.001);
  const min = minValue - padding;
  const max = maxValue + padding;
  const range = max - min || 1;
  const step = width / (series.length - 1);

  const coordinates = series.map((point, index) => {
    const x = index * step;
    const y = height - ((point.price - min) / range) * height;
    return { ...point, x, y };
  });

  const path = coordinates.map(({ x, y }, index) => `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
  const last = coordinates[coordinates.length - 1];
  const first = coordinates[0];
  const previousY = previousClose ? height - ((previousClose - min) / range) * height : undefined;
  const ticks = Array.from({ length: 5 }, (_, index) => max - ((max - min) / 4) * index);

  return { coordinates, first, path, last, previousY, ticks };
}

function formatChartDate(point: ChartSeriesPoint | undefined, range: RangeOption) {
  if (!point?.time) return "";

  const date = new Date(point.time * 1000);
  if (range === "1D") {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  if (range === "5D") {
    return date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  }

  if (range === "1M" || range === "6M" || range === "YTD") {
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  return date.toLocaleDateString([], { month: "short", year: "numeric" });
}

function chartLabels(series: ChartSeriesPoint[], range: RangeOption) {
  if (series.length >= 4 && series.some((point) => point.time)) {
    const indexes = [0, Math.floor((series.length - 1) * 0.25), Math.floor((series.length - 1) * 0.5), Math.floor((series.length - 1) * 0.75), series.length - 1];
    return indexes.map((index) => formatChartDate(series[index], range)).filter(Boolean);
  }

  if (range === "1D") return ["10:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];
  if (range === "5D") return ["Mon", "Tue", "Wed", "Thu", "Fri"];
  if (range === "1M") return ["Week 1", "Week 2", "Week 3", "Week 4"];
  if (range === "6M") return ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  if (range === "YTD") return ["Jan", "Mar", "May", "Jul", "Sep", "Nov"];
  if (range === "1Y") return ["Q1", "Q2", "Q3", "Q4"];
  if (range === "5Y") return ["2022", "2023", "2024", "2025", "2026"];
  return ["2019", "2021", "2023", "2025", "Now"];
}

export function LiveLineChart({
  series,
  previousClose,
  source,
  summary,
  selectedRange,
}: {
  series: ChartSeriesPoint[];
  previousClose?: number;
  source?: MarketSummaryResponse["chartSource"];
  summary: MarketStock;
  selectedRange: RangeOption;
}) {
  const chart = useMemo(() => buildMarketChart(series, previousClose ?? summary.previousClose), [series, previousClose, summary.previousClose]);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const labels = chartLabels(series, selectedRange);

  if (!chart) {
    return (
      <div className="grid h-full place-items-center rounded-md border border-dashed border-black/15 bg-black/[0.02] px-6 text-center">
        <div>
          <LineChart className="mx-auto size-8 text-black/35" />
          <p className="mt-3 text-sm font-bold text-black/60">Chart data unavailable</p>
          <p className="mt-1 text-xs leading-5 text-black/45">
            Live quotes loaded, but the backend did not return enough price points to draw a chart.
          </p>
        </div>
      </div>
    );
  }

  const activePoint = chart.coordinates[hoverIndex ?? chart.coordinates.length - 1] ?? chart.last;
  const isInspecting = hoverIndex !== null;
  const activeLeft = Math.min(92, Math.max(0, (activePoint.x / 720) * 100));
  const activeTop = Math.min(82, Math.max(8, (activePoint.y / 250) * 100 + 8));
  const isRangeUp = chart.last.price >= chart.first.price;
  const chartColor = isRangeUp ? "#63b37f" : "#ef4444";
  const gradientId = isRangeUp ? "liveMarketFadeUp" : "liveMarketFadeDown";

  function updateActivePoint(event: PointerEvent<HTMLDivElement>) {
    if (!chart) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const relativeX = Math.min(Math.max(event.clientX - bounds.left, 0), bounds.width);
    const nextIndex = Math.round((relativeX / bounds.width) * (chart.coordinates.length - 1));
    setHoverIndex(nextIndex);
  }

  return (
    <div className="relative size-full">
      <div className="absolute inset-y-0 left-0 flex w-12 flex-col justify-between text-xs font-medium text-black/55">
        {chart.ticks.map((tick, index) => (
          <span key={`${tick}-${index}`}>{numberFormatter.format(tick)}</span>
        ))}
      </div>

      <div className="absolute inset-y-0 left-14 right-0">
        <div className="absolute inset-x-0 top-0 h-px bg-black/10" />
        <div className="absolute inset-x-0 top-1/4 h-px bg-black/10" />
        <div className="absolute inset-x-0 top-1/2 h-px bg-black/10" />
        <div className="absolute inset-x-0 top-3/4 h-px bg-black/10" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-black/10" />
        {typeof chart.previousY === "number" && (
          <div
            className="absolute left-0 right-12 border-t border-dashed border-black/35"
            style={{ top: `${(chart.previousY / 250) * 100}%` }}
          >
            <span className="absolute right-2 -top-4 w-16 text-right text-xs font-medium leading-4 text-black/55">
              Previous close
            </span>
          </div>
        )}
      </div>

      <svg viewBox="0 0 720 250" className="absolute inset-y-0 left-14 right-0 h-full w-[calc(100%-3.5rem)]" aria-label="Market price trend">
        <path d={`${chart.path} L720 250 L0 250 Z`} fill={`url(#${gradientId})`} />
        <path d={chart.path} fill="none" stroke={chartColor} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        {isInspecting && <line x1={activePoint.x} x2={activePoint.x} y1="0" y2="250" stroke="rgba(0,0,0,0.35)" strokeDasharray="2 4" />}
        <circle cx={activePoint.x} cy={activePoint.y} r="5" fill={chartColor} stroke="#ffffff" strokeWidth="3" />
        <defs>
          <linearGradient id="liveMarketFadeUp" x1="0" x2="0" y1="0" y2="1">
            <stop stopColor="#63b37f" stopOpacity="0.28" />
            <stop offset="1" stopColor="#63b37f" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="liveMarketFadeDown" x1="0" x2="0" y1="0" y2="1">
            <stop stopColor="#ef4444" stopOpacity="0.24" />
            <stop offset="1" stopColor="#ef4444" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {isInspecting && (
        <span
          className="pointer-events-none absolute z-10 rounded-md bg-black px-2 py-1 text-xs font-semibold text-white shadow-lg"
          style={{
            left: `calc(3.5rem + ${activeLeft}%)`,
            top: `${activeTop}%`,
            transform: activeLeft > 82 ? "translateX(-100%)" : "translateX(0)",
          }}
        >
          <span>{numberFormatter.format(activePoint.price)} USD</span>
          {activePoint.time && <span className="ml-1 text-white/65">{formatChartDate(activePoint, selectedRange)}</span>}
        </span>
      )}

      <div
        className="absolute inset-y-0 left-14 right-0 cursor-crosshair touch-none"
        role="slider"
        aria-label="Inspect market chart price"
        aria-valuemin={0}
        aria-valuemax={chart.coordinates.length - 1}
        aria-valuenow={hoverIndex ?? chart.coordinates.length - 1}
        aria-valuetext={`${formatCurrency(activePoint.price)} ${formatChartDate(activePoint, selectedRange)}`}
        tabIndex={0}
        onPointerMove={updateActivePoint}
        onPointerDown={updateActivePoint}
        onPointerLeave={() => setHoverIndex(null)}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            setHoverIndex((currentIndex) => Math.max(0, (currentIndex ?? chart.coordinates.length - 1) - 1));
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            setHoverIndex((currentIndex) => Math.min(chart.coordinates.length - 1, (currentIndex ?? chart.coordinates.length - 1) + 1));
          }
        }}
      />

      <div className="absolute inset-x-14 bottom-0 flex justify-between text-sm font-medium text-black/50">
        {labels.map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}
      </div>

      <span className="absolute bottom-7 left-14 rounded-md border border-black/10 bg-white/85 px-2 py-1 text-[10px] font-bold text-black/45 backdrop-blur-sm">
        {source === "candles" || source === "yahoo-chart" ? "Live market chart" : source === "live-history" ? "Live quote history" : "Live quote range"}
      </span>
    </div>
  );
}

function MiniChart({ points, isUp }: { points: number[]; isUp: boolean }) {
  const path = useMemo(() => buildChartPath(points, 120, 36), [points]);

  if (!path) {
    return <span className="h-7 w-20 rounded bg-black/[0.03]" />;
  }

  return (
    <svg viewBox="0 0 120 36" className="h-7 w-20" aria-hidden>
      <path d={path} fill="none" stroke={isUp ? "#0f9f8c" : "#ef4444"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function LoadingState() {
  return (
    <section id="live-stats" className="border-t border-black/10 bg-white px-5 pb-12 pt-14 text-black md:px-8 md:pb-14 md:pt-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex items-center gap-3">
          <Loader2 className="size-5 animate-spin text-teal-700" />
          <div>
            <h2 className="text-2xl font-semibold md:text-3xl">Market summary</h2>
            <p className="mt-1 text-sm text-black/50">Fetching live stock market data...</p>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-[2.05fr_1fr]">
          <div className="h-[356px] animate-pulse rounded-lg border border-black/10 bg-black/[0.03]" />
          <div className="h-[356px] animate-pulse rounded-lg border border-black/10 bg-black/[0.03]" />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="h-[280px] animate-pulse rounded-lg border border-black/10 bg-black/[0.03]" />
          <div className="h-[280px] animate-pulse rounded-lg border border-black/10 bg-black/[0.03]" />
          <div className="h-[280px] animate-pulse rounded-lg border border-black/10 bg-black/[0.03]" />
        </div>
      </div>
    </section>
  );
}

function StateCard({ title, message, action }: { title: string; message: string; action?: string }) {
  return (
    <section id="live-stats" className="border-t border-black/10 bg-white px-5 py-16 text-black md:px-8 md:py-20">
      <div className="mx-auto max-w-7xl rounded-lg border border-black/10 bg-white p-10 text-center shadow-sm">
        <BarChart3 className="mx-auto size-10 text-black/35" />
        <h2 className="mt-4 text-2xl font-semibold">{title}</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-black/55">{message}</p>
        {action && <p className="mt-4 text-xs font-bold text-black/45">{action}</p>}
      </div>
    </section>
  );
}

function StockRow({
  stock,
  showMiniChart = true,
  isSelected = false,
  onSelect,
}: {
  stock: MarketStock;
  showMiniChart?: boolean;
  isSelected?: boolean;
  onSelect?: (stock: MarketStock) => void;
}) {
  const isUp = stock.changePercent >= 0;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(stock)}
      className={`grid w-full grid-cols-[2.4rem_1fr_auto] items-center gap-3 rounded-md py-3 text-left transition-colors ${
        onSelect ? "cursor-pointer hover:bg-black/[0.03]" : ""
      } ${isSelected ? "bg-black/[0.04] ring-1 ring-black/10" : ""}`}
    >
      <StockAvatar stock={stock} />
      <div className="min-w-0">
        <p className="truncate text-xs font-bold">{stock.name}</p>
        <span className="rounded-sm bg-black/5 px-1.5 py-0.5 text-[10px] font-bold text-black/45">{stock.symbol}</span>
      </div>
      <div className="flex items-center gap-3 text-right">
        {showMiniChart && <MiniChart points={stock.chartPoints} isUp={isUp} />}
        <div>
        <p className="text-xs font-medium">{formatCurrency(stock.price)}</p>
        <p className={`text-xs font-bold ${isUp ? "text-teal-700" : "text-red-500"}`}>{formatPercent(stock.changePercent)}</p>
        </div>
      </div>
    </button>
  );
}

function StockAvatar({ stock }: { stock: MarketStock }) {
  const [hasLogoError, setHasLogoError] = useState(false);

  if (stock.logo && !hasLogoError) {
    return (
      <img
        src={stock.logo}
        alt={`${stock.name} logo`}
        className="size-8 rounded-full bg-white p-1 object-contain"
        onError={() => setHasLogoError(true)}
      />
    );
  }

  return (
    <span className="grid size-8 place-items-center rounded-full bg-black text-[10px] font-bold text-white">
      {stock.symbol.slice(0, 3)}
    </span>
  );
}

function MoversCard({
  title,
  stocks,
  variant,
  selectedSymbol,
  onSelectStock,
}: {
  title: string;
  stocks: MarketStock[];
  variant: "up" | "down" | "trend";
  selectedSymbol: string;
  onSelectStock: (stock: MarketStock) => void;
}) {
  const Icon = variant === "down" ? ArrowDownRight : variant === "trend" ? Activity : ArrowUpRight;

  return (
    <article className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className={`grid size-7 place-items-center rounded-full text-white ${variant === "down" ? "bg-red-500" : "bg-black"}`}>
          <Icon className="size-4" />
        </span>
        <h3 className="text-sm font-bold">{title}</h3>
      </div>
      <div className="mt-4 divide-y divide-black/10">
        {stocks.length > 0 ? (
          stocks.map((stock) => (
            <StockRow
              key={`${title}-${stock.symbol}`}
              stock={stock}
              isSelected={stock.symbol === selectedSymbol}
              onSelect={onSelectStock}
            />
          ))
        ) : (
          <p className="rounded-md border border-dashed border-black/10 p-5 text-sm text-black/45">No stocks returned for this group.</p>
        )}
      </div>
    </article>
  );
}

function MarketHeadline({ summary }: { summary: MarketStock }) {
  const isUp = summary.changePercent >= 0;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-black">{summary.name}</span>
        <span className="rounded-sm bg-black/5 px-1.5 py-0.5 text-[10px] font-bold text-black/55">
          {summary.exchange}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <p className="text-3xl font-semibold leading-none text-black">
          <AnimatedValue value={summary.price} formatter={numberFormatter.format} />
        </p>
        <span className="text-[10px] font-bold uppercase text-black/45">USD</span>
        <span className={`text-sm font-bold ${isUp ? "text-emerald-700" : "text-red-500"}`}>
          <AnimatedValue value={summary.changePercent} formatter={formatPercent} />
        </span>
        <span className="text-xs font-semibold text-black/45">
          <AnimatedValue value={summary.change} formatter={formatChange} />
        </span>
      </div>
    </div>
  );
}

export default function MarketSummaryLive({ onSelectCompany }: { onSelectCompany?: (stock: MarketSummarySelection) => void }) {
  const [data, setData] = useState<MarketSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<RangeOption>("1D");
  const [selectedSymbol] = useState("SPY");
  const [liveSamples, setLiveSamples] = useState<ChartSeriesPoint[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadMarketData(showLoading = false) {
      try {
        if (showLoading) {
          setIsLoading(true);
          setError(null);
        }
        const response = await fetch(
          `/api/market-summary?range=${encodeURIComponent(selectedRange)}&symbol=${encodeURIComponent(selectedSymbol)}&t=${Date.now()}`,
          { cache: "no-store" }
        );
        const payload = (await response.json()) as MarketSummaryResponse;

        if (!response.ok) {
          throw new Error(payload.error || "Failed to fetch market data.");
        }

        if (isMounted) {
          setData(payload);
          if (payload.marketSummary?.price) {
            setLiveSamples((currentSamples) => {
              if (selectedRange !== "1D" || payload.chartSource !== "quote-session") {
                return [];
              }

              const baseSeries = payload.chartSeries?.length
                ? payload.chartSeries
                : (payload.chartPoints?.length ? payload.chartPoints : payload.marketSummary?.chartPoints ?? []).map((price, index, prices) => ({
                    price,
                    time: Math.floor(Date.now() / 1000) - (prices.length - index - 1) * 15 * 60,
                  }));
              const nextSamples =
                currentSamples.length > 0
                  ? [...currentSamples, { price: payload.marketSummary?.price ?? 0, time: Math.floor(Date.now() / 1000) }]
                  : baseSeries;
              return nextSamples.slice(-MAX_LIVE_SAMPLES);
            });
          }
        }
      } catch (loadError) {
        if (isMounted && showLoading) {
          setError(loadError instanceof Error ? loadError.message : "Failed to fetch market data.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadMarketData(true);
    const intervalId = window.setInterval(() => loadMarketData(false), LIVE_REFRESH_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [selectedRange, selectedSymbol]);

  if (isLoading) return <LoadingState />;

  if (error) {
    return (
      <StateCard
        title="Live market data is unavailable"
        message={error}
        action="Check the Finnhub API key and /api/market-summary backend route."
      />
    );
  }

  if (!data || (!data.marketSummary && data.trendingStocks.length === 0 && data.majorIndices.length === 0)) {
    return (
      <StateCard
        title="No market data returned"
        message="The backend responded successfully, but did not return any stock quotes yet."
        action="The landing page is ready for the backend to return stocks, gainers, losers, and market summary data."
      />
    );
  }

  const summary = data.marketSummary;
  const updatedAt = data.updatedAt ? new Date(data.updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : null;
  const chartSeries =
    selectedRange === "1D" && liveSamples.length >= 2
      ? liveSamples
      : data.chartSeries?.length
        ? data.chartSeries
        : data.chartPoints.map((price) => ({ price }));
  const latestChartPoint = chartSeries[chartSeries.length - 1];
  const displaySummary = (() => {
    if (!summary || !latestChartPoint?.price || data.chartSource === "quote-session") {
      return summary;
    }

    const previousClose = data.chartPreviousClose ?? summary.previousClose;
    const price = latestChartPoint.price;
    const change = price - previousClose;
    const changePercent = previousClose ? (change / previousClose) * 100 : summary.changePercent;

    return {
      ...summary,
      price,
      change,
      changePercent,
      previousClose,
      high: summary.high && summary.high > price ? summary.high : price,
      low: summary.low && summary.low < price ? summary.low : price,
    };
  })();
  const activeSymbol = data.selectedSymbol ?? displaySummary?.symbol ?? selectedSymbol;

  function handleSelectStock(stock: MarketStock) {
    onSelectCompany?.(stock);
  }

  return (
    <section id="live-stats" className="border-t border-black/10 bg-white px-5 py-16 text-black md:px-8 md:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold tracking-normal md:text-3xl">Market summary</h2>
              <ChevronRight className="size-5" />
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-black/50">
              Live stock quotes from the backend, ranked into market movers and a watchlist-style preview.
            </p>
          </div>
          <div className="flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            Live data{updatedAt ? ` · ${updatedAt}` : ""}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[2.05fr_1fr]">
          <article className="rounded-lg border border-black/10 bg-white p-5 text-black shadow-lg shadow-black/5">
            {displaySummary ? (
              <>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <MarketHeadline summary={displaySummary} />
                  <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-black/45 md:gap-4">
                    {RANGE_OPTIONS.map((range) => (
                      <button
                        type="button"
                        key={range}
                        onClick={() => setSelectedRange(range)}
                        className={`relative cursor-pointer px-1 py-1 transition-colors hover:text-black ${
                          range === selectedRange
                            ? "text-blue-600 after:absolute after:-bottom-1 after:left-0 after:h-1 after:w-full after:rounded-full after:bg-blue-500"
                            : ""
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-7 h-[290px]">
                  <LiveLineChart
                    series={chartSeries}
                    previousClose={data.chartPreviousClose}
                    source={data.chartSource}
                    summary={displaySummary}
                    selectedRange={selectedRange}
                  />
                </div>
                <div className="mt-5 grid grid-cols-4 gap-3 text-sm text-black/75 md:grid-cols-8">
                  {[
                    ["Open", displaySummary.open],
                    ["High", displaySummary.high],
                    ["Low", displaySummary.low],
                    ["Current", displaySummary.price],
                    ["Prev close", displaySummary.previousClose],
                    ["Change", displaySummary.change],
                    ["Change %", displaySummary.changePercent],
                    ["Range", displaySummary.high && displaySummary.low ? displaySummary.high - displaySummary.low : undefined],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="font-bold text-black/50">{label}</p>
                      <p className="mt-1 font-semibold text-black">
                        {typeof value === "number"
                          ? label === "Change %"
                            ? <AnimatedValue value={value} formatter={formatPercent} />
                            : label === "Range"
                              ? numberFormatter.format(value)
                              : <AnimatedValue value={value} formatter={formatCurrency} />
                          : "N/A"}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="grid h-[312px] place-items-center text-center text-black/45">No market summary symbol returned.</div>
            )}
          </article>

          <article className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold">Market proxies</h3>
            <div className="mt-4 divide-y divide-black/10">
              {data.majorIndices.length > 0 ? (
                data.majorIndices.map((index) => (
                  <StockRow
                    key={`index-${index.symbol}`}
                    stock={index}
                    showMiniChart={false}
                    isSelected={index.symbol === activeSymbol}
                    onSelect={handleSelectStock}
                  />
                ))
              ) : (
                <p className="rounded-md border border-dashed border-black/10 p-5 text-sm text-black/45">No index proxy quotes returned.</p>
              )}
            </div>
            <Link href="#features" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-blue-600">
              Build your own watchlist
              <ChevronRight className="size-3" />
            </Link>
          </article>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <MoversCard title="Top gaining stocks" stocks={data.topGainers} variant="up" selectedSymbol={activeSymbol} onSelectStock={handleSelectStock} />
          <MoversCard title="Trending stocks" stocks={data.trendingStocks} variant="trend" selectedSymbol={activeSymbol} onSelectStock={handleSelectStock} />
        </div>

        <article className="mt-4 rounded-lg border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-full bg-black text-white">
              <Star className="size-4" />
            </span>
            <h3 className="text-sm font-bold">Watchlist-style preview</h3>
          </div>
          <div className="mt-4 grid gap-x-6 divide-y divide-black/10 md:grid-cols-2 md:divide-y-0">
            {data.watchlistPreview.length > 0 ? (
              data.watchlistPreview.map((stock) => (
                <StockRow
                  key={`watchlist-${stock.symbol}`}
                  stock={stock}
                  isSelected={stock.symbol === activeSymbol}
                  onSelect={handleSelectStock}
                />
              ))
            ) : (
              <p className="rounded-md border border-dashed border-black/10 p-5 text-sm text-black/45">
                No preview stocks returned. Once the backend exposes user watchlists publicly, this slot can connect to it.
              </p>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
