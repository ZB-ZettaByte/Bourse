import type { StockNewsArticle } from "@/lib/stock-detail";

function formatDate(timestamp?: number) {
  if (!timestamp) return "Recent";
  return new Date(timestamp * 1000).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function StockNews({ articles }: { articles: StockNewsArticle[] }) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-6 shadow-sm shadow-black/20">
      <h2 className="text-2xl font-semibold text-white">Latest News</h2>
      <div className="mt-5 divide-y divide-white/10">
        {articles.length > 0 ? (
          articles.slice(0, 8).map((article) => (
            <a
              key={`${article.id ?? article.url}-${article.datetime ?? ""}`}
              href={article.url}
              target="_blank"
              rel="noreferrer"
              className="block py-4 transition-colors hover:bg-white/[0.03]"
            >
              <h3 className="text-sm font-bold leading-6 text-white">{article.headline}</h3>
              <p className="mt-1 text-xs font-semibold text-white/40">
                {article.source ?? "Market news"} · {formatDate(article.datetime)}
              </p>
            </a>
          ))
        ) : (
          <p className="py-5 text-sm font-semibold text-white/45">No recent company news returned by Finnhub.</p>
        )}
      </div>
    </section>
  );
}
