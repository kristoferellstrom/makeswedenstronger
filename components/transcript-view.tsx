import { inferSpeakerDisplayNames } from "@/lib/transcript-speakers";
import { normalizeSearchText } from "@/lib/text";
import { formatTimestampRange } from "@/lib/text";
import type { TranscriptCue } from "@/lib/types";

type TranscriptViewProps = {
  cues: TranscriptCue[];
  episodeTitle: string;
};

function normalizeSpeakerLabel(speaker?: string) {
  return speaker?.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function isGenericSpeakerLabel(speaker?: string) {
  return Boolean(normalizeSpeakerLabel(speaker)?.match(/^speaker_?\d+$/));
}

function getCueKey(cue: TranscriptCue) {
  return `${cue.id}-${cue.start}`;
}

function getGuestNameFromEpisodeTitle(episodeTitle: string) {
  const withoutSubtitle = episodeTitle.split(/\s+-\s+/)[0]?.trim() ?? episodeTitle.trim();
  const firstChunk = withoutSubtitle.split(",")[0]?.trim() ?? withoutSubtitle;
  const cleaned = firstChunk
    .replace(
      /\b(vd|ceo|grundare|medgrundare|delagare|delägare|partner|reporter|moderator|poddare|chefredaktor|chefredaktör|ansvarig|utgivare|cmo)\b.*$/i,
      "",
    )
    .trim();

  if (!cleaned) {
    return "Gäst";
  }

  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length <= 2) {
    return cleaned;
  }

  return parts.slice(0, 2).join(" ");
}

function hasSingleGenericSpeakerTrack(cues: TranscriptCue[]) {
  const genericLabels = new Set(
    cues
      .map((cue) => normalizeSpeakerLabel(cue.speaker))
      .filter((label): label is string => Boolean(label && /^speaker_?\d+$/.test(label))),
  );

  const explicitLabels = new Set(
    cues
      .map((cue) => cue.speaker?.trim())
      .filter((speaker): speaker is string => Boolean(speaker && !isGenericSpeakerLabel(speaker))),
  );

  return genericLabels.size === 1 && explicitLabels.size === 0;
}

function inferSingleTrackSpeakers(cues: TranscriptCue[], episodeTitle: string) {
  const speakerByCue = new Map<string, string>();
  const guestName = getGuestNameFromEpisodeTitle(episodeTitle);
  let previousSpeaker: string | null = null;

  for (const cue of cues) {
    const normalizedText = normalizeSearchText(cue.text);
    const cueKey = getCueKey(cue);
    const hasQuestion =
      cue.text.includes("?") ||
      /^(hur|vad|varfor|kan|vilken|vilka|nar|vart|vem)\b/.test(normalizedText);

    let speaker: string;

    if (
      cue.startSeconds <= 50 ||
      normalizedText.includes("idag valkomnar vi") ||
      normalizedText.includes("valkommen till podden") ||
      normalizedText.includes("jag haller med men vad brinner ni mest for")
    ) {
      speaker = "Joel";
    } else if (
      normalizedText.includes("alltsa joel") ||
      normalizedText.startsWith("tack joel") ||
      normalizedText.includes("joel jag kanner")
    ) {
      speaker = guestName;
    } else if (hasQuestion) {
      speaker = "Joel";
    } else if (previousSpeaker === "Joel") {
      speaker = guestName;
    } else if (previousSpeaker === guestName) {
      speaker = guestName;
    } else {
      speaker = guestName;
    }

    speakerByCue.set(cueKey, speaker);
    previousSpeaker = speaker;
  }

  return speakerByCue;
}

function getSpeakerToneMap(cues: TranscriptCue[], syntheticSpeakerByCue: Map<string, string>) {
  const tones = new Map<string, "speakerOne" | "speakerTwo">();

  for (const cue of cues) {
    const syntheticSpeaker = syntheticSpeakerByCue.get(getCueKey(cue));
    const label = normalizeSpeakerLabel(syntheticSpeaker) ?? normalizeSpeakerLabel(cue.speaker);

    if (!label || tones.has(label)) {
      continue;
    }

    tones.set(label, tones.size % 2 === 0 ? "speakerOne" : "speakerTwo");
  }

  return tones;
}

