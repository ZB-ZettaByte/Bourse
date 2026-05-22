import { NextResponse } from "next/server";

const FINNHUB_BASE_URL = process.env.FINNHUB_BASE_URL ?? "https://finnhub.io/api/v1";
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? "";
const YAHOO_CHART_BASE_URL = "https://query1.finance.yahoo.com/v8/finance/chart";
const QUOTE_CACHE_TTL_MS = 30_000;
const STALE_QUOTE_TTL_MS = 10 * 60_000;

export const dynamic = "force-dynamic";

type RangeOption = "1D" | "5D" | "1M" | "6M" | "YTD" | "1Y" | "5Y" | "Max";
type ChartSource = "candles" | "yahoo-chart" | "live-history" | "quote-session" | "unavailable";

type FinnhubQuote = {
  c?: number;
  d?: number;
  dp?: number;
  h?: number;
  l?: number;
  o?: number;
  pc?: number;
  t?: number;
};

type FinnhubProfile = {
  logo?: string;
  name?: string;
};

type FinnhubCandles = {
  c?: number[];
  s?: string;
  t?: number[];
};

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: {
        chartPreviousClose?: number;
        previousClose?: number;
      };
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>;
        }>;
      };
    }>;
  };
};

type ChartPoint = {
  price: number;
  time?: number;
};

type ChartDataResult = {
  points: ChartPoint[];
  previousClose?: number;
};

type MarketStock = {
  symbol: string;
  name: string;
  exchange: string;
  logo?: string;
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

type StockFetchResult = {
  stock: MarketStock | null;
  errorStatus?: number;
};

type CachedStock = {
  stock: MarketStock;
  fetchedAt: number;
};

type CachedProfile = {
  profile: FinnhubProfile;
  fetchedAt: number;
};

type QuoteHistoryPoint = {
  price: number;
  time: number;
};

const STOCK_NAMES: Record<string, string> = {
  AAPL: "Apple Inc.",
  MSFT: "Microsoft Corp.",
  GOOGL: "Alphabet Inc.",
  AMZN: "Amazon.com Inc.",
  TSLA: "Tesla Inc.",
  NVDA: "NVIDIA Corp.",
  META: "Meta Platforms Inc.",
  AMD: "Advanced Micro Devices",
  SPY: "S&P 500 ETF",
  QQQ: "Nasdaq 100 ETF",
  DIA: "Dow Jones ETF",
  IWM: "Russell 2000 ETF",
};

const STOCK_LOGOS: Record<string, string> = {
  SPY: "https://logo.clearbit.com/ssga.com",
  DIA: "https://logo.clearbit.com/ssga.com",
  QQQ: "https://logo.clearbit.com/invesco.com",
  IWM: "https://logo.clearbit.com/ishares.com",
};

const LANDING_SYMBOLS = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "META", "AMD"];

const MARKET_PROXIES = [
  { symbol: "SPY", name: "S&P 500 ETF", code: "SPY", logo: STOCK_LOGOS.SPY },
  { symbol: "QQQ", name: "Nasdaq 100 ETF", code: "QQQ", logo: STOCK_LOGOS.QQQ },
  { symbol: "DIA", name: "Dow Jones ETF", code: "DIA", logo: STOCK_LOGOS.DIA },
  { symbol: "IWM", name: "Russell 2000 ETF", code: "IWM", logo: STOCK_LOGOS.IWM },
];

const quoteHistoryStore = globalThis as typeof globalThis & {
  __signalistQuoteHistory?: Record<string, QuoteHistoryPoint[]>;
  __signalistStockQuoteCache?: Record<string, CachedStock>;
  __signalistStockProfileCache?: Record<string, CachedProfile>;
};

const quoteHistory = quoteHistoryStore.__signalistQuoteHistory ?? {};
quoteHistoryStore.__signalistQuoteHistory = quoteHistory;
const stockQuoteCache = quoteHistoryStore.__signalistStockQuoteCache ?? {};
quoteHistoryStore.__signalistStockQuoteCache = stockQuoteCache;
const stockProfileCache = quoteHistoryStore.__signalistStockProfileCache ?? {};
quoteHistoryStore.__signalistStockProfileCache = stockProfileCache;

function finitePositive(value: unknown): number | undefined {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined;
}

function buildQuoteChartPoints(quote: FinnhubQuote): number[] {
  const previousClose = finitePositive(quote.pc);
  const open = finitePositive(quote.o);
  const low = finitePositive(quote.l);
  const high = finitePositive(quote.h);
  const current = finitePositive(quote.c);

  const orderedPoints = [previousClose, open, low, high, current].filter((point): point is number =>
    Boolean(point)
  );
  const deduped = orderedPoints.filter((point, index) => index === 0 || point !== orderedPoints[index - 1]);

  if (deduped.length >= 2) return deduped;
  if (previousClose && current && previousClose !== current) return [previousClose, current];

  return [];
}

