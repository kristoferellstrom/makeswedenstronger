import { cache } from "react";

import { getPodcastFeed } from "@/lib/rss";
import {
  getTranscriptForEpisode,
  getTranscriptIndex,
  getTranscriptMatchForEpisode,
} from "@/lib/transcripts";
import { normalizeSearchText } from "@/lib/text";
import type { Episode } from "@/lib/types";

export const getShow = cache(async () => {
  const { show } = await getPodcastFeed();
  return show;
});

export const getEpisodes = cache(async (): Promise<Episode[]> => {
  const [{ episodes }, transcriptIndex] = await Promise.all([
    getPodcastFeed(),
    getTranscriptIndex(),
  ]);

  return episodes.map((episode) => ({
    ...episode,
    hasTranscript: transcriptIndex.has(episode.titleKey),
  }));
});

export async function getEpisodeBySlug(slug: string): Promise<Episode | null> {
  const episodes = await getEpisodes();
  return episodes.find((episode) => episode.slug === slug) ?? null;
}

export async function getLatestEpisodes(limit = 6): Promise<Episode[]> {
  return (await getEpisodes()).slice(0, limit);
}

export async function getRelatedEpisodes(currentEpisode: Episode, limit = 3): Promise<Episode[]> {
  const episodes = await getEpisodes();

  return episodes
    .filter((episode) => episode.slug !== currentEpisode.slug)
    .slice(0, limit);
}

export async function getTranscriptCoverage(): Promise<{
  matchedEpisodes: number;
  totalEpisodes: number;
  transcriptFiles: number;
}> {
  const [episodes, transcriptIndex] = await Promise.all([getEpisodes(), getTranscriptIndex()]);

  return {
    matchedEpisodes: episodes.filter((episode) => episode.hasTranscript).length,
    totalEpisodes: episodes.length,
    transcriptFiles: transcriptIndex.size,
  };
}

export async function hasTranscriptForEpisode(episode: Episode): Promise<boolean> {
  return Boolean(await getTranscriptMatchForEpisode(episode));
}

const getEpisodeSearchIndex = cache(async () => {
  const episodes = await getEpisodes();

  return Promise.all(
    episodes.map(async (episode) => {
      const transcript = episode.hasTranscript ? await getTranscriptForEpisode(episode) : null;
      const transcriptText = transcript
        ? transcript.cues
            .map((cue) => [cue.speaker, cue.text].filter(Boolean).join(" "))
            .join(" ")
        : "";

      return {
        episode,
        searchText: normalizeSearchText(
          `${episode.title} ${episode.descriptionText} ${transcriptText}`,
        ),
      };
    }),
  );
});

export async function searchEpisodes(query: string): Promise<Episode[]> {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return getEpisodes();
  }

  const queryTokens = normalizedQuery.split(" ").filter(Boolean);
  const searchIndex = await getEpisodeSearchIndex();

  return searchIndex
    .filter(({ searchText }) => queryTokens.every((token) => searchText.includes(token)))
    .map(({ episode }) => episode);
}
