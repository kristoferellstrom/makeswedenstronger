import { decode } from "html-entities";

function collapseRepeatedLeadingPhrase(value: string): string {
  const tokens = value.split(" ").filter(Boolean);

  for (let phraseLength = 1; phraseLength <= Math.floor(tokens.length / 2); phraseLength += 1) {
    const firstPhrase = tokens.slice(0, phraseLength).join(" ");
    const secondPhrase = tokens.slice(phraseLength, phraseLength * 2).join(" ");

    if (firstPhrase && firstPhrase === secondPhrase) {
      return [...tokens.slice(0, phraseLength), ...tokens.slice(phraseLength * 2)].join(" ");
    }
  }

  return value;
}

export function normalizeSearchText(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function getNormalizedSearchTokens(normalizedInput: string): string[] {
  return normalizedInput.split(" ").filter(Boolean);
}

export function matchesWholeWordQuery(normalizedText: string, queryTokens: readonly string[]) {
  if (!queryTokens.length) {
    return true;
  }

  const tokenSet = new Set(getNormalizedSearchTokens(normalizedText));
  return queryTokens.every((token) => tokenSet.has(token));
}

export function normalizeTitle(input: string): string {
  const normalized = normalizeSearchText(
    input
      .replace(/\.(vtt|sbv)$/i, "")
      .replace(/^\s*\d+\.\s*/, ""),
  );

  return collapseRepeatedLeadingPhrase(normalized);
}

export function slugifyTitle(input: string): string {
  return normalizeTitle(input).replace(/\s+/g, "-");
}

export function stripHtml(html: string): string {
  return decode(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<\/li>\s*/gi, "\n")
    .replace(/<li>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function htmlToParagraphs(html: string): string[] {
  return stripHtml(html)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function buildExcerpt(text: string, maxLength = 180): string {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}…`;
}

export function formatEpisodeDate(date: string): string {
  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "long",
  }).format(new Date(date));
}

export function formatEpisodeDuration(duration: string): string {
  return `Avsnittslängd: ${duration}`;
}

export function formatSecondsAsClock(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatTimestamp(timestamp: string): string {
  const [hours = "00", minutes = "00", rest = "00.000"] = timestamp.split(":");
  const seconds = rest.split(".")[0] ?? "00";

  if (hours === "00") {
    return `${minutes}:${seconds}`;
  }

  return `${hours}:${minutes}:${seconds}`;
}

export function formatTimestampRange(start: string, end: string): string {
  const formattedStart = formatTimestamp(start);
  const formattedEnd = formatTimestamp(end);

  if (formattedStart === formattedEnd) {
    return formattedStart;
  }

  return `${formattedStart} - ${formattedEnd}`;
}
