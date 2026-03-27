import { cache } from "react";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

import { parseVtt } from "@/lib/vtt";
import { normalizeTitle } from "@/lib/text";
import type { Episode, EpisodeTranscript, TranscriptFileRecord } from "@/lib/types";

const transcriptDirectories = [
  {
    sourceDirectory: "content/transcripts",
    absoluteDirectory: path.join(process.cwd(), "content", "transcripts"),
  },
  {
    sourceDirectory: "Transcript",
    absoluteDirectory: path.join(process.cwd(), "Transcript"),
  },
];

async function directoryExists(directoryPath: string): Promise<boolean> {
  try {
    const info = await stat(directoryPath);
    return info.isDirectory();
  } catch {
    return false;
  }
}

export const getTranscriptIndex = cache(async () => {
  const index = new Map<string, TranscriptFileRecord>();

  for (const directory of transcriptDirectories) {
    if (!(await directoryExists(directory.absoluteDirectory))) {
      continue;
    }

    const files = await readdir(directory.absoluteDirectory, { withFileTypes: true });

    for (const file of files) {
      if (!file.isFile() || !file.name.toLowerCase().endsWith(".vtt")) {
        continue;
      }

      const titleKey = normalizeTitle(file.name);

      if (!titleKey || index.has(titleKey)) {
        continue;
      }

      index.set(titleKey, {
        titleKey,
        fileName: file.name,
        filePath: path.join(directory.absoluteDirectory, file.name),
        relativePath: path.join(directory.sourceDirectory, file.name),
        sourceDirectory: directory.sourceDirectory,
      });
    }
  }

  return index;
});

export async function getTranscriptMatchForEpisode(
  episode: Pick<Episode, "title" | "titleKey">,
): Promise<TranscriptFileRecord | null> {
  const index = await getTranscriptIndex();
  return index.get(episode.titleKey) ?? index.get(normalizeTitle(episode.title)) ?? null;
}

export async function getTranscriptForEpisode(
  episode: Pick<Episode, "title" | "titleKey">,
): Promise<EpisodeTranscript | null> {
  const match = await getTranscriptMatchForEpisode(episode);

  if (!match) {
    return null;
  }

  const rawVtt = await readFile(match.filePath, "utf8");

  return {
    file: match,
    cues: parseVtt(rawVtt),
  };
}
