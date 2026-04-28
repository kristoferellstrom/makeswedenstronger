import type { Metadata } from "next";
import { Suspense } from "react";

import { SemanticDirectory } from "@/components/semantic-directory";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getSemanticDirectoryEntries } from "@/lib/semantic";
import { siteConfig } from "@/config/site";
import { buildBreadcrumbJsonLd, serializeJsonLd } from "@/lib/seo";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Ämnen och personer",
  description:
    "Bläddra bland ämnen, personer och bolag och hitta relaterade avsnitt i Make Sweden Stronger.",
  alternates: {
    canonical: "/amnen",
  },
  openGraph: {
    type: "website",
    url: `${siteConfig.siteUrl}/amnen`,
    title: `Ämnen och personer | ${siteConfig.name}`,
    description:
      "Bläddra bland ämnen, personer och bolag och hitta relaterade avsnitt i Make Sweden Stronger.",
    images: [
      {
        url: siteConfig.defaultImage,
        width: 1200,
        height: 1200,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Ämnen och personer | ${siteConfig.name}`,
    description:
      "Bläddra bland ämnen, personer och bolag och hitta relaterade avsnitt i Make Sweden Stronger.",
    images: [siteConfig.defaultImage],
  },
};

export default async function TopicsPage() {
  const { topics, entities } = await getSemanticDirectoryEntries();

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Hem", url: siteConfig.siteUrl },
    { name: "Ämnen", url: `${siteConfig.siteUrl}/amnen` },
  ]);

  return (
    <div className="container pageStack">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />

      <Breadcrumbs
        items={[
          { label: "Hem", href: "/" },
          { label: "Ämnen" },
        ]}
      />

      <section className="pageIntro">
        <h1 className="archiveTitle">Ämnen och personer</h1>
        <p className="introCopy">
          Bläddra i poddens kunskapsnätverk och hitta avsnitt utifrån ämnen, personer och bolag.
          Den här sidan samlar och strukturerar innehållet så att du snabbare kan hoppa till rätt
          avsnitt, oavsett om du söker efter ett specifikt namn eller ett område som e-handel,
          ledarskap eller marknadsföring.
        </p>
        <div className="topicsIntroPrompt">
          <h2>Välj ett ämne eller namn</h2>
          <p>Välj ett ämne eller ett namn för att se relaterade avsnitt.</p>
        </div>
      </section>

      <Suspense fallback={<p className="emptyState">Laddar…</p>}>
        <SemanticDirectory topics={topics} entities={entities} />
      </Suspense>
    </div>
  );
}
