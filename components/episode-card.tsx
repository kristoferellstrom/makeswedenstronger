import Image from "next/image";
import Link from "next/link";

import { formatEpisodeDate, formatEpisodeDuration } from "@/lib/text";
import type { EpisodeListItem } from "@/lib/types";

type EpisodeCardProps = {
  episode: EpisodeListItem;
};

export function EpisodeCard({ episode }: EpisodeCardProps) {
  return (
    <article className="episodeCard">
      <Link href={`/episodes/${episode.slug}`} className="episodeCardImageLink">
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
          <Link href={`/episodes/${episode.slug}`}>{episode.title}</Link>
        </h3>

        <p className="episodeCardExcerpt">{episode.excerpt}</p>

        <Link href={`/episodes/${episode.slug}`} className="textLink episodeActionLink">
          Läs och lyssna
        </Link>
      </div>
    </article>
  );
}
