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
  openGraph: {
    type: "website",
    url: `${siteConfig.siteUrl}/episodes`,
    title: `Arkiv: alla transkriberingar och avsnitt | ${siteConfig.name}`,
    description:
      "Alla avsnitt och transkriberingar från Make Sweden Stronger. Sök bland gäster, bolag och ämnen och hitta rätt intervju direkt.",
    images: [
      {
        url: siteConfig.defaultImage,
        width: 1200,
        height: 1200,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Arkiv: alla transkriberingar och avsnitt | ${siteConfig.name}`,
    description:
      "Alla avsnitt och transkriberingar från Make Sweden Stronger. Sök bland gäster, bolag och ämnen och hitta rätt intervju direkt.",
    images: [siteConfig.defaultImage],
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
        <p className="introCopy">
          Här finns hela arkivet för Make Sweden Stronger med avsnitt, transkript och sammanfattningar.
          Du kan söka på gäster, bolag, ämnen och nyckelord och snabbt hitta rätt intervju.
          Varje avsnittssida innehåller tydlig metadata med publiceringsdatum, avsnittslängd, kapitel,
          nyckelämnen och personer för att både besökare och sökmotorer enkelt ska förstå innehållet.
        </p>
      </section>

      <EpisodeSearch episodes={episodeListItems} />
    </div>
  );
}
