"use client";

import { useDeferredValue, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { formatEpisodeDate, formatEpisodeDuration } from "@/lib/text";
import type { EpisodeListItem } from "@/lib/types";

type EpisodeSearchProps = {
  episodes: EpisodeListItem[];
};

export function EpisodeSearch({ episodes }: EpisodeSearchProps) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim());
  const [filteredEpisodes, setFilteredEpisodes] = useState(episodes);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!deferredQuery) {
      setFilteredEpisodes(episodes);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    setIsSearching(true);

    void fetch(`/api/episodes/search?query=${encodeURIComponent(deferredQuery)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Search failed with status ${response.status}`);
        }

        return response.json() as Promise<{ episodes: EpisodeListItem[] }>;
      })
      .then((data) => {
        setFilteredEpisodes(data.episodes);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error(error);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [deferredQuery, episodes]);

  return (
    <div className="searchLayout">
      <label className="searchField">
        <span>Sök bland avsnitt</span>
        <input
          type="search"
          name="query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Skriv namn, bolag eller ämne"
        />
      </label>

      <p className="searchSummary">
        Visar {filteredEpisodes.length} av {episodes.length} avsnitt
        {isSearching ? " ..." : ""}
      </p>

      <div className="episodeList">
        {filteredEpisodes.map((episode) => (
          <article key={episode.guid} className="episodeListItem">
            <Link href={`/episodes/${episode.slug}`} className="episodeListImageLink">
              <Image
                src={episode.imageUrl}
                alt={episode.title}
                width={280}
                height={280}
                sizes="(max-width: 767px) 100vw, 280px"
                className="episodeListImage"
              />
            </Link>

            <div className="episodeListContent">
              <div className="episodeMetaRow">
                <span>{formatEpisodeDate(episode.publishedAt)}</span>
                {episode.duration ? <span>{formatEpisodeDuration(episode.duration)}</span> : null}
              </div>

              {!episode.hasTranscript ? (
                <div className="badgeRow">
                  <span className="statusBadge isMissing">Transkript saknas</span>
                </div>
              ) : null}

              <h2 className="episodeListTitle">
                <Link href={`/episodes/${episode.slug}`}>{episode.title}</Link>
              </h2>

              <p className="episodeListExcerpt">{episode.excerpt}</p>

              <Link href={`/episodes/${episode.slug}`} className="textLink episodeActionLink">
                Öppna avsnitt
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
