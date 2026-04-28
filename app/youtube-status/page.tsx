import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getEpisodes } from "@/lib/episodes";
import { normalizeTitle } from "@/lib/text";
import { getYouTubeVideoIndex } from "@/lib/youtube";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "YouTube-status",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function YouTubeStatusPage() {
  if (process.env.ENABLE_YOUTUBE_STATUS_PAGE !== "true") {
    notFound();
  }

  const [episodes, youtubeIndex] = await Promise.all([getEpisodes(), getYouTubeVideoIndex()]);
  const youtubeTitles = new Set(youtubeIndex.entries.map((entry) => entry.normalizedTitle));

  const missingEpisodes = episodes.filter(
    (episode) => !youtubeTitles.has(normalizeTitle(episode.title)),
  );

  if (missingEpisodes.length === 0) {
    notFound();
  }

  return (
    <div className="container pageStack">
      <section className="contentPanel">
        <div className="sectionHeading">
          <h1>YouTube-status</h1>
        </div>
        <p className="emptyState">
          Följande avsnitt saknar matchad YouTube-video just nu.
        </p>
        <ul className="chapterList">
          {missingEpisodes.map((episode) => (
            <li key={episode.guid} className="chapterItem">
              {episode.title}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
