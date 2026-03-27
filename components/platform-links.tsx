import Image from "next/image";

import { socialLinkItems } from "@/config/site";

type PlatformLinksProps = {
  title?: string;
};

export function PlatformLinks({
  title,
}: PlatformLinksProps) {
  const links = socialLinkItems.filter((item) => item.href);

  if (links.length === 0) {
    return null;
  }

  return (
    <section className="platformSection" aria-label={title}>
      {title ? (
        <div className="sectionHeading">
          <h2>{title}</h2>
        </div>
      ) : null}
      <div className="platformLinkGrid">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className={
              link.badge
                ? `platformBadgeLink ${link.badge.containerClassName ?? ""}`.trim()
                : "platformPill"
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
    </section>
  );
}
