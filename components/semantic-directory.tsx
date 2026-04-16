"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { formatEpisodeDate, formatEpisodeDuration, normalizeSearchText } from "@/lib/text";
import type { EpisodeListItem } from "@/lib/types";

type SemanticEntry = {
  slug: string;
  label: string;
  episodes: EpisodeListItem[];
};

type SemanticDirectoryProps = {
  topics: SemanticEntry[];
  entities: SemanticEntry[];
};

type SemanticCategoryGroup = {
  id: string;
  label: string;
  entries: SemanticEntry[];
};

type TopicCategoryRule = {
  id: string;
  label: string;
  keywords: string[];
};

type TopicCategoryRuleNormalized = TopicCategoryRule & {
  normalizedKeywords: string[];
};

type EntityBucket = "people" | "companies" | "other";

const topicCategoryRules: TopicCategoryRule[] = [
  {
    id: "ecommerce",
    label: "E-handel",
    keywords: [
      "e-handel",
      "retail",
      "omnihandel",
      "omnikanal",
      "shopify",
      "klarna",
      "konvertering",
      "sortiment",
      "prissättning",
      "lager",
      "last mile",
      "kundresa",
      "kundupplevelse",
      "d2c",
      "dtc",
    ],
  },
  {
    id: "tech",
    label: "Tech & AI",
    keywords: [
      "ai",
      "automation",
      "tech",
      "data",
      "ga4",
      "dashboard",
      "plattform",
      "app",
      "saas",
      "api",
      "martech",
      "algoritm",
    ],
  },
  {
    id: "startups",
    label: "Startups & Tillväxt",
    keywords: [
      "startup",
      "scaleup",
      "tillväxt",
      "lönsam",
      "riskkapital",
      "kapital",
      "investering",
      "expansion",
      "internationalisering",
      "internationell expansion",
      "bootstrapping",
      "forvarv",
      "m&a",
      "ipo",
    ],
  },
  {
    id: "business",
    label: "Företag & Ledarskap",
    keywords: [
      "ledarskap",
      "företagskultur",
      "organisation",
      "rekrytering",
      "team",
      "styrelse",
      "styrelsearbete",
      "försäljning",
      "entreprenörskap",
      "affärsmodell",
      "strategi",
    ],
  },
  {
    id: "sport-health",
    label: "Sport & Hälsa",
    keywords: [
      "träning",
      "styrke",
      "gym",
      "sport",
      "hälsa",
      "kost",
      "löpning",
      "ufc",
      "mma",
      "crossfit",
      "recovery",
      "idrott",
    ],
  },
  {
    id: "knowledge-media",
    label: "Kunskap & Media",
    keywords: [
      "podcast",
      "journalistik",
      "media",
      "utbildning",
      "kunskap",
      "research",
      "föreläsning",
      "nyhetsbrev",
    ],
  },
  {
    id: "marketing-brand",
    label: "Marknadsföring & Varumärke",
    keywords: [
      "varumärke",
      "brand",
      "branding",
      "marknadsföring",
      "influencer",
      "pr",
      "content",
      "seo",
      "sociala medier",
      "positionering",
      "community",
      "tiktok",
      "instagram",
      "meta ads",
    ],
  },
];

const topicFallbackCategory = {
  id: "other",
  label: "Övriga ämnen",
};

const normalizedTopicCategoryRules: TopicCategoryRuleNormalized[] = topicCategoryRules.map(
  (category) => ({
    ...category,
    normalizedKeywords: category.keywords.map((keyword) => normalizeSearchText(keyword)),
  }),
);

const entityCompanyMarkers = [
  "ab",
  "group",
  "studio",
  "school",
  "academy",
  "akademi",
  "akademin",
  "forbundet",
  "podden",
  "podcast",
  "sweden",
  "sverige",
  "business",
  "commerce",
  "workspace",
  "athletics",
  "plus",
  "labs",
  "lab",
  "store",
  "shop",
  "invest",
  "equity",
  "media",
  "news",
  "logistics",
  "logistik",
  "training",
  "travel",
  "tribe",
  "influencers",
  "forum",
  "handel",
  "universitet",
  "bank",
  "wellness",
  "sauna",
];

