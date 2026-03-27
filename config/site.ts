export const siteConfig = {
  name: "Make Sweden Stronger",
  titleTemplateSuffix: "Make Sweden Stronger",
  description:
    "Företagsbyggande, kapitalanskaffning, ehandel, ledarskap, marknadsföring och varumärkesbyggande.",
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000",
  rssFeedUrl: "https://feed.pod.space/makeswedenstronger",
  locale: "sv-SE",
  revalidateSeconds: 60 * 60,
  defaultImage:
    "https://assets.pod.space/system/shows/images/3a1/799/29-/large/IMG_1498.jpeg",
  creator: "Joel Löwenberg",
  links: {
    spotify: "https://open.spotify.com/search/Make%20Sweden%20Stronger",
    applePodcasts:
      "https://podcasts.apple.com/us/podcast/make-sweden-stronger/id1718037226",
    youtube: "",
    podspace: "https://play.pod.space/makeswedenstronger",
    gymkompaniet: "https://www.gymkompaniet.se",
    instagram: "",
    linkedin: "",
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
  { label: "YouTube", href: siteConfig.links.youtube },
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
