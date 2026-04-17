import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getEpisodeMeta } from "@/content/episode-meta";
import { siteConfig } from "@/config/site";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { EpisodeCard } from "@/components/episode-card";
import { SeekableAudioPlayerFromQuery } from "@/components/seekable-audio-player";
import { TranscriptView } from "@/components/transcript-view";
import { getEpisodeBySlug, getEpisodes, getRelatedEpisodes } from "@/lib/episodes";
import { formatEpisodeDate, formatEpisodeDuration } from "@/lib/text";
import {
  buildBreadcrumbJsonLd,
  buildEpisodeJsonLd,
  buildEpisodeSeoDescription,
  buildEpisodeSeoTitle,
  buildTranscriptText,
  serializeJsonLd,
} from "@/lib/seo";
import { toSemanticSlug, toSemanticTopicSlug } from "@/lib/semantic";
import { getTranscriptForEpisode } from "@/lib/transcripts";
import { buildYouTubeSearchUrl, getYouTubeVideoForTitle } from "@/lib/youtube";

export const revalidate = 3600;
export const dynamicParams = true;

type EpisodePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const episodes = await getEpisodes();

  return episodes.map((episode) => ({
    slug: episode.slug,
  }));
}

export async function generateMetadata({
  params,
}: EpisodePageProps): Promise<Metadata> {
  const { slug } = await params;
  const episode = await getEpisodeBySlug(slug);
  const episodeMeta = episode ? getEpisodeMeta(episode.slug) : null;

  if (!episode) {
    return {
      title: "Avsnitt saknas",
    };
  }

  const description = buildEpisodeSeoDescription({
    summary: episodeMeta?.summary[0],
    excerpt: episode.excerpt,
    description: episode.descriptionText,
    topics: episodeMeta?.topics,
  });
  const seoTitle = buildEpisodeSeoTitle(episode.title, episodeMeta?.topics);

  return {
    title: seoTitle,
    description,
    keywords: episodeMeta?.topics,
    authors: [{ name: siteConfig.creator, url: `${siteConfig.siteUrl}/om-joel` }],
    alternates: {
      canonical: `/episodes/${episode.slug}`,
    },
    openGraph: {
      type: "article",
      url: `${siteConfig.siteUrl}/episodes/${episode.slug}`,
      title: seoTitle,
      description,
      publishedTime: episode.publishedAt,
      images: [
        {
          url: episode.imageUrl || siteConfig.defaultImage,
          width: 1200,
          height: 1200,
          alt: episode.title,
        },
      ],
    },
  };
}

