import { episodeMetaBySlug } from "./episode-meta/index";

export function getEpisodeMeta(slug: string) {
  return episodeMetaBySlug[slug] ?? null;
}
