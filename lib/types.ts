export type Episode = {
  guid: string;
  slug: string;
  title: string;
  descriptionHtml: string;
  descriptionText: string;
  descriptionParagraphs: string[];
  excerpt: string;
  publishedAt: string;
  audioUrl: string;
  imageUrl: string;
  duration: string;
  rssLink: string;
  titleKey: string;
  hasTranscript: boolean;
};

export type PodcastShow = {
  title: string;
  description: string;
  imageUrl: string;
  link: string;
  latestPublishedAt: string | null;
};

export type TranscriptFileRecord = {
  titleKey: string;
  fileName: string;
  filePath: string;
  relativePath: string;
  sourceDirectory: string;
};

export type TranscriptCue = {
  id: string;
  start: string;
  end: string;
  startSeconds: number;
  endSeconds: number;
  text: string;
  speaker?: string;
};

export type EpisodeTranscript = {
  file: TranscriptFileRecord;
  cues: TranscriptCue[];
};

