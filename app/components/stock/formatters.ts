export const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

export function formatCurrency(value?: number) {
  return typeof value === "number" && Number.isFinite(value) ? currencyFormatter.format(value) : "N/A";
}

export function formatNumber(value?: number) {
  return typeof value === "number" && Number.isFinite(value) ? numberFormatter.format(value) : "N/A";
}

export function formatPercent(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "N/A";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function formatSignedCurrency(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "N/A";
  return `${value >= 0 ? "+" : "-"}${currencyFormatter.format(Math.abs(value))}`;
}

export function formatMarketCap(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "N/A";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}T`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}B`;
  return `$${value.toFixed(2)}M`;
}
