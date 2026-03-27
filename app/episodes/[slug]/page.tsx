import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { siteConfig } from "@/config/site";
import { EpisodeCard } from "@/components/episode-card";
import { TranscriptView } from "@/components/transcript-view";
import { getEpisodeBySlug, getEpisodes, getRelatedEpisodes } from "@/lib/episodes";
import { formatEpisodeDate, formatEpisodeDuration } from "@/lib/text";
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

  return (
    <div className="container pageStack">
      <article className="episodePage">
        <section className="episodeHero">
          <div className="episodeHeroCopy">
            <div className="episodeOverline">
              <p className="eyebrow">Avsnitt</p>

              <div className="episodeOverlineMeta">
                <span>{formatEpisodeDate(episode.publishedAt)}</span>
                {episode.duration ? <span>{formatEpisodeDuration(episode.duration)}</span> : null}
                {!transcript ? <span>Transkript kommer snart</span> : null}
              </div>
            </div>

            <h1>{episode.title}</h1>

            <div className="richText episodeDescription">
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

        <section className="contentPanel">
          <div className="sectionHeading">
            <h2>Lyssna</h2>
          </div>
          <audio controls preload="none" className="audioPlayer">
            <source src={episode.audioUrl} />
            Din webbläsare stödjer inte ljudspelaren.
          </audio>
        </section>

        {transcript ? (
          <details className="contentPanel transcriptPanel">
            <summary className="transcriptToggle">
              <h2>Transkript</h2>
              <span className="transcriptChevron" aria-hidden="true" />
            </summary>

            <TranscriptView cues={transcript.cues} episodeTitle={episode.title} />
          </details>
        ) : (
          <section className="contentPanel">
            <div className="sectionHeading">
              <h2>Transkript</h2>
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
