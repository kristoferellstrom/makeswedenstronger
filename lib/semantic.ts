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

type MutableSemanticEntry = {
  slug: string;
  label: string;
  episodes: EpisodeListItem[];
  aliasSlugs: Set<string>;
  labelCounts: Map<string, number>;
};

function toSemanticKey(value: string) {
  return normalizeSearchText(value);
}

function toSemanticSlugFromKey(key: string) {
  return key.replace(/\s+/g, "-");
}

export function toSemanticSlug(value: string) {
  return toSemanticSlugFromKey(toSemanticKey(value));
}

const topicStemSuffixes = [
  "ningar",
  "ingar",
  "elser",
  "heter",
  "erna",
  "orna",
  "arna",
  "ing",
  "are",
  "ers",
  "er",
  "ar",
  "or",
] as const;

function stemTopicToken(token: string) {
  if (token.length < 5) {
    return token;
  }

  for (const suffix of topicStemSuffixes) {
    if (token.length > suffix.length + 2 && token.endsWith(suffix)) {
      return token.slice(0, -suffix.length);
    }
  }

  return token;
}

function toTopicGroupingKey(value: string) {
  const normalized = toSemanticKey(value);

  if (!normalized) {
    return "";
  }

  return normalized
    .split(" ")
    .map((token) => stemTopicToken(token))
    .filter(Boolean)
    .join(" ");
}

export function toSemanticTopicSlug(value: string) {
  const topicKey = toTopicGroupingKey(value);

  if (!topicKey) {
    return toSemanticSlug(value);
  }

  return toSemanticSlugFromKey(topicKey);
}

function pickPreferredLabel(labelCounts: Map<string, number>) {
  const sorted = Array.from(labelCounts.entries()).sort((left, right) => {
    if (right[1] !== left[1]) {
      return right[1] - left[1];
    }

    if (left[0].length !== right[0].length) {
      return left[0].length - right[0].length;
    }

    return left[0].localeCompare(right[0], "sv");
  });

  return sorted[0]?.[0] ?? "";
}

function addEntry(
  map: Map<string, MutableSemanticEntry>,
  label: string,
  episode: EpisodeListItem,
  options?: {
    groupingKey?: string;
  },
) {
  const key = toSemanticKey(options?.groupingKey ?? label);

  if (!key) {
    return;
  }

  const aliasSlug = toSemanticSlug(label);
  const existing = map.get(key);

  if (!existing) {
    map.set(key, {
      slug: aliasSlug,
      label,
      episodes: [episode],
      aliasSlugs: new Set(aliasSlug ? [aliasSlug] : []),
      labelCounts: new Map([[label, 1]]),
    });

    return;
  }

  if (aliasSlug) {
    existing.aliasSlugs.add(aliasSlug);
  }

  existing.labelCounts.set(label, (existing.labelCounts.get(label) ?? 0) + 1);

  if (existing.episodes.some((entry) => entry.slug === episode.slug)) {
    return;
  }

  existing.episodes.push(episode);
}

const getSemanticDirectoryIndex = cache(async () => {
  const listItems = await getEpisodeListItems();
  const itemBySlug = new Map(listItems.map((item) => [item.slug, item]));
  const topicMap = new Map<string, MutableSemanticEntry>();
  const entityMap = new Map<string, MutableSemanticEntry>();

  for (const item of listItems) {
    const listItem = itemBySlug.get(item.slug);
    const meta = getEpisodeMeta(item.slug);

    if (!listItem || !meta) {
      continue;
    }

    for (const topic of meta.topics) {
      addEntry(topicMap, topic, listItem, {
        groupingKey: toTopicGroupingKey(topic),
      });
    }

    for (const entity of meta.entities ?? []) {
      addEntry(entityMap, entity, listItem);
    }
  }

  const byPublishedDateDesc = (left: EpisodeListItem, right: EpisodeListItem) =>
    new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime();

  const topicsWithAliases = Array.from(topicMap.values())
    .map((entry) => {
      const preferredLabel = pickPreferredLabel(entry.labelCounts) || entry.label;
      const preferredSlug = toSemanticSlug(preferredLabel) || entry.slug;
      const aliasSlugs = new Set(entry.aliasSlugs);

      if (preferredSlug) {
        aliasSlugs.add(preferredSlug);
      }

      return {
        entry: {
          slug: preferredSlug,
          label: preferredLabel,
          episodes: [...entry.episodes].sort(byPublishedDateDesc),
        } satisfies SemanticEntry,
        aliasSlugs,
      };
    })
    .sort((a, b) => a.entry.label.localeCompare(b.entry.label, "sv"));

  const topics = topicsWithAliases.map((item) => item.entry);
  const topicBySlug = new Map<string, SemanticEntry>();
  const topicRouteSlugSet = new Set<string>();

  for (const { entry, aliasSlugs } of topicsWithAliases) {
    for (const aliasSlug of aliasSlugs) {
      if (!aliasSlug) {
        continue;
      }

      if (!topicBySlug.has(aliasSlug)) {
        topicBySlug.set(aliasSlug, entry);
      }

      topicRouteSlugSet.add(aliasSlug);
    }

    topicBySlug.set(entry.slug, entry);
    topicRouteSlugSet.add(entry.slug);
  }

  const topicRouteSlugs = Array.from(topicRouteSlugSet).sort((a, b) => a.localeCompare(b, "sv"));

  const entities = Array.from(entityMap.values())
    .map((entry) => {
      const preferredLabel = pickPreferredLabel(entry.labelCounts) || entry.label;
      const preferredSlug = toSemanticSlug(preferredLabel) || entry.slug;

      return {
        slug: preferredSlug,
        label: preferredLabel,
        episodes: [...entry.episodes].sort(byPublishedDateDesc),
      } satisfies SemanticEntry;
    })
    .sort((a, b) => a.label.localeCompare(b.label, "sv"));
  const entityBySlug = new Map(entities.map((entry) => [entry.slug, entry]));

  return {
    topics,
    entities,
    topicBySlug,
    entityBySlug,
    topicRouteSlugs,
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

export async function getSemanticTopicRouteSlugs() {
  return (await getSemanticDirectoryIndex()).topicRouteSlugs;
}

export async function getSemanticTopicBySlug(slug: string) {
  const normalizedSlug = toSemanticSlug(slug);
  return (await getSemanticDirectoryIndex()).topicBySlug.get(normalizedSlug) ?? null;
}

export async function getSemanticEntityBySlug(slug: string) {
  const normalizedSlug = toSemanticSlug(slug);
  return (await getSemanticDirectoryIndex()).entityBySlug.get(normalizedSlug) ?? null;
}
