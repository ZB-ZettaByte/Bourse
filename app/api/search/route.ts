import { NextResponse } from "next/server";

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://127.0.0.1:8000";
const FINNHUB_BASE_URL = process.env.FINNHUB_BASE_URL ?? "https://finnhub.io/api/v1";
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? "";
const LOGO_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export const dynamic = "force-dynamic";

type SearchMatch = {
  ticker: string;
  companyName: string;
  score: number;
  logo?: string;
};

type CachedLogo = {
  logo: string;
  fetchedAt: number;
};

const searchStore = globalThis as typeof globalThis & {
  __bourseSearchLogoCache?: Record<string, CachedLogo>;
};

const logoCache = searchStore.__bourseSearchLogoCache ?? {};
searchStore.__bourseSearchLogoCache = logoCache;

function cleanSymbol(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9.-]/g, "");
}

async function getCompanyLogo(ticker: string) {
  const symbol = cleanSymbol(ticker);
  if (!FINNHUB_API_KEY || !symbol) return "";

  const cached = logoCache[symbol];
  if (cached && Date.now() - cached.fetchedAt < LOGO_CACHE_TTL_MS) {
    return cached.logo;
  }

  try {
    const response = await fetch(
      `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(FINNHUB_API_KEY)}`,
      { cache: "no-store" }
    );
    if (!response.ok) return "";

    const profile = (await response.json()) as { logo?: string };
    const logo = typeof profile.logo === "string" ? profile.logo : "";
    logoCache[symbol] = { logo, fetchedAt: Date.now() };
    return logo;
  } catch {
    return "";
  }
}

async function withCompanyLogos(results: SearchMatch[]) {
  const topResults = results.slice(0, 8);
  return Promise.all(
    topResults.map(async (match) => ({
      ...match,
      ticker: cleanSymbol(match.ticker),
      logo: match.logo || (await getCompanyLogo(match.ticker)),
    }))
  );
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    const response = await fetch(`${FASTAPI_BASE_URL}/api/search?q=${encodeURIComponent(query)}`, {
      cache: "no-store",
    });
    const payload = await response.json();
    const results = Array.isArray(payload.results)
      ? await withCompanyLogos(payload.results as SearchMatch[])
      : [];

    return NextResponse.json({ ...payload, results }, { status: response.status });
  } catch {
    return NextResponse.json({ results: [], error: "Semantic search backend unavailable." }, { status: 503 });
  }
}
