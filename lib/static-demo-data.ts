import type { StockDetailData, StockNewsArticle, StockPerformancePeriod } from "@/lib/stock-detail";

export type StaticDemoStock = {
  symbol: string;
  name: string;
  exchange: string;
  logo?: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  open: number;
  high: number;
  low: number;
  chartPoints: number[];
  sector: string;
  ceo: string;
  description: string;
  marketCapitalization: number;
  peRatio: number;
  dividendYield: number;
  beta: number;
  employees: number;
  revenue: number;
  netIncome: number;
  eps: number;
};

type StaticMarketData = {
  updatedAt: string;
  range: "1D";
  selectedSymbol: string;
  marketSummary: StaticDemoStock;
  majorIndices: StaticDemoStock[];
  topGainers: StaticDemoStock[];
  topLosers: StaticDemoStock[];
  trendingStocks: StaticDemoStock[];
  watchlistPreview: StaticDemoStock[];
  chartPoints: number[];
  chartSeries: Array<{ price: number; time: number }>;
  chartPreviousClose: number;
  chartSource: "quote-session";
};

export const STATIC_DEMO_SYMBOLS = ["AAPL", "AMZN", "NVDA", "MSFT", "TSLA", "FOX", "NOK", "GOOGL"];

export const STATIC_SEARCH_SUGGESTIONS = [
  { ticker: "AAPL", companyName: "Apple Inc", score: 1, logo: "https://logo.clearbit.com/apple.com" },
  { ticker: "AMZN", companyName: "Amazon.com Inc", score: 1, logo: "https://logo.clearbit.com/amazon.com" },
  {
    ticker: "NVDA",
    companyName: "NVIDIA Corporation",
    score: 1,
    logo: "https://logo.clearbit.com/nvidia.com",
  },
  {
    ticker: "MSFT",
    companyName: "Microsoft Corporation",
    score: 1,
    logo: "https://logo.clearbit.com/microsoft.com",
  },
  { ticker: "TSLA", companyName: "Tesla Inc", score: 1, logo: "https://logo.clearbit.com/tesla.com" },
  { ticker: "FOX", companyName: "Fox Corporation", score: 1, logo: "https://logo.clearbit.com/fox.com" },
  { ticker: "NOK", companyName: "Nokia Corporation", score: 1, logo: "https://logo.clearbit.com/nokia.com" },
  { ticker: "GOOGL", companyName: "Alphabet Inc", score: 1, logo: "https://logo.clearbit.com/abc.xyz" },
];

const staticStocks: Record<string, StaticDemoStock> = {
  SPY: stock("SPY", "S&P 500 ETF", 741.25, 7.52, 1.02, "https://logo.clearbit.com/ssga.com"),
  QQQ: stock("QQQ", "Nasdaq 100 ETF", 713.15, 11.62, 1.66, "https://logo.clearbit.com/invesco.com"),
  DIA: stock("DIA", "Dow Jones ETF", 500.24, 6.27, 1.27, "https://logo.clearbit.com/ssga.com"),
  IWM: stock("IWM", "Russell 2000 ETF", 279.87, 6.88, 2.52, "https://logo.clearbit.com/ishares.com"),
  AMD: stock("AMD", "Advanced Micro Devices", 447.58, 33.54, 8.1, "https://logo.clearbit.com/amd.com"),
  TSLA: stock("TSLA", "Tesla Inc", 417.26, 13.13, 3.25, "https://logo.clearbit.com/tesla.com"),
  AMZN: stock("AMZN", "Amazon.com Inc", 265.01, 5.68, 2.19, "https://logo.clearbit.com/amazon.com"),
  NVDA: stock("NVDA", "NVIDIA Corporation", 223.47, 2.87, 1.3, "https://logo.clearbit.com/nvidia.com"),
  AAPL: stock("AAPL", "Apple Inc", 302.25, 3.28, 1.1, "https://logo.clearbit.com/apple.com"),
  MSFT: stock("MSFT", "Microsoft Corporation", 486.4, 4.34, 0.9, "https://logo.clearbit.com/microsoft.com"),
  FOX: stock("FOX", "Fox Corporation", 52.18, 0.42, 0.81, "https://logo.clearbit.com/fox.com"),
  NOK: stock("NOK", "Nokia Corporation", 4.86, 0.06, 1.25, "https://logo.clearbit.com/nokia.com"),
  GOOGL: stock("GOOGL", "Alphabet Inc", 175.63, 1.96, 1.13, "https://logo.clearbit.com/abc.xyz"),
};

