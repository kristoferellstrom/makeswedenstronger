import type { Metadata } from "next";
import Image from "next/image";

import heroLogo from "@/makeswedenstronger.jpeg";
import { siteConfig } from "@/config/site";
import { Breadcrumbs } from "@/components/breadcrumbs";
import {
  buildBreadcrumbJsonLd,
  buildPodcastAboutJsonLd,
  serializeJsonLd,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: "Om podden",
  description: siteConfig.podcastAbout.description,
  alternates: {
    canonical: "/om-podden",
  },
  openGraph: {
    type: "article",
    url: `${siteConfig.siteUrl}/om-podden`,
    title: `Om podden | ${siteConfig.name}`,
    description: siteConfig.podcastAbout.description,
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

export default function AboutPodcastPage() {
  const aboutJsonLd = buildPodcastAboutJsonLd();
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Hem", url: siteConfig.siteUrl },
    { name: "Om podden", url: `${siteConfig.siteUrl}/om-podden` },
  ]);

  return (
    <div className="container pageStack aboutPage">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(aboutJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />

      <Breadcrumbs
        items={[
          { label: "Hem", href: "/" },
          { label: "Om podden" },
        ]}
      />

      <section className="heroPanel aboutHeroPanel">
        <div className="heroMedia aboutHeroMedia">
          <div className="aboutHeroMediaFrame">
            <Image
              src={heroLogo}
              alt={siteConfig.name}
              priority
              sizes="(max-width: 767px) 100vw, 50vw"
              className="heroLogoImage aboutHeroImage"
            />
          </div>
        </div>

        <div className="heroCopy aboutHeroCopy">
          <p className="eyebrow">Podcast</p>
          <h1 className="aboutHeroTitle">{siteConfig.name}</h1>
          <div className="richText introCopy aboutHeroLead">
            {siteConfig.podcastAbout.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="contentPanel aboutFeaturePanel" aria-labelledby="podcast-highlights-heading">
        <div className="sectionHeading">
          <h2 id="podcast-highlights-heading">Det här kännetecknar podden</h2>
        </div>

        <div className="aboutFeatureGrid">
          {siteConfig.podcastAbout.highlights.map((item) => (
            <article key={item.title} className="aboutFeatureCard">
              <p className="aboutFeatureEyebrow">Make Sweden Stronger</p>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="contentPanel aboutTopicsPanel aboutTopicsPanelCompact"
        aria-labelledby="podcast-topics-heading"
      >
        <div className="aboutTopicsCompactHeader">
          <p id="podcast-topics-heading" className="aboutFeatureEyebrow">
            Fokusområden
          </p>
        </div>

        <div className="aboutTopicCloud aboutTopicCloudCompact">
          <div className="topicChipList">
            {siteConfig.podcastAbout.topics.map((topic) => (
              <span key={topic} className="topicChip">{topic}</span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
