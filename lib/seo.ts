import { siteConfig, socialLinkItems } from "@/config/site";
import type { Episode, EpisodeListItem, PodcastShow, TranscriptCue } from "@/lib/types";

type SocialHref = (typeof socialLinkItems)[number]["href"];

const organizationId = `${siteConfig.siteUrl}#organization`;
const creatorProfileUrl = `${siteConfig.siteUrl}/om-joel`;

export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function toAbsoluteUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${siteConfig.siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getPublicSocialLinks() {
  return socialLinkItems
    .map((item) => item.href)
    .filter((href): href is Exclude<SocialHref, ""> => Boolean(href));
}

export function getPodcastSameAsLinks() {
  return [
    siteConfig.links.spotify,
    siteConfig.links.applePodcasts,
    siteConfig.links.youtube,
    siteConfig.links.podspace,
  ].filter(Boolean);
}

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": organizationId,
    name: siteConfig.name,
    url: siteConfig.siteUrl,
    description: siteConfig.podcastAbout.description,
    founder: {
      "@type": "Person",
      name: siteConfig.creator,
      url: creatorProfileUrl,
    },
    sameAs: getPodcastSameAsLinks(),
  };
}

function normalizeMetaText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function trimMetaText(text: string, maxLength = 170) {
  const normalized = normalizeMetaText(text);

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const trimmed = normalized.slice(0, maxLength);
  const lastSpace = trimmed.lastIndexOf(" ");

  return `${trimmed.slice(0, lastSpace > 120 ? lastSpace : maxLength).trim()}...`;
}

