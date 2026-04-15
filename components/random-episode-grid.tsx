"use client";

import { useMemo } from "react";

import { EpisodeCard } from "@/components/episode-card";
import type { EpisodeListItem } from "@/lib/types";

type RandomEpisodeGridProps = {
  episodes: EpisodeListItem[];
  count?: number;
};

function pickRandomEpisodes(episodes: EpisodeListItem[], count: number) {
  if (episodes.length <= count) {
    return episodes;
  }

  const pool = [...episodes];

  for (let index = pool.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [pool[index], pool[randomIndex]] = [pool[randomIndex], pool[index]];
  }

  return pool.slice(0, count);
}

export function RandomEpisodeGrid({ episodes, count = 3 }: RandomEpisodeGridProps) {
  const randomEpisodes = useMemo(() => pickRandomEpisodes(episodes, count), [episodes, count]);

  return (
    <div className="episodeGrid">
      {randomEpisodes.map((episode) => (
        <EpisodeCard key={episode.guid} episode={episode} />
      ))}
    </div>
  );
}

