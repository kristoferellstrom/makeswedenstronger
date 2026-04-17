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

export type EpisodeListItem = Pick<
  Episode,
  "guid" | "slug" | "title" | "excerpt" | "publishedAt" | "imageUrl" | "duration" | "hasTranscript"
>;

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

export type EpisodeChapter = {
  start: string;
  title: string;
  summary?: string;
};

export type EpisodeMeta = {
  summary: string[];
  topics: string[];
  chapters: EpisodeChapter[];
  entities?: string[];
  topicSeekSeconds?: Record<string, number>;
  entitySeekSeconds?: Record<string, number>;
};
