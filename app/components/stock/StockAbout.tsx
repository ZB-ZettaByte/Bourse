import type { StockProfile } from "@/lib/stock-detail";
import { formatCurrency, formatMarketCap, formatNumber, formatPercent } from "./formatters";

type StockAboutProps = {
  profile: StockProfile;
  metrics?: Record<string, number>;
  dayLow?: number;
  dayHigh?: number;
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 py-3 last:border-b-0">
      <span className="text-sm text-white/45">{label}</span>
      <span className="text-right text-sm font-bold text-white">{value}</span>
    </div>
  );
}

export default function StockAbout({ profile, metrics = {}, dayLow, dayHigh }: StockAboutProps) {
  const name = profile.name ?? profile.ticker ?? "This company";
  const industry = profile.finnhubIndustry ?? "its reported industry";
  const description = `${name} is listed on ${profile.exchange ?? "a US exchange"} and operates in ${industry}.`;
  const weekLow = metrics["52WeekLow"];
  const weekHigh = metrics["52WeekHigh"];

  return (
    <section className="mb-6 rounded-lg border border-white/10 bg-white/[0.04] p-6 shadow-sm shadow-black/20">
      <h2 className="text-2xl font-semibold text-white">About</h2>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-white/55">{description}</p>

      <div className="mt-7 grid gap-8 md:grid-cols-2">
        <div>
          <Row label="Sector" value={profile.finnhubIndustry ?? "N/A"} />
          <Row label="Industry" value={profile.finnhubIndustry ?? "N/A"} />
          <Row label="Employees" value="N/A" />
          <Row label="Founded" value={profile.ipo ?? "N/A"} />
          <Row label="Website" value={profile.weburl ?? "N/A"} />
        </div>
        <div>
          <Row label="1-day range" value={`${formatCurrency(dayLow)} - ${formatCurrency(dayHigh)}`} />
          <Row label="52-week range" value={`${formatCurrency(weekLow)} - ${formatCurrency(weekHigh)}`} />
          <Row label="Market cap" value={formatMarketCap(profile.marketCapitalization)} />
          <Row label="P/E ratio" value={formatNumber(metrics.peBasicExclExtraTTM ?? metrics.peNormalizedAnnual)} />
          <Row label="Dividend yield" value={formatPercent(metrics.dividendYieldIndicatedAnnual)} />
        </div>
      </div>
    </section>
  );
}
