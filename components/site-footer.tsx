import Image from "next/image";

import { socialLinkItems } from "@/config/site";

export function SiteFooter() {
  const links = socialLinkItems.filter((item) => item.href);

  return (
    <footer className="siteFooter">
      <div className="container footerInner">
        <div className="footerLinks">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className={
                link.badge
                  ? `platformBadgeLink ${link.badge.containerClassName ?? ""}`.trim()
                  : undefined
              }
            >
              {link.badge ? (
                <Image
                  src={link.badge.src}
                  alt={link.badge.alt}
                  width={link.badge.width}
                  height={link.badge.height}
                  className={
                    `platformBadgeImage ${link.badge.imageClassName ?? ""}`.trim()
                  }
                  style={
                    {
                      "--badge-width": `${link.badge.displayWidth ?? link.badge.width}px`,
                      "--badge-height": `${link.badge.displayHeight ?? link.badge.height}px`,
                    } as React.CSSProperties
                  }
                />
              ) : (
                link.label
              )}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
