import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import heroLogo from "@/makeswedenstronger.jpeg";
import { siteConfig } from "@/config/site";
import { EpisodeCard } from "@/components/episode-card";
import { getLatestEpisodes, getShow } from "@/lib/episodes";
import { buildHomeJsonLd, serializeJsonLd } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Podcast om företagsbyggande, e-handel och ledarskap",
  description:
    "Make Sweden Stronger är en svensk podcast med Joel Löwenberg om företagsbyggande, kapitalanskaffning, e-handel, ledarskap, marknadsföring och varumärkesbyggande.",
  keywords: [...siteConfig.podcastAbout.topics],
  authors: [{ name: siteConfig.creator, url: `${siteConfig.siteUrl}/om-joel` }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteConfig.siteUrl,
    title: `Podcast om företagsbyggande, e-handel och ledarskap | ${siteConfig.name}`,
    description:
      "Make Sweden Stronger är en svensk podcast med Joel Löwenberg om företagsbyggande, kapitalanskaffning, e-handel, ledarskap, marknadsföring och varumärkesbyggande.",
    images: [
      {
        url: siteConfig.defaultImage,
        width: 1200,
        height: 1200,
        alt: siteConfig.name,
      },
    ],
  },
};

export default async function HomePage() {
  const [show, latestEpisodes] = await Promise.all([getShow(), getLatestEpisodes(6)]);
  const homeJsonLd = buildHomeJsonLd(show, latestEpisodes);

  return (
    <div className="container pageStack">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(homeJsonLd) }}
      />

      <section className="heroPanel">
        <div className="heroMedia">
          <Image
            src={heroLogo}
            alt={show.title}
            priority
            sizes="(max-width: 767px) 100vw, 50vw"
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
          {latestEpisodes.map((episode) => (
            <EpisodeCard
              key={episode.guid}
              episode={episode}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
