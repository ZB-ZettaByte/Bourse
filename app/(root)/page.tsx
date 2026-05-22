"use client";

import Link from "next/link";
import { Activity, Brain, LineChart, Newspaper, Search, Star } from "lucide-react";

import LandingHeader from "@/components/LandingHeader";
import MarketSummaryLive from "@/components/MarketSummaryLive";
import SiteContactSection from "@/components/SiteContactSection";
import SiteFooter from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";

const featurePillars = [
  {
    icon: Search,
    title: "Search",
    description: "Find a ticker naturally and open a full stock workspace.",
  },
  {
    icon: LineChart,
    title: "Chart",
    description: "Read live movement with range tabs and clean trend color.",
  },
  {
    icon: Newspaper,
    title: "News",
    description: "Review ranked, deduped stories around the selected company.",
  },
  {
    icon: Brain,
    title: "Insights",
    description: "Pair fundamentals and price context with AI-assisted summaries.",
  },
  {
    icon: Star,
    title: "Track",
    description: "Keep important names close with watchlist actions.",
  },
];

export default function Home() {
  return (
    <div className="landing-page bg-green-100 text-green-950">
      <LandingHeader />

      <main className="overflow-hidden bg-green-100">
        <section className="relative min-h-screen overflow-hidden bg-green-900 text-white">
          <div aria-hidden className="hero-market-backdrop absolute inset-0 z-[1]">
            <div className="hero-market-grid absolute inset-0" />
            <div className="hero-market-bars absolute inset-0">
              {Array.from({ length: 18 }).map((_, index) => (
                <span key={index} />
              ))}
            </div>
            <svg
              className="hero-market-lines absolute inset-x-0 top-[8%] h-[78%] w-full opacity-70"
              viewBox="0 0 1440 520"
              fill="none"
              preserveAspectRatio="none"
            >
              <path
                d="M-80 350C25 320 75 235 172 255C278 277 313 410 430 370C558 326 592 150 730 185C858 218 886 338 1018 292C1155 245 1190 104 1530 140"
                stroke="#34d399"
                strokeWidth="3"
                strokeLinecap="round"
                className="hero-market-line hero-market-line-primary"
              />
              <path
                d="M-90 258C48 205 146 295 260 245C365 198 425 112 548 160C682 212 746 315 875 265C1012 212 1098 170 1225 198C1342 224 1416 290 1530 244"
                stroke="#a7f3d0"
                strokeWidth="2"
                strokeLinecap="round"
                className="hero-market-line hero-market-line-soft"
              />
              <path
                d="M-70 418C82 386 175 438 300 404C432 368 462 284 590 310C728 338 804 448 936 386C1055 330 1125 250 1268 278C1382 300 1460 370 1535 340"
                stroke="#22c55e"
                strokeWidth="2"
                strokeLinecap="round"
                className="hero-market-line hero-market-line-low"
              />
            </svg>
            <div className="hero-ticker-chip left-[8%] top-[28%] hidden md:flex">
              <span>AAPL</span>
              <strong>+1.2%</strong>
            </div>
            <div className="hero-ticker-chip hero-ticker-chip-late right-[10%] top-[32%] hidden md:flex">
              <span>NVDA</span>
              <strong>+2.8%</strong>
            </div>
            <div className="hero-ticker-chip hero-ticker-chip-slow bottom-[24%] left-[17%] hidden md:flex">
              <span>SPY</span>
              <strong>+0.7%</strong>
            </div>
            <div className="hero-ticker-chip hero-ticker-chip-late bottom-[27%] right-[18%] hidden md:flex">
              <span>MSFT</span>
              <strong>+0.9%</strong>
            </div>
          </div>
          <div
            aria-hidden
            className="absolute inset-0 z-[2] bg-[radial-gradient(70%_58%_at_50%_48%,rgba(20,83,45,0.08)_0%,rgba(20,83,45,0.72)_76%),linear-gradient(180deg,rgba(20,83,45,0.35),rgba(20,83,45,0.85))]"
          />

          <div className="relative z-10 flex min-h-screen items-center px-6 pb-20 pt-28 md:pt-36">
            <div className="mx-auto max-w-7xl text-center">
              <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70">
                <Activity className="size-4 text-emerald-300" />
                Personal stock research dashboard
              </div>

              <h1 className="mx-auto mt-8 max-w-5xl text-balance text-5xl font-medium leading-[1.05] text-white md:text-7xl xl:text-[5.25rem]">
                Smarter Stock Research Starts Here
              </h1>

              <p className="mx-auto mt-8 max-w-2xl text-balance text-lg leading-8 text-white/68">
                Real-time stock data, market movers, news, and AI-assisted insights built as a personal
                project for faster market research.
              </p>

              <div className="relative mt-12 flex flex-col items-center justify-center gap-3 md:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="group relative z-10 h-auto overflow-hidden rounded-[6px] border border-white/80 bg-white px-[38px] py-4 text-sm font-bold text-black shadow-[0_18px_40px_rgba(0,0,0,0.16)] transition-all duration-300 before:absolute before:inset-y-0 before:-left-1/2 before:w-1/2 before:skew-x-[-18deg] before:bg-emerald-100/70 before:opacity-0 before:transition-all before:duration-500 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-white hover:text-emerald-950 hover:shadow-[0_18px_42px_rgba(16,185,129,0.22)] hover:before:left-[130%] hover:before:opacity-100"
                >
                  <Link href="#live-stats">View Live Market</Link>
                </Button>
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

        <MarketSummaryLive />

        <section
          id="features"
          className="min-h-screen border-y border-emerald-300/15 bg-green-900 px-5 py-20 text-white md:px-8"
        >
          <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-7xl flex-col justify-center">
            <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
                  Project Features
                </p>
                <h2 className="mt-5 max-w-xl text-3xl font-semibold leading-[1.14] md:text-4xl lg:text-5xl">
                  See the full market workflow in one place.
                </h2>
                <p className="mt-6 max-w-xl text-base leading-7 text-white/55">
                  Bourse turns a ticker search into a focused research surface: live price movement, company
                  facts, latest earnings, relevant news, AI context, and watchlist actions.
                </p>
                <div className="mt-8 space-y-3">
                  {[
                    ["01", "Start from semantic search"],
                    ["02", "Open a live stock page"],
                    ["03", "Compare chart, financials, news, and insights"],
                  ].map(([step, text]) => (
                    <div key={step} className="flex items-center gap-3 text-sm font-bold text-white/70">
                      <span className="grid size-8 place-items-center rounded-lg border border-emerald-300/25 bg-emerald-300/10 text-xs text-emerald-200">
                        {step}
                      </span>
                      {text}
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-white/10 bg-neutral-950 shadow-xl shadow-black/30 lg:justify-self-end">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div>
                    <p className="text-sm font-bold text-white">Bourse workflow</p>
                    <p className="mt-1 text-xs text-white/45">Search becomes a complete stock brief</p>
                  </div>
                  <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-300">
                    Live demo
                  </span>
                </div>

                <div className="p-5 md:p-6">
                  <div className="relative overflow-hidden rounded-lg border border-white/10 bg-black p-5">
                    <div
                      aria-hidden
                      className="workflow-scan absolute inset-y-0 left-0 w-36 bg-gradient-to-r from-transparent via-emerald-300/10 to-transparent"
                    />

                    <div className="grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3">
                          <Search className="size-4 text-emerald-300" />
                          <span className="text-sm font-bold text-white/80">Search “Apple earnings”</span>
                        </div>

                        <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/[0.06] p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-lg font-bold text-white">Apple Inc</p>
                              <p className="mt-1 text-xs font-bold text-white/40">AAPL · NASDAQ NMS</p>
                            </div>
                            <span className="text-right text-xl font-semibold text-emerald-300">$303.67</span>
                          </div>
                          <div className="mt-4 grid grid-cols-3 gap-2 text-xs font-bold">
                            <span className="rounded-md bg-white/8 px-2 py-2 text-white/65">CEO</span>
                            <span className="rounded-md bg-white/8 px-2 py-2 text-white/65">Revenue</span>
                            <span className="rounded-md bg-white/8 px-2 py-2 text-white/65">Earnings</span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold">Live market chart</p>
                          <span className="text-xs font-bold text-emerald-300">1D</span>
                        </div>
                        <svg
                          className="mt-5 h-36 w-full"
                          viewBox="0 0 360 150"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M4 124C38 110 48 47 78 62C111 79 119 24 149 36C182 49 188 104 221 85C249 68 267 31 301 44C325 53 342 25 356 18"
                            stroke="#34d399"
                            strokeWidth="4"
                            strokeLinecap="round"
                            className="workflow-line"
                          />
                          <path
                            d="M4 124C38 110 48 47 78 62C111 79 119 24 149 36C182 49 188 104 221 85C249 68 267 31 301 44C325 53 342 25 356 18V150H4V124Z"
                            fill="url(#workflowFill)"
                            opacity="0.34"
                          />
                          <defs>
                            <linearGradient
                              id="workflowFill"
                              x1="180"
                              x2="180"
                              y1="18"
                              y2="150"
                              gradientUnits="userSpaceOnUse"
                            >
                              <stop stopColor="#34d399" />
                              <stop offset="1" stopColor="#34d399" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      {[
                        ["Financials", "P/E, EPS, beta, float"],
                        ["News", "Relevant stories sorted"],
                        ["AI Insights", "Quick market context"],
                      ].map(([title, detail]) => (
                        <div
                          key={title}
                          className="workflow-step rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3"
                        >
                          <p className="text-sm font-bold text-white">{title}</p>
                          <p className="mt-1 text-xs font-semibold text-white/42">{detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-5">
              {featurePillars.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className="h-full rounded-lg border border-white/10 bg-neutral-950 p-5 shadow-sm shadow-black/20"
                >
                  <span className="grid size-10 place-items-center rounded-md bg-emerald-300/12 text-emerald-200">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-bold">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/50">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <SiteContactSection />
        <SiteFooter />
      </main>
    </div>
  );
}