const normalizedEntityCompanyMarkers = entityCompanyMarkers.map((marker) =>
  normalizeSearchText(marker),
);

const nonPersonLeadingWords = new Set(
  [
    "new",
    "stockholm",
    "goteborg",
    "oslo",
    "sverige",
    "norge",
    "danmark",
    "usa",
    "uk",
    "europa",
    "norden",
    "kina",
    "japan",
    "finland",
    "tyskland",
    "spanien",
    "portugal",
    "frankrike",
    "polen",
    "taiwan",
    "vietnam",
    "asien",
    "black",
    "world",
    "social",
    "digital",
    "private",
  ].map((word) => normalizeSearchText(word)),
);

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

function includesMarker(
  normalizedLabel: string,
  normalizedWords: string[],
  marker: string,
): boolean {
  if (!marker) {
    return false;
  }

  if (marker.includes(" ")) {
    return normalizedLabel.includes(marker);
  }

  return normalizedWords.includes(marker);
}

function getTopicCategoryId(label: string): string {
  const normalizedLabel = normalizeSearchText(label);

  for (const category of normalizedTopicCategoryRules) {
    if (
      category.normalizedKeywords.some(
        (keyword) => keyword && normalizedLabel.includes(keyword),
      )
    ) {
      return category.id;
    }
  }

  return topicFallbackCategory.id;
}

function buildTopicCategoryGroups(
  entries: SemanticEntry[],
): SemanticCategoryGroup[] {
  const categoryMap = new Map<string, SemanticCategoryGroup>();

  for (const category of topicCategoryRules) {
    categoryMap.set(category.id, {
      id: category.id,
      label: category.label,
      entries: [],
    });
  }

  categoryMap.set(topicFallbackCategory.id, {
    id: topicFallbackCategory.id,
    label: topicFallbackCategory.label,
    entries: [],
  });

  for (const entry of entries) {
    const categoryId = getTopicCategoryId(entry.label);
    const category = categoryMap.get(categoryId) ?? categoryMap.get(topicFallbackCategory.id);

    if (!category) {
      continue;
    }

    category.entries.push(entry);
  }

  return [...categoryMap.values()].filter((group) => group.entries.length > 0);
}

