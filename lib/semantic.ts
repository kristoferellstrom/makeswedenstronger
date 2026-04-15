import { cache } from "react";

import { getEpisodeMeta } from "@/content/episode-meta";
import { getEpisodeListItems } from "@/lib/episodes";
import { normalizeSearchText } from "@/lib/text";
import type { EpisodeListItem } from "@/lib/types";

export type SemanticEntry = {
  slug: string;
  label: string;
  episodes: EpisodeListItem[];
};

function toSemanticKey(value: string) {
  return normalizeSearchText(value);
}

export function toSemanticSlug(value: string) {
  return toSemanticKey(value).replace(/\s+/g, "-");
}

function addEntry(
  map: Map<string, SemanticEntry>,
  label: string,
  episode: EpisodeListItem,
) {
  const key = toSemanticKey(label);

  if (!key) {
    return;
  }

  const existing = map.get(key);

  if (!existing) {
    map.set(key, {
      slug: toSemanticSlug(label),
      label,
      episodes: [episode],
    });

    return;
  }

  if (existing.episodes.some((entry) => entry.slug === episode.slug)) {
    return;
  }

  existing.episodes.push(episode);
}

const getSemanticDirectoryIndex = cache(async () => {
  const listItems = await getEpisodeListItems();
  const itemBySlug = new Map(listItems.map((item) => [item.slug, item]));
  const topicMap = new Map<string, SemanticEntry>();
  const entityMap = new Map<string, SemanticEntry>();

  for (const item of listItems) {
    const listItem = itemBySlug.get(item.slug);
    const meta = getEpisodeMeta(item.slug);

    if (!listItem || !meta) {
      continue;
    }

    for (const topic of meta.topics) {
      addEntry(topicMap, topic, listItem);
    }

    for (const entity of meta.entities ?? []) {
      addEntry(entityMap, entity, listItem);
    }
  }

  const byPublishedDateDesc = (left: EpisodeListItem, right: EpisodeListItem) =>
    new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime();

  const topics = Array.from(topicMap.values())
    .map((entry) => ({
      ...entry,
      episodes: [...entry.episodes].sort(byPublishedDateDesc),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "sv"));
  const entities = Array.from(entityMap.values())
    .map((entry) => ({
      ...entry,
      episodes: [...entry.episodes].sort(byPublishedDateDesc),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "sv"));

  return {
    topics,
    entities,
  };
});

export async function getSemanticDirectoryEntries() {
  return getSemanticDirectoryIndex();
}

export async function getSemanticTopicEntries() {
  return (await getSemanticDirectoryIndex()).topics;
}

export async function getSemanticEntityEntries() {
  return (await getSemanticDirectoryIndex()).entities;
}

export async function getSemanticTopicBySlug(slug: string) {
  const normalizedSlug = toSemanticSlug(slug);
  return (await getSemanticDirectoryIndex()).topics.find((entry) => entry.slug === normalizedSlug) ?? null;
}

export async function getSemanticEntityBySlug(slug: string) {
  const normalizedSlug = toSemanticSlug(slug);
  return (
    (await getSemanticDirectoryIndex()).entities.find((entry) => entry.slug === normalizedSlug) ?? null
  );
}
