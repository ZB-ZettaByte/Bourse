import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { formatCurrency, formatPercent, formatSignedCurrency } from "./formatters";

type StockHeaderProps = {
  companyName: string;
  ticker: string;
  price?: number;
  change?: number;
  changePercent?: number;
};

function isMarketOpen() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const minutes = hour * 60 + minute;
  return day > 0 && day < 6 && minutes >= 6 * 60 + 30 && minutes < 13 * 60;
}

export default function StockHeader({ companyName, ticker, price, change, changePercent }: StockHeaderProps) {
  const isUp = Number(changePercent ?? change ?? 0) >= 0;
  const marketOpen = isMarketOpen();
  const DirectionIcon = isUp ? ArrowUpRight : ArrowDownRight;

  return (
    <section className="mb-6">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h1 className="max-w-3xl text-balance text-4xl font-medium leading-[1.08] text-white md:text-5xl">
            {companyName || ticker}
          </h1>
          <p className="mt-3 text-sm font-semibold text-white/45">{ticker.toUpperCase()}</p>
        </div>
        <div className="text-left md:text-right">
          <p className="text-4xl font-semibold leading-none text-white">{formatCurrency(price)}</p>
          <p className={`mt-3 inline-flex items-center gap-1 text-sm font-bold ${isUp ? "text-emerald-300" : "text-red-400"}`}>
            <DirectionIcon className="size-4" />
            {formatSignedCurrency(change)} {formatPercent(changePercent)}
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs font-bold uppercase text-white/45 md:justify-end">
            <span className={`size-2 rounded-full ${marketOpen ? "bg-emerald-300" : "bg-white/25"}`} />
            Today · Market {marketOpen ? "open" : "closed"}
          </div>
        </div>
      </div>
    </section>
  );
}
