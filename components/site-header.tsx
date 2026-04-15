"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { siteConfig } from "@/config/site";

export function SiteHeader() {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const updateHeaderState = () => {
      const nextIsCompact = window.scrollY > 8;
      setIsCompact((current) =>
        current === nextIsCompact ? current : nextIsCompact,
      );
    };

    updateHeaderState();
    window.addEventListener("scroll", updateHeaderState, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateHeaderState);
    };
  }, []);

  return (
    <header className={`siteHeader${isCompact ? " siteHeaderCompact" : ""}`}>
      <div className="container siteHeaderInner">
        <Link href="/" className="brandMark">
          <span>
            <span className="brandTitle" aria-label={siteConfig.name}>
              <span className="brandTitleLine brandTitleBlue">Make</span>
              <span className="brandTitleLine brandTitleBlue">Sweden</span>
              <span className="brandTitleLine brandTitleYellow">Stronger</span>
            </span>
          </span>
        </Link>

        <nav className="siteNav" aria-label="Huvudnavigering">
          <Link href="/">Hem</Link>
          <Link href="/episodes">Avsnitt</Link>
          <Link href="/om-podden">Om podden</Link>
          <Link href="/om-joel">Om Joel</Link>
        </nav>
      </div>
    </header>
  );
}
