const FINNHUB_BASE_URL = process.env.FINNHUB_BASE_URL ?? "https://finnhub.io/api/v1";
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? "";
const YAHOO_QUOTE_SUMMARY_BASE_URL = "https://query1.finance.yahoo.com/v10/finance/quoteSummary";
const YAHOO_SEARCH_URL = "https://query1.finance.yahoo.com/v1/finance/search";
const TRADINGVIEW_SYMBOL_URL = "https://scanner.tradingview.com/symbol";
const WIKIPEDIA_API_URL = "https://en.wikipedia.org/w/api.php";
const WIKIPEDIA_SUMMARY_URL = "https://en.wikipedia.org/api/rest_v1/page/summary";
const WIKIDATA_SPARQL_URL = "https://query.wikidata.org/sparql";

export type StockQuote = {
  c?: number;
  d?: number;
  dp?: number;
  h?: number;
  l?: number;
  o?: number;
  pc?: number;
  t?: number;
};

export type StockProfile = {
  city?: string;
  country?: string;
  description?: string;
  currency?: string;
  employeeTotal?: number;
  exchange?: string;
  finnhubIndustry?: string;
  ipo?: string;
  logo?: string;
  marketCapitalization?: number;
  name?: string;
  phone?: string;
  shareOutstanding?: number;
  ticker?: string;
  weburl?: string;
  ceo?: string;
};

export type StockMetrics = {
  metric?: Record<string, number>;
};

export type StockNewsArticle = {
  id?: number | string;
  headline?: string;
  source?: string;
  datetime?: number;
  url?: string;
  summary?: string;
  relevanceScore?: number;
};

export type StockFinancials = {
  revenueFY?: number;
  netIncomeFY?: number;
  sharesFloat?: number;
  employeesFY?: number;
  revenuePerEmployee?: number;
  netIncomePerEmployee?: number;
  dataNotes?: Partial<
    Record<
      | "revenueFY"
      | "netIncomeFY"
      | "sharesFloat"
      | "employeesFY"
      | "revenuePerEmployee"
      | "netIncomePerEmployee",
      string
    >
  >;
};

type StockExecutive = {
  name?: string;
  position?: string;
  title?: string;
};

type StockExecutiveResponse = {
  executive?: StockExecutive[];
};

type YahooProfileResponse = {
  quoteSummary?: {
    result?: Array<{
      assetProfile?: {
        longBusinessSummary?: string;
        fullTimeEmployees?: number;
        companyOfficers?: Array<{
          name?: string;
          title?: string;
        }>;
      };
      defaultKeyStatistics?: Record<string, YahooValue>;
      financialData?: Record<string, YahooValue>;
      incomeStatementHistory?: {
        incomeStatementHistory?: Array<Record<string, YahooValue>>;
      };
      price?: Record<string, YahooValue>;
    }>;
  };
};

type YahooNewsResponse = {
  news?: Array<{
    uuid?: string;
    title?: string;
    publisher?: string;
    link?: string;
    providerPublishTime?: number;
    summary?: string;
  }>;
};

type YahooValue =
  | {
      raw?: number;
      fmt?: string;
      longFmt?: string;
    }
  | number
  | string
  | null
  | undefined;

type TradingViewMetricsResponse = {
  total_revenue_fy?: number | null;
  net_income_fy?: number | null;
  float_shares_outstanding?: number | null;
  number_of_employees?: number | null;
  current_employee_count?: number | null;
};

export type StockEarnings = {
  actual?: number;
  estimate?: number;
  period?: string;
  quarter?: number;
  surprise?: number;
  surprisePercent?: number;
  symbol?: string;
  year?: number;
  revenueActual?: number;
  revenueEstimate?: number;
};

export type StockPerformancePeriod =
  | "1 day"
  | "5 days"
  | "1 month"
  | "6 months"
  | "Year to date"
  | "1 year"
  | "5 years";

export type StockPerformance = {
  label: StockPerformancePeriod;
  changePercent?: number;
};