function buildQuoteChartSeries(quote: FinnhubQuote): ChartPoint[] {
  const now = Math.floor(Date.now() / 1000);
  const currentTime = Number.isFinite(Number(quote.t)) && Number(quote.t) > 0 ? Number(quote.t) : now;
  const prices = buildQuoteChartPoints(quote);
  const spacing = 15 * 60;

  return prices.map((price, index) => ({
    price,
    time: currentTime - (prices.length - index - 1) * spacing,
  }));
}

function rangeConfig(range: RangeOption) {
  const now = Math.floor(Date.now() / 1000);
  const day = 24 * 60 * 60;
  const currentYear = new Date().getFullYear();
  const yearStart = Math.floor(new Date(currentYear, 0, 1).getTime() / 1000);

  if (range === "1D") return { resolution: "5", from: now - day };
  if (range === "5D") return { resolution: "15", from: now - 5 * day };
  if (range === "1M") return { resolution: "60", from: now - 31 * day };
  if (range === "6M") return { resolution: "D", from: now - 183 * day };
  if (range === "YTD") return { resolution: "D", from: yearStart };
  if (range === "1Y") return { resolution: "D", from: now - 366 * day };
  if (range === "5Y") return { resolution: "W", from: now - 5 * 366 * day };

  return { resolution: "M", from: now - 10 * 366 * day };
}

function yahooRangeConfig(range: RangeOption) {
  if (range === "1D") return { range: "1d", interval: "5m" };
  if (range === "5D") return { range: "5d", interval: "15m" };
  if (range === "1M") return { range: "1mo", interval: "1h" };
  if (range === "6M") return { range: "6mo", interval: "1d" };
  if (range === "YTD") return { range: "ytd", interval: "1d" };
  if (range === "1Y") return { range: "1y", interval: "1d" };
  if (range === "5Y") return { range: "5y", interval: "1wk" };

  return { range: "max", interval: "1mo" };
}

function rangeDurationMs(range: RangeOption) {
  const day = 24 * 60 * 60 * 1000;

  if (range === "1D") return day;
  if (range === "5D") return 5 * day;
  if (range === "1M") return 31 * day;
  if (range === "6M") return 183 * day;
  if (range === "YTD") return Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime();
  if (range === "1Y") return 366 * day;
  if (range === "5Y") return 5 * 366 * day;

  return Number.POSITIVE_INFINITY;
}

function rememberQuote(symbol: string, price: number) {
  if (!Number.isFinite(price) || price <= 0) return;

  const now = Date.now();
  const currentHistory = quoteHistory[symbol] ?? [];
  const lastPoint = currentHistory[currentHistory.length - 1];
  const shouldAppend = !lastPoint || lastPoint.price !== price || now - lastPoint.time > 20_000;
  const nextHistory = shouldAppend ? [...currentHistory, { price, time: now }] : currentHistory;
  const oldestAllowed = now - 10 * 366 * 24 * 60 * 60 * 1000;

  quoteHistory[symbol] = nextHistory.filter((point) => point.time >= oldestAllowed).slice(-500);
}

function getLiveHistory(symbol: string, range: RangeOption) {
  const history = quoteHistory[symbol] ?? [];
  const duration = rangeDurationMs(range);
  const fromTime = Number.isFinite(duration) ? Date.now() - duration : 0;

  return history
    .filter((point) => point.time >= fromTime)
    .map((point) => ({
      price: point.price,
      time: Math.floor(point.time / 1000),
    }));
}

function parseRange(value: string | null): RangeOption {
  const normalized = value?.toUpperCase();
  if (
    normalized === "1D" ||
    normalized === "5D" ||
    normalized === "1M" ||
    normalized === "6M" ||
    normalized === "YTD" ||
    normalized === "1Y" ||
    normalized === "5Y" ||
    normalized === "MAX"
  ) {
    return normalized === "MAX" ? "Max" : normalized;
  }

  return "1D";
}

function parseSymbol(value: string | null) {
  const symbol = value
    ?.trim()
    .toUpperCase()
    .replace(/[^A-Z0-9.-]/g, "");
  return symbol || "SPY";
}