const details: Partial<Record<string, Partial<StaticDemoStock>>> = {
  AAPL: {
    sector: "Consumer Electronics",
    ceo: "Tim Cook",
    description:
      "Apple designs iPhone, Mac, iPad, wearables, and services. This demo view shows a static snapshot of price action, company context, and news.",
  },
  AMZN: {
    sector: "Internet Retail",
    ceo: "Andy Jassy",
    description:
      "Amazon operates ecommerce, cloud infrastructure, advertising, logistics, and subscription services across global markets.",
  },
  NVDA: {
    sector: "Semiconductors",
    ceo: "Jensen Huang",
    description:
      "NVIDIA builds accelerated computing platforms, GPUs, networking products, and AI infrastructure used by data centers and developers.",
  },
  MSFT: {
    sector: "Software",
    ceo: "Satya Nadella",
    description:
      "Microsoft provides cloud services, productivity software, operating systems, developer tools, gaming, and AI products.",
  },
  TSLA: {
    sector: "Automobiles",
    ceo: "Elon Musk",
    description:
      "Tesla designs electric vehicles, energy storage systems, charging infrastructure, and software-driven mobility products.",
  },
  FOX: {
    sector: "Media",
    ceo: "Lachlan Murdoch",
    description:
      "Fox Corporation operates news, sports, and entertainment programming across broadcast, cable, and digital media channels.",
  },
  NOK: {
    sector: "Communications Equipment",
    ceo: "Pekka Lundmark",
    description:
      "Nokia provides network infrastructure, mobile network equipment, cloud networking software, and technology licensing.",
  },
  GOOGL: {
    sector: "Internet Content",
    ceo: "Sundar Pichai",
    description:
      "Alphabet operates Google Search, YouTube, Cloud, Android, advertising platforms, and long-term technology initiatives.",
  },
};

for (const symbol of Object.keys(details)) {
  staticStocks[symbol] = { ...staticStocks[symbol], ...details[symbol] };
}

export function getStaticMarketData(selectedSymbol = "SPY"): StaticMarketData {
  const selected = staticStocks[selectedSymbol] ?? staticStocks.SPY;
  const proxies = ["SPY", "QQQ", "DIA", "IWM"].map((symbol) => staticStocks[symbol]);
  const gainers = ["AMD", "TSLA", "AMZN", "NVDA", "AAPL"].map((symbol) => staticStocks[symbol]);
  const trending = ["AMD", "TSLA", "IWM", "AMZN", "QQQ", "NVDA"].map((symbol) => staticStocks[symbol]);
  const chartSeries = buildSeries(selected);

  return {
    updatedAt: "Static demo",
    range: "1D",
    selectedSymbol: selected.symbol,
    marketSummary: selected,
    majorIndices: proxies,
    topGainers: gainers,
    topLosers: [],
    trendingStocks: trending,
    watchlistPreview: ["AAPL", "AMZN", "NVDA", "MSFT"].map((symbol) => staticStocks[symbol]),
    chartPoints: selected.chartPoints,
    chartSeries,
    chartPreviousClose: selected.previousClose,
    chartSource: "quote-session",
  };
}

