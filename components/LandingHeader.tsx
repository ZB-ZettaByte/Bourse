"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import SemanticStockSearch from "@/components/SemanticStockSearch";
import { cn } from "@/lib/utils";

type LandingHeaderProps = {
  selectedCompany?: { symbol: string; name?: string } | null;
  onHome?: () => void;
};

export default function LandingHeader({ selectedCompany = null, onHome }: LandingHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const isCompanyContext = Boolean(selectedCompany);
  const menuItems = isCompanyContext
    ? [
        { name: selectedCompany?.symbol ?? "Company", href: "#company-summary" },
        { name: "Background", href: "#company-background" },
        { name: "Sources", href: "#company-sources" },
      ]
    : [
        { name: "Features", href: "#features" },
        { name: "Live Market", href: "#live-stats" },
      ];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header>
      <nav data-state={menuOpen ? "active" : "closed"} className="fixed z-30 w-full px-2">
        <div
          className={cn(
            "mx-auto mt-2 max-w-7xl px-6 transition-all duration-300 lg:px-8",
            isScrolled && "rounded-2xl border border-white/10 bg-black/55 backdrop-blur-xl"
          )}
        >
          <div className="flex flex-wrap items-center gap-5 py-3 lg:flex-nowrap lg:gap-8 lg:py-4">
            <div className="flex w-full items-center justify-between gap-6 lg:w-auto lg:justify-start">
              <div className="flex items-center gap-7">
                <Link
                  href="/"
                  aria-label="Bourse home"
                  onClick={(event) => {
                    if (onHome) {
                      event.preventDefault();
                      onHome();
                    }
                  }}
                  className="flex shrink-0 items-center"
                >
                  <Image
                    src="/assets/icons/logo.svg"
                    alt="Bourse"
                    width={164}
                    height={36}
                    className="h-10 w-auto"
                    priority
                  />
                </Link>

                <ul className="hidden items-center gap-6 text-sm font-semibold text-white/75 lg:flex">
                  {menuItems.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className="whitespace-nowrap duration-150 hover:text-white">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setMenuOpen((value) => !value)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 text-white lg:hidden"
              >
                <Menu className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                <X className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
              </button>
            </div>

            <SemanticStockSearch className="order-3 w-full lg:order-none lg:mx-auto lg:min-w-[400px] lg:max-w-[560px] lg:flex-1" />

            <div className="in-data-[state=active]:block hidden w-full rounded-3xl border border-white/10 bg-black/90 p-6 shadow-2xl shadow-black/30 lg:m-0 lg:flex lg:w-fit lg:items-center lg:gap-3 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none">
              <ul className="space-y-6 text-base lg:hidden">
                {menuItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="block text-white/70 duration-150 hover:text-white"
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row lg:mt-0 lg:w-fit">
                <Button
                  asChild
                  size="lg"
                  className="h-11 rounded-full border border-white bg-white px-7 text-sm font-bold text-black hover:bg-black hover:text-white"
                >
                  <Link href="/watchlist">Start Tracking</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