async function fetchFinnhub<T>(path: string): Promise<T> {
  const separator = path.includes("?") ? "&" : "?";
  const response = await fetch(`${FINNHUB_BASE_URL}${path}${separator}token=${FINNHUB_API_KEY}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const error = new Error(`Finnhub request failed ${response.status}: ${text}`) as Error & {
      status?: number;
    };
    error.status = response.status;
    throw error;
  }

  return (await response.json()) as T;
}

async function getProfile(symbol: string): Promise<FinnhubProfile> {
  const cached = stockProfileCache[symbol];
  const now = Date.now();

  if (cached && now - cached.fetchedAt < 60 * 60_000) {
    return cached.profile;
  }

  try {
    const profile = await fetchFinnhub<FinnhubProfile>(
      `/stock/profile2?symbol=${encodeURIComponent(symbol)}`
    );
    stockProfileCache[symbol] = { profile, fetchedAt: now };
    return profile;
  } catch {
    return cached?.profile ?? {};
  }
}

async function getCandles(symbol: string, range: RangeOption): Promise<ChartPoint[]> {
  try {
    const { from, resolution } = rangeConfig(range);
    const to = Math.floor(Date.now() / 1000);
    const candles = await fetchFinnhub<FinnhubCandles>(
      `/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&from=${from}&to=${to}`
    );

    if (candles.s !== "ok" || !Array.isArray(candles.c)) {
      return [];
    }

    return candles.c
      .map((price, index) => ({
        price,
        time: candles.t?.[index],
      }))
      .filter((point) => Number.isFinite(point.price) && point.price > 0)
      .map((point) => ({ price: point.price, time: point.time }));
  } catch {
    return [];
  }
}

async function getYahooChart(symbol: string, range: RangeOption): Promise<ChartDataResult> {
  try {
    const config = yahooRangeConfig(range);
    const response = await fetch(
      `${YAHOO_CHART_BASE_URL}/${encodeURIComponent(symbol)}?range=${config.range}&interval=${config.interval}`,
      {
        cache: "no-store",
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      return { points: [] };
    }

    const data = (await response.json()) as YahooChartResponse;
    const result = data.chart?.result?.[0];
    const closes = result?.indicators?.quote?.[0]?.close ?? [];
    const timestamps = result?.timestamp ?? [];
    const previousClose =
      finitePositive(result?.meta?.chartPreviousClose) ?? finitePositive(result?.meta?.previousClose);

    return {
      points: closes
        .map((price, index) => ({
          price,
          time: timestamps[index],
        }))
        .filter((point) => Number.isFinite(point.price) && Number(point.price) > 0)
        .map((point) => ({ price: Number(point.price), time: point.time })),
      previousClose,
    };
  } catch {
    return { points: [] };
  }
}

async function getStock(symbol: string, forceFresh = false): Promise<StockFetchResult> {
  const cached = stockQuoteCache[symbol];
  const now = Date.now();

  if (!forceFresh && cached && now - cached.fetchedAt < QUOTE_CACHE_TTL_MS) {
    return { stock: cached.stock };
  }

  try {
    const [quote, profile] = await Promise.all([
      fetchFinnhub<FinnhubQuote>(`/quote?symbol=${encodeURIComponent(symbol)}`),
      getProfile(symbol),
    ]);

    const price = finitePositive(quote.c);
    const previousClose = finitePositive(quote.pc);

    if (!price || !previousClose) {
      return { stock: null };
    }

    const change = Number.isFinite(Number(quote.d)) ? Number(quote.d) : price - previousClose;
    const changePercent = Number.isFinite(Number(quote.dp))
      ? Number(quote.dp)
      : (change / previousClose) * 100;

    const stock = {
      symbol,
      name: profile.name || STOCK_NAMES[symbol] || symbol,
      exchange: "US",
      logo: profile.logo || STOCK_LOGOS[symbol] || undefined,
      price,
      change,
      changePercent,
      previousClose,
      open: finitePositive(quote.o),
      high: finitePositive(quote.h),
      low: finitePositive(quote.l),
      updatedAt: Number.isFinite(Number(quote.t)) ? Number(quote.t) : undefined,
      chartPoints: buildQuoteChartPoints(quote),
    };

    stockQuoteCache[symbol] = { stock, fetchedAt: now };

    return { stock };
  } catch (error) {
    const status =
      error instanceof Error && "status" in error
        ? Number((error as Error & { status?: number }).status)
        : undefined;
    if (cached && now - cached.fetchedAt < STALE_QUOTE_TTL_MS) {
      return { stock: cached.stock, errorStatus: status };
    }

    return { stock: null, errorStatus: status };
  }
}

export async function GET(request: Request) {
  if (!FINNHUB_API_KEY) {
    return NextResponse.json(
      {
        error: "Market data API key is not configured.",
        data: null,
      },
      { status: 503 }
    );
  }

  const searchParams = new URL(request.url).searchParams;
  const selectedRange = parseRange(searchParams.get("range"));
  const selectedSymbol = parseSymbol(searchParams.get("symbol"));
  const forceLiveQuote = searchParams.get("live") === "1" || searchParams.get("refresh") === "1";
  const symbols = Array.from(
    new Set([selectedSymbol, ...LANDING_SYMBOLS, ...MARKET_PROXIES.map((item) => item.symbol)])
  );
  const results = await Promise.all(
    symbols.map((symbol) => getStock(symbol, forceLiveQuote && symbol === selectedSymbol))
  );
  const stocks = results
    .map((result) => result.stock)
    .filter((stock): stock is MarketStock => Boolean(stock));
  const failedStatuses = results
    .map((result) => result.errorStatus)
    .filter((status): status is number => Number.isFinite(status));

  if (stocks.length === 0) {
    const rateLimited = failedStatuses.includes(429);
    return NextResponse.json(
      {
        error: rateLimited
          ? "Market data provider rate limit reached. Please try again shortly."
          : "No market quotes were returned by the backend.",
        updatedAt: new Date().toISOString(),
        marketSummary: null,
        majorIndices: [],
        topGainers: [],
        topLosers: [],
        trendingStocks: [],
        watchlistPreview: [],
        chartPoints: [],
        chartSeries: [],
        chartSource: "unavailable",
      },
      { status: rateLimited || failedStatuses.length > 0 ? 502 : 200 }
    );
  }

  const marketSummary =
    stocks.find((stock) => stock.symbol === selectedSymbol) ??
    stocks.find((stock) => stock.symbol === "SPY") ??
    stocks[0] ??
    null;
  const marketProxySymbols = new Set(MARKET_PROXIES.map((item) => item.symbol));
  const majorIndices = MARKET_PROXIES.map((proxy) => {
    const stock = stocks.find((item) => item.symbol === proxy.symbol);
    return stock ? { ...stock, name: proxy.name, code: proxy.code, logo: stock.logo || proxy.logo } : null;
  }).filter((stock): stock is MarketStock & { code: string; logo: string } => Boolean(stock));

  const equities = stocks.filter((stock) => !marketProxySymbols.has(stock.symbol));
  const topGainers = [...equities]
    .filter((stock) => stock.changePercent > 0)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 5);
  const topLosers = [...equities]
    .filter((stock) => stock.changePercent < 0)
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 5);
  const trendingStocks = [...equities]
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 6);
  const watchlistPreview = equities.slice(0, 4);
  const candleSeries = marketSummary ? await getCandles(marketSummary.symbol, selectedRange) : [];
  const yahooChart =
    marketSummary && candleSeries.length < 2
      ? await getYahooChart(marketSummary.symbol, selectedRange)
      : { points: [] };
  const liveHistorySeries = marketSummary ? getLiveHistory(marketSummary.symbol, selectedRange) : [];
  const quoteSeries = marketSummary
    ? buildQuoteChartSeries({
        pc: marketSummary.previousClose,
        o: marketSummary.open,
        l: marketSummary.low,
        h: marketSummary.high,
        c: marketSummary.price,
      })
    : [];
  const chartSeries =
    candleSeries.length >= 2
      ? candleSeries
      : yahooChart.points.length >= 2
        ? yahooChart.points
        : liveHistorySeries.length >= 2
          ? liveHistorySeries
          : quoteSeries;
  const synchronizedChartSeries =
    selectedRange === "1D" &&
    marketSummary?.price &&
    chartSeries.length >= 2 &&
    chartSeries[chartSeries.length - 1]?.price !== marketSummary.price
      ? [
          ...chartSeries,
          {
            price: marketSummary.price,
            time: Math.max(
              marketSummary.updatedAt ?? 0,
              (chartSeries[chartSeries.length - 1]?.time ?? 0) + 1,
              Math.floor(Date.now() / 1000)
            ),
          },
        ]
      : chartSeries;
  const chartPoints = synchronizedChartSeries.map((point) => point.price);
  const chartSource: ChartSource =
    candleSeries.length >= 2
      ? "candles"
      : yahooChart.points.length >= 2
        ? "yahoo-chart"
        : liveHistorySeries.length >= 2
          ? "live-history"
          : marketSummary?.chartPoints?.length
            ? "quote-session"
            : "unavailable";
  const chartPreviousClose = yahooChart.previousClose ?? marketSummary?.previousClose;
  const displayMarketSummary = marketSummary
    ? { ...marketSummary, chartPoints: chartPoints.length >= 2 ? chartPoints : marketSummary.chartPoints }
    : marketSummary;
  if (displayMarketSummary) {
    rememberQuote(displayMarketSummary.symbol, displayMarketSummary.price);
  }

  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    range: selectedRange,
    selectedSymbol: displayMarketSummary?.symbol ?? selectedSymbol,
    marketSummary: displayMarketSummary,
    majorIndices,
    topGainers,
    topLosers,
    trendingStocks,
    watchlistPreview,
    chartPoints,
    chartSeries: synchronizedChartSeries,
    chartPreviousClose,
    chartSource,
  });
}
