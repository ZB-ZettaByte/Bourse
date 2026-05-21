import Image from "next/image";
import Link from "next/link";

const footerLinks = [
  { label: "Markets", href: "/stocks/SPY" },
  { label: "S&P 500", href: "/stocks/SPY" },
  { label: "Nasdaq", href: "/stocks/QQQ" },
  { label: "Apple", href: "/stocks/AAPL" },
  { label: "Microsoft", href: "/stocks/MSFT" },
];

export default function MarketFooter() {
  return (
    <footer className="border-t border-black/10 bg-white text-black">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 md:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <Link href="/" aria-label="Bourse home" className="w-fit">
            <Image src="/assets/icons/logo.svg" alt="Bourse" width={164} height={36} className="h-10 w-auto" />
          </Link>
          <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-black/60">
            {footerLinks.map((link) => (
              <Link key={link.label} href={link.href} className="transition-colors hover:text-black">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-col justify-between gap-3 border-t border-black/10 pt-6 text-sm text-black/50 md:flex-row">
          <p>Live stock tracking, watchlists, market movement, and company context in one market workspace.</p>
          <p>&copy; 2026 Bourse. Market data is provided by connected backend services.</p>
        </div>
      </div>
    </footer>
  );
}
