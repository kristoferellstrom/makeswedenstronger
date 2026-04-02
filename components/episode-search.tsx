"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { formatEpisodeDate, formatEpisodeDuration, normalizeSearchText } from "@/lib/text";
import type { EpisodeListItem } from "@/lib/types";

type EpisodeSearchProps = {
  episodes: EpisodeListItem[];
};

export function EpisodeSearch({ episodes }: EpisodeSearchProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = normalizeSearchText(query);
  const [filteredEpisodes, setFilteredEpisodes] = useState<EpisodeListItem[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const localSearchIndex = useMemo(
    () =>
      episodes.map((episode) => ({
        episode,
        searchText: normalizeSearchText(`${episode.title} ${episode.excerpt}`),
      })),
    [episodes],
  );

  const localFilteredEpisodes = useMemo(() => {
    if (!normalizedQuery) {
      return episodes;
    }

    const queryTokens = normalizedQuery.split(" ").filter(Boolean);

    return localSearchIndex
      .filter(({ searchText }) => queryTokens.every((token) => searchText.includes(token)))
      .map(({ episode }) => episode);
  }, [episodes, localSearchIndex, normalizedQuery]);

  useEffect(() => {
    setFilteredEpisodes(null);

    if (!normalizedQuery || normalizedQuery.length < 3) {
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setIsSearching(true);

      void fetch(`/api/episodes/search?query=${encodeURIComponent(normalizedQuery)}`, {
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
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [normalizedQuery]);

  const displayedEpisodes = filteredEpisodes ?? localFilteredEpisodes;

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
        Visar {displayedEpisodes.length} av {episodes.length} avsnitt
        {isSearching ? " ..." : ""}
      </p>

      <div className="episodeList">
        {displayedEpisodes.map((episode) => (
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
