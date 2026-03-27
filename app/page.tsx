import Image from "next/image";
import Link from "next/link";

import heroLogo from "@/makeswedenstronger.jpeg";
import { EpisodeCard } from "@/components/episode-card";
import { getLatestEpisodes, getShow } from "@/lib/episodes";

export const revalidate = 3600;

export default async function HomePage() {
  const [show, latestEpisodes] = await Promise.all([getShow(), getLatestEpisodes(6)]);

  return (
    <div className="container pageStack">
      <section className="heroPanel">
        <div className="heroMedia">
          <Image
            src={heroLogo}
            alt={show.title}
            priority
            className="heroLogoImage"
          />
        </div>

        <div className="heroCopy">
          <p className="eyebrow">Podcast</p>
          <h1 className="srOnly">{show.title}</h1>
          <p className="heroLead">{show.description}</p>

          <div className="heroActions">
            <Link href="/episodes" className="buttonPrimary">
              Alla avsnitt
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="sectionHeading">
          <h2>Senaste avsnitten</h2>
          <Link href="/episodes" className="textLink sectionHeadingLink">
            Se alla
          </Link>
        </div>

        <div className="episodeGrid">
          {latestEpisodes.map((episode, index) => (
            <EpisodeCard
              key={episode.guid}
              episode={episode}
              priority={index < 2}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
