import { siteConfig, socialLinkItems } from "@/config/site";
import type { Episode, PodcastShow, TranscriptCue } from "@/lib/types";

type SocialHref = (typeof socialLinkItems)[number]["href"];

export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function getPublicSocialLinks() {
  return socialLinkItems
    .map((item) => item.href)
    .filter((href): href is Exclude<SocialHref, ""> => Boolean(href));
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
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.siteUrl,
      description: siteConfig.description,
      inLanguage: siteConfig.locale,
    },
    {
      "@context": "https://schema.org",
      "@type": "PodcastSeries",
      name: show.title,
      url: siteConfig.siteUrl,
      description: show.description,
      image: show.imageUrl || siteConfig.defaultImage,
      inLanguage: siteConfig.locale,
      publisher: {
        "@type": "Person",
        name: siteConfig.creator,
      },
      sameAs: getPublicSocialLinks(),
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
  return {
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
  };
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
      "@type": "PodcastSeries",
      name: siteConfig.name,
      url: siteConfig.siteUrl,
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
      "@type": "Person",
      name: siteConfig.creator,
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
