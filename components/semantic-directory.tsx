"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { formatEpisodeDate, formatEpisodeDuration, normalizeSearchText } from "@/lib/text";
import type { EpisodeListItem } from "@/lib/types";

type SemanticEntry = {
  label: string;
  episodes: EpisodeListItem[];
};

type SemanticDirectoryProps = {
  topics: SemanticEntry[];
  entities: SemanticEntry[];
};

function findEntry(entries: SemanticEntry[], queryValue: string | null) {
  if (!queryValue) {
    return null;
  }

  const normalizedQuery = normalizeSearchText(queryValue);

  return (
    entries.find((entry) => normalizeSearchText(entry.label) === normalizedQuery) ?? null
  );
}

function intersectEpisodes(
  left: EpisodeListItem[] | null,
  right: EpisodeListItem[] | null,
) {
  if (!left && !right) {
    return null;
  }

  if (!left) {
    return right;
  }

  if (!right) {
    return left;
  }

  const rightSlugs = new Set(right.map((episode) => episode.slug));
  return left.filter((episode) => rightSlugs.has(episode.slug));
}

export function SemanticDirectory({ topics, entities }: SemanticDirectoryProps) {
  const params = useSearchParams();
  const selectedTopic = params.get("topic");
  const selectedEntity = params.get("entity");

  const activeTopic = useMemo(() => findEntry(topics, selectedTopic), [topics, selectedTopic]);
  const activeEntity = useMemo(
    () => findEntry(entities, selectedEntity),
    [entities, selectedEntity],
  );

  const filteredEpisodes = useMemo(
    () => intersectEpisodes(activeTopic?.episodes ?? null, activeEntity?.episodes ?? null),
    [activeEntity, activeTopic],
  );

  const hasFilter = Boolean(activeTopic || activeEntity);

  return (
    <div className="semanticDirectory">
      <section className="contentPanel">
        <div className="sectionHeading">
          <h2>Ämnen</h2>
        </div>
        <div className="topicChipList">
          {topics.map((entry) => (
            <Link
              key={entry.label}
              href={`/amnen?topic=${encodeURIComponent(entry.label)}`}
              className={[
                "topicChip",
                activeTopic?.label === entry.label ? "isActive" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {entry.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="contentPanel">
        <div className="sectionHeading">
          <h2>Personer och bolag</h2>
        </div>
        <div className="topicChipList">
          {entities.map((entry) => (
            <Link
              key={entry.label}
              href={`/amnen?entity=${encodeURIComponent(entry.label)}`}
              className={[
                "topicChip",
                "topicChipMuted",
                activeEntity?.label === entry.label ? "isActive" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {entry.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="contentPanel">
        <div className="sectionHeading">
          <h2>{hasFilter ? "Relaterade avsnitt" : "Välj ett ämne eller namn"}</h2>
          {hasFilter ? (
            <Link href="/amnen" className="textLink sectionHeadingLink">
              Rensa filter
            </Link>
          ) : null}
        </div>

        {filteredEpisodes && filteredEpisodes.length > 0 ? (
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

                  <h3 className="episodeListTitle">
                    <Link href={`/episodes/${episode.slug}`}>{episode.title}</Link>
                  </h3>

                  <p className="episodeListExcerpt">{episode.excerpt}</p>

                  <Link href={`/episodes/${episode.slug}`} className="textLink episodeActionLink">
                    Öppna avsnitt
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="emptyState">
            {hasFilter
              ? "Inga avsnitt matchar den här kombinationen ännu."
              : "Välj ett ämne eller ett namn för att se relaterade avsnitt."}
          </p>
        )}
      </section>
    </div>
  );
}