export type StockDetailData = {
  symbol: string;
  quote: StockQuote;
  profile: StockProfile;
  metrics: StockMetrics["metric"];
  financials: StockFinancials;
  earnings: StockEarnings[];
  performance: StockPerformance[];
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
    signal: AbortSignal.timeout(8000),
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

function unixSeconds(date: Date) {
  return Math.floor(date.getTime() / 1000);
}

function performanceStart(label: StockPerformancePeriod) {
  const now = new Date();
  const start = new Date(now);

  if (label === "1 day") start.setDate(now.getDate() - 1);
  if (label === "5 days") start.setDate(now.getDate() - 5);
  if (label === "1 month") start.setMonth(now.getMonth() - 1);
  if (label === "6 months") start.setMonth(now.getMonth() - 6);
  if (label === "Year to date") return new Date(now.getFullYear(), 0, 1);
  if (label === "1 year") start.setFullYear(now.getFullYear() - 1);
  if (label === "5 years") start.setFullYear(now.getFullYear() - 5);

  return start;
}

type FinnhubCandles = {
  c?: number[];
  s?: string;
  t?: number[];
};

async function getPerformance(symbol: string, current?: number): Promise<StockPerformance[]> {
  const labels: StockPerformancePeriod[] = [
    "1 day",
    "5 days",
    "1 month",
    "6 months",
    "Year to date",
    "1 year",
    "5 years",
  ];
  const to = Math.floor(Date.now() / 1000);

  const rows = await Promise.all(
    labels.map(async (label) => {
      try {
        const candles = await fetchFinnhub<FinnhubCandles>(
          `/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=D&from=${unixSeconds(performanceStart(label))}&to=${to}`,
          300
        );
        const closes = Array.isArray(candles.c)
          ? candles.c.filter((value) => Number.isFinite(Number(value)) && Number(value) > 0)
          : [];
        const first = closes[0];
        const last = current ?? closes[closes.length - 1];
        const changePercent = first && last ? ((last - first) / first) * 100 : undefined;
        return { label, changePercent };
      } catch {
        return { label };
      }
    })
  );

  return rows;
}

function decodeHtml(value: string) {
  return value
    .replace(/\\u002F/g, "/")
    .replace(/\\"/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function cleanDescription(value: string) {
  return decodeHtml(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function yahooRaw(value: YahooValue) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const numeric = Number(value.replace(/,/g, ""));
    return Number.isFinite(numeric) ? numeric : undefined;
  }
  if (value && typeof value === "object" && typeof value.raw === "number" && Number.isFinite(value.raw))
    return value.raw;
  return undefined;
}

function firstFinite(...values: Array<number | undefined>) {
  return values.find((value) => typeof value === "number" && Number.isFinite(value));
}

function withNote(
  notes: StockFinancials["dataNotes"],
  key: keyof NonNullable<StockFinancials["dataNotes"]>,
  found: boolean,
  source: string
) {
  if (found) return;
  notes[key] = `Could not find ${source}.`;
}

function metricFrom(metrics: Record<string, number>, keys: string[]) {
  return firstFinite(...keys.map((key) => finiteNumber(metrics[key])));
}

function primaryTradingViewExchange(profile: StockProfile) {
  const exchange = `${profile.exchange ?? ""}`.toUpperCase();
  if (
    exchange.includes("NASDAQ") ||
    exchange.includes("NMS") ||
    exchange.includes("NCM") ||
    exchange.includes("NGM")
  )
    return "NASDAQ";
  if (exchange.includes("NYSE") || exchange.includes("NEW YORK STOCK EXCHANGE")) return "NYSE";
  if (exchange.includes("AMEX")) return "AMEX";
  return "NASDAQ";
}

function tradingViewExchangeCandidates(profile: StockProfile) {
  const primary = primaryTradingViewExchange(profile);
  return Array.from(new Set([primary, "NASDAQ", "NYSE", "AMEX", "NYSEARCA", "OTC"]));
}

function tradingViewPageUrl(exchange: string, symbol: string) {
  return `https://www.tradingview.com/symbols/${exchange}-${encodeURIComponent(symbol)}/`;
}

async function getTradingViewCeo(symbol: string, profile: StockProfile) {
  for (const exchange of tradingViewExchangeCandidates(profile)) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const response = await fetch(tradingViewPageUrl(exchange, symbol), {
        headers: {
          "User-Agent": "Mozilla/5.0 Bourse stock profile enrichment",
          Accept: "text/html",
        },
        signal: controller.signal,
        next: { revalidate: 86400 },
      });
      clearTimeout(timeoutId);

      if (!response.ok) continue;

      const html = await response.text();
      const patterns = [
        /"CEO"\s*:\s*"([^"]+)"/i,
        /"ceo"\s*:\s*"([^"]+)"/i,
        /Chief Executive Officer[^<]{0,120}<[^>]+>([^<]+)/i,
        /CEO[^<]{0,120}<[^>]+>([^<]+)/i,
      ];

      for (const pattern of patterns) {
        const match = html.match(pattern);
        const value = match?.[1] ? decodeHtml(match[1]) : "";
        if (value && !/CEO|Chief Executive Officer|TradingView/i.test(value)) return value;
      }
    } catch {
      // Try the next likely TradingView exchange for this ticker.
    }
  }

  return undefined;
}

