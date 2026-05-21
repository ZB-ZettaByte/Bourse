"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BellRing,
  LineChart,
  Search,
  Star,
} from "lucide-react";
import { useState } from "react";

import CompanyDetailLive from "@/components/CompanyDetailLive";
import LandingHeader from "@/components/LandingHeader";
import MarketSummaryLive, { type MarketSummarySelection } from "@/components/MarketSummaryLive";
import { Button } from "@/components/ui/button";

const featurePillars = [
  {
    icon: Search,
    title: "Stock Search",
    description: "Find companies quickly and jump into live quote, profile, news, and chart views.",
  },
  {
    icon: Star,
    title: "Watchlists",
    description: "Save symbols you care about and monitor price movement without rebuilding your list.",
  },
  {
    icon: BellRing,
    title: "Smart Alerts",
    description: "Track meaningful price moves and market events around the companies you follow.",
  },
  {
    icon: LineChart,
    title: "Market Movement",
    description: "Inspect intraday and historical movement with range tabs, hover prices, and trend colors.",
  },
];

export default function Home() {
  const [selectedCompany, setSelectedCompany] = useState<MarketSummarySelection | null>(null);

  function openCompany(stock: MarketSummarySelection) {
    setSelectedCompany(stock);
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  function openCompanyBySymbol(symbol: string) {
    setSelectedCompany((current) => ({
      symbol,
      name: current?.symbol === symbol ? current.name : symbol,
      exchange: "US",
      price: 0,
      change: 0,
      changePercent: 0,
      previousClose: 0,
      chartPoints: [],
    }));
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  function backToMarkets() {
    setSelectedCompany(null);
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  return (
    <div className="landing-page bg-white text-black">
      <LandingHeader
        selectedCompany={selectedCompany ? { symbol: selectedCompany.symbol, name: selectedCompany.name } : null}
        onHome={backToMarkets}
      />

      <main className="overflow-hidden bg-white">
        {selectedCompany ? (
          <CompanyDetailLive
            symbol={selectedCompany.symbol}
            embedded
            onBackToMarkets={backToMarkets}
            onSelectCompany={openCompanyBySymbol}
          />
        ) : (
          <>
        <section className="relative min-h-screen overflow-hidden bg-black text-white">
          <div
            aria-hidden
            className="absolute inset-0 z-[2] bg-[radial-gradient(80%_70%_at_50%_45%,transparent_0%,#000_78%)]"
          />

          <div className="relative z-10 flex min-h-screen items-center px-6 pb-20 pt-28 md:pt-36">
            <div className="mx-auto max-w-7xl text-center">
              <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70">
                <Activity className="size-4 text-teal-400" />
                Live market intelligence for active investors
              </div>

              <h1 className="mx-auto mt-8 max-w-5xl text-balance text-5xl font-medium leading-[1.05] text-white md:text-7xl xl:text-[5.25rem]">
                Track every market move with clarity.
              </h1>

              <p className="mx-auto mt-8 max-w-2xl text-balance text-lg leading-8 text-white/68">
                Bourse brings real-time stock data, watchlists, alerts, and portfolio insights into one polished
                command center for modern market tracking.
              </p>

              <div className="mt-12 flex flex-col items-center justify-center gap-3 md:flex-row">
                <div className="rounded-[calc(var(--radius-xl)+0.125rem)] border border-white/10 bg-white/10 p-0.5">
                  <Button
                    asChild
                    size="lg"
                    className="h-12 rounded-lg border border-white bg-white px-8 text-sm font-bold text-black hover:bg-black hover:text-white"
                  >
                    <Link href="#live-stats">
                      Start Tracking
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
                <Button
                  asChild
                  size="lg"
                  variant="ghost"
                  className="h-12 rounded-xl px-6 text-sm font-bold text-white/85 hover:bg-white/10 hover:text-white"
                >
                  <Link href="#features">Explore Features</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <MarketSummaryLive onSelectCompany={openCompany} />

        <section id="features" className="min-h-screen border-t border-white/10 bg-black px-5 py-20 text-white md:px-8">
          <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-7xl flex-col justify-center">
            <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">Platform Features</p>
                <h2 className="mt-5 max-w-xl text-3xl font-semibold leading-[1.14] md:text-4xl lg:text-5xl">
                  Live market tools in one focused workspace.
                </h2>
                <p className="mt-6 max-w-xl text-base leading-7 text-white/55">
                  Start with the live Market Summary, choose a symbol, review the stock detail page, and keep the names
                  that matter close with watchlist actions.
                </p>
              </div>
              <div className="overflow-hidden rounded-lg border border-white/10 bg-neutral-950 shadow-2xl shadow-black lg:justify-self-end">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div>
                    <p className="text-sm font-bold text-white">Market workflow</p>
                    <p className="mt-1 text-xs text-white/45">Search, review, analyze, and track</p>
                  </div>
                  <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-300">
                    Product flow
                  </span>
                </div>

                <div className="grid gap-4 p-5 md:grid-cols-2 md:p-6">
                  {[
                    ["01", "Search", "Open the navbar search and jump straight into a company page."],
                    ["02", "Review", "Use the stock detail view for quote context, profile, and financials."],
                    ["03", "Analyze", "Compare price movement with technical and baseline chart views."],
                    ["04", "Track", "Save the symbols you care about and return to them from the same workspace."],
                  ].map(([step, title, description]) => (
                    <article key={step} className="rounded-lg border border-white/10 bg-black p-5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-teal-300">Step {step}</span>
                        <span className="grid size-9 place-items-center rounded-md bg-white text-black">
                          {title === "Search" ? <Search className="size-5" /> : title === "Track" ? <BellRing className="size-5" /> : <LineChart className="size-5" />}
                        </span>
                      </div>
                      <h3 className="mt-8 text-xl font-bold text-white">{title}</h3>
                      <p className="mt-3 text-sm leading-6 text-white/50">{description}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {featurePillars.map(({ icon: Icon, title, description }) => (
                <article key={title} className="h-full rounded-lg border border-white/10 bg-white/[0.04] p-6 shadow-sm shadow-black/20">
                  <span className="grid size-12 place-items-center rounded-md bg-white text-black">
                    <Icon className="size-6" />
                  </span>
                  <h3 className="mt-7 text-xl font-bold">{title}</h3>
                  <p className="mt-4 text-base leading-7 text-white/55">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
          </>
        )}
      </main>
    </div>
  );
}
