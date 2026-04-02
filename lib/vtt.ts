import { decode } from "html-entities";

import type { TranscriptCue } from "@/lib/types";

function normalizeCueTimestamp(timestamp: string): string {
  const [hours = "00", minutes = "00", rest = "00.000"] = timestamp.trim().split(":");
  const [seconds = "00", milliseconds = "000"] = rest.split(".");

  return [
    hours.padStart(2, "0"),
    minutes.padStart(2, "0"),
    `${seconds.padStart(2, "0")}.${milliseconds.padEnd(3, "0").slice(0, 3)}`,
  ].join(":");
}

function parseTimestamp(timestamp: string): number {
  const [hours = "00", minutes = "00", rest = "00.000"] = timestamp.split(":");
  const [seconds = "0", milliseconds = "0"] = rest.split(".");

  return (
    Number(hours) * 3600 +
    Number(minutes) * 60 +
    Number(seconds) +
    Number(milliseconds) / 1000
  );
}

function stripCueMarkup(value: string): string {
  return decode(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?v[^>]*>/gi, "")
    .replace(/<\/?c[^>]*>/gi, "")
    .replace(/<\/?i>/gi, "")
    .replace(/<\/?b>/gi, "")
    .replace(/<\/?u>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

function extractSpeakerAndText(rawText: string): {
  speaker?: string;
  text: string;
} {
  const lines = rawText.split("\n");
  const speakers = new Set<string>();

  const strippedLines = lines.map((line) => {
    const match = line.trim().match(/^<v(?:\.[^\s>]+)?\s*([^>]*)>(.*)$/i);

    if (!match) {
      return line;
    }

    const [, speaker, text] = match;
    const cleanedSpeaker = speaker.trim();

    if (cleanedSpeaker) {
      speakers.add(cleanedSpeaker);
    }

    return text;
  });

  const text = stripCueMarkup(strippedLines.join("\n"));
  const speaker = speakers.size === 1 ? Array.from(speakers)[0] : undefined;

  return { speaker, text };
}

export function parseVtt(rawVtt: string): TranscriptCue[] {
  const normalized = rawVtt.replace(/\r\n?/g, "\n");
  const lines = normalized.split("\n");
  const cues: TranscriptCue[] = [];

  let index = 0;

  if (lines[0]?.startsWith("WEBVTT")) {
    index = 1;
  }

  while (index < lines.length) {
    const currentLine = lines[index]?.trim() ?? "";

    if (!currentLine) {
      index += 1;
      continue;
    }

    if (
      currentLine.startsWith("NOTE") ||
      currentLine.startsWith("STYLE") ||
      currentLine.startsWith("REGION")
    ) {
      index += 1;

      while (index < lines.length && lines[index]?.trim()) {
        index += 1;
      }

      continue;
    }

    let identifier = "";
    let timingLine = currentLine;

    if (!timingLine.includes("-->") && lines[index + 1]?.includes("-->")) {
      identifier = timingLine;
      index += 1;
      timingLine = lines[index]?.trim() ?? "";
    }

    const vttTimingMatch = timingLine.match(
      /^(\d{1,2}:\d{2}:\d{2}\.\d{3})\s+-->\s+(\d{1,2}:\d{2}:\d{2}\.\d{3})/,
    );
    const sbvTimingMatch = timingLine.match(
      /^(\d{1,2}:\d{2}:\d{2}\.\d{3}),(\d{1,2}:\d{2}:\d{2}\.\d{3})$/,
    );

    if (!vttTimingMatch && !sbvTimingMatch) {
      index += 1;
      continue;
    }

    const [, rawStart, rawEnd] = vttTimingMatch ?? sbvTimingMatch ?? [];
    const start = normalizeCueTimestamp(rawStart);
    const end = normalizeCueTimestamp(rawEnd);
    index += 1;

    const textLines: string[] = [];

    while (index < lines.length && lines[index]?.trim()) {
      textLines.push(lines[index] ?? "");
      index += 1;
    }

    const rawText = textLines.join("\n").trim();

    if (!rawText) {
      continue;
    }

    const { speaker, text } = extractSpeakerAndText(rawText);

    if (!text) {
      continue;
    }

    cues.push({
      id: identifier || String(cues.length + 1),
      start,
      end,
      startSeconds: parseTimestamp(start),
      endSeconds: parseTimestamp(end),
      text,
      speaker,
    });
  }

  return cues;
}