async function getWikidataCeoFromTitle(title: string) {
  const summaryResponse = await fetch(`${WIKIPEDIA_SUMMARY_URL}/${encodeURIComponent(title)}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 Bourse company profile enrichment",
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(3500),
    next: { revalidate: 86400 },
  });
  if (!summaryResponse.ok) return undefined;

  const summaryPayload = (await summaryResponse.json()) as { wikibase_item?: string };
  const entityId = summaryPayload.wikibase_item;
  if (!entityId || !/^Q\d+$/.test(entityId)) return undefined;

  const sparql = `SELECT ?ceoLabel WHERE { wd:${entityId} wdt:P169 ?ceo. SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } } LIMIT 1`;
  const ceoResponse = await fetch(`${WIKIDATA_SPARQL_URL}?query=${encodeURIComponent(sparql)}&format=json`, {
    headers: {
      "User-Agent": "Mozilla/5.0 Bourse company profile enrichment",
      Accept: "application/sparql-results+json",
    },
    signal: AbortSignal.timeout(3500),
    next: { revalidate: 86400 },
  });
  if (!ceoResponse.ok) return undefined;

  const ceoPayload = (await ceoResponse.json()) as {
    results?: { bindings?: Array<{ ceoLabel?: { value?: string } }> };
  };
  return ceoPayload.results?.bindings?.[0]?.ceoLabel?.value;
}

async function getWikidataCeo(symbol: string, profile: StockProfile) {
  try {
    const searchTerm = profile.name ?? symbol;
    const searchResponse = await fetch(
      `${WIKIPEDIA_API_URL}?action=query&list=search&srsearch=${encodeURIComponent(searchTerm)}&format=json&origin=*`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 Bourse company profile enrichment",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(3500),
        next: { revalidate: 86400 },
      }
    );
    if (!searchResponse.ok) return undefined;

    const searchPayload = (await searchResponse.json()) as {
      query?: { search?: Array<{ title?: string }> };
    };
    const title = searchPayload.query?.search?.find((item) => item.title)?.title;
    return (
      (title ? await getWikidataCeoFromTitle(title) : undefined) ?? (await getWikidataCeoFromTitle(symbol))
    );
  } catch {
    return undefined;
  }
}

async function getYahooProfile(symbol: string) {
  try {
    const modules = [
      "assetProfile",
      "defaultKeyStatistics",
      "financialData",
      "incomeStatementHistory",
      "price",
    ].join(",");
    const response = await fetch(
      `${YAHOO_QUOTE_SUMMARY_BASE_URL}/${encodeURIComponent(symbol)}?modules=${modules}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 Bourse stock profile enrichment",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(3500),
        next: { revalidate: 86400 },
      }
    );

    if (!response.ok) return undefined;

    const payload = (await response.json()) as YahooProfileResponse;
    return payload.quoteSummary?.result?.[0];
  } catch {
    return undefined;
  }
}

async function getExternalDescription(symbol: string, profile: StockProfile) {
  const yahooProfile = await getYahooProfile(symbol);
  const yahooDescription = yahooProfile?.assetProfile?.longBusinessSummary
    ? cleanDescription(yahooProfile.assetProfile.longBusinessSummary)
    : "";
  if (yahooDescription) return yahooDescription;

  for (const exchange of tradingViewExchangeCandidates(profile)) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const response = await fetch(tradingViewPageUrl(exchange, symbol), {
        headers: {
          "User-Agent": "Mozilla/5.0 Bourse stock profile enrichment",
          Accept: "text/html",
        },
        signal: controller.signal,
        next: { revalidate: 86400 },
      });
      clearTimeout(timeoutId);

      if (!response.ok) continue;

      const html = await response.text();
      const patterns = [
        /"description"\s*:\s*"([^"]{180,2500})"/i,
        /<meta\s+name="description"\s+content="([^"]{120,1200})"/i,
        /<meta\s+property="og:description"\s+content="([^"]{120,1200})"/i,
      ];

      for (const pattern of patterns) {
        const match = html.match(pattern);
        const value = match?.[1] ? cleanDescription(match[1]) : "";
        if (value && !/Stock Chart|TradingView|stock price/i.test(value)) return value;
      }
    } catch {
      // Try the next likely TradingView exchange for this ticker.
    }
  }

  return undefined;
}

