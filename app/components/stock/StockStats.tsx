import { formatCurrency, formatNumber, formatPercent, formatSignedCurrency } from "./formatters";

type StockStatsProps = {
  open?: number;
  high?: number;
  low?: number;
  current?: number;
  previousClose?: number;
  change?: number;
  changePercent?: number;
  volume?: number;
};

export default function StockStats({ open, high, low, current, previousClose, change, changePercent, volume }: StockStatsProps) {
  const stats = [
    ["Open", formatCurrency(open)],
    ["High", formatCurrency(high)],
    ["Low", formatCurrency(low)],
    ["Current", formatCurrency(current)],
    ["Prev Close", formatCurrency(previousClose)],
    ["Change", formatSignedCurrency(change)],
    ["Change %", formatPercent(changePercent)],
    ["Volume", formatNumber(volume)],
  ];

  return (
    <section className="mb-6 rounded-lg border border-white/10 bg-white/[0.04] p-4 shadow-sm shadow-black/20">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        {stats.map(([label, value]) => (
          <div key={label}>
            <p className="text-xs font-bold uppercase text-white/35">{label}</p>
            <p className="mt-2 text-sm font-bold text-white">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
