import type { Metadata } from "next";
import Image from "next/image";

import { siteConfig } from "@/config/site";
import { Breadcrumbs } from "@/components/breadcrumbs";
import {
  buildBreadcrumbJsonLd,
  buildCreatorProfileJsonLd,
  serializeJsonLd,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: "Om Joel",
  description: siteConfig.creatorProfile.description,
  alternates: {
    canonical: "/om-joel",
  },
  openGraph: {
    type: "profile",
    url: `${siteConfig.siteUrl}/om-joel`,
    title: `Om Joel | ${siteConfig.name}`,
    description: siteConfig.creatorProfile.description,
    images: [
      {
        url: `${siteConfig.siteUrl}${siteConfig.creatorImagePath}`,
        width: 1200,
        height: 1200,
        alt: siteConfig.creator,
      },
    ],
  },
};

export default function AboutJoelPage() {
  const profileJsonLd = buildCreatorProfileJsonLd();
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Hem", url: siteConfig.siteUrl },
    { name: "Om Joel", url: `${siteConfig.siteUrl}/om-joel` },
  ]);

  return (
    <div className="container pageStack aboutPage">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(profileJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />

      <Breadcrumbs
        items={[
          { label: "Hem", href: "/" },
          { label: "Om Joel" },
        ]}
      />

      <section className="heroPanel aboutHeroPanel">
        <div className="heroMedia aboutHeroMedia">
          <div className="aboutHeroMediaFrame">
            <Image
              src={siteConfig.creatorImagePath}
              alt={siteConfig.creator}
              width={1200}
              height={1200}
              priority
              sizes="(max-width: 767px) 100vw, 50vw"
              className="profileImage aboutHeroImage"
            />
          </div>
        </div>

        <div className="heroCopy aboutHeroCopy">
          <p className="eyebrow">Poddvärd</p>
          <h1 className="aboutHeroTitle">{siteConfig.creator}</h1>
          <p className="profileRole">{siteConfig.creatorRole}</p>
          <div className="richText introCopy aboutHeroLead">
            {siteConfig.creatorProfile.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="contentPanel aboutFeaturePanel" aria-labelledby="joel-highlights-heading">
        <div className="sectionHeading">
          <h2 id="joel-highlights-heading">Mer om Joel</h2>
        </div>

        <div className="aboutFeatureGrid">
          {siteConfig.creatorProfile.highlights.map((item) => (
            <article key={item.title} className="aboutFeatureCard">
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="contentPanel aboutTopicsPanel aboutTopicsPanelCompact"
        aria-labelledby="joel-expertise-heading"
      >
        <div className="aboutTopicsCompactHeader">
          <p id="joel-expertise-heading" className="aboutFeatureEyebrow">
            Kompetenser
          </p>
        </div>

        <div className="aboutTopicCloud aboutTopicCloudCompact">
          <div className="topicChipList">
            {siteConfig.creatorProfile.expertise.map((topic) => (
              <span key={topic} className="topicChip">{topic}</span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
