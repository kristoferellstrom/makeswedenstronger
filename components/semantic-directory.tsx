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

type SearchSuggestion = {
  id: string;
  label: string;
  href: string;
  kind: "Ämne" | "Person / Företag";
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

const topicPeopleCategory = {
  id: "topic-people",
  label: "Personer",
};

const topicCompaniesCategory = {
  id: "topic-companies",
  label: "Företag & varumärken",
};

const topicCategoryRules: TopicCategoryRule[] = [
  {
    id: "business-strategy",
    label: "Företagande & strategi",
    keywords: [
      "bolagsbyggande",
      "agarperspektiv",
      "ägarperspektiv",
      "delägarskap",
      "familjebolag",
      "börsnotering",
      "börsnoteringar",
      "due diligence",
      "portfoljbolag",
      "smart money",
      "långsiktighet",
      "vision",
      "vändning",
      "etablering",
      "organisatorisk riktning",
      "operations",
      "operativ kontroll",
      "execution",
      "förändringsarbete",
      "change management",
      "professionalisering",
      "konsolidering",
      "entreprenörskap",
      "affärsmodell",
      "strategi",
      "internationalisering",
      "internationell expansion",
      "europaexpansion",
      "uk-expansion",
      "omställning",
      "diversifiering",
      "m&a",
      "företagsförsäljning",
      "avtal",
      "affärsjuridik",
      "ägarresor",
      "konsultbolag",
      "konkurrens",
    ],
  },
  {
    id: "marketing-growth",
    label: "Marknadsföring & tillväxt",
    keywords: [
      "marknadsföring",
      "betald annonsering",
      "creatives",
      "attribution",
      "kundanskaffning",
      "go to market",
      "segmentering",
      "organisk trafik",
      "organisk spridning",
      "söktrafik",
      "rabattkoder",
      "premium online",
      "premiumprodukt",
      "premiumprodukter",
      "differentiering",
      "nyhetsvärde",
      "redaktionella omnämnanden",
      "redaktionell integritet",
      "performance marketing",
      "meta ads",
      "tiktok",
      "instagram",
      "sociala medier",
      "seo",
      "ugc",
      "influencer marketing",
      "influencers",
      "telemarketing",
      "brand safety",
      "roi",
      "varumärke",
      "varumärkesbyggande",
      "varumärkesstrategi",
      "premiumpositionering",
      "prissättning",
      "försäljning",
      "trovärdighet",
      "metaannonsering",
      "tillväxt",
    ],
  },
  {
    id: "ecommerce-retail",
    label: "E-handel & retail",
    keywords: [
      "e-handel",
      "retail",
      "checkout",
      "dagligvaror online",
      "dropshipping",
      "kvallsleveranser",
      "kvällsleveranser",
      "leveransupplevelse",
      "snabba leveranser",
      "lager",
      "lagring",
      "ruttoptimering",
      "mikrohubbar",
      "butiker",
      "pop-up stores",
      "premium skor",
      "konsumentelektronik",
      "vitvaror",
      "smycken",
      "väskor",
      "takbox",
      "lastbilstillbehör",
      "omnihandel",
      "omnikanal",
      "shopify",
      "klarna",
      "nischhandel",
      "cykelhandel",
      "sortimentsstrategi",
      "halloween",
      "prenumerationsaffär",
      "showroom",
      "säsongsaffär",
      "återköp",
      "återförsäljare",
      "3pl",
      "last mile",
    ],
  },
  {
    id: "product-development",
    label: "Produkt & utveckling",
    keywords: [
      "produktlansering",
      "produktvision",
      "produkturval",
      "produktprovning",
      "produktvideo",
      "hero-produkter",
      "hero produkter",
      "private label",
      "egen konstruktion",
      "uppfinning",
      "uppfinnare",
      "validering",
      "precision",
      "produktutveckling",
      "innovation",
      "produktion i europa",
      "produktion",
      "kvalitet",
      "design",
      "hållbarhet",
      "kopior",
      "nischprodukter",
      "marinelektronik",
      "elcyklar",
      "recovery tech",
    ],
  },
  {
    id: "leadership-organization",
    label: "Ledarskap & organisation",
    keywords: [
      "ledarskap",
      "chefskap",
      "destruktiva chefer",
      "feedback",
      "feedbackkultur",
      "psykologisk trygghet",
      "konflikthantering",
      "konflikträdsla",
      "konsensuskultur",
      "kravställning",
      "personal",
      "personberoende",
      "nyckelpersoner",
      "generalister",
      "expertroll",
      "karriär",
      "livspussel",
      "karriärvägar",
      "remote work",
      "företagskultur",
      "organisation",
      "rekrytering",
      "team",
      "styrelsearbete",
      "styrelse",
      "ledning",
      "familjeliv",
      "medgrundare",
      "kunskapsdelning",
      "intervjuteknik",
      "moderatorrollen",
      "stoicism",
      "lärande",
      "pedagogik",
      "personlig utveckling",
      "berättande",
      "corona",
      "coronaboomen",
    ],
  },
  {
    id: "finance-business-operations",
    label: "Ekonomi & affärsdrift",
    keywords: [
      "cashflow",
      "kassaflöde",
      "budget",
      "prognoser",
      "prispress",
      "underskott",
      "riskbedömning",
      "riskminimering",
      "kravställning",
      "outsourcing",
      "inkoterms",
      "likviditet",
      "marginal",
      "marginaler",
      "produktmarginal",
      "kostnadskontroll",
      "riskkapital",
      "investering",
      "investeringar",
      "lönsam tillväxt",
      "kapital",
      "finansiering",
      "konkurs",
      "ängelinvestering",
      "ängelinvestering",
      "ängelinvesteringar",
    ],
  },
  {
    id: "partnerships-relations",
    label: "Partnerskap & affärsrelationer",
    keywords: [
      "partners",
      "partnerskap",
      "distributörer",
      "leverantörer",
      "leverantörsnätverk",
      "wholesale",
      "oberoende handlare",
      "förhandling",
      "internationella leverantörer",
      "inköp",
      "inkop",
      "b2b",
      "kundrelationer",
    ],
  },
  {
    id: "customer-behavior",
    label: "Kund & beteende",
    keywords: [
      "kundinsikt",
      "kundpersonas",
      "kunddriven utveckling",
      "kundvård",
      "lojalitet",
      "beteendeförändring",
      "vanor",
      "användarfokus",
      "användare istället för förbrukare",
      "kundservice",
      "kundupplevelse",
      "kundrelation",
      "kundrelationer",
      "konvertering",
      "återköp",
    ],
  },
  {
    id: "sustainability-society",
    label: "Hållbarhet & samhälle",
    keywords: [
      "klimat",
      "cirkularitet",
      "återbruk",
      "socialt ansvar",
      "greenwashing",
      "transparens",
      "svensk tillverkning",
      "etik",
      "forskning",
      "hållbarhet",
    ],
  },
  {
    id: "health-fitness-lifestyle",
    label: "Hälsa, träning & livsstil",
    keywords: [
      "hälsa",
      "träning",
      "träningrelation",
      "biohacking",
      "blodtester",
      "mikrobiom",
      "fightcamp",
      "massagepistol",
      "gymdrift",
      "gymkedja",
      "hälsotrender",
      "terapi",
      "utmattning",
      "smärta",
      "gym",
      "sport",
      "fotboll",
      "friidrott",
      "simning",
      "styrkelyft",
      "löpning",
      "coachning",
      "ufc",
      "mma",
      "crossfit",
      "recovery",
      "idrott",
      "onlinecoaching",
      "mental träning",
      "prestation",
      "prestationsångest",
      "hetsätning",
      "hemmagym",
      "träningsbranschen",
      "träningsläger",
      "kost för prestation",
      "luktsalt",
      "sportresor",
      "sportfiske",
      "stress",
      "stresshantering",
      "sömn",
      "aterhamtning",
      "återhämtning",
      "välmående",
      "kvinnor och styrketräning",
      "kajaker",
    ],
  },
  {
    id: "consumer-products-niches",
    label: "Konsumentprodukter & nischer",
    keywords: [
      "barnmat",
      "blöjor",
      "bivaxduk",
      "frityrolja",
      "frystorkade bar",
      "torkad frukt",
      "utan tillsatt socker",
      "doft",
      "grooming",
      "ljus",
      "loshår",
      "hudvård",
      "parfym",
      "mode",
      "skönhet",
      "outdoorkläder",
      "kläder",
      "designfilosofi",
      "storleksstrategi",
      "kvinnliga former",
      "merchandising",
      "krydda",
      "kryddor",
      "mat",
      "livsmedel",
      "fisk",
      "skaldjur",
    ],
  },
  {
    id: "parenting-family",
    label: "Föräldraskap & familj",
    keywords: [
      "föräldraskap",
      "föräldrasegmentet",
      "mammaliv",
      "postpartum",
      "förlossningsvård",
    ],
  },
  {
    id: "public-organization",
    label: "Samhälle & organisation",
    keywords: [
      "offentlig sektor",
      "folkrörelse",
      "föreningssamarbeten",
      "funktionärer",
    ],
  },
  {
    id: "operational-processes",
    label: "Operativt & processer",
    keywords: [
      "processer",
      "processkartläggning",
      "lean",
      "six sigma",
      "optimering",
      "teknisk skuld",
      "mötesstruktur",
      "operations",
      "operativ kontroll",
      "execution",
      "logistik",
      "distribution",
      "frakt",
      "montering",
      "lagerbindning",
    ],
  },
  {
    id: "trend-analysis",
    label: "Trend & analys",
    keywords: [
      "trender",
      "framtidsspaning",
      "omvärldsbevakning",
      "kategoritänk",
      "nyckelpersoner",
      "generation z",
      "trendspaning",
      "research",
      "journalistik",
      "media",
      "mediebolag",
      "medieformat",
      "näringslivsmedia",
      "podcast",
      "podcasting",
      "affärsvärlden",
      "privata affärer",
      "breakit",
      "bonnier",
      "ai",
      "automation",
      "data",
      "ga4",
      "dashboard",
      "plattform",
      "app",
      "saas",
      "api",
      "algoritm",
      "martech",
      "digital assessment",
      "usa",
      "göteborg",
      "piteå",
      "research",
    ],
  },
  {
    id: "niche-misc",
    label: "Misc / nischade topics",
    keywords: [
      "amazon pager",
      "bastutält",
      "peri bottle",
      "moss & noor",
      "moss noor",
      "slaget om småland",
      "social xp",
      "rödljus",
      "smoothiemixer",
      "resebranschen",
      "elcyklar",
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

function hasKeywordMatch(
  normalizedLabel: string,
  normalizedWords: string[],
  keyword: string,
): boolean {
  if (!keyword) {
    return false;
  }

  if (keyword.includes(" ")) {
    return normalizedLabel.includes(keyword);
  }

  if (keyword.length <= 3) {
    return normalizedWords.includes(keyword);
  }

  return normalizedLabel.includes(keyword);
}

function getSearchRank(label: string, normalizedQuery: string): number {
  const normalizedLabel = normalizeSearchText(label);

  if (normalizedLabel === normalizedQuery) {
    return 4;
  }

  if (normalizedLabel.startsWith(normalizedQuery)) {
    return 3;
  }

  if (normalizedLabel.split(" ").some((word) => word.startsWith(normalizedQuery))) {
    return 2;
  }

  return 1;
}

function isLikelyCompanyTopic(label: string): boolean {
  const normalizedLabel = normalizeSearchText(label);
  const normalizedWords = normalizedLabel.split(" ").filter(Boolean);
  const words = label.trim().split(/\s+/).filter(Boolean);
  const hasDigit = words.some((word) => /\d/.test(word));
  const hasAcronymWord = words.some(
    (word) => word.length > 2 && /[A-ZÅÄÖ]/.test(word) && word === word.toUpperCase(),
  );
  const hasCompanyMarker = normalizedEntityCompanyMarkers.some((marker) =>
    includesMarker(normalizedLabel, normalizedWords, marker),
  );

  if (hasCompanyMarker) {
    return true;
  }

  if (hasAcronymWord && words.length <= 4) {
    return true;
  }

  return hasDigit && words.length <= 3;
}

function getTopicCategoryId(
  label: string,
  entityBucketByLabel: Map<string, EntityBucket>,
): string {
  const normalizedLabel = normalizeSearchText(label);
  const normalizedWords = normalizedLabel.split(" ").filter(Boolean);
  const entityBucket = entityBucketByLabel.get(normalizedLabel);

  if (entityBucket === "people") {
    return topicPeopleCategory.id;
  }

  if (entityBucket === "companies") {
    return topicCompaniesCategory.id;
  }

  for (const category of normalizedTopicCategoryRules) {
    if (
      category.normalizedKeywords.some(
        (keyword) => hasKeywordMatch(normalizedLabel, normalizedWords, keyword),
      )
    ) {
      return category.id;
    }
  }

  if (isLikelyPersonName(label)) {
    return topicPeopleCategory.id;
  }

  if (isLikelyCompanyTopic(label)) {
    return topicCompaniesCategory.id;
  }

  return topicFallbackCategory.id;
}

function buildTopicCategoryGroups(
  entries: SemanticEntry[],
  entityBucketByLabel: Map<string, EntityBucket>,
): SemanticCategoryGroup[] {
  const categoryMap = new Map<string, SemanticCategoryGroup>();

  const orderedCategories = [
    topicPeopleCategory,
    topicCompaniesCategory,
    ...topicCategoryRules,
    topicFallbackCategory,
  ];

  for (const category of orderedCategories) {
    categoryMap.set(category.id, {
      id: category.id,
      label: category.label,
      entries: [],
    });
  }

  for (const entry of entries) {
    const categoryId = getTopicCategoryId(entry.label, entityBucketByLabel);
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

function buildEntityBucketByLabel(
  entries: SemanticEntry[],
): Map<string, EntityBucket> {
  const bucketByLabel = new Map<string, EntityBucket>();

  for (const entry of entries) {
    bucketByLabel.set(normalizeSearchText(entry.label), classifyEntity(entry));
  }

  return bucketByLabel;
}

export function SemanticDirectory({ topics, entities }: SemanticDirectoryProps) {
  const params = useSearchParams();
  const selectedTopic = params.get("topic");
  const selectedEntity = params.get("entity");
  const [query, setQuery] = useState("");
  const [selectedTopicCategoryIds, setSelectedTopicCategoryIds] = useState<string[]>([]);
  const [selectedEntityCategoryIds, setSelectedEntityCategoryIds] = useState<string[]>([]);
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
  const searchSuggestions = useMemo(() => {
    if (!normalizedQuery) {
      return [] as SearchSuggestion[];
    }

    const topicSuggestions = filteredTopics.map((entry) => ({
      id: `topic-${entry.slug}`,
      label: entry.label,
      href: `/amnen/${entry.slug}#results`,
      kind: "Ämne" as const,
      rank: getSearchRank(entry.label, normalizedQuery),
    }));
    const entitySuggestions = filteredEntities.map((entry) => ({
      id: `entity-${entry.slug}`,
      label: entry.label,
      href: `/personer/${entry.slug}#results`,
      kind: "Person / Företag" as const,
      rank: getSearchRank(entry.label, normalizedQuery),
    }));

    return [...topicSuggestions, ...entitySuggestions]
      .sort((left, right) => {
        if (right.rank !== left.rank) {
          return right.rank - left.rank;
        }

        return left.label.localeCompare(right.label, "sv");
      })
      .slice(0, 12)
      .map(({ rank: _rank, ...entry }) => entry);
  }, [filteredEntities, filteredTopics, normalizedQuery]);

  const entityBucketByLabel = useMemo(
    () => buildEntityBucketByLabel(entities),
    [entities],
  );

  const topicCategoryGroups = useMemo(
    () => buildTopicCategoryGroups(filteredTopics, entityBucketByLabel),
    [entityBucketByLabel, filteredTopics],
  );
  const entityCategoryGroups = useMemo(
    () => buildEntityGroups(filteredEntities),
    [filteredEntities],
  );
  const hasCategoryFilter =
    selectedTopicCategoryIds.length > 0 || selectedEntityCategoryIds.length > 0;
  const visibleTopicCategoryGroups = useMemo(() => {
    if (!selectedTopicCategoryIds.length) {
      return topicCategoryGroups;
    }

    return topicCategoryGroups.filter((group) => selectedTopicCategoryIds.includes(group.id));
  }, [selectedTopicCategoryIds, topicCategoryGroups]);
  const visibleEntityCategoryGroups = useMemo(() => {
    if (!selectedEntityCategoryIds.length) {
      return entityCategoryGroups;
    }

    return entityCategoryGroups.filter((group) => selectedEntityCategoryIds.includes(group.id));
  }, [entityCategoryGroups, selectedEntityCategoryIds]);
  const toggleTopicCategory = (categoryId: string) => {
    setSelectedTopicCategoryIds((current) =>
      current.includes(categoryId)
        ? current.filter((value) => value !== categoryId)
        : [...current, categoryId],
    );
  };
  const toggleEntityCategory = (categoryId: string) => {
    setSelectedEntityCategoryIds((current) =>
      current.includes(categoryId)
        ? current.filter((value) => value !== categoryId)
        : [...current, categoryId],
    );
  };
  const resetCategoryFilters = () => {
    setSelectedTopicCategoryIds([]);
    setSelectedEntityCategoryIds([]);
  };
  const jumpToPanel = (panelId: string) => {
    const target = document.getElementById(panelId);

    if (!target) {
      return;
    }

    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="semanticDirectory">
      <div className="semanticSearchShell">
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
        {normalizedQuery ? (
          <div className="semanticSearchResults" aria-live="polite">
            {searchSuggestions.length ? (
              <div className="semanticSearchResultList">
                {searchSuggestions.map((entry) => (
                  <Link key={entry.id} href={entry.href} className="semanticSearchResultItem">
                    <span>{entry.label}</span>
                    <span className="semanticSearchResultKind">{entry.kind}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="semanticSearchEmpty">Inga direkta träffar för sökningen ännu.</p>
            )}
          </div>
        ) : null}
      </div>

      <section className="contentPanel semanticFilterPanel" aria-label="Kategorifilter">
        <div className="semanticFilterPanelHeader">
          <div className="semanticFilterPanelIntro">
            <p className="semanticFilterPanelTitle">Filtrera med lista</p>
            <p className="semanticFilterPanelSubtitle">Tryck fram en lista och bocka i en eller flera kategorier.</p>
          </div>
          {hasCategoryFilter ? (
            <button
              type="button"
              className="semanticFilterButton semanticFilterButtonReset"
              onClick={resetCategoryFilters}
            >
              Rensa val
            </button>
          ) : null}
        </div>
        <div className="semanticFilterJumpRow">
          <button
            type="button"
            className="semanticFilterButton semanticFilterButtonJump"
            onClick={() => jumpToPanel("topics-panel")}
          >
            Hoppa till ämnen
          </button>
          <button
            type="button"
            className="semanticFilterButton semanticFilterButtonJump"
            onClick={() => jumpToPanel("entities-panel")}
          >
            Hoppa till personer & företag
          </button>
        </div>
        <div className="semanticFilterPickerGrid">
          <details className="semanticFilterPicker">
            <summary className="semanticFilterPickerSummary">
              <span className="semanticFilterPickerTitle">Ämneskategorier</span>
              <span className="semanticFilterPickerMeta">
                {selectedTopicCategoryIds.length
                  ? `${selectedTopicCategoryIds.length} valda`
                  : "Alla"}
              </span>
            </summary>
            <div className="semanticFilterChecklist semanticFilterChecklistTopics">
              {topicCategoryGroups.map((group) => (
                <label key={group.id} className="semanticFilterOption">
                  <input
                    type="checkbox"
                    checked={selectedTopicCategoryIds.includes(group.id)}
                    onChange={() => toggleTopicCategory(group.id)}
                  />
                  <span>{group.label}</span>
                  <span className="semanticFilterOptionCount">{group.entries.length}</span>
                </label>
              ))}
            </div>
          </details>
          <details className="semanticFilterPicker">
            <summary className="semanticFilterPickerSummary">
              <span className="semanticFilterPickerTitle">Personer & bolag</span>
              <span className="semanticFilterPickerMeta">
                {selectedEntityCategoryIds.length
                  ? `${selectedEntityCategoryIds.length} valda`
                  : "Alla"}
              </span>
            </summary>
            <div className="semanticFilterChecklist semanticFilterChecklistEntities">
              {entityCategoryGroups.map((group) => (
                <label key={group.id} className="semanticFilterOption">
                  <input
                    type="checkbox"
                    checked={selectedEntityCategoryIds.includes(group.id)}
                    onChange={() => toggleEntityCategory(group.id)}
                  />
                  <span>{group.label}</span>
                  <span className="semanticFilterOptionCount">{group.entries.length}</span>
                </label>
              ))}
            </div>
          </details>
        </div>
      </section>

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

      <section className="contentPanel semanticPanel" id="topics-panel">
        <div className="semanticPanelRow">
          <div className="sectionHeading">
            <h2>Ämnen</h2>
          </div>
          <div className="semanticChipPanel">
            <div className="semanticCategoryStack">
              {visibleTopicCategoryGroups.map((group) => (
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

      <section className="contentPanel semanticPanel" id="entities-panel">
        <div className="semanticPanelRow">
          <div className="sectionHeading">
            <h2>Personer och bolag</h2>
          </div>
          <div className="semanticChipPanel">
            <div className="semanticCategoryStack">
              {visibleEntityCategoryGroups.map((group) => (
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
