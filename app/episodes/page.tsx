import type { Metadata } from "next";

import { EpisodeSearch } from "@/components/episode-search";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { siteConfig } from "@/config/site";
import { getEpisodeListItems, getEpisodes } from "@/lib/episodes";
import { buildArchiveJsonLd, buildBreadcrumbJsonLd, serializeJsonLd } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Arkiv",
  description: "Bläddra bland alla avsnitt i Make Sweden Stronger och se direkt vilka som har transkript.",
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(archiveJsonLd) }}
      />
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