export function getStaticStockDetail(symbolValue: string): StockDetailData | null {
  const symbol = symbolValue.trim().toUpperCase();
  const item = staticStocks[symbol];
  if (!item || !STATIC_DEMO_SYMBOLS.includes(symbol)) return null;

  return {
    symbol,
    quote: {
      c: item.price,
      d: item.change,
      dp: item.changePercent,
      h: item.high,
      l: item.low,
      o: item.open,
      pc: item.previousClose,
      t: Math.floor(Date.now() / 1000),
    },
    profile: {
      name: item.name,
      ticker: item.symbol,
      exchange: item.exchange,
      logo: item.logo,
      finnhubIndustry: item.sector,
      description: item.description,
      marketCapitalization: item.marketCapitalization,
      employeeTotal: item.employees,
      ceo: item.ceo,
      weburl: `https://www.${item.symbol.toLowerCase()}.com`,
      city: "Demo City",
      country: "US",
      ipo: "2010-01-01",
    },
    metrics: {
      beta: item.beta,
      dividendYieldIndicatedAnnual: item.dividendYield,
      epsBasicExclExtraItemsTTM: item.eps,
      marketCapitalization: item.marketCapitalization,
      peBasicExclExtraTTM: item.peRatio,
    },
    financials: {
      revenueFY: item.revenue,
      netIncomeFY: item.netIncome,
      sharesFloat: 1_250_000_000,
      employeesFY: item.employees,
      revenuePerEmployee: item.revenue / item.employees,
      netIncomePerEmployee: item.netIncome / item.employees,
      dataNotes: {},
    },
    earnings: [
      {
        actual: item.eps,
        estimate: item.eps * 0.96,
        period: "2026-03-31",
        quarter: 1,
        surprise: item.eps * 0.04,
        surprisePercent: 4.1,
        symbol,
        year: 2026,
        revenueActual: item.revenue / 4,
        revenueEstimate: item.revenue / 4.1,
      },
    ],
    performance: performanceRows(item.changePercent),
    news: demoNews(item),
  };
}

export function getStaticDemoSymbolsText() {
  return STATIC_DEMO_SYMBOLS.join(", ");
}

function stock(
  symbol: string,
  name: string,
  price: number,
  change: number,
  changePercent: number,
  logo?: string
) {
  const previousClose = price - change;
  const open = previousClose * 0.995;
  const high = Math.max(price, previousClose) * 1.012;
  const low = Math.min(price, previousClose) * 0.992;
  const chartPoints = intraday(previousClose, price);

  return {
    symbol,
    name,
    exchange: symbol.length <= 3 ? "NYSE ARCA" : "NASDAQ NMS",
    logo,
    price,
    change,
    changePercent,
    previousClose,
    open,
    high,
    low,
    chartPoints,
    sector: "Technology",
    ceo: "Demo CEO",
    description: `${name} is included in the Bourse static demo dataset for GitHub Pages.`,
    marketCapitalization: price * 1_000_000,
    peRatio: 28.4,
    dividendYield: 0.52,
    beta: 1.18,
    employees: 120_000,
    revenue: price * 1_000_000_000,
    netIncome: price * 180_000_000,
  };
}

function intraday(start: number, end: number) {
  return Array.from({ length: 48 }).map((_, index) => {
    const progress = index / 47;
    const trend = start + (end - start) * progress;
    const wave = Math.sin(progress * Math.PI * 4) * Math.abs(end - start) * 0.18;
    const micro = Math.sin(progress * Math.PI * 13) * Math.abs(end - start) * 0.06;
    return Number((trend + wave + micro).toFixed(2));
  });
}

function buildSeries(stockItem: StaticDemoStock) {
  const start = new Date();
  start.setHours(9, 30, 0, 0);
  return stockItem.chartPoints.map((price, index) => ({
    price,
    time: Math.floor((start.getTime() + index * 5 * 60 * 1000) / 1000),
  }));
}

function performanceRows(changePercent: number) {
  const labels: StockPerformancePeriod[] = [
    "1 day",
    "5 days",
    "1 month",
    "6 months",
    "Year to date",
    "1 year",
    "5 years",
  ];
  return labels.map((label, index) => ({
    label,
    changePercent: Number((changePercent * (index + 1) * 0.8).toFixed(2)),
  }));
}

function demoNews(stockItem: StaticDemoStock): StockNewsArticle[] {
  return [
    {
      id: `${stockItem.symbol}-1`,
      headline: `${stockItem.name} holds steady as investors review latest market momentum`,
      source: "Bourse Demo",
      datetime: 1779393600,
      url: "#",
      summary: "Static demo headline showing how company news appears when the backend is offline.",
    },
    {
      id: `${stockItem.symbol}-2`,
      headline: `${stockItem.symbol} gains attention in portfolio research workflows`,
      source: "Market Desk",
      datetime: 1779386400,
      url: "#",
      summary: "Demo story for the stock detail page news grid.",
    },
    {
      id: `${stockItem.symbol}-3`,
      headline: `Analysts watch ${stockItem.name} as sector trends remain active`,
      source: "Research Wire",
      datetime: 1779379200,
      url: "#",
      summary: "Placeholder news item used only for the static GitHub Pages demo.",
    },
  ];
}
