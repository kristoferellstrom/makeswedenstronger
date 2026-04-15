import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import heroLogo from "@/makeswedenstronger.jpeg";
import { getEpisodeMeta } from "@/content/episode-meta";
import { siteConfig } from "@/config/site";
import { EpisodeCard } from "@/components/episode-card";
import { getEpisodes, getLatestEpisodes, getShow } from "@/lib/episodes";
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
  const [show, latestEpisodes, episodes] = await Promise.all([
    getShow(),
    getLatestEpisodes(6),
    getEpisodes(),
  ]);
  const homeJsonLd = buildHomeJsonLd(show, latestEpisodes);
  const latestEpisode = latestEpisodes[0] ?? null;
  const startHereEpisodes =
    latestEpisodes.length > 1 ? latestEpisodes.slice(1, 4) : latestEpisodes.slice(0, 3);
  const latestAndStartSlugs = new Set(
    [latestEpisode, ...startHereEpisodes]
      .filter((episode): episode is NonNullable<typeof episode> => Boolean(episode))
      .map((episode) => episode.slug),
  );
  const recentEpisodes = latestEpisodes.slice(1);
  const popularEpisodes = episodes
    .map((episode) => {
      const meta = getEpisodeMeta(episode.slug);
      const topicsScore = meta?.topics.length ?? 0;
      const entitiesScore = meta?.entities?.length ?? 0;
      const chaptersScore = meta?.chapters.length ?? 0;

      return {
        episode,
        score: topicsScore * 3 + entitiesScore + chaptersScore,
      };
    })
    .filter(({ episode }) => !latestAndStartSlugs.has(episode.slug))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return (
        new Date(right.episode.publishedAt).getTime() - new Date(left.episode.publishedAt).getTime()
      );
    })
    .slice(0, 3)
    .map(({ episode }) => episode);
  const uniqueTopics = new Set(
    episodes.flatMap((episode) => getEpisodeMeta(episode.slug)?.topics ?? []),
  ).size;

  return (
    <div className="container pageStack homePage">
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
          <p className="heroHook">
            En podcast om entreprenörskap, e-handel och ledarskap. Börja med senaste avsnittet
            eller hoppa direkt till arkivet.
          </p>
          <p className="heroLead">{show.description}</p>

          <div className="heroActions">
            {latestEpisode ? (
              <Link href={`/episodes/${latestEpisode.slug}#episode-audio-heading`} className="buttonPrimary">
                Spela senaste avsnittet
              </Link>
            ) : null}
            <a
              href={siteConfig.links.spotify}
              target="_blank"
              rel="noreferrer"
              className="buttonSecondary"
            >
              Lyssna på Spotify
            </a>
            <Link href="/episodes" className="buttonSecondary">
              Alla avsnitt
            </Link>
          </div>
        </div>
      </section>

      {latestEpisode ? (
        <section className="section">
          <div className="sectionHeading">
            <h2>Nytt avsnitt</h2>
            <Link href={`/episodes/${latestEpisode.slug}`} className="textLink sectionHeadingLink">
              Öppna avsnitt
            </Link>
          </div>
          <div className="episodeGrid">
            <EpisodeCard episode={latestEpisode} />
          </div>
        </section>
      ) : null}

      <section className="contentPanel trustPanel" aria-label="Förtroende och överblick">
        <div className="trustGrid">
          <div className="trustItem">
            <p className="trustLabel">Publicerat</p>
            <p className="trustValue">{episodes.length} avsnitt</p>
          </div>
          <div className="trustItem">
            <p className="trustLabel">Transkript och guider</p>
            <p className="trustValue">Tillgängliga för alla publicerade avsnitt</p>
          </div>
          <div className="trustItem">
            <p className="trustLabel">Kunskapsområden</p>
            <p className="trustValue">{uniqueTopics} ämnen</p>
          </div>
          <div className="trustItem">
            <p className="trustLabel">Publicering</p>
            <p className="trustValue">Nya avsnitt varje vecka</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="sectionHeading">
          <h2>Starta här</h2>
          <Link href="/om-podden" className="textLink sectionHeadingLink">
            Om podden
          </Link>
        </div>
        <p className="introCopy sectionIntro">
          Tre bra ingångsavsnitt om du är ny här. Alla avsnittssidor innehåller sammanfattning,
          nyckelämnen, personer och bolag samt fullt transkript för snabb överblick.
        </p>

        <div className="episodeGrid">
          {startHereEpisodes.map((episode) => (
            <EpisodeCard key={episode.guid} episode={episode} />
          ))}
        </div>
      </section>

      {popularEpisodes.length ? (
        <section className="section">
          <div className="sectionHeading">
            <h2>Populära avsnitt</h2>
            <Link href="/amnen" className="textLink sectionHeadingLink">
              Ämnen och personer
            </Link>
          </div>
          <p className="introCopy sectionIntro">
            Våra mest populära avsnitt som många börjar med.
          </p>

          <div className="episodeGrid">
            {popularEpisodes.map((episode) => (
              <EpisodeCard key={episode.guid} episode={episode} />
            ))}
          </div>
        </section>
      ) : null}

      {recentEpisodes.length ? (
        <section className="section">
          <div className="sectionHeading">
            <h2>Fler nya avsnitt</h2>
            <Link href="/episodes" className="textLink sectionHeadingLink">
              Se alla
            </Link>
          </div>

          <div className="episodeGrid">
            {recentEpisodes.map((episode) => (
              <EpisodeCard
                key={episode.guid}
                episode={episode}
              />
            ))}
          </div>
        </section>
      ) : null}

      {latestEpisode ? (
        <div className="mobileStickyCta" aria-label="Snabblyssna">
          <Link href={`/episodes/${latestEpisode.slug}#episode-audio-heading`} className="buttonPrimary">
            Spela senaste
          </Link>
          <a
            href={siteConfig.links.spotify}
            target="_blank"
            rel="noreferrer"
            className="buttonSecondary"
          >
            Spotify
          </a>
        </div>
      ) : null}
    </div>
  );
}