async function getCeo(symbol: string, profile: StockProfile) {
  if (profile.ceo) return profile.ceo;

  const yahooProfile = await getYahooProfile(symbol);
  const yahooCeo = yahooProfile?.assetProfile?.companyOfficers?.find((person) => {
    const title = `${person.title ?? ""}`.toLowerCase();
    return title.includes("chief executive officer") || /\bceo\b/.test(title);
  });
  if (yahooCeo?.name) return yahooCeo.name;

  const executives = await fetchFinnhub<StockExecutiveResponse>(
    `/stock/executive?symbol=${encodeURIComponent(symbol)}`,
    86400
  ).catch(() => ({ executive: [] }));
  const ceo = executives.executive?.find((person) => {
    const title = `${person.position ?? person.title ?? ""}`.toLowerCase();
    return title.includes("chief executive officer") || /\bceo\b/.test(title);
  });

  return ceo?.name ?? (await getWikidataCeo(symbol, profile)) ?? (await getTradingViewCeo(symbol, profile));
}

async function getTradingViewFinancials(symbol: string, profile: StockProfile) {
  const fields = [
    "total_revenue_fy",
    "net_income_fy",
    "float_shares_outstanding",
    "number_of_employees",
    "current_employee_count",
  ].join(",");

  for (const exchange of tradingViewExchangeCandidates(profile)) {
    try {
      const response = await fetch(
        `${TRADINGVIEW_SYMBOL_URL}?symbol=${encodeURIComponent(`${exchange}:${symbol}`)}&fields=${encodeURIComponent(fields)}`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 Bourse stock fundamentals enrichment",
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(3500),
          next: { revalidate: 86400 },
        }
      );

      if (!response.ok) continue;

      const financials = (await response.json()) as TradingViewMetricsResponse;
      if (
        financials.total_revenue_fy ||
        financials.net_income_fy ||
        financials.float_shares_outstanding ||
        financials.number_of_employees ||
        financials.current_employee_count
      ) {
        return financials;
      }
    } catch {
      // Try the next likely TradingView exchange for this ticker.
    }
  }

  return {};
}

async function getFinancialFallbacks(
  symbol: string,
  profile: StockProfile,
  metrics: Record<string, number>
): Promise<StockFinancials> {
  const [yahooProfile, tradingViewFinancials] = await Promise.all([
    getYahooProfile(symbol).catch(() => undefined),
    getTradingViewFinancials(symbol, profile).catch(() => ({})),
  ]);
  const annualStatement = yahooProfile?.incomeStatementHistory?.incomeStatementHistory?.[0] ?? {};
  const notes: StockFinancials["dataNotes"] = {};

  const revenueFY = firstFinite(
    metricFrom(metrics, ["revenueAnnual", "revenueFY", "totalRevenueAnnual"]),
    yahooRaw(annualStatement.totalRevenue),
    yahooRaw(yahooProfile?.financialData?.totalRevenue),
    finiteNumber(tradingViewFinancials.total_revenue_fy)
  );
  const netIncomeFY = firstFinite(
    metricFrom(metrics, ["netIncomeAnnual", "netIncomeFY", "netIncome"]),
    yahooRaw(annualStatement.netIncome),
    finiteNumber(tradingViewFinancials.net_income_fy)
  );
  const sharesFloat = firstFinite(
    metricFrom(metrics, ["floatShares", "shareFloat", "sharesFloat"]),
    yahooRaw(yahooProfile?.defaultKeyStatistics?.floatShares),
    yahooRaw(yahooProfile?.defaultKeyStatistics?.sharesOutstanding),
    finiteNumber(tradingViewFinancials.float_shares_outstanding)
  );
  const employeesFY = firstFinite(
    finiteNumber(profile.employeeTotal),
    yahooRaw(yahooProfile?.assetProfile?.fullTimeEmployees),
    finiteNumber(tradingViewFinancials.number_of_employees),
    finiteNumber(tradingViewFinancials.current_employee_count)
  );
  const revenuePerEmployee = employeesFY && revenueFY ? revenueFY / employeesFY : undefined;
  const netIncomePerEmployee = employeesFY && netIncomeFY ? netIncomeFY / employeesFY : undefined;

  withNote(
    notes,
    "revenueFY",
    revenueFY !== undefined,
    "annual revenue from Finnhub, Yahoo Finance, or TradingView"
  );
  withNote(
    notes,
    "netIncomeFY",
    netIncomeFY !== undefined,
    "annual net income from Finnhub, Yahoo Finance, or TradingView"
  );
  withNote(
    notes,
    "sharesFloat",
    sharesFloat !== undefined,
    "shares float from Finnhub, Yahoo Finance, or TradingView"
  );
  withNote(
    notes,
    "employeesFY",
    employeesFY !== undefined,
    "employee count from Finnhub, Yahoo Finance, or TradingView"
  );
  withNote(notes, "revenuePerEmployee", revenuePerEmployee !== undefined, "revenue per employee inputs");
  withNote(
    notes,
    "netIncomePerEmployee",
    netIncomePerEmployee !== undefined,
    "net income per employee inputs"
  );

  return {
    revenueFY,
    netIncomeFY,
    sharesFloat,
    employeesFY,
    revenuePerEmployee,
    netIncomePerEmployee,
    dataNotes: notes,
  };
}