export default async function EpisodePage({ params }: EpisodePageProps) {
  const { slug } = await params;
  const episode = await getEpisodeBySlug(slug);

  if (!episode) {
    notFound();
  }

  const [transcript, relatedEpisodes, youtubeVideo] = await Promise.all([
    getTranscriptForEpisode(episode),
    getRelatedEpisodes(episode, 3),
    getYouTubeVideoForTitle(episode.title, { episodeSlug: episode.slug }),
  ]);
  const episodeMeta = getEpisodeMeta(episode.slug);
  const episodeJsonLd = buildEpisodeJsonLd(episode, {
    transcriptText: transcript ? buildTranscriptText(transcript.cues) : undefined,
    topics: episodeMeta?.topics,
    entities: episodeMeta?.entities,
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Hem", url: siteConfig.siteUrl },
    { name: "Avsnitt", url: `${siteConfig.siteUrl}/episodes` },
    { name: episode.title, url: `${siteConfig.siteUrl}/episodes/${episode.slug}` },
  ]);

  return (
    <div className="container pageStack">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(episodeJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />

      <Breadcrumbs
        items={[
          { label: "Hem", href: "/" },
          { label: "Avsnitt", href: "/episodes" },
          { label: episode.title },
        ]}
      />

      <article className="episodePage">
        <section className="episodeHero" aria-labelledby="episode-title">
          <div className="episodeHeroCopy">
            <div className="episodeOverline">
              <p className="eyebrow">Avsnitt</p>

              <div className="episodeOverlineMeta">
                <span>{formatEpisodeDate(episode.publishedAt)}</span>
                {episode.duration ? <span>{formatEpisodeDuration(episode.duration)}</span> : null}
                {!transcript ? <span>Transkript kommer snart</span> : null}
              </div>
            </div>

            <h1 id="episode-title">{episode.title}</h1>

            <p className="episodeHostLine">
              Intervju med <Link href="/om-joel">Joel Löwenberg</Link>
            </p>

            <div className="richText episodeDescription" id="episode-description">
              {episode.descriptionParagraphs.map((paragraph, index) => (
                <p key={`${episode.guid}-paragraph-${index}`}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="episodeImageShell">
            <Image
              src={episode.imageUrl}
              alt={episode.title}
              width={900}
              height={900}
              priority
              sizes="(max-width: 767px) 100vw, (max-width: 1200px) 45vw, 520px"
              className="episodeHeroImage"
            />
          </div>
        </section>

        <section id="episode-audio-section" className="contentPanel" aria-labelledby="episode-audio-heading">
          <Suspense
            fallback={
              <>
                <div className="sectionHeading">
                  <h2 id="episode-audio-heading">Lyssna</h2>
                </div>
                <audio controls preload="none" className="audioPlayer">
                  <source src={episode.audioUrl} />
                  Din webbläsare stödjer inte ljudspelaren.
                </audio>
              </>
            }
          >
            <SeekableAudioPlayerFromQuery audioUrl={episode.audioUrl} />
          </Suspense>
        </section>

        <section className="contentPanel" aria-labelledby="episode-youtube-heading">
          <div className="sectionHeading">
            <h2 id="episode-youtube-heading">YouTube</h2>
          </div>
          {youtubeVideo ? (
            <div className="youtubeEmbed">
              <iframe
                src={youtubeVideo.embedUrl}
                title={`YouTube - ${episode.title}`}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="emptyStateBlock">
              <p>
                Vi hittar ingen exakt video i YouTube-flödet ännu. Öppna sökningen eller
                spellistan så hittar du avsnittet direkt där.
              </p>
              <div className="inlineActions">
                <a
                  className="textLink"
                  href={buildYouTubeSearchUrl(episode.title)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Sök avsnittet på YouTube
                </a>
                <a
                  className="textLink"
                  href={siteConfig.links.youtube}
                  target="_blank"
                  rel="noreferrer"
                >
                  Öppna spellistan
                </a>
              </div>
            </div>
          )}
        </section>

        {episodeMeta ? (
          <section className="contentPanel episodeGuidePanel" aria-labelledby="episode-guide-heading">
            <div className="sectionHeading">
              <h2 id="episode-guide-heading">Det här pratar de om</h2>
            </div>

            <div className="episodeGuideGrid">
              <div className="episodeGuideBlock">
                <h3>Sammanfattning</h3>
                <div className="richText">
                  {episodeMeta.summary.map((paragraph, index) => (
                    <p key={`${episode.slug}-summary-${index}`}>{paragraph}</p>
                  ))}
                </div>
              </div>

              <div className="episodeGuideBlock">
                <h3>Nyckelämnen</h3>
                <div className="topicChipList">
                  {episodeMeta.topics.map((topic) => (
                    <Link
                      key={topic}
                      href={`/amnen/${toSemanticTopicSlug(topic)}#results`}
                      className="topicChip"
                    >
                      {topic}
                    </Link>
                  ))}
                </div>
              </div>

              {episodeMeta.entities?.length ? (
                <div className="episodeGuideBlock">
                  <h3>Personer och bolag</h3>
                  <div className="topicChipList">
                    {episodeMeta.entities.map((entity) => (
                      <Link
                        key={entity}
                        href={`/personer/${toSemanticSlug(entity)}#results`}
                        className="topicChip topicChipMuted"
                      >
                        {entity}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="episodeGuideBlock chapterBlock">
                <h3>Kapitel</h3>
                <ol className="chapterList">
                  {episodeMeta.chapters.map((chapter) => (
                    <li key={`${episode.slug}-${chapter.start}-${chapter.title}`} className="chapterItem">
                      <div className="chapterHeading">
                        <time dateTime={chapter.start}>{chapter.start}</time>
                        <span>{chapter.title}</span>
                      </div>
                      {chapter.summary ? <p>{chapter.summary}</p> : null}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>
        ) : null}

        {transcript ? (
          <details className="contentPanel transcriptPanel" aria-labelledby="episode-transcript-heading">
            <summary className="transcriptToggle">
              <h2 id="episode-transcript-heading">Transkript</h2>
              <span className="transcriptChevron" aria-hidden="true" />
            </summary>

            <TranscriptView cues={transcript.cues} episodeTitle={episode.title} />
          </details>
        ) : (
          <section className="contentPanel" aria-labelledby="episode-transcript-heading">
            <div className="sectionHeading">
              <h2 id="episode-transcript-heading">Transkript</h2>
            </div>

            <p className="emptyState">
              Transkription kommer snart.
            </p>
          </section>
        )}
      </article>

      <section className="section">
        <div className="sectionHeading">
          <h2>{episodeMeta ? "Relaterade avsnitt" : "Fler avsnitt"}</h2>
          <Link href="/episodes" className="textLink sectionHeadingLink">
            Alla avsnitt
          </Link>
        </div>

        <div className="episodeGrid">
          {relatedEpisodes.map((relatedEpisode) => (
            <EpisodeCard key={relatedEpisode.guid} episode={relatedEpisode} />
          ))}
        </div>
      </section>
    </div>
  );
}
