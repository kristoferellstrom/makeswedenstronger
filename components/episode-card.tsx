import Image from "next/image";
import Link from "next/link";

import { formatEpisodeDate, formatEpisodeDuration, formatSecondsAsClock } from "@/lib/text";
import type { EpisodeListItem } from "@/lib/types";

type EpisodeCardProps = {
  episode: EpisodeListItem;
  seekSeconds?: number;
  seekLabel?: string;
};

export function EpisodeCard({ episode, seekSeconds, seekLabel }: EpisodeCardProps) {
  const hasSeek = typeof seekSeconds === "number" && Number.isFinite(seekSeconds) && seekSeconds >= 0;
  const episodeBaseHref = `/episodes/${episode.slug}`;
  const seekParams = new URLSearchParams();

  if (hasSeek) {
    seekParams.set("t", String(Math.floor(seekSeconds)));

    if (seekLabel?.trim()) {
      seekParams.set("from", seekLabel.trim());
    }
  }

  const seekQuery = seekParams.toString();
  const episodeHref = hasSeek ? `${episodeBaseHref}?${seekQuery}` : episodeBaseHref;
  const episodeAudioHref = hasSeek
    ? `${episodeBaseHref}?${seekQuery}#episode-audio-heading`
    : `${episodeBaseHref}#episode-audio-heading`;

  return (
    <article className="episodeCard">
      <Link href={episodeHref} className="episodeCardImageLink">
        <Image
          src={episode.imageUrl}
          alt={episode.title}
          width={640}
          height={640}
          sizes="(max-width: 767px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="episodeCardImage"
        />
      </Link>

      <div className="episodeCardBody">
        <div className="episodeMetaRow">
          <span>{formatEpisodeDate(episode.publishedAt)}</span>
          {episode.duration ? <span>{formatEpisodeDuration(episode.duration)}</span> : null}
        </div>

        {!episode.hasTranscript ? (
          <div className="badgeRow">
            <span className="statusBadge isMissing">Transkript saknas</span>
          </div>
        ) : null}

        <h3 className="episodeCardTitle">
          <Link href={episodeHref}>{episode.title}</Link>
        </h3>

        <p className="episodeCardExcerpt">{episode.excerpt}</p>

        <div className="episodeActionRow">
          <Link href={episodeHref} className="textLink episodeActionLink">
            Öppna avsnitt
          </Link>
          {hasSeek ? (
            <Link href={episodeAudioHref} className="buttonPrimary episodeCardPlayButton">
              Lyssna från {formatSecondsAsClock(seekSeconds)}
            </Link>
          ) : (
            <Link href={episodeAudioHref} className="buttonPrimary episodeCardPlayButton">
              Spela avsnitt
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
