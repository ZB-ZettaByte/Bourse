"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import SemanticStockSearch from "@/components/SemanticStockSearch";
import { cn } from "@/lib/utils";

type LandingHeaderProps = {
  selectedCompany?: { symbol: string; name?: string; price?: number; changePercent?: number } | null;
  onHome?: () => void;
  hideCta?: boolean;
  surface?: "dark" | "light";
};

type MarketSummaryPayload = {
  marketSummary?: {
    price?: number;
    changePercent?: number;
  } | null;
};

function formatCompactPrice(value?: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(
        value
      )
    : "";
}

function formatCompactPercent(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export default function LandingHeader({
  selectedCompany = null,
  onHome,
  hideCta = false,
  surface = "dark",
}: LandingHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [navQuote, setNavQuote] = useState({
    price: selectedCompany?.price,
    changePercent: selectedCompany?.changePercent,
  });
  const isCompanyContext = Boolean(selectedCompany);
  const isLightSurface = surface === "light" && !isScrolled;
  const showWordmark = !isCompanyContext && !isScrolled;
  const quoteIsUp = Number(navQuote.changePercent ?? 0) >= 0;
  const menuItems = isCompanyContext
    ? [
        { name: "Home", href: "/" },
        { name: "Watchlist", href: "/watchlist" },
        { name: "Live Market", href: "/#live-stats" },
      ]
    : [
        { name: "Features", href: "#features" },
        { name: "Live Market", href: "#live-stats" },
        { name: "Contact", href: "#contact" },
      ];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!selectedCompany?.symbol) return;
    const symbol = selectedCompany.symbol;
    let isMounted = true;

    async function loadQuote() {
      try {
        const response = await fetch(
          `/api/market-summary?symbol=${encodeURIComponent(symbol)}&range=1D&live=1&t=${Date.now()}`,
          {
            cache: "no-store",
          }
        );
        const payload = (await response.json()) as MarketSummaryPayload;
        if (!isMounted || !payload.marketSummary) return;
        setNavQuote({
          price: payload.marketSummary.price,
          changePercent: payload.marketSummary.changePercent,
        });
      } catch {
        // Keep the initial server quote if the live refresh fails.
      }
    }

    loadQuote();
    const intervalId = window.setInterval(loadQuote, 30_000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [selectedCompany?.symbol]);

  return (
    <header>
      <nav data-state={menuOpen ? "active" : "closed"} className="fixed z-30 w-full px-2">
        <div
          className={cn(
            "mx-auto mt-2 max-w-7xl px-6 transition-all duration-300 ease-out lg:px-8",
            isScrolled &&
              "max-w-4xl rounded-2xl border border-white/10 bg-black/70 px-4 shadow-2xl shadow-black/30 backdrop-blur-xl lg:px-5"
          )}
        >
          <div
            className={cn(
              "flex flex-wrap items-center gap-5 py-3 transition-all duration-300 ease-out lg:flex-nowrap lg:gap-8 lg:py-4",
              isScrolled && "lg:gap-5 lg:py-2.5"
            )}
          >
            <div className="flex w-full items-center justify-between gap-6 lg:w-auto lg:shrink-0 lg:justify-start">
              <div
                className={cn("flex items-center gap-7 transition-all duration-300", isScrolled && "gap-3")}
              >
                <Link
                  href="/"
                  aria-label="Bourse home"
                  onClick={(event) => {
                    if (onHome) {
                      event.preventDefault();
                      onHome();
                    }
                  }}
                  className="flex shrink-0 items-center"
                >
                  <Image
                    src={showWordmark ? "/assets/icons/logo.svg" : "/assets/icons/bourse-icon.svg"}
                    alt="Bourse"
                    width={showWordmark ? 184 : 44}
                    height={44}
                    className={cn(
                      "h-10 transition-all duration-300 ease-out",
                      showWordmark ? "w-[132px] sm:w-[148px]" : "w-10",
                      isScrolled && "size-8"
                    )}
                    priority
                  />
                </Link>

                <ul
                  className={cn(
                    "hidden items-center gap-6 text-sm font-semibold transition-all duration-300 lg:flex",
                    isLightSurface ? "text-green-950/65" : "text-white/75",
                    isScrolled && "gap-3 text-xs"
                  )}
                >
                  {menuItems.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "whitespace-nowrap duration-150",
                          isLightSurface ? "hover:text-green-950" : "hover:text-white"
                        )}
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setMenuOpen((value) => !value)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                className={cn(
                  "relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden",
                  isLightSurface ? "text-green-950" : "text-white"
                )}
              >
                <Menu className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                <X className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
              </button>
            </div>

            <SemanticStockSearch
              surface={isLightSurface ? "light" : "dark"}
              className={cn(
                "order-3 w-full lg:order-none lg:mx-auto lg:min-w-[400px] lg:max-w-[560px] lg:flex-1",
                isScrolled && "lg:ml-auto lg:mr-0 lg:min-w-[300px] lg:max-w-[300px] lg:flex-none"
              )}
            />

            {selectedCompany && navQuote.price ? (
              <div
                className={cn(
                  "hidden shrink-0 items-baseline gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-bold opacity-0 transition-all duration-300 lg:flex",
                  isScrolled && "opacity-100"
                )}
              >
                <span className="text-white">{selectedCompany.symbol}</span>
                <span className="tabular-nums text-white/90">{formatCompactPrice(navQuote.price)}</span>
                <span className={cn("tabular-nums text-xs", quoteIsUp ? "text-emerald-300" : "text-red-400")}>
                  {formatCompactPercent(navQuote.changePercent)}
                </span>
              </div>
            ) : null}

            <div className="in-data-[state=active]:block hidden w-full rounded-3xl border border-white/10 bg-black/90 p-6 shadow-2xl shadow-black/30 lg:m-0 lg:flex lg:w-fit lg:items-center lg:gap-3 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none">
              <ul className="space-y-6 text-base lg:hidden">
                {menuItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="block text-white/70 duration-150 hover:text-white"
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>

              {!hideCta ? (
                <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row lg:mt-0 lg:w-fit">
                  <Button
                    asChild
                    size="lg"
                    className={cn(
                      "h-auto rounded-lg border border-white bg-white px-7 py-3 text-sm font-bold text-black shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-400 hover:text-black",
                      isScrolled && "px-5 py-2 text-xs"
                    )}
                  >
                    <Link href="/#live-stats">View Market</Link>
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
