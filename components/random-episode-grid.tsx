import { EpisodeCard } from "@/components/episode-card";
import type { EpisodeListItem } from "@/lib/types";

type RandomEpisodeGridProps = {
  episodes: EpisodeListItem[];
  count?: number;
};

function computeStableHash(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function pickRandomEpisodes(episodes: EpisodeListItem[], count: number) {
  if (episodes.length <= count) {
    return episodes;
  }

  return [...episodes]
    .sort((left, right) => {
      const leftScore = computeStableHash(`${left.guid}:${left.slug}`);
      const rightScore = computeStableHash(`${right.guid}:${right.slug}`);
      return leftScore - rightScore;
    })
    .slice(0, count);
}

export function RandomEpisodeGrid({ episodes, count = 3 }: RandomEpisodeGridProps) {
  const randomEpisodes = pickRandomEpisodes(episodes, count);

  return (
    <div className="episodeGrid">
      {randomEpisodes.map((episode) => (
        <EpisodeCard key={episode.guid} episode={episode} />
      ))}
    </div>
  );
}
