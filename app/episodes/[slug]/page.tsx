import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getEpisodeMeta } from "@/content/episode-meta";
import { siteConfig } from "@/config/site";
import { EpisodeCard } from "@/components/episode-card";
import { TranscriptView } from "@/components/transcript-view";
import { getEpisodeBySlug, getEpisodes, getRelatedEpisodes } from "@/lib/episodes";
import { formatEpisodeDate, formatEpisodeDuration } from "@/lib/text";
import { buildEpisodeJsonLd, buildTranscriptText, serializeJsonLd } from "@/lib/seo";
import { getTranscriptForEpisode } from "@/lib/transcripts";

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

  if (!episode) {
    return {
      title: "Avsnitt saknas",
    };
  }

  const description = episode.excerpt || episode.descriptionText || siteConfig.description;

  return {
    title: episode.title,
    description,
    alternates: {
      canonical: `/episodes/${episode.slug}`,
    },
    openGraph: {
      type: "article",
      url: `${siteConfig.siteUrl}/episodes/${episode.slug}`,
      title: episode.title,
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

  const [transcript, relatedEpisodes] = await Promise.all([
    getTranscriptForEpisode(episode),
    getRelatedEpisodes(episode, 3),
  ]);
  const episodeMeta = getEpisodeMeta(episode.slug);
  const episodeJsonLd = buildEpisodeJsonLd(episode, {
    transcriptText: transcript ? buildTranscriptText(transcript.cues) : undefined,
    topics: episodeMeta?.topics,
    entities: episodeMeta?.entities,
  });

  return (
    <div className="container pageStack">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(episodeJsonLd) }}
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
              className="episodeHeroImage"
            />
          </div>
        </section>

        <section className="contentPanel" aria-labelledby="episode-audio-heading">
          <div className="sectionHeading">
            <h2 id="episode-audio-heading">Lyssna</h2>
          </div>
          <audio controls preload="none" className="audioPlayer">
            <source src={episode.audioUrl} />
            Din webbläsare stödjer inte ljudspelaren.
          </audio>
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
                <h3>Nyckelamnen</h3>
                <div className="topicChipList">
                  {episodeMeta.topics.map((topic) => (
                    <span key={topic} className="topicChip">{topic}</span>
                  ))}
                </div>
              </div>

              {episodeMeta.entities?.length ? (
                <div className="episodeGuideBlock">
                  <h3>Personer och bolag</h3>
                  <div className="topicChipList">
                    {episodeMeta.entities.map((entity) => (
                      <span key={entity} className="topicChip topicChipMuted">{entity}</span>
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
          <h2>Fler avsnitt</h2>
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