async function getYahooNews(symbol: string, companyName?: string) {
  try {
    const query = encodeURIComponent(companyName ? `${symbol} ${companyName}` : symbol);
    const response = await fetch(`${YAHOO_SEARCH_URL}?q=${query}&quotesCount=0&newsCount=40`, {
      headers: {
        "User-Agent": "Mozilla/5.0 Bourse stock news",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(3500),
      next: { revalidate: 180 },
    });

    if (!response.ok) return [];

    const payload = (await response.json()) as YahooNewsResponse;
    return (payload.news ?? [])
      .filter((article) => article.title && article.link)
      .map((article) => ({
        id: article.uuid,
        headline: article.title,
        source: article.publisher ?? "Yahoo",
        datetime: article.providerPublishTime,
        url: article.link,
        summary: article.summary ? cleanDescription(article.summary) : undefined,
      })) satisfies StockNewsArticle[];
  } catch {
    return [];
  }
}

function normalizedTitle(value?: string) {
  return cleanDescription(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function newsRelevance(article: StockNewsArticle, symbol: string, companyName?: string) {
  const headline = normalizedTitle(article.headline);
  const summary = normalizedTitle(article.summary);
  const source = normalizedTitle(article.source);
  const text = `${headline} ${summary}`;
  const cleanSymbol = symbol.toLowerCase();
  const companyTokens = normalizedTitle(companyName)
    .split(" ")
    .filter(
      (token) =>
        token.length > 2 && !["inc", "corp", "corporation", "company", "com", "class"].includes(token)
    );
  const mentionsSymbol = new RegExp(`\\b${cleanSymbol}\\b`, "i").test(text);
  const tokenHits = companyTokens.filter((token) => text.includes(token)).length;
  const trustedSource =
    /yahoo|reuters|bloomberg|marketwatch|benzinga|investor|seeking|zacks|cnbc|barron|motley|fool|globenewswire|businesswire/.test(
      source
    );
  const ageHours = article.datetime ? Math.max(0, Date.now() / 1000 - article.datetime) / 3600 : 240;
  const recency = Math.max(0, 24 - Math.min(ageHours, 24));

  return (mentionsSymbol ? 8 : 0) + tokenHits * 5 + (trustedSource ? 2 : 0) + recency / 12;
}

function mergeNews(symbol: string, companyName: string | undefined, ...groups: StockNewsArticle[][]) {
  const byUrl = new Map<string, StockNewsArticle>();
  const byTitle = new Map<string, string>();

  for (const article of groups.flat()) {
    if (!article.headline || !article.url) continue;
    const titleKey = normalizedTitle(article.headline);
    const canonicalTitle = byTitle.get(titleKey);
    const key = canonicalTitle ?? article.url;
    const relevanceScore = newsRelevance(article, symbol, companyName);
    if (!canonicalTitle) byTitle.set(titleKey, key);
    const existing = byUrl.get(key);
    if (
      !existing ||
      relevanceScore > Number(existing.relevanceScore ?? 0) ||
      Number(article.datetime ?? 0) > Number(existing.datetime ?? 0)
    ) {
      byUrl.set(key, { ...article, relevanceScore });
    }
  }

  const ranked = [...byUrl.values()].sort(
    (a, b) =>
      Number(b.relevanceScore ?? 0) - Number(a.relevanceScore ?? 0) ||
      Number(b.datetime ?? 0) - Number(a.datetime ?? 0)
  );
  const relevant = ranked.filter((article) => Number(article.relevanceScore ?? 0) >= 2);
  return relevant.length >= 8 ? relevant : ranked;
}

export async function getStockNews(symbolValue: string) {
  const symbol = symbolValue
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9.-]/g, "");
  const to = isoDate(0);
  const from = isoDate(30);
  const profile = await fetchFinnhub<StockProfile>(
    `/stock/profile2?symbol=${encodeURIComponent(symbol)}`,
    3600
  ).catch(() => ({}));
  const [finnhubNews, yahooNews] = await Promise.all([
    fetchFinnhub<StockNewsArticle[]>(
      `/company-news?symbol=${encodeURIComponent(symbol)}&from=${from}&to=${to}`,
      300
    ).catch(() => []),
    getYahooNews(symbol, profile.name).catch(() => []),
  ]);

  return mergeNews(symbol, profile.name, yahooNews, Array.isArray(finnhubNews) ? finnhubNews : []).slice(
    0,
    20
  );
}

export async function getStockFinancials(symbolValue: string) {
  const symbol = symbolValue
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9.-]/g, "");
  const [profile, metrics] = await Promise.all([
    fetchFinnhub<StockProfile>(`/stock/profile2?symbol=${encodeURIComponent(symbol)}`, 3600).catch(() => ({
      ticker: symbol,
    })),
    fetchFinnhub<StockMetrics>(`/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all`, 3600).catch(
      () => ({ metric: {} })
    ),
  ]);
  return getFinancialFallbacks(symbol, profile, metrics.metric ?? {});
}

