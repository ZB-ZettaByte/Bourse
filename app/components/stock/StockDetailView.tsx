"use client";

import { ExternalLink, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReactNode } from "react";
import AIInsights from "@/app/components/stock/AIInsights";
import { formatCurrency, formatMarketCap, formatNumber, formatPercent } from "./formatters";
import type { StockDetailData, StockEarnings, StockNewsArticle } from "@/lib/stock-detail";

type StockDetailViewProps = {
  detail: StockDetailData;
  current?: number;
  change?: number;
  changePercent?: number;
  previousClose?: number;
  summary: {
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
    updatedAt?: number;
    chartPoints: number[];
  };
};

type TabKey = "Overview" | "Financials" | "News" | "Technicals" | "Forecasts";
type RangeOption = "1D" | "5D" | "1M" | "6M" | "YTD" | "1Y" | "5Y" | "Max";
type ChartPoint = { price: number; time?: number };
type ChartResponse = {
  marketSummary?: StockDetailViewProps["summary"] | null;
  chartSeries?: ChartPoint[];
  chartPreviousClose?: number;
  chartSource?: string;
};

type FinnhubTradeMessage = {
  type?: string;
  data?: Array<{
    p?: number;
    s?: string;
    t?: number;
  }>;
};

const TABS: TabKey[] = ["Overview", "Financials", "News", "Technicals", "Forecasts"];
const CHART_RANGES: RangeOption[] = ["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y", "Max"];
const LIVE_REFRESH_MS = 30_000;
const FINNHUB_WS_TOKEN = process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? "";

function metricValue(metrics: Record<string, number>, keys: string[]) {
  for (const key of keys) {
    const value = Number(metrics[key]);
    if (Number.isFinite(value)) return value;
  }
  return undefined;
}

