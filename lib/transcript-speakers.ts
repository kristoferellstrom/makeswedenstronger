import { normalizeSearchText } from "@/lib/text";
import type { TranscriptCue } from "@/lib/types";

const HOST_NAME = "Joel";
const INTRO_WINDOW_SECONDS = 120;

function normalizeSpeakerLabel(speaker?: string) {
  return speaker?.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function isGenericSpeakerLabel(speaker?: string) {
  return Boolean(normalizeSpeakerLabel(speaker)?.match(/^speaker_?\d+$/));
}

function sanitizeGuestCandidate(candidate?: string | null) {
  if (!candidate) {
    return null;
  }

  const cleaned = candidate
    .replace(/^make sweden stronger\b[: ,.-]*/i, "")
    .replace(/\bfrån\b.*$/i, "")
    .replace(/\bsom\b.*$/i, "")
    .replace(/\btill podden\b.*$/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[,.:;!?\- ]+|[,.:;!?\- ]+$/g, "");

  if (!cleaned) {
    return null;
  }

  const normalized = normalizeSearchText(cleaned);

  if (!normalized || normalized === "joel") {
    return null;
  }

  if (normalized.startsWith("3 intervjuer fran")) {
    return null;
  }

  if (normalized.split(" ").length > 6) {
    return null;
  }

  return cleaned;
}

function extractGuestNameFromIntro(text: string) {
  const patterns = [
    /idag välkomnar vi\s+(.+?)(?=\s+till podden|[,.!]|$)/i,
    /idag sitter vi här med\s+(.+?)(?=,\s*|\s+som\b|\s+från\b|[.!]|$)/i,
    /tjena\s+(.+?)\s+och välkommen till podden/i,
    /då säger vi välkommen till(?: podden)?\s+(.+?)(?=\s+från\b|\s+som\b|[,.!]|$)/i,
    /välkommen till podden\s+(.+?)(?=\s+från\b|\s+som\b|[,.!]|$)/i,
    /välkommen\s+(.+?)(?=,\s*|\s+och\b|\s+till podden\b|[.!]|$)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (!match) {
      continue;
    }

    const candidate = sanitizeGuestCandidate(match[1]);

    if (candidate) {
      return candidate;
    }
  }

  return null;
}

function cueLooksLikeHostIntro(text: string) {
  const normalized = normalizeSearchText(text);

  return [
    "valkommen till podden",
    "idag valkomnar vi",
    "idag sitter vi har med",
    "och valkommen till podden",
    "da sager vi valkommen",
    "forst valkommen till podden",
  ].some((pattern) => normalized.includes(pattern));
}

function getGuestNameFromTitle(episodeTitle: string) {
  const withoutSubtitle = episodeTitle.split(/\s+-\s+/)[0]?.trim() ?? episodeTitle.trim();
  const primaryName = withoutSubtitle.split(",")[0]?.trim() ?? withoutSubtitle;
  return sanitizeGuestCandidate(primaryName);
}

function isMultiSegmentEpisode(episodeTitle: string) {
  const normalized = normalizeSearchText(episodeTitle);
  return normalized.includes("intervjuer fran");
}

function getGuestSpeakerLabel(
  cues: TranscriptCue[],
  hostLabel: string,
  hostCueIndex: number,
) {
  for (let index = hostCueIndex + 1; index < cues.length; index += 1) {
    const cue = cues[index];

    if (cue.startSeconds > INTRO_WINDOW_SECONDS) {
      break;
    }

    if (!cue.speaker || !isGenericSpeakerLabel(cue.speaker)) {
      continue;
    }

    const label = normalizeSpeakerLabel(cue.speaker);

    if (!label || label === hostLabel) {
      continue;
    }

    return label;
  }

  return null;
}

export function inferSpeakerDisplayNames(cues: TranscriptCue[], episodeTitle: string) {
  const genericLabels = Array.from(
    new Set(
      cues
        .map((cue) => cue.speaker)
        .filter(isGenericSpeakerLabel)
        .map((speaker) => normalizeSpeakerLabel(speaker))
        .filter(Boolean),
    ),
  );

  if (genericLabels.length < 2) {
    return new Map<string, string>();
  }

  let hostLabel: string | null = null;
  let hostCueIndex = -1;
  let guestName: string | null = null;

  for (const [index, cue] of cues.entries()) {
    if (cue.startSeconds > INTRO_WINDOW_SECONDS || !cue.speaker || !isGenericSpeakerLabel(cue.speaker)) {
      continue;
    }

    if (!cueLooksLikeHostIntro(cue.text)) {
      continue;
    }

    hostLabel = normalizeSpeakerLabel(cue.speaker) ?? null;
    hostCueIndex = index;
    guestName = extractGuestNameFromIntro(cue.text);

    if (!guestName) {
      for (let lookAheadIndex = index + 1; lookAheadIndex < cues.length; lookAheadIndex += 1) {
        const followUpCue = cues[lookAheadIndex];

        if (followUpCue.startSeconds > INTRO_WINDOW_SECONDS) {
          break;
        }

        const candidate = extractGuestNameFromIntro(followUpCue.text);

        if (candidate) {
          guestName = candidate;
          break;
        }
      }
    }

    break;
  }

  if (!hostLabel) {
    return new Map<string, string>();
  }

  const speakerNames = new Map<string, string>([[hostLabel, HOST_NAME]]);

  if (isMultiSegmentEpisode(episodeTitle)) {
    return speakerNames;
  }

  const resolvedGuestName = getGuestNameFromTitle(episodeTitle) ?? guestName;

  if (!resolvedGuestName) {
    return speakerNames;
  }

  const guestLabel =
    getGuestSpeakerLabel(cues, hostLabel, hostCueIndex) ??
    genericLabels.find((label) => label !== hostLabel) ??
    null;

  if (guestLabel) {
    speakerNames.set(guestLabel, resolvedGuestName);
  }

  return speakerNames;
}