type TranscriptBlock = {
  id: string;
  start: string;
  end: string;
  text: string;
  speakerKey?: string;
  speakerTone?: "speakerOne" | "speakerTwo";
  displaySpeaker?: string;
};

function getDisplaySpeaker(
  cue: TranscriptCue,
  speakerDisplayNames: Map<string, string>,
  syntheticSpeakerByCue: Map<string, string>,
) {
  const syntheticSpeaker = syntheticSpeakerByCue.get(getCueKey(cue));

  if (syntheticSpeaker) {
    return syntheticSpeaker;
  }

  const normalizedSpeaker = normalizeSpeakerLabel(cue.speaker);

  if (!normalizedSpeaker) {
    return undefined;
  }

  return speakerDisplayNames.get(normalizedSpeaker) ??
    (!isGenericSpeakerLabel(cue.speaker) ? cue.speaker : undefined);
}

function mergeTranscriptCues(
  cues: TranscriptCue[],
  speakerTones: Map<string, "speakerOne" | "speakerTwo">,
  speakerDisplayNames: Map<string, string>,
  syntheticSpeakerByCue: Map<string, string>,
  allowMerge: boolean,
) {
  const blocks: TranscriptBlock[] = [];

  for (const cue of cues) {
    const syntheticSpeaker = syntheticSpeakerByCue.get(getCueKey(cue));
    const normalizedSpeaker =
      normalizeSpeakerLabel(syntheticSpeaker) ?? normalizeSpeakerLabel(cue.speaker);
    const displaySpeaker = getDisplaySpeaker(cue, speakerDisplayNames, syntheticSpeakerByCue);
    const speakerTone = normalizedSpeaker ? speakerTones.get(normalizedSpeaker) : undefined;
    const previousBlock = blocks.at(-1);

    if (
      allowMerge &&
      previousBlock &&
      normalizedSpeaker &&
      previousBlock.speakerKey === normalizedSpeaker
    ) {
      previousBlock.end = cue.end;
      previousBlock.text = `${previousBlock.text} ${cue.text}`
        .replace(/\s+/g, " ")
        .trim();
      continue;
    }

    blocks.push({
      id: cue.id,
      start: cue.start,
      end: cue.end,
      text: cue.text,
      speakerKey: normalizedSpeaker,
      speakerTone,
      displaySpeaker,
    });
  }

  return blocks;
}

export function TranscriptView({ cues, episodeTitle }: TranscriptViewProps) {
  const singleGenericTrack = hasSingleGenericSpeakerTrack(cues);
  const syntheticSpeakerByCue = singleGenericTrack
    ? inferSingleTrackSpeakers(cues, episodeTitle)
    : new Map<string, string>();
  const speakerTones = getSpeakerToneMap(cues, syntheticSpeakerByCue);
  const speakerDisplayNames = inferSpeakerDisplayNames(cues, episodeTitle);
  const blocks = mergeTranscriptCues(
    cues,
    speakerTones,
    speakerDisplayNames,
    syntheticSpeakerByCue,
    !singleGenericTrack,
  );

  return (
    <div className="transcriptShell">
      <div className="transcriptList">
        {blocks.map((block) => {
          return (
            <article
              key={`${block.id}-${block.start}-${block.end}`}
              className={[
                "transcriptCue",
                block.speakerTone === "speakerOne" ? "isSpeakerOne" : "",
                block.speakerTone === "speakerTwo" ? "isSpeakerTwo" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
            <div className="transcriptCueMeta">
              <time dateTime={block.start}>{formatTimestampRange(block.start, block.end)}</time>
              {block.displaySpeaker ? (
                <span>{block.displaySpeaker}</span>
              ) : null}
            </div>

            <p>{block.text}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
