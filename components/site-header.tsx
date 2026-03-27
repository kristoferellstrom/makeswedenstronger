import Link from "next/link";

import { siteConfig } from "@/config/site";

export function SiteHeader() {
  return (
    <header className="siteHeader">
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
        </nav>
      </div>
    </header>
  );
}
