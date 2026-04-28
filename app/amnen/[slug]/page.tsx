import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getEpisodeMeta } from "@/content/episode-meta";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { EpisodeCard } from "@/components/episode-card";
import { siteConfig } from "@/config/site";
import {
  getSemanticTopicBySlug,
  getSemanticTopicEntries,
  getSemanticTopicRouteSlugs,
  toSemanticTopicSlug,
} from "@/lib/semantic";
import {
  buildBreadcrumbJsonLd,
  buildSemanticCollectionJsonLd,
  serializeJsonLd,
} from "@/lib/seo";

export const revalidate = 86400;
export const dynamicParams = false;

type TopicPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const slugs = await getSemanticTopicRouteSlugs();

  return slugs.map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({ params }: TopicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const topic = await getSemanticTopicBySlug(slug);

  if (!topic) {
    return {
      title: "Ämnet hittades inte",
    };
  }

  const description = `${topic.episodes.length} avsnitt som handlar om ${topic.label} i Make Sweden Stronger.`;

  return {
    title: `Ämne: ${topic.label}`,
    description,
    alternates: {
      canonical: `/amnen/${topic.slug}`,
    },
    openGraph: {
      type: "website",
      url: `${siteConfig.siteUrl}/amnen/${topic.slug}`,
      title: `Ämne: ${topic.label} | ${siteConfig.name}`,
      description,
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
      title: `Ämne: ${topic.label} | ${siteConfig.name}`,
      description,
      images: [siteConfig.defaultImage],
    },
  };
}

export default async function TopicPage({ params }: TopicPageProps) {
  const { slug } = await params;
  const [topic, allTopics] = await Promise.all([
    getSemanticTopicBySlug(slug),
    getSemanticTopicEntries(),
  ]);

  if (!topic) {
    notFound();
  }
  const topicSeekKey = toSemanticTopicSlug(topic.label);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Hem", url: siteConfig.siteUrl },
    { name: "Ämnen", url: `${siteConfig.siteUrl}/amnen` },
    { name: topic.label, url: `${siteConfig.siteUrl}/amnen/${topic.slug}` },
  ]);
  const semanticJsonLd = buildSemanticCollectionJsonLd({
    type: "topic",
    label: topic.label,
    urlPath: `/amnen/${topic.slug}`,
    episodes: topic.episodes,
  });

  return (
    <div className="container pageStack">
      {semanticJsonLd.map((entry, index) => (
        <script
          key={`topic-jsonld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(entry) }}
        />
      ))}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />

      <Breadcrumbs
        items={[
          { label: "Hem", href: "/" },
          { label: "Ämnen", href: "/amnen" },
          { label: topic.label },
        ]}
      />

      <section className="pageIntro">
        <p className="eyebrow">Ämne</p>
        <h1 className="archiveTitle">{topic.label}</h1>
        <p className="introCopy">
          {topic.episodes.length} relaterade avsnitt där ämnet {topic.label} är centralt.
        </p>
        <p className="introCopy">
          Här hittar du avsnitt som går djupare i {topic.label}. Öppna ett avsnitt för att se hur
          {" "}{topic.label} diskuteras i sammanfattning, nyckelämnen, personer och kapitel.
        </p>
      </section>

      <section className="section" id="results">
        <div className="sectionHeading">
          <h2>Relaterade avsnitt</h2>
          <Link href="/amnen" className="textLink sectionHeadingLink">
            Alla ämnen
          </Link>
        </div>

        <div className="episodeGrid">
          {topic.episodes.map((episode) => {
            const seekSeconds = getEpisodeMeta(episode.slug)?.topicSeekSeconds?.[topicSeekKey];
            return (
              <EpisodeCard
                key={episode.guid}
                episode={episode}
                seekSeconds={seekSeconds}
                seekLabel={topic.label}
              />
            );
          })}
        </div>
      </section>

      <section className="contentPanel semanticPanel">
        <div className="sectionHeading">
          <h2>Fler ämnen</h2>
        </div>
        <div className="topicChipList">
          {allTopics
            .filter((entry) => entry.slug !== topic.slug)
            .map((entry) => (
              <Link key={entry.slug} href={`/amnen/${entry.slug}#results`} className="topicChip">
                {entry.label}
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