function formatCompactCurrency(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "N/A";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(1)}T`;
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  return formatCurrency(value);
}

function formatCompactNumber(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "N/A";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000_000) return `${(value / 1_000_000_000_000).toFixed(1)}T`;
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  return formatNumber(value);
}

function formatDate(value?: string) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function formatPeriod(earnings?: StockEarnings) {
  if (!earnings) return "N/A";
  if (earnings.quarter && earnings.year) return `Q${earnings.quarter} ${earnings.year}`;
  return earnings.period ?? "N/A";
}

function formatTimeAgo(timestamp?: number) {
  if (!timestamp) return "Recent";
  const seconds = Math.max(1, Math.floor(Date.now() / 1000 - timestamp));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function formatQuoteTime(timestamp?: number) {
  if (!timestamp) return "";
  return new Date(timestamp * 1000).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" });
}

function isMarketOpen() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(new Date());
  const weekday = parts.find((part) => part.type === "weekday")?.value;
  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  const minute = Number(parts.find((part) => part.type === "minute")?.value);
  const minutes = hour * 60 + minute;
  return weekday !== "Sat" && weekday !== "Sun" && minutes >= 9 * 60 + 30 && minutes < 16 * 60;
}

function useMarketOpenStatus() {
  const [marketOpen, setMarketOpen] = useState(false);

  useEffect(() => {
    function updateMarketStatus() {
      setMarketOpen(isMarketOpen());
    }

    updateMarketStatus();
    const intervalId = window.setInterval(updateMarketStatus, 30_000);

    return () => window.clearInterval(intervalId);
  }, []);

  return marketOpen;
}

function DataCell({ label, value, note }: { label: string; value: string; note?: string }) {
  const unavailable = value === "N/A";
  return (
    <div className="min-h-16 py-2">
      <p className="text-xs font-bold uppercase tracking-0 text-white/38">{label}</p>
      <p className={`mt-3 text-lg font-semibold ${unavailable ? "text-white/55" : "text-white"}`} title={note}>
        {value}
      </p>
      {unavailable && note ? <p className="mt-2 text-[11px] font-semibold text-white/35">Data could not be found.</p> : null}
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-2xl font-semibold leading-tight text-white">{children}</h2>;
}

function charSlotWidth(char: string) {
  if (char === ".") return "0.36ch";
  if (char === "," || char === "%") return "0.58ch";
  if (char === "$" || char === "+" || char === "-") return "0.72ch";
  return "1ch";
}

function AnimatedTickerValue({
  value,
  formatter,
  className = "",
  minWidth,
  colorChangedDigits = true,
}: {
  value?: number;
  formatter: (value?: number) => string;
  className?: string;
  minWidth?: string;
  colorChangedDigits?: boolean;
}) {
  const formatted = formatter(value);
  const numericRef = useRef(value);
  const currentRef = useRef(formatted);
  const [previousText, setPreviousText] = useState(formatted);
  const [currentText, setCurrentText] = useState(formatted);
  const [direction, setDirection] = useState<"up" | "down" | null>(null);
  const [isSliding, setIsSliding] = useState(false);

  useEffect(() => {
    if (formatted === currentRef.current) return;

    const previousNumeric = numericRef.current;
    const nextDirection =
      typeof value === "number" && Number.isFinite(value) && typeof previousNumeric === "number" && Number.isFinite(previousNumeric)
        ? value > previousNumeric
          ? "up"
          : value < previousNumeric
            ? "down"
            : null
        : null;

    setPreviousText(currentRef.current);
    setCurrentText(formatted);
    setDirection(nextDirection);
    setIsSliding(false);

    const frameId = requestAnimationFrame(() => setIsSliding(true));
    const timeoutId = window.setTimeout(() => {
      currentRef.current = formatted;
      numericRef.current = value;
      setPreviousText(formatted);
      setDirection(null);
      setIsSliding(false);
    }, 850);

    return () => {
      cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [formatted, value]);

  const maxLength = Math.max(previousText.length, currentText.length);
  const previousChars = previousText.padEnd(maxLength, " ");
  const currentChars = currentText.padEnd(maxLength, " ");
  const movementColor = colorChangedDigits && direction === "up" ? "text-emerald-300" : colorChangedDigits && direction === "down" ? "text-red-400" : "";
  const oldY = direction === "up" ? "-110%" : "110%";
  const newStartY = direction === "up" ? "110%" : "-110%";

  return (
    <span
      className={`inline-flex h-[1.12em] items-baseline overflow-hidden tabular-nums leading-none transition-colors duration-300 ${movementColor} ${className}`}
      style={{ fontVariantNumeric: "tabular-nums", minWidth }}
    >
      {Array.from(currentChars).map((currentChar, index) => {
        const previousChar = previousChars[index] ?? currentChar;
        const stableChar = currentChar === " " ? previousChar : currentChar;
        const width = stableChar === " " ? "0.35ch" : charSlotWidth(stableChar);
        const changed = Boolean(direction && previousChar !== currentChar);

        if (!changed) {
          return (
            <span key={`${currentChar}-${index}`} className="inline-block text-center" style={{ width, visibility: currentChar === " " ? "hidden" : "visible" }}>
              {currentChar === " " ? previousChar : currentChar}
            </span>
          );
        }

        return (
          <span key={`${previousChar}-${currentChar}-${index}`} className="relative inline-grid overflow-hidden text-center" style={{ width, height: "1.12em" }}>
            <span
              className="col-start-1 row-start-1 transition-all duration-500 ease-out"
              style={{ opacity: isSliding ? 0 : 1, transform: isSliding ? `translateY(${oldY})` : "translateY(0)" }}
            >
              {previousChar === " " ? "\u00a0" : previousChar}
            </span>
            <span
              className="col-start-1 row-start-1 transition-all duration-500 ease-out"
              style={{ opacity: isSliding ? 1 : 0, transform: isSliding ? "translateY(0)" : `translateY(${newStartY})` }}
            >
              {currentChar === " " ? "\u00a0" : currentChar}
            </span>
          </span>
        );
      })}
    </span>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number | string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-white/10 bg-black px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-white">{formatCurrency(Number(payload[0].value))} USD</p>
      {label && <p className="mt-1 text-white/45">{label}</p>}
    </div>
  );
}

function chartLabel(point: ChartPoint, index: number, range: RangeOption) {
  if (!point.time) return `${index + 1}`;
  const date = new Date(point.time * 1000);
  if (range === "1D") return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (range === "5D") return date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  if (range === "1M" || range === "6M" || range === "YTD") return date.toLocaleDateString([], { month: "short", day: "numeric" });
  return date.toLocaleDateString([], { month: "short", year: "numeric" });
}

function StockPriceChart({
  detail,
  fallbackPoints,
  summary,
  onSummaryUpdate,
}: {
  detail: StockDetailData;
  fallbackPoints: number[];
  summary: StockDetailViewProps["summary"];
  onSummaryUpdate?: (summary: StockDetailViewProps["summary"]) => void;
}) {
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [chartPreviousClose, setChartPreviousClose] = useState<number | undefined>(summary.previousClose);
  const [range, setRange] = useState<RangeOption>("1D");
  const [isLoading, setIsLoading] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadChart() {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/market-summary?symbol=${encodeURIComponent(detail.symbol)}&range=${encodeURIComponent(range)}&live=1&t=${Date.now()}`,
          {
            cache: "no-store",
          }
        );
        const payload = (await response.json()) as ChartResponse;
        if (isMounted) {
          setChartData(payload.chartSeries ?? []);
          setChartPreviousClose(payload.chartPreviousClose ?? summary.previousClose);
          if (payload.marketSummary) onSummaryUpdate?.(payload.marketSummary);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadChart();

    return () => {
      isMounted = false;
    };
  }, [detail.symbol, onSummaryUpdate, range, summary.previousClose]);

  useEffect(() => {
    const element = chartRef.current;
    if (!element) return;
    const observedElement = element;

    function updateWidth() {
      setChartWidth(Math.max(0, Math.floor(observedElement.getBoundingClientRect().width)));
    }

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(observedElement);

    return () => observer.disconnect();
  }, []);

  const series = useMemo(() => {
    const points: ChartPoint[] = chartData.length >= 2 ? chartData : fallbackPoints.map((price) => ({ price }));
    const livePoints =
      range === "1D" && summary.price && points.length > 0 && points[points.length - 1]?.price !== summary.price
        ? [...points, { price: summary.price, time: Math.floor(Date.now() / 1000) }]
        : points;
    return livePoints.map((point, index) => ({
      price: point.price,
      label: chartLabel(point, index, range),
    }));
  }, [chartData, fallbackPoints, range, summary.price]);

  const first = series[0]?.price ?? summary.previousClose ?? 0;
  const last = series[series.length - 1]?.price ?? first;
  const isUp = last >= first;
  const stroke = isUp ? "#63b37f" : "#ef4444";
  const innerWidth = Math.max(320, chartWidth);
  const dayRange = summary.high && summary.low ? summary.high - summary.low : undefined;
  const yAxisTicks = useMemo(() => {
    const prices = series.map((point) => point.price).filter((price) => Number.isFinite(price));
    if (chartPreviousClose) prices.push(chartPreviousClose);
    if (!prices.length) return undefined;

    const min = Math.floor(Math.min(...prices));
    const max = Math.ceil(Math.max(...prices));
    if (min === max) return [min - 1, min, min + 1];

    const span = Math.max(1, max - min);
    const step = Math.max(1, Math.ceil(span / 4));
    const ticks = new Set<number>();
    for (let value = min; value <= max; value += step) ticks.add(value);
    ticks.add(max);

    return Array.from(ticks).sort((a, b) => a - b);
  }, [chartPreviousClose, series]);
  const stats = [
    ["Open", formatCurrency(summary.open)],
    ["High", formatCurrency(summary.high)],
    ["Low", formatCurrency(summary.low)],
    ["Current", formatCurrency(summary.price)],
    ["Prev close", formatCurrency(summary.previousClose)],
    ["Change", formatNumber(summary.change)],
    ["Change %", formatPercent(summary.changePercent)],
    ["Range", formatNumber(dayRange)],
  ];

  return (
    <div className="rounded-lg border border-white/10 bg-black p-5 shadow-sm shadow-black/20">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-white">{detail.profile.name ?? summary.name}</h3>
            <span className="rounded-sm bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-white/50">{detail.profile.exchange ?? summary.exchange}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <p className="h-[1.12em] text-3xl font-semibold leading-none text-white">
              <AnimatedTickerValue value={summary.price} formatter={formatNumber} minWidth="6.2ch" />
            </p>
            <span className="text-[10px] font-bold uppercase text-white/42">USD</span>
            <span className={`text-sm font-bold ${summary.changePercent >= 0 ? "text-emerald-300" : "text-red-400"}`}>
              <AnimatedTickerValue value={summary.changePercent} formatter={formatPercent} minWidth="6.6ch" />
            </span>
            <span className="text-xs font-semibold text-white/42">
              <AnimatedTickerValue value={summary.change} formatter={formatCurrency} minWidth="6.4ch" />
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-5">
          {CHART_RANGES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRange(option)}
              className={`border-b-2 pb-2 text-sm font-bold transition-colors ${
                range === option ? "border-emerald-300 text-emerald-300" : "border-transparent text-white/42 hover:text-white"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mt-7 h-[318px]">
        {isLoading && <Loader2 className="absolute right-4 top-4 z-10 size-4 animate-spin text-white/45" />}
        <div ref={chartRef} className="h-full w-full min-w-0 overflow-hidden">
          <AreaChart width={innerWidth} height={318} data={series} margin={{ top: 10, right: 8, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="stockDetailArea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity={0.30} />
                <stop offset="100%" stopColor={stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.09)" vertical={false} />
            <XAxis
              dataKey="label"
              axisLine={{ stroke: "rgba(255,255,255,0.10)" }}
              tickLine={false}
              minTickGap={32}
              tick={{ fill: "rgba(255,255,255,0.46)", fontSize: 13, fontWeight: 600 }}
            />
            <YAxis
              orientation="right"
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(255,255,255,0.46)", fontSize: 12 }}
              tickFormatter={(value) => Math.round(Number(value)).toString()}
              width={72}
              ticks={yAxisTicks}
              domain={yAxisTicks ? [yAxisTicks[0], yAxisTicks[yAxisTicks.length - 1]] : ["dataMin", "dataMax"]}
            />
            {chartPreviousClose ? (
              <ReferenceLine
                y={chartPreviousClose}
                stroke="rgba(255,255,255,0.30)"
                strokeDasharray="2 4"
                label={{ value: "Previous close", position: "right", fill: "rgba(255,255,255,0.52)", fontSize: 12 }}
              />
            ) : null}
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.35)", strokeDasharray: "2 4" }} />
            <Area type="monotone" dataKey="price" stroke={stroke} strokeWidth={3} fill="url(#stockDetailArea)" dot={false} activeDot={{ r: 5, stroke: "#000000", strokeWidth: 3 }} />
          </AreaChart>
        </div>
        <span className="absolute bottom-7 left-3 rounded-md border border-white/10 bg-black/80 px-2 py-1 text-[10px] font-bold text-white/45 backdrop-blur-sm">
          Live market chart
        </span>
      </div>

      <div className="mt-5 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        {stats.map(([label, value]) => (
          <div key={label}>
            <p className="text-xs font-bold text-white/45">{label}</p>
            <p className="mt-2 text-sm font-semibold text-white">
              {label === "Current" ? <AnimatedTickerValue value={summary.price} formatter={formatCurrency} minWidth="6.8ch" /> : value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EarningsBanner({ earnings }: { earnings?: StockEarnings }) {
  return (
    <section className="rounded-lg border border-emerald-300/20 bg-[radial-gradient(circle_at_top_left,rgba(99,179,127,0.20),transparent_34%),rgba(255,255,255,0.045)] p-6 text-center shadow-sm shadow-black/20">
      <p className="text-xs font-bold uppercase text-emerald-200/80">Key facts today</p>
      <p className="mx-auto mt-3 max-w-3xl text-xl font-semibold leading-8 text-white">
        Latest report: EPS {formatNumber(earnings?.actual)}, revenue {formatCompactCurrency(earnings?.revenueActual)}, report period{" "}
        {formatPeriod(earnings)}.
      </p>
    </section>
  );
}

function LatestEarnings({ earnings }: { earnings?: StockEarnings }) {
  return (
    <section className="space-y-4">
      <SectionTitle>Latest Earnings</SectionTitle>
      <div className="grid gap-3 md:grid-cols-4">
        <DataCell label="Last report date" value={formatDate(earnings?.period)} />
        <DataCell label="Report period" value={formatPeriod(earnings)} />
        <DataCell label="EPS" value={formatNumber(earnings?.actual)} />
        <DataCell label="Revenue" value={formatCompactCurrency(earnings?.revenueActual)} />
      </div>
    </section>
  );
}

function KeyStats({ detail }: { detail: StockDetailData }) {
  const metrics = detail.metrics ?? {};
  const financials = detail.financials ?? {};
  const notes = financials.dataNotes ?? {};
  const rows = [
    { label: "Market cap", value: formatMarketCap(detail.profile.marketCapitalization ?? metricValue(metrics, ["marketCapitalization"])) },
    { label: "Dividend yield", value: formatPercent(metricValue(metrics, ["dividendYieldIndicatedAnnual", "dividendYield5Y"])) },
    { label: "P/E ratio", value: formatNumber(metricValue(metrics, ["peBasicExclExtraTTM", "peNormalizedAnnual", "peTTM"])) },
    { label: "Basic EPS", value: formatNumber(metricValue(metrics, ["epsBasicExclExtraItemsTTM", "epsBasicExclExtraItemsAnnual", "epsTTM"])) },
    { label: "Net income FY", value: formatCompactCurrency(financials.netIncomeFY), note: notes.netIncomeFY },
    { label: "Revenue FY", value: formatCompactCurrency(financials.revenueFY), note: notes.revenueFY },
    { label: "Shares float", value: formatCompactNumber(financials.sharesFloat), note: notes.sharesFloat },
    { label: "Beta", value: formatNumber(metricValue(metrics, ["beta", "beta1Year"])) },
  ];

  return (
    <section className="space-y-4">
      <SectionTitle>Key Stats</SectionTitle>
      <div className="grid gap-3 md:grid-cols-4">
        {rows.map((row) => (
          <DataCell key={row.label} label={row.label} value={row.value} note={row.note} />
        ))}
      </div>
    </section>
  );
}

function Employees({ detail }: { detail: StockDetailData }) {
  const financials = detail.financials ?? {};
  const notes = financials.dataNotes ?? {};

  return (
    <section className="space-y-4">
      <SectionTitle>Employees</SectionTitle>
      <div className="grid gap-3 md:grid-cols-3">
        <DataCell label="Employees FY" value={formatCompactNumber(financials.employeesFY)} note={notes.employeesFY} />
        <DataCell label="Revenue per employee" value={formatCompactCurrency(financials.revenuePerEmployee)} note={notes.revenuePerEmployee} />
        <DataCell label="Net income per employee" value={formatCompactCurrency(financials.netIncomePerEmployee)} note={notes.netIncomePerEmployee} />
      </div>
    </section>
  );
}

function AboutCompany({ detail }: { detail: StockDetailData }) {
  const [expanded, setExpanded] = useState(false);
  const profile = detail.profile;
  const name = profile.name ?? detail.symbol;
  const fallbackDescription = `${name} trades on ${profile.exchange ?? "its listed exchange"} under ${detail.symbol}. The company is categorized in ${
    profile.finnhubIndustry ?? "its reported industry"
  } and is headquartered in ${[profile.city, profile.country].filter(Boolean).join(", ") || "its reported market region"}. Bourse combines Finnhub profile, quote, metric, earnings, candle, and company news data here so investors can review current market movement beside company fundamentals.`;
  const description = profile.description ?? fallbackDescription;
  const canExpand = description.length > 260;

  return (
    <section className="space-y-4">
      <SectionTitle>About {name}</SectionTitle>
      <div className="grid gap-3 md:grid-cols-4">
        <DataCell label="Sector" value={profile.finnhubIndustry ?? "N/A"} />
        <DataCell label="Industry" value={profile.finnhubIndustry ?? "N/A"} />
        <DataCell label="CEO" value={profile.ceo ?? "N/A"} />
        <DataCell label="Website" value={profile.weburl ?? "N/A"} />
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <DataCell label="Headquarters" value={[profile.city, profile.country].filter(Boolean).join(", ") || "N/A"} />
        <DataCell label="Founded" value={profile.ipo ? new Date(profile.ipo).getFullYear().toString() : "N/A"} />
        <DataCell label="IPO date" value={formatDate(profile.ipo)} />
      </div>
      <div className="max-w-4xl py-2">
        <p className={`text-sm leading-7 text-white/58 ${canExpand && !expanded ? "line-clamp-3" : ""}`}>{description}</p>
        {canExpand ? (
          <button type="button" onClick={() => setExpanded((value) => !value)} className="mt-3 text-sm font-bold text-emerald-300">
            {expanded ? "Show less" : "Show more"}
          </button>
        ) : null}
      </div>
    </section>
  );
}

type NewsPayload = {
  news?: StockNewsArticle[];
  error?: string;
};

function NewsGrid({ detail }: { detail: StockDetailData }) {
  const [articles, setArticles] = useState<StockNewsArticle[]>(detail.news.slice(0, 15));
  const [isLoading, setIsLoading] = useState(detail.news.length === 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadNews() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/stock/${encodeURIComponent(detail.symbol)}/news?t=${Date.now()}`, { cache: "no-store" });
        const payload = (await response.json()) as NewsPayload;
        if (!response.ok) throw new Error(payload.error ?? "Unable to load news.");
        if (isMounted && Array.isArray(payload.news)) setArticles(payload.news.slice(0, 15));
      } catch (nextError) {
        if (isMounted) setError(nextError instanceof Error ? nextError.message : "Unable to load news.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadNews();

    return () => {
      isMounted = false;
    };
  }, [detail.symbol]);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionTitle>News</SectionTitle>
        <div className="min-h-5 text-xs font-semibold text-white/38">
          {isLoading ? (
            <span className="inline-flex items-center gap-2"><Loader2 className="size-3.5 animate-spin" /> Refreshing headlines</span>
          ) : articles.length ? (
            <span>{articles.length} relevant stories</span>
          ) : null}
        </div>
      </div>

      {error ? <p className="rounded-lg border border-red-400/20 bg-red-400/10 p-4 text-sm font-semibold text-red-200">{error}</p> : null}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {isLoading && articles.length === 0
          ? Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="min-h-32 animate-pulse rounded-lg border border-white/10 bg-white/[0.035] p-4">
                <div className="h-4 w-28 rounded bg-white/10" />
                <div className="mt-5 h-4 w-full rounded bg-white/10" />
                <div className="mt-3 h-4 w-4/5 rounded bg-white/10" />
              </div>
            ))
          : articles.length > 0 ? (
          articles.map((article) => (
            <a
              key={`${article.id ?? article.url}-${article.datetime ?? ""}`}
              href={article.url ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="group block min-h-40 rounded-lg border border-white/10 bg-white/[0.025] p-4 transition-colors hover:border-emerald-300/40 hover:bg-emerald-300/[0.04]"
            >
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-white/40">
                <span className="grid size-4 place-items-center rounded-full bg-emerald-300/18 text-[8px] font-bold text-emerald-200">
                  {(article.source ?? "N").slice(0, 2).toUpperCase()}
                </span>
                <span className="truncate">{formatTimeAgo(article.datetime)} · {article.source ?? "Market news"}</span>
                <ExternalLink className="size-3.5 shrink-0 text-white/28 transition-colors group-hover:text-emerald-300" />
              </div>
              <h3 className="text-sm font-semibold leading-6 text-white/88 transition-colors group-hover:text-emerald-200">{article.headline}</h3>
              {article.summary ? <p className="mt-3 line-clamp-2 text-xs leading-5 text-white/48">{article.summary}</p> : null}
            </a>
          ))
        ) : (
          <p className="rounded-lg border border-dashed border-white/10 p-5 text-sm font-semibold text-white/45 sm:col-span-2 lg:col-span-3 xl:col-span-4 2xl:col-span-5">
            No recent company news could be found from the available sources.
          </p>
        )}
      </div>
    </section>
  );
}

