import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { EpisodeCard } from "@/components/episode-card";
import { siteConfig } from "@/config/site";
import { getSemanticEntityBySlug, getSemanticEntityEntries } from "@/lib/semantic";
import {
  buildBreadcrumbJsonLd,
  buildSemanticCollectionJsonLd,
  serializeJsonLd,
} from "@/lib/seo";

export const revalidate = 3600;
export const dynamicParams = false;

type EntityPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const entities = await getSemanticEntityEntries();

  return entities.map((entity) => ({
    slug: entity.slug,
  }));
}

export async function generateMetadata({ params }: EntityPageProps): Promise<Metadata> {
  const { slug } = await params;
  const entity = await getSemanticEntityBySlug(slug);

  if (!entity) {
    return {
      title: "Person eller bolag hittades inte",
    };
  }

  const description = `${entity.episodes.length} avsnitt där ${entity.label} nämns i Make Sweden Stronger.`;

  return {
    title: `${entity.label} - avsnitt och transkript`,
    description,
    alternates: {
      canonical: `/personer/${entity.slug}`,
    },
    openGraph: {
      type: "website",
      url: `${siteConfig.siteUrl}/personer/${entity.slug}`,
      title: `${entity.label} - avsnitt och transkript | ${siteConfig.name}`,
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
      title: `${entity.label} - avsnitt och transkript | ${siteConfig.name}`,
      description,
      images: [siteConfig.defaultImage],
    },
  };
}

export default async function EntityPage({ params }: EntityPageProps) {
  const { slug } = await params;
  const [entity, allEntities] = await Promise.all([
    getSemanticEntityBySlug(slug),
    getSemanticEntityEntries(),
  ]);

  if (!entity) {
    notFound();
  }

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Hem", url: siteConfig.siteUrl },
    { name: "Ämnen", url: `${siteConfig.siteUrl}/amnen` },
    { name: entity.label, url: `${siteConfig.siteUrl}/personer/${entity.slug}` },
  ]);
  const semanticJsonLd = buildSemanticCollectionJsonLd({
    type: "entity",
    label: entity.label,
    urlPath: `/personer/${entity.slug}`,
    episodes: entity.episodes,
  });

  return (
    <div className="container pageStack">
      {semanticJsonLd.map((entry, index) => (
        <script
          key={`entity-jsonld-${index}`}
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
          { label: entity.label },
        ]}
      />

      <section className="pageIntro">
        <p className="eyebrow">Personer och bolag</p>
        <h1 className="archiveTitle">{entity.label}</h1>
        <p className="introCopy">
          {entity.episodes.length} relaterade avsnitt där namnet förekommer i avsnittsdata.
        </p>
        <p className="introCopy">
          Här ser du avsnitten där personen eller bolaget nämns som central del av innehållet.
          Varje avsnitt har en egen sida med struktur för ämnen, kapitel och transkript, vilket gör
          det enkelt att jämföra resonemang över tid och hitta rätt del i samtalen.
        </p>
      </section>

      <section className="section" id="results">
        <div className="sectionHeading">
          <h2>Relaterade avsnitt</h2>
          <Link href="/amnen" className="textLink sectionHeadingLink">
            Alla ämnen och personer
          </Link>
        </div>

        <div className="episodeGrid">
          {entity.episodes.map((episode) => (
            <EpisodeCard key={episode.guid} episode={episode} />
          ))}
        </div>
      </section>

      <section className="contentPanel semanticPanel">
        <div className="sectionHeading">
          <h2>Fler personer och bolag</h2>
        </div>
        <div className="topicChipList">
          {allEntities
            .filter((entry) => entry.slug !== entity.slug)
            .map((entry) => (
              <Link
                key={entry.slug}
                href={`/personer/${entry.slug}#results`}
                className="topicChip topicChipMuted"
              >
                {entry.label}
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
