import type { Metadata } from "next";
import { Suspense } from "react";

import { SemanticDirectory } from "@/components/semantic-directory";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getEpisodeListItems, getEpisodes } from "@/lib/episodes";
import { getEpisodeMeta } from "@/content/episode-meta";
import { normalizeSearchText } from "@/lib/text";
import { siteConfig } from "@/config/site";
import { buildBreadcrumbJsonLd, serializeJsonLd } from "@/lib/seo";
import type { EpisodeListItem } from "@/lib/types";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Ämnen och personer",
  description:
    "Bläddra bland ämnen, personer och bolag och hitta relaterade avsnitt i Make Sweden Stronger.",
  alternates: {
    canonical: "/amnen",
  },
  openGraph: {
    type: "website",
    url: `${siteConfig.siteUrl}/amnen`,
    title: `Ämnen och personer | ${siteConfig.name}`,
    description:
      "Bläddra bland ämnen, personer och bolag och hitta relaterade avsnitt i Make Sweden Stronger.",
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
    title: `Ämnen och personer | ${siteConfig.name}`,
    description:
      "Bläddra bland ämnen, personer och bolag och hitta relaterade avsnitt i Make Sweden Stronger.",
    images: [siteConfig.defaultImage],
  },
};

type SemanticEntry = {
  label: string;
  episodes: EpisodeListItem[];
};

function toKey(value: string) {
  return normalizeSearchText(value);
}

export default async function TopicsPage() {
  const [episodes, listItems] = await Promise.all([getEpisodes(), getEpisodeListItems()]);
  const listItemBySlug = new Map(listItems.map((item) => [item.slug, item]));
  const topicMap = new Map<string, SemanticEntry>();
  const entityMap = new Map<string, SemanticEntry>();

  for (const episode of episodes) {
    const meta = getEpisodeMeta(episode.slug);
    const listItem = listItemBySlug.get(episode.slug);

    if (!meta || !listItem) {
      continue;
    }

    for (const topic of meta.topics) {
      const key = toKey(topic);
      const entry = topicMap.get(key) ?? { label: topic, episodes: [] };

      if (!entry.episodes.some((item) => item.slug === listItem.slug)) {
        entry.episodes.push(listItem);
      }

      topicMap.set(key, entry);
    }

    for (const entity of meta.entities ?? []) {
      const key = toKey(entity);
      const entry = entityMap.get(key) ?? { label: entity, episodes: [] };

      if (!entry.episodes.some((item) => item.slug === listItem.slug)) {
        entry.episodes.push(listItem);
      }

      entityMap.set(key, entry);
    }
  }

  const topics = Array.from(topicMap.values()).sort((a, b) =>
    a.label.localeCompare(b.label, "sv"),
  );
  const entities = Array.from(entityMap.values()).sort((a, b) =>
    a.label.localeCompare(b.label, "sv"),
  );

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Hem", url: siteConfig.siteUrl },
    { name: "Ämnen", url: `${siteConfig.siteUrl}/amnen` },
  ]);

  return (
    <div className="container pageStack">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />

      <Breadcrumbs
        items={[
          { label: "Hem", href: "/" },
          { label: "Ämnen" },
        ]}
      />

      <section className="pageIntro">
        <h1 className="archiveTitle">Ämnen och personer</h1>
      </section>

      <Suspense fallback={<p className="emptyState">Laddar…</p>}>
        <SemanticDirectory topics={topics} entities={entities} />
      </Suspense>
    </div>
  );
}