function Overview({
  detail,
  summary,
  onSummaryUpdate,
}: Pick<StockDetailViewProps, "detail" | "summary"> & {
  onSummaryUpdate: (summary: StockDetailViewProps["summary"]) => void;
}) {
  const latestEarnings = detail.earnings[0];

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <StockPriceChart detail={detail} fallbackPoints={summary.chartPoints} summary={summary} onSummaryUpdate={onSummaryUpdate} />
        <EarningsBanner earnings={latestEarnings} />
      </section>
      <LatestEarnings earnings={latestEarnings} />
      <KeyStats detail={detail} />
      <Employees detail={detail} />
      <AboutCompany detail={detail} />
    </div>
  );
}

export default function StockDetailView({ detail, current, change, changePercent, summary }: StockDetailViewProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("Overview");
  const [liveSummary, setLiveSummary] = useState(summary);
  const updateLiveSummary = useCallback((nextSummary: StockDetailViewProps["summary"]) => {
    setLiveSummary(nextSummary);
  }, []);
  const updateLivePrice = useCallback((price: number) => {
    if (!Number.isFinite(price) || price <= 0) return;

    setLiveSummary((currentSummary) => {
      if (currentSummary.price === price) return currentSummary;

      const previousClose = currentSummary.previousClose || price;
      const change = price - previousClose;
      const changePercent = previousClose ? (change / previousClose) * 100 : 0;
      const high = currentSummary.high ? Math.max(currentSummary.high, price) : price;
      const low = currentSummary.low ? Math.min(currentSummary.low, price) : price;
      const chartPoints = [...(currentSummary.chartPoints ?? []), price].slice(-240);

      return {
        ...currentSummary,
        price,
        change,
        changePercent,
        high,
        low,
        chartPoints,
      };
    });
  }, []);
  const latestEarnings = detail.earnings[0];
  const marketOpen = useMarketOpenStatus();
  const displayedPrice = liveSummary.price || current;
  const displayedChange = Number.isFinite(liveSummary.change) ? liveSummary.change : change;
  const displayedChangePercent = Number.isFinite(liveSummary.changePercent) ? liveSummary.changePercent : changePercent;
  const isUp = Number(displayedChangePercent ?? displayedChange ?? 0) >= 0;
  const profile = detail.profile;

  useEffect(() => {
    let isMounted = true;

    async function loadLatestQuote() {
      const response = await fetch(`/api/market-summary?symbol=${encodeURIComponent(detail.symbol)}&range=1D&live=1&t=${Date.now()}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as ChartResponse;
      if (isMounted && payload.marketSummary) setLiveSummary(payload.marketSummary);
    }

    loadLatestQuote().catch(() => undefined);
    const intervalId = window.setInterval(() => {
      loadLatestQuote().catch(() => undefined);
    }, LIVE_REFRESH_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [detail.symbol]);

  useEffect(() => {
    if (!FINNHUB_WS_TOKEN) return;

    const socket = new WebSocket(`wss://ws.finnhub.io?token=${encodeURIComponent(FINNHUB_WS_TOKEN)}`);

    socket.addEventListener("open", () => {
      socket.send(JSON.stringify({ type: "subscribe", symbol: detail.symbol }));
    });

    socket.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(String(event.data)) as FinnhubTradeMessage;
        if (message.type !== "trade" || !Array.isArray(message.data)) return;

        const latestTrade = [...message.data].reverse().find((trade) => trade.s === detail.symbol && Number.isFinite(Number(trade.p)));
        if (latestTrade?.p) updateLivePrice(Number(latestTrade.p));
      } catch {
        // Ignore malformed websocket frames and keep the polling fallback alive.
      }
    });

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "unsubscribe", symbol: detail.symbol }));
      }
      socket.close();
    };
  }, [detail.symbol, updateLivePrice]);

  return (
    <div>
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="min-w-0">
          <section className="mb-7">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(220px,300px)] lg:items-start">
              <div className="flex min-w-0 items-center gap-5">
                {profile.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- Finnhub returns arbitrary remote logo hosts.
                  <img src={profile.logo} alt={`${profile.name ?? detail.symbol} logo`} className="size-20 rounded-full bg-white p-2 object-contain" />
                ) : (
                  <span className="grid size-20 place-items-center rounded-full bg-white/10 text-xl font-bold text-white">{detail.symbol.slice(0, 3)}</span>
                )}
                <div className="min-w-0">
                  <h1 className="max-w-[15ch] text-4xl font-semibold leading-[1.05] text-white md:max-w-[18ch] md:text-5xl lg:max-w-[19ch]">
                    {profile.name ?? detail.symbol}
                  </h1>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-white/46">
                    <span>{detail.symbol}</span>
                    <span>·</span>
                    <span>{profile.exchange ?? liveSummary.exchange}</span>
                    <span className={`ml-1 size-2 rounded-full ${marketOpen ? "bg-emerald-300" : "bg-red-400"}`} />
                    <span>Market {marketOpen ? "open" : "closed"}</span>
                  </div>
                </div>
              </div>
              <div className="flex min-w-0 flex-col items-start lg:items-end lg:justify-self-end lg:text-right">
                <p className="min-h-[1.05em] whitespace-nowrap text-5xl font-semibold leading-none text-white tabular-nums">
                  {formatCurrency(displayedPrice)}
                </p>
                <p className={`mt-3 flex min-h-[1.25em] justify-start gap-3 text-base font-bold lg:justify-end ${isUp ? "text-emerald-300" : "text-red-400"}`}>
                  <AnimatedTickerValue
                    value={displayedChange}
                    formatter={(nextValue) => `${nextValue && nextValue >= 0 ? "+" : ""}${formatNumber(nextValue)}`}
                    minWidth="5.4ch"
                  />
                  <AnimatedTickerValue value={displayedChangePercent} formatter={formatPercent} minWidth="5.8ch" />
                </p>
                {liveSummary.updatedAt ? <p className="mt-2 text-xs font-semibold text-white/35">Updated {formatQuoteTime(liveSummary.updatedAt)}</p> : null}
              </div>
            </div>
          </section>

          <div className="mb-7 flex gap-7 overflow-x-auto border-b border-white/10">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 border-b-2 pb-3 text-sm font-bold transition-colors ${
                  activeTab === tab ? "border-emerald-300 text-white" : "border-transparent text-white/45 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "Overview" && <Overview detail={detail} summary={liveSummary} onSummaryUpdate={updateLiveSummary} />}
          {activeTab === "Financials" && (
            <div className="space-y-8">
              <LatestEarnings earnings={latestEarnings} />
              <KeyStats detail={detail} />
              <Employees detail={detail} />
            </div>
          )}
          {activeTab === "Technicals" && (
            <section className="space-y-4">
              <StockPriceChart detail={detail} fallbackPoints={liveSummary.chartPoints} summary={liveSummary} onSummaryUpdate={updateLiveSummary} />
            </section>
          )}
          {activeTab === "Forecasts" && (
            <div className="space-y-8">
              <EarningsBanner earnings={latestEarnings} />
              <KeyStats detail={detail} />
            </div>
          )}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-28 xl:self-start">
          <AIInsights symbol={detail.symbol} />
          <button
            type="button"
            className="h-12 w-full rounded-lg border border-white bg-white px-6 text-sm font-bold text-black transition-colors hover:bg-black hover:text-white"
          >
            Add {detail.symbol} to Watchlist
          </button>
        </aside>
      </div>

      {(activeTab === "Overview" || activeTab === "News") && (
        <div className="mt-8">
          <NewsGrid detail={detail} />
        </div>
      )}
    </div>
  );
}
