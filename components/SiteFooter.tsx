import Image from "next/image";
import Link from "next/link";
import { Linkedin, Rocket } from "lucide-react";

const links = [
  {
    group: "Product",
    items: [
      { title: "Features", href: "/#features" },
      { title: "Live Market", href: "/#live-stats" },
      { title: "Watchlist", href: "/watchlist" },
    ],
  },
  {
    group: "Company",
    items: [
      { title: "Contact", href: "/#contact" },
      { title: "Privacy", href: "#" },
      { title: "Cookies", href: "#" },
    ],
  },
  {
    group: "Explore",
    items: [
      { title: "Apple", href: "/stock/AAPL" },
      { title: "Microsoft", href: "/stock/MSFT" },
      { title: "NVIDIA", href: "/stock/NVDA" },
    ],
  },
];

function XIcon() {
  return (
    <svg className="size-5" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M10.488 14.651L15.25 21h7l-7.858-10.478L20.93 3h-2.65l-5.117 5.886L8.75 3h-7l7.51 10.015L2.32 21h2.65zM16.25 19L5.75 5h2l10.5 14z"
      />
    </svg>
  );
}

export default function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-emerald-300/15 bg-green-900 text-white">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent" />
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),transparent_38%)]" />
      <div aria-hidden className="footer-rocket pointer-events-none absolute bottom-10 left-6 text-emerald-300/80">
        <Rocket className="size-7 rotate-45" />
        <span className="mt-1 block h-px w-14 bg-gradient-to-r from-emerald-300/70 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 py-14 md:px-8 lg:py-20">
        <div className="grid gap-12 md:grid-cols-5">
          <div className="space-y-6 md:col-span-2">
            <Link href="/" aria-label="Go home" className="inline-flex size-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
              <Image src="/assets/icons/bourse-icon.svg" alt="Bourse" width={44} height={44} className="size-10" />
            </Link>
            <div>
              <h2 className="text-2xl font-bold">Bourse</h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-white/50">
                Live stock tracking, market movement, news, and company context in one focused market workspace.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="https://x.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X/Twitter"
                className="grid size-10 place-items-center rounded-lg border border-white/10 text-white/55 transition-colors hover:border-emerald-300/45 hover:text-emerald-300"
              >
                <XIcon />
              </Link>
              <Link
                href="https://www.linkedin.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="grid size-10 place-items-center rounded-lg border border-white/10 text-white/55 transition-colors hover:border-emerald-300/45 hover:text-emerald-300"
              >
                <Linkedin className="size-5" />
              </Link>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3 md:col-span-3">
            {links.map((group) => (
              <div key={group.group} className="space-y-4">
                <span className="block text-sm font-bold text-white">{group.group}</span>
                <div className="flex flex-wrap gap-4 sm:flex-col">
                  {group.items.map((item) => (
                    <Link key={item.title} href={item.href} className="block text-sm font-semibold text-white/45 transition-colors hover:text-emerald-300">
                      {item.title}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col justify-between gap-3 border-t border-white/10 pt-6 text-xs font-semibold text-white/35 md:flex-row">
          <p>&copy; 2026 Bourse. Built for stock research and portfolio context.</p>
          <p>Market data is provided by connected backend services.</p>
        </div>
      </div>
    </footer>
  );
}
