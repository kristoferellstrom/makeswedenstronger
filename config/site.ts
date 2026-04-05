export const siteConfig = {
  name: "Make Sweden Stronger",
  titleTemplateSuffix: "Make Sweden Stronger",
  description:
    "Företagsbyggande, kapitalanskaffning, ehandel, ledarskap, marknadsföring och varumärkesbyggande.",
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000",
  rssFeedUrl: "https://feed.pod.space/makeswedenstronger",
  youtubeFeedUrl:
    "https://www.youtube.com/feeds/videos.xml?playlist_id=PLDN2kFf8TeetLpOS8F_bJi6BUKaLtSifz",
  locale: "sv-SE",
  revalidateSeconds: 60 * 60,
  defaultImage:
    "https://assets.pod.space/system/shows/images/3a1/799/29-/large/IMG_1498.jpeg",
  creator: "Joel Löwenberg",
  creatorImagePath: "/jLowenbergoel.webp",
  creatorRole: "VD, entreprenör och poddvärd",
  links: {
    spotify: "https://open.spotify.com/search/Make%20Sweden%20Stronger",
    applePodcasts:
      "https://podcasts.apple.com/us/podcast/make-sweden-stronger/id1718037226",
    youtube:
      "https://www.youtube.com/playlist?list=PLDN2kFf8TeetLpOS8F_bJi6BUKaLtSifz",
    podspace: "https://play.pod.space/makeswedenstronger",
    gymkompaniet: "https://www.gymkompaniet.se",
    instagram: "",
    linkedin: "",
  },
  podcastAbout: {
    title: "Om podden",
    description:
      "Make Sweden Stronger är en svensk podcast om företagsbyggande, kapitalanskaffning, e-handel, ledarskap, marknadsföring och varumärkesbyggande.",
    paragraphs: [
      "Make Sweden Stronger är en podcast om företagsbyggande, kapitalanskaffning, e-handel, ledarskap, marknadsföring och varumärkesbyggande.",
      "Det är ett passionsprojekt från Joel på Gymkompaniet, där han på onsdagar varje vecka sätter sig ner i samtal med entreprenörer, företagsledare och profiler för att förstå hur de får sina verksamheter att rulla.",
      "Samtalen kretsar kring verkliga beslut, tillväxtresor, marknad, försäljning, produktutveckling, kultur och hur man bygger bolag som håller över tid.",
    ],
    topics: [
      "företagsbyggande",
      "kapitalanskaffning",
      "e-handel",
      "ledarskap",
      "marknadsföring",
      "varumärkesbyggande",
    ],
    highlights: [
      {
        title: "Nya avsnitt varje vecka",
        text: "Podden publiceras på onsdagar och bygger på återkommande samtal om hur bolag faktiskt växer och håller över tid.",
      },
      {
        title: "Praktiskt företagsbyggande",
        text: "Fokus ligger på kapital, försäljning, produktutveckling, e-handel, marknad och de beslut som driver verklig tillväxt.",
      },
      {
        title: "Gäster med operativ erfarenhet",
        text: "Joel intervjuar entreprenörer, företagsledare och profiler som delar konkreta lärdomar från sina egna verksamheter.",
      },
    ],
  },
  creatorProfile: {
    title: "Om Joel Löwenberg",
    description:
      "Joel Löwenberg är entreprenör, e-handelsprofil och poddvärd bakom Make Sweden Stronger.",
    paragraphs: [
      "Joel Löwenberg är en framstående svensk entreprenör och e-handelsprofil som sedan 2015 är VD för Gymkompaniet Sverige AB. Under hans ledarskap har bolaget vuxit kraftigt och utmärkt sig som ett av Sveriges Gasellföretag.",
      "Joel är känd för sin passion för både träning och affärsutveckling, och har byggt upp Gymkompaniet till en stark aktör inom träningsutrustning för både privatpersoner och företag.",
      "Parallellt med sitt uppdrag på Gymkompaniet är han också VD för Beyond Yourself AB, där han fortsätter att utforska nya möjligheter inom e-handel och personlig utveckling.",
      "Hans expertis sträcker sig över områden som e-handel, entreprenörskap och träning, och han är en flitigt anlitad talare och inspiratör i branschen.",
      "År 2024 belönades Joel med priset Årets Inspiratör/Kunskapsspridare vid E-star Awards, vilket ytterligare stärkte hans roll som en av de tydligaste rösterna inom svensk e-handel.",
    ],
    expertise: [
      "e-handel",
      "entreprenörskap",
      "träning",
      "företagsbyggande",
      "ledarskap",
      "marknadsföring",
    ],
    highlights: [
      {
        title: "Byggt Gymkompaniet sedan 2015",
        text: "Sedan 2015 har Joel lett Gymkompaniet Sverige AB och byggt upp verksamheten med fokus på träning, e-handel, sortiment, kundvärde och långsiktig tillväxt.",
      },
      {
        title: "Driver också podden",
        text: "Joel är värd för Make Sweden Stronger, ett passionsprojekt där han varje vecka sätter sig ner med entreprenörer och företagsledare för att förstå hur de bygger sina bolag.",
      },
      {
        title: "Prisad kunskapsspridare",
        text: "Utmärkelsen Årets Inspiratör/Kunskapsspridare vid E-star Awards 2024 förstärker hans roll som en tydlig röst inom svensk e-handel.",
      },
    ],
  },
} as const;

export const socialLinkItems = [
  {
    label: "Spotify",
    href: siteConfig.links.spotify,
    badge: {
      src: "/spotify-podcast-badge.svg",
      alt: `Lyssna på ${siteConfig.name} på Spotify`,
      width: 165,
      height: 40,
      displayWidth: 180,
      displayHeight: 44,
      imageClassName: "",
    },
  },
  {
    label: "Apple Podcasts",
    href: siteConfig.links.applePodcasts,
    badge: {
      src: "/apple-podcast-logo.png",
      alt: `Lyssna på ${siteConfig.name} på Apple Podcasts`,
      width: 800,
      height: 350,
      displayWidth: 186,
      displayHeight: 52,
      containerClassName: "platformBadgeLight",
    },
  },
  {
    label: "YouTube",
    href: siteConfig.links.youtube,
    badge: {
      src: "/youtube-badge.svg",
      alt: `Se ${siteConfig.name} på YouTube`,
      width: 165,
      height: 40,
      displayWidth: 180,
      displayHeight: 44,
    },
  },
  {
    label: "Gymkompaniet",
    href: siteConfig.links.gymkompaniet,
    badge: {
      src: "/gymkompaniet-logo.webp",
      alt: "Gymkompaniet",
      width: 170,
      height: 40,
      displayWidth: 182,
      displayHeight: 44,
      imageClassName: "",
    },
  },
  { label: "Instagram", href: siteConfig.links.instagram },
  { label: "LinkedIn", href: siteConfig.links.linkedin },
];