function normalizeForComparison(text: string) {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function buildEpisodeSeoTitle(
  episodeTitle: string,
  topics?: readonly string[],
) {
  const primaryTopic = topics?.[0]?.trim();

  if (!primaryTopic) {
    return episodeTitle;
  }

  const normalizedTitle = normalizeForComparison(episodeTitle);
  const normalizedTopic = normalizeForComparison(primaryTopic);

  if (normalizedTitle.includes(normalizedTopic)) {
    return episodeTitle;
  }

  return `${episodeTitle} | ${primaryTopic}`;
}

export function buildEpisodeSeoDescription(options: {
  summary?: string;
  excerpt?: string;
  description?: string;
  topics?: readonly string[];
}) {
  const base =
    options.summary?.trim() ||
    options.excerpt?.trim() ||
    options.description?.trim() ||
    siteConfig.description;
  const topicSummary = options.topics?.slice(0, 3).join(", ");

  if (!topicSummary) {
    return trimMetaText(base);
  }

  return trimMetaText(`${base} Ämnen: ${topicSummary}.`);
}

export function formatIsoDuration(duration?: string) {
  if (!duration) {
    return undefined;
  }

  const parts = duration.split(":").map((part) => Number(part));

  if (parts.some(Number.isNaN)) {
    return undefined;
  }

  const [hours = 0, minutes = 0, seconds = 0] =
    parts.length === 3 ? parts : [0, parts[0] ?? 0, parts[1] ?? 0];

  const normalizedHours = Number.isFinite(hours) ? hours : 0;
  const normalizedMinutes = Number.isFinite(minutes) ? minutes : 0;
  const normalizedSeconds = Number.isFinite(seconds) ? seconds : 0;

  const fragments = [
    normalizedHours ? `${normalizedHours}H` : "",
    normalizedMinutes ? `${normalizedMinutes}M` : "",
    normalizedSeconds ? `${normalizedSeconds}S` : "",
  ].filter(Boolean);

  return `PT${fragments.join("") || "0S"}`;
}

export function buildTranscriptText(cues: TranscriptCue[]) {
  return cues
    .map((cue) => {
      const speaker = cue.speaker?.trim();
      const prefix = speaker ? `${speaker}: ` : "";

      return `${prefix}${cue.text}`.trim();
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function buildHomeJsonLd(show: PodcastShow, latestEpisodes: Episode[]) {
  return [
    buildOrganizationJsonLd(),
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.siteUrl,
      description: siteConfig.description,
      inLanguage: siteConfig.locale,
      publisher: {
        "@id": organizationId,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "PodcastSeries",
      "@id": `${siteConfig.siteUrl}#podcast`,
      name: show.title,
      url: siteConfig.siteUrl,
      description: show.description,
      image: show.imageUrl || siteConfig.defaultImage,
      inLanguage: siteConfig.locale,
      publisher: {
        "@id": organizationId,
      },
      sameAs: getPodcastSameAsLinks(),
      hasPart: latestEpisodes.map((episode) => ({
        "@type": "PodcastEpisode",
        name: episode.title,
        url: `${siteConfig.siteUrl}/episodes/${episode.slug}`,
        datePublished: episode.publishedAt,
      })),
    },
  ];
}

export function buildArchiveJsonLd(episodes: Episode[]) {
  const episodeUrls = episodes.map((episode) => `${siteConfig.siteUrl}/episodes/${episode.slug}`);

  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `Arkiv | ${siteConfig.name}`,
      url: `${siteConfig.siteUrl}/episodes`,
      description: "Alla publicerade avsnitt av Make Sweden Stronger.",
      isPartOf: {
        "@type": "WebSite",
        name: siteConfig.name,
        url: siteConfig.siteUrl,
      },
      mainEntity: {
        "@type": "ItemList",
        itemListElement: episodes.map((episode, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${siteConfig.siteUrl}/episodes/${episode.slug}`,
          name: episode.title,
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: `${siteConfig.name} – Transkriberingar`,
      description:
        "Samling av avsnittstranskriberingar från Make Sweden Stronger. Varje post länkar till ett avsnitt med fullständig transcript, sammanfattning och kapitel.",
      url: `${siteConfig.siteUrl}/episodes`,
      creator: {
        "@type": "Person",
        name: siteConfig.creator,
        url: creatorProfileUrl,
      },
      publisher: {
        "@id": organizationId,
      },
      license: siteConfig.siteUrl,
      inLanguage: siteConfig.locale,
      distribution: episodeUrls.map((url) => ({
        "@type": "DataDownload",
        encodingFormat: "text/html",
        contentUrl: url,
      })),
      isPartOf: {
        "@type": "DataCatalog",
        name: `${siteConfig.name} – Avsnittsarkiv`,
        url: `${siteConfig.siteUrl}/episodes`,
      },
    },
  ];
}

export function buildSemanticCollectionJsonLd(options: {
  type: "topic" | "entity";
  label: string;
  urlPath: string;
  episodes: EpisodeListItem[];
}) {
  const absoluteUrl = `${siteConfig.siteUrl}${options.urlPath}`;
  const noun = options.type === "topic" ? "ämne" : "person eller bolag";
  const pageLabel = options.type === "topic" ? "Ämne" : "Person och bolag";
  const description = `${options.episodes.length} avsnitt om ${options.label} i Make Sweden Stronger.`;

  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${pageLabel}: ${options.label} | ${siteConfig.name}`,
      url: absoluteUrl,
      description,
      about: {
        "@type": "Thing",
        name: options.label,
      },
      isPartOf: {
        "@type": "WebSite",
        name: siteConfig.name,
        url: siteConfig.siteUrl,
      },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: options.episodes.length,
        itemListElement: options.episodes.map((episode, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: episode.title,
          url: `${siteConfig.siteUrl}/episodes/${episode.slug}`,
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "DefinedTerm",
      name: options.label,
      description: `Samlingssida för avsnitt där ${options.label} är ett centralt ${noun}.`,
      inDefinedTermSet: `${siteConfig.siteUrl}/amnen`,
      url: absoluteUrl,
    },
  ];
}

export function buildBreadcrumbJsonLd(
  items: Array<{
    name: string;
    url: string;
  }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildPodcastAboutJsonLd() {
  return [
    buildOrganizationJsonLd(),
    {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: `${siteConfig.podcastAbout.title} | ${siteConfig.name}`,
      url: `${siteConfig.siteUrl}/om-podden`,
      description: siteConfig.podcastAbout.description,
      isPartOf: {
        "@type": "WebSite",
        name: siteConfig.name,
        url: siteConfig.siteUrl,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "PodcastSeries",
      "@id": `${siteConfig.siteUrl}#podcast`,
      name: siteConfig.name,
      url: siteConfig.siteUrl,
      description: siteConfig.podcastAbout.description,
      image: siteConfig.defaultImage,
      inLanguage: siteConfig.locale,
      publisher: {
        "@id": organizationId,
      },
      sameAs: getPodcastSameAsLinks(),
    },
  ];
}

export function buildCreatorProfileJsonLd() {
  return [
    buildOrganizationJsonLd(),
    {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      name: `${siteConfig.creatorProfile.title} | ${siteConfig.name}`,
      url: `${siteConfig.siteUrl}/om-joel`,
      description: siteConfig.creatorProfile.description,
      isPartOf: {
        "@type": "WebSite",
        name: siteConfig.name,
        url: siteConfig.siteUrl,
      },
      mainEntity: {
        "@type": "Person",
        name: siteConfig.creator,
        jobTitle: siteConfig.creatorRole,
        image: toAbsoluteUrl(siteConfig.creatorImagePath),
        description: siteConfig.creatorProfile.paragraphs.join(" "),
        knowsAbout: siteConfig.creatorProfile.expertise,
        url: creatorProfileUrl,
        worksFor: [
          {
            "@type": "Organization",
            name: "Gymkompaniet Sverige AB",
          },
          {
            "@type": "Organization",
            name: "Beyond Yourself AB",
          },
        ],
      },
    },
  ];
}

export function buildEpisodeJsonLd(
  episode: Episode,
  options?: {
    transcriptText?: string;
    topics?: string[];
    entities?: string[];
  },
) {
  const transcriptText = options?.transcriptText?.trim();
  const topics = options?.topics?.filter(Boolean) ?? [];
  const entities = options?.entities?.filter(Boolean) ?? [];

  return {
    "@context": "https://schema.org",
    "@type": "PodcastEpisode",
    name: episode.title,
    headline: episode.title,
    url: `${siteConfig.siteUrl}/episodes/${episode.slug}`,
    mainEntityOfPage: `${siteConfig.siteUrl}/episodes/${episode.slug}`,
    description: episode.descriptionText,
    ...(topics.length ? { keywords: topics.join(", ") } : {}),
    datePublished: episode.publishedAt,
    inLanguage: siteConfig.locale,
    image: episode.imageUrl || siteConfig.defaultImage,
    duration: formatIsoDuration(episode.duration),
    partOfSeries: {
      "@id": `${siteConfig.siteUrl}#podcast`,
    },
    audio: {
      "@type": "AudioObject",
      name: episode.title,
      contentUrl: episode.audioUrl,
      encodingFormat: "audio/mpeg",
      duration: formatIsoDuration(episode.duration),
      ...(transcriptText ? { transcript: transcriptText } : {}),
    },
    publisher: {
      "@id": organizationId,
    },
    author: {
      "@type": "Person",
      name: siteConfig.creator,
      url: creatorProfileUrl,
    },
    ...(topics.length
      ? {
          about: topics.map((topic) => ({
            "@type": "Thing",
            name: topic,
          })),
        }
      : {}),
    ...(entities.length
      ? {
          mentions: entities.map((entity) => ({
            "@type": "Thing",
            name: entity,
          })),
        }
      : {}),
  };
}
