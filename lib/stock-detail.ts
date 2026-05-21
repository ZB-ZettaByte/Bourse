const FINNHUB_BASE_URL = process.env.FINNHUB_BASE_URL ?? "https://finnhub.io/api/v1";
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? "";

export type StockQuote = {
  c?: number;
  d?: number;
  dp?: number;
  h?: number;
  l?: number;
  o?: number;
  pc?: number;
};

export type StockProfile = {
  country?: string;
  currency?: string;
  exchange?: string;
  finnhubIndustry?: string;
  ipo?: string;
  logo?: string;
  marketCapitalization?: number;
  name?: string;
  shareOutstanding?: number;
  ticker?: string;
  weburl?: string;
};

export type StockMetrics = {
  metric?: Record<string, number>;
};

export type StockNewsArticle = {
  id?: number;
  headline?: string;
  source?: string;
  datetime?: number;
  url?: string;
};

export type StockDetailData = {
  symbol: string;
  quote: StockQuote;
  profile: StockProfile;
  metrics: StockMetrics["metric"];
  news: StockNewsArticle[];
};

function tokenParam() {
  if (!FINNHUB_API_KEY) {
    throw new Error("FINNHUB API key is not configured.");
  }
  return `token=${encodeURIComponent(FINNHUB_API_KEY)}`;
}

async function fetchFinnhub<T>(path: string, revalidate = 60): Promise<T> {
  const separator = path.includes("?") ? "&" : "?";
  const response = await fetch(`${FINNHUB_BASE_URL}${path}${separator}${tokenParam()}`, {
    next: { revalidate },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Finnhub request failed ${response.status}: ${text}`);
  }

  return (await response.json()) as T;
}

function isoDate(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

export async function getStockDetail(symbolValue: string): Promise<StockDetailData> {
  const symbol = symbolValue.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, "");
  const to = isoDate(0);
  const from = isoDate(30);

  const [quote, profile, metrics, news] = await Promise.all([
    fetchFinnhub<StockQuote>(`/quote?symbol=${encodeURIComponent(symbol)}`, 30),
    fetchFinnhub<StockProfile>(`/stock/profile2?symbol=${encodeURIComponent(symbol)}`, 3600),
    fetchFinnhub<StockMetrics>(`/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all`, 3600).catch(() => ({ metric: {} })),
    fetchFinnhub<StockNewsArticle[]>(
      `/company-news?symbol=${encodeURIComponent(symbol)}&from=${from}&to=${to}`,
      300
    ).catch(() => []),
  ]);

  return {
    symbol,
    quote,
    profile,
    metrics: metrics.metric ?? {},
    news: (Array.isArray(news) ? news : [])
      .filter((article) => article.headline && article.url)
      .sort((a, b) => Number(b.datetime ?? 0) - Number(a.datetime ?? 0))
      .slice(0, 8),
  };
}

export function finiteNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}