export async function getStockDetail(symbolValue: string): Promise<StockDetailData> {
  const symbol = symbolValue
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9.-]/g, "");
  const to = isoDate(0);
  const from = isoDate(30);

  const [quote, profile, metrics, earnings, news] = await Promise.all([
    fetchFinnhub<StockQuote>(`/quote?symbol=${encodeURIComponent(symbol)}`, 30).catch(() => ({})),
    fetchFinnhub<StockProfile>(`/stock/profile2?symbol=${encodeURIComponent(symbol)}`, 3600).catch(() => ({
      ticker: symbol,
    })),
    fetchFinnhub<StockMetrics>(`/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all`, 3600).catch(
      () => ({ metric: {} })
    ),
    fetchFinnhub<StockEarnings[]>(`/stock/earnings?symbol=${encodeURIComponent(symbol)}`, 3600).catch(
      () => []
    ),
    fetchFinnhub<StockNewsArticle[]>(
      `/company-news?symbol=${encodeURIComponent(symbol)}&from=${from}&to=${to}`,
      300
    ).catch(() => []),
  ]);
  const current = finiteNumber(quote.c);
  const metricPayload = metrics.metric ?? {};
  const [performance, ceo, description, yahooNews, financials] = await Promise.all([
    getPerformance(symbol, current).catch(() => []),
    getCeo(symbol, profile).catch(() => undefined),
    getExternalDescription(symbol, profile).catch(() => undefined),
    getYahooNews(symbol, profile.name).catch(() => []),
    getFinancialFallbacks(symbol, profile, metricPayload).catch(() => ({ dataNotes: {} })),
  ]);
  const enrichedProfile = {
    ...profile,
    ...(ceo ? { ceo } : {}),
    ...(description ? { description } : {}),
    ...(financials.employeesFY ? { employeeTotal: financials.employeesFY } : {}),
  };
  const finnhubNews = Array.isArray(news) ? news : [];

  return {
    symbol,
    quote,
    profile: enrichedProfile,
    metrics: metricPayload,
    financials,
    earnings: (Array.isArray(earnings) ? earnings : []).sort((a, b) =>
      String(b.period ?? "").localeCompare(String(a.period ?? ""))
    ),
    performance,
    news: mergeNews(symbol, profile.name, yahooNews, finnhubNews).slice(0, 20),
  };
}

export function finiteNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}
