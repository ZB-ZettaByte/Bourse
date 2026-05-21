"use client";

import { Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { KeyboardEvent, useEffect, useRef, useState } from "react";

type SearchMatch = {
  ticker: string;
  companyName: string;
  score: number;
  logo?: string;
};

export default function SemanticStockSearch({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const showDropdown = isFocused && (query.trim().length > 0 || matches.length > 0);

  useEffect(() => {
    const trimmed = query.trim();

    abortRef.current?.abort();

    if (!trimmed) {
      setMatches([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await response.json()) as { results?: SearchMatch[] };
        setMatches(Array.isArray(payload.results) ? payload.results.slice(0, 8) : []);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setMatches([]);
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query]);

  function openMatch(match?: SearchMatch) {
    if (!match?.ticker) return;
    const ticker = match.ticker.toUpperCase();
    setQuery("");
    setMatches([]);
    setIsFocused(false);
    router.push(`/stock/${ticker}`);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      openMatch(matches[0]);
    }
    if (event.key === "Escape") {
      setIsFocused(false);
    }
  }

  return (
    <div className={`relative w-full transition-all duration-300 ${className}`}>
      <div className="flex h-11 items-center gap-3 rounded-full border border-green-500/30 bg-white/5 px-4 text-white/80 transition-colors focus-within:border-green-500/60 focus-within:bg-white/10">
        <Search className="size-4 shrink-0 text-teal-300" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => window.setTimeout(() => setIsFocused(false), 140)}
          onKeyDown={handleKeyDown}
          placeholder="Search stocks naturally"
          className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/40"
        />
        {isLoading && <Loader2 className="size-4 shrink-0 animate-spin text-white/45" />}
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-lg border border-white/10 bg-black/95 shadow-2xl shadow-black/40 backdrop-blur-xl">
          {matches.length > 0 ? (
            <ul className="divide-y divide-white/10">
              {matches.map((match) => (
                <li key={match.ticker}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => openMatch(match)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/10"
                  >
                    <SearchResultLogo match={match} />
                    <span className="shrink-0 text-sm font-bold text-emerald-300">{match.ticker.toUpperCase()}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-white/75">{match.companyName || match.ticker}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-5 text-sm font-semibold text-white/45">
              {isLoading ? "Searching..." : "No semantic matches found"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SearchResultLogo({ match }: { match: SearchMatch }) {
  const [hasLogoError, setHasLogoError] = useState(false);
  const ticker = match.ticker.toUpperCase();

  if (match.logo && !hasLogoError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={match.logo}
        alt={`${match.companyName || ticker} logo`}
        className="size-8 shrink-0 rounded-full bg-white p-1 object-contain"
        onError={() => setHasLogoError(true)}
      />
    );
  }

  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white text-[10px] font-black text-black">
      {ticker.slice(0, 3)}
    </span>
  );
}
