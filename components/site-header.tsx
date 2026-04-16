"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { siteConfig } from "@/config/site";

const compactEnterScrollY = 68;
const compactExitScrollY = 20;
const compactDisabledMediaQuery = "(max-width: 720px)";

function shouldUseCompactHeader(isCompact: boolean, scrollY: number, isNarrowViewport: boolean) {
  if (isNarrowViewport) {
    return false;
  }

  if (isCompact) {
    return scrollY > compactExitScrollY;
  }

  return scrollY > compactEnterScrollY;
}

export function SiteHeader() {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    let frameId: number | null = null;
    const mediaQueryList = window.matchMedia(compactDisabledMediaQuery);

    const updateHeaderState = () => {
      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        const nextScrollY = window.scrollY || 0;
        const isNarrowViewport = mediaQueryList.matches;

        setIsCompact((current) => {
          const next = shouldUseCompactHeader(current, nextScrollY, isNarrowViewport);
          return current === next ? current : next;
        });
      });
    };

    updateHeaderState();
    window.addEventListener("scroll", updateHeaderState, { passive: true });
    window.addEventListener("resize", updateHeaderState, { passive: true });
    mediaQueryList.addEventListener("change", updateHeaderState);

    return () => {
      window.removeEventListener("scroll", updateHeaderState);
      window.removeEventListener("resize", updateHeaderState);
      mediaQueryList.removeEventListener("change", updateHeaderState);

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
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
          <Link href="/amnen">Ämnen</Link>
          <Link href="/om-podden">Om podden</Link>
          <Link href="/om-joel">Om Joel</Link>
        </nav>
      </div>
    </header>
  );
}
