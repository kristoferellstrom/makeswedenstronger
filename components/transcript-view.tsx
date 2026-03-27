import { inferSpeakerDisplayNames } from "@/lib/transcript-speakers";
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

function getSpeakerToneMap(cues: TranscriptCue[]) {
  const tones = new Map<string, "speakerOne" | "speakerTwo">();

  for (const cue of cues) {
    const label = normalizeSpeakerLabel(cue.speaker);

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
) {
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
) {
  const blocks: TranscriptBlock[] = [];

  for (const cue of cues) {
    const normalizedSpeaker = normalizeSpeakerLabel(cue.speaker);
    const displaySpeaker = getDisplaySpeaker(cue, speakerDisplayNames);
    const speakerTone = normalizedSpeaker ? speakerTones.get(normalizedSpeaker) : undefined;
    const previousBlock = blocks.at(-1);

    if (
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
  const speakerTones = getSpeakerToneMap(cues);
  const speakerDisplayNames = inferSpeakerDisplayNames(cues, episodeTitle);
  const blocks = mergeTranscriptCues(cues, speakerTones, speakerDisplayNames);

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
