import { EpisodeCard } from "@/components/episode-card";
import type { EpisodeListItem } from "@/lib/types";

type RandomEpisodeGridProps = {
  episodes: EpisodeListItem[];
  count?: number;
};

function pickRandomEpisodes(episodes: EpisodeListItem[], count: number) {
  const shuffledEpisodes = [...episodes];

  for (let index = shuffledEpisodes.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffledEpisodes[index], shuffledEpisodes[randomIndex]] = [
      shuffledEpisodes[randomIndex],
      shuffledEpisodes[index],
    ];
  }

  return shuffledEpisodes.slice(0, count);
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
