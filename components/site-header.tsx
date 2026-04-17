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
  const [isMobile, setIsMobile] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    let frameId: number | null = null;
    let scrollStopTimeoutId: number | null = null;
    let hasPendingScrollActivity = false;
    let lastScrollY = Math.max(0, window.scrollY || 0);
    const mediaQueryList = window.matchMedia(compactDisabledMediaQuery);

    const updateHeaderState = (markScrollActivity: boolean) => {
      const liveScrollY = Math.max(0, window.scrollY || 0);
      const hasMeaningfulScrollDelta = Math.abs(liveScrollY - lastScrollY) > 1;

      if (markScrollActivity && hasMeaningfulScrollDelta) {
        hasPendingScrollActivity = true;
      }

      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        const nextScrollY = Math.max(0, window.scrollY || 0);
        lastScrollY = nextScrollY;
        const isNarrowViewport = mediaQueryList.matches;
        const nextIsAtTop = nextScrollY <= 2;

        setIsMobile((current) => (current === isNarrowViewport ? current : isNarrowViewport));
        setIsAtTop((current) => (current === nextIsAtTop ? current : nextIsAtTop));
        setIsCompact((current) => {
          const next = shouldUseCompactHeader(current, nextScrollY, isNarrowViewport);
          return current === next ? current : next;
        });

        if (!isNarrowViewport) {
          if (scrollStopTimeoutId !== null) {
            window.clearTimeout(scrollStopTimeoutId);
            scrollStopTimeoutId = null;
          }

          hasPendingScrollActivity = false;
          setIsScrolling(false);
          return;
        }

        if (hasPendingScrollActivity) {
          setIsScrolling(true);

          if (scrollStopTimeoutId !== null) {
            window.clearTimeout(scrollStopTimeoutId);
          }

          scrollStopTimeoutId = window.setTimeout(() => {
            setIsScrolling(false);
            scrollStopTimeoutId = null;
          }, 320);
        }

        hasPendingScrollActivity = false;
      });
    };

    const handleScroll = () => updateHeaderState(true);
    const handleResize = () => updateHeaderState(false);
    const handleViewportModeChange = () => updateHeaderState(false);

    updateHeaderState(false);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });
    mediaQueryList.addEventListener("change", handleViewportModeChange);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      mediaQueryList.removeEventListener("change", handleViewportModeChange);

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }

      if (scrollStopTimeoutId !== null) {
        window.clearTimeout(scrollStopTimeoutId);
      }
    };
  }, []);

  const headerClassName = [
    "siteHeader",
    isCompact ? "siteHeaderCompact" : "",
    isMobile && !isAtTop ? "siteHeaderMobileNoLogo" : "",
    isMobile && isScrolling ? "siteHeaderMobileHidden" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={headerClassName}>
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