function isLikelyPersonName(label: string): boolean {
  const normalizedLabel = normalizeSearchText(label);
  const normalizedWords = normalizedLabel.split(" ").filter(Boolean);
  const words = label.trim().split(/\s+/).filter(Boolean);
  const firstWord = normalizedWords[0] ?? "";
  const hasDigit = words.some((word) => /\d/.test(word));
  const hasAcronymWord = words.some(
    (word) => word.length > 2 && /[A-ZÅÄÖ]/.test(word) && word === word.toUpperCase(),
  );
  const hasCompanyMarker = normalizedEntityCompanyMarkers.some((marker) =>
    includesMarker(normalizedLabel, normalizedWords, marker),
  );
  const wordsLookLikeNames = words.every((word) =>
    /^[A-ZÅÄÖ][A-Za-zÅÄÖåäöÉéÈèÊêËëÜüÁáÍíÓóÚúÑñ'’.-]*$/.test(word),
  );

  if (words.length < 2 || words.length > 3) {
    return false;
  }

  if (!wordsLookLikeNames || hasDigit || hasAcronymWord) {
    return false;
  }

  if (nonPersonLeadingWords.has(firstWord)) {
    return false;
  }

  return !hasCompanyMarker;
}

function classifyEntity(entry: SemanticEntry): EntityBucket {
  if (isLikelyPersonName(entry.label)) {
    return "people";
  }

  const normalizedLabel = normalizeSearchText(entry.label);
  const normalizedWords = normalizedLabel.split(" ").filter(Boolean);
  const words = entry.label.trim().split(/\s+/).filter(Boolean);
  const hasDigit = words.some((word) => /\d/.test(word));
  const hasAcronymWord = words.some(
    (word) => word.length > 2 && /[A-ZÅÄÖ]/.test(word) && word === word.toUpperCase(),
  );
  const hasCompanyMarker = normalizedEntityCompanyMarkers.some((marker) =>
    includesMarker(normalizedLabel, normalizedWords, marker),
  );

  if (hasCompanyMarker || hasAcronymWord || hasDigit || words.length <= 1) {
    return "companies";
  }

  return "other";
}

function buildEntityGroups(
  entries: SemanticEntry[],
): SemanticCategoryGroup[] {
  const groups: Record<EntityBucket, SemanticCategoryGroup> = {
    people: { id: "people", label: "Personer", entries: [] },
    companies: { id: "companies", label: "Företag & varumärken", entries: [] },
    other: { id: "other", label: "Övriga namn", entries: [] },
  };

  for (const entry of entries) {
    const bucket = classifyEntity(entry);
    groups[bucket].entries.push(entry);
  }

  return [groups.people, groups.companies, groups.other].filter(
    (group) => group.entries.length > 0,
  );
}

export function SemanticDirectory({ topics, entities }: SemanticDirectoryProps) {
  const params = useSearchParams();
  const selectedTopic = params.get("topic");
  const selectedEntity = params.get("entity");
  const [query, setQuery] = useState("");
  const normalizedQuery = normalizeSearchText(query);

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
  const filteredTopics = useMemo(() => {
    if (!normalizedQuery) {
      return topics;
    }

    return topics.filter((entry) =>
      normalizeSearchText(entry.label).includes(normalizedQuery),
    );
  }, [normalizedQuery, topics]);

  const filteredEntities = useMemo(() => {
    if (!normalizedQuery) {
      return entities;
    }

    return entities.filter((entry) =>
      normalizeSearchText(entry.label).includes(normalizedQuery),
    );
  }, [entities, normalizedQuery]);

  const topicCategoryGroups = useMemo(
    () => buildTopicCategoryGroups(filteredTopics),
    [filteredTopics],
  );
  const entityCategoryGroups = useMemo(
    () => buildEntityGroups(filteredEntities),
    [filteredEntities],
  );

  return (
    <div className="semanticDirectory">
      <label className="searchField">
        <span>Sök i ämnen, personer och bolag</span>
        <input
          type="search"
          name="topic-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Sök ämne eller namn"
        />
      </label>

      <section className="contentPanel" id="results">
        <div className="sectionHeading">
          <h2>{hasFilter ? "Relaterade avsnitt" : "Välj ett ämne eller namn"}</h2>
          {hasFilter ? (
            <Link href="/amnen#results" className="textLink sectionHeadingLink">
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

      <section className="contentPanel semanticPanel">
        <div className="semanticPanelRow">
          <div className="sectionHeading">
            <h2>Ämnen</h2>
          </div>
          <div className="semanticChipPanel">
            <div className="semanticCategoryStack">
              {topicCategoryGroups.map((group) => (
                <section key={group.id} className="semanticCategoryGroup">
                  <div className="semanticCategoryHeading">
                    <h3 className="semanticCategoryTitle">{group.label}</h3>
                    <span className="semanticCategoryCount">{group.entries.length}</span>
                  </div>
                  <div className="topicChipList">
                    {group.entries.map((entry) => (
                      <Link
                        key={entry.label}
                        href={`/amnen/${entry.slug}#results`}
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
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="contentPanel semanticPanel">
        <div className="semanticPanelRow">
          <div className="sectionHeading">
            <h2>Personer och bolag</h2>
          </div>
          <div className="semanticChipPanel">
            <div className="semanticCategoryStack">
              {entityCategoryGroups.map((group) => (
                <section key={group.id} className="semanticCategoryGroup">
                  <div className="semanticCategoryHeading">
                    <h3 className="semanticCategoryTitle">{group.label}</h3>
                    <span className="semanticCategoryCount">{group.entries.length}</span>
                  </div>
                  <div className="topicChipList">
                    {group.entries.map((entry) => (
                      <Link
                        key={entry.label}
                        href={`/personer/${entry.slug}#results`}
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
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
