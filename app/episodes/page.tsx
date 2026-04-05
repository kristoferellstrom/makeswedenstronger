import type { Metadata } from "next";

import { EpisodeSearch } from "@/components/episode-search";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { siteConfig } from "@/config/site";
import { getEpisodeListItems, getEpisodes } from "@/lib/episodes";
import { buildArchiveJsonLd, buildBreadcrumbJsonLd, serializeJsonLd } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Arkiv: alla transkriberingar och avsnitt",
  description:
    "Alla avsnitt och transkriberingar från Make Sweden Stronger. Sök bland gäster, bolag och ämnen och hitta rätt intervju direkt.",
  alternates: {
    canonical: "/episodes",
  },
};

export default async function EpisodesPage() {
  const [episodes, episodeListItems] = await Promise.all([getEpisodes(), getEpisodeListItems()]);
  const archiveJsonLd = buildArchiveJsonLd(episodes);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Hem", url: siteConfig.siteUrl },
    { name: "Avsnitt", url: `${siteConfig.siteUrl}/episodes` },
  ]);

  return (
    <div className="container pageStack">
      {Array.isArray(archiveJsonLd)
        ? archiveJsonLd.map((entry, index) => (
            <script
              key={`archive-jsonld-${index}`}
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: serializeJsonLd(entry) }}
            />
          ))
        : (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: serializeJsonLd(archiveJsonLd) }}
            />
          )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />

      <Breadcrumbs
        items={[
          { label: "Hem", href: "/" },
          { label: "Avsnitt" },
        ]}
      />

      <section className="pageIntro">
        <h1 className="archiveTitle">Arkiv</h1>
      </section>

      <EpisodeSearch episodes={episodeListItems} />
    </div>
  );
}
