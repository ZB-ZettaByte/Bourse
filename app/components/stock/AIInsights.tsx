"use client";

import { Lightbulb, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

const isStaticDeployment = Boolean(process.env.NEXT_PUBLIC_BASE_PATH);

export default function AIInsights({ symbol }: { symbol: string }) {
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(!isStaticDeployment);

  useEffect(() => {
    let isMounted = true;

    function loadStaticInsights() {
      if (!isMounted) return;

      setInsights([
        `${symbol} is using static demo data while the backend is offline.`,
        "Price, stats, and news are included so the research workflow stays visible.",
        "Run the FastAPI backend locally to restore live AI insight generation.",
      ]);
      setIsLoading(false);
    }

    async function loadInsights() {
      if (isStaticDeployment) {
        loadStaticInsights();
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch(`/api/insights?symbol=${encodeURIComponent(symbol)}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as { insights?: string[] };
        if (isMounted) {
          setInsights(Array.isArray(payload.insights) ? payload.insights.slice(0, 3) : []);
        }
      } catch {
        loadStaticInsights();
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadInsights();

    return () => {
      isMounted = false;
    };
  }, [symbol]);

  return (
    <section className="rounded-lg border border-green-900/10 bg-white p-5 text-green-950 shadow-sm shadow-black/10">
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-md bg-green-950 text-white">
          <Lightbulb className="size-4" />
        </span>
        <h2 className="text-sm font-bold text-green-950">Insights</h2>
      </div>

      {isLoading ? (
        <div className="mt-7 flex items-center gap-3 text-sm font-semibold text-green-950/50">
          <Loader2 className="size-4 animate-spin" />
          Reading market context...
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {(insights.length ? insights : ["AI insights are unavailable right now."]).map((insight, index) => (
            <li
              key={`${insight}-${index}`}
              className="border-l-2 border-emerald-500 pl-3 text-sm leading-6 text-green-950/70"
            >
              {insight}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
