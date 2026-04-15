# Make Sweden Stronger

Podcastwebbplats byggd med Next.js App Router + TypeScript.

## Teknik
- Next.js App Router
- React
- TypeScript
- RSS-data från Podspace
- Transkriptfiler (`.vtt` / `.sbv`)
- Manuell avsnittsmetadata (sammanfattning, ämnen, kapitel, personer/bolag)

## Kom igång lokalt
1. Installera beroenden:
```bash
npm install
```
2. Starta utvecklingsserver:
```bash
npm run dev
```
3. Öppna `http://localhost:3000`.

4. Kopiera miljömall (valfritt men rekommenderat):
```bash
cp .env.example .env.local
```

## Miljövariabler
- `NEXT_PUBLIC_SITE_URL`: publik domän i produktion (viktig för canonical, sitemap, JSON-LD).
- `YOUTUBE_API_KEY`: valfri. Om den saknas används YouTube-feed som fallback.
- `ENABLE_YOUTUBE_STATUS_PAGE`: intern toggle för `/youtube-status` (default `false`).

Alla finns dokumenterade i `.env.example`.

## Varifrån innehåll hämtas
- Avsnitt hämtas från RSS-feed: `config/site.ts` (`rssFeedUrl`).
- Transkript läses från:
`Transcript/` och `content/transcripts/`.
- Avsnittsmetadata ligger i:
`content/episode-meta/*.ts` och indexeras i `content/episode-meta/index.ts`.

## Playbook: nytt avsnitt (operativ guide)
1. Säkerställ att avsnittet finns i RSS (`rssFeedUrl` i `config/site.ts`).
2. Lägg in transkriptfil i `Transcript/` med titel som matchar avsnittet (`.vtt` eller `.sbv`).
3. Kontrollera talare i transkript:
- Helst: använd explicita `<v ...>`-talartaggar i `.vtt` så att namn blir tydliga.
- Om du har `SPEAKER_1/SPEAKER_2`: verifiera att UI visar rätt talare på avsnittssidan.
- Om talare blir fel: justera transcriptfilen (namn/talartaggar) tills den renderar rätt.
4. Skapa metadatafil i `content/episode-meta/<slug>.ts` med:
- `summary` (2-4 stycken).
- `topics` (ämnen/nyckelord).
- `entities` (personer + företag/varumärken).
- `chapters` (tidskod + rubrik, ev. kort summary).
5. Registrera metadata i `content/episode-meta/index.ts`:
- Lägg till import för filen.
- Lägg till slug -> meta-mappning i `episodeMetaBySlug`.
6. SEO/metataggar för nya avsnittssidan:
- Sker automatiskt från avsnittsdata + metadata.
- Viktigt: första `summary`-stycket och första `topics`-värdet påverkar titel/description mest.
7. Uppdatera full transcript-bundle:
```bash
npm run generate:llms-full
```
8. Kör kvalitet:
```bash
npm run typecheck
npm run build
```
9. Verifiera manuellt i UI:
- `/episodes` visar avsnittet.
- `/episodes/<slug>` visar ljudspelare, sammanfattning, ämnen, personer/bolag, kapitel och transkript.
- Talare visas korrekt i transkriptblocket.
- Avsnittet dyker upp under relevanta `/amnen/<slug>` och `/personer/<slug>`.
- `public/llms-full.txt` innehåller nya transkriptet.
10. YouTube-kontroll (valfritt men rekommenderat):
- Sätt `ENABLE_YOUTUBE_STATUS_PAGE=true` lokalt om du vill använda `/youtube-status` för matchkontroll.
- Sätt tillbaka till `false` i produktion om sidan ska vara intern.

## CI / kvalitetssäkring
- GitHub Actions-workflow finns i `.github/workflows/ci.yml`.
- Kör på push till `main` och på pull requests.
- Kör:
`npm ci` och `npm run ci:check` (typecheck + build).

## Viktigt: när ett avsnitt inte visas
Ett avsnitt publiceras bara på sajten när alla tre är uppfyllda:
1. Transkript matchar avsnittstiteln.
2. Metadatafil finns.
3. Metadata är komplett (sammanfattning, ämnen, kapitel, och normalt entities).

Om någon del saknas filtreras avsnittet bort i `lib/episodes.ts`.

## Minimal metadata-mall för nytt avsnitt
```ts
import type { EpisodeMeta } from "@/lib/types";

const meta: EpisodeMeta = {
  summary: [
    "Kort sammanfattning stycke 1.",
    "Kort sammanfattning stycke 2.",
  ],
  topics: ["e-handel", "ledarskap"],
  entities: ["Gästnamn", "Bolagsnamn"],
  chapters: [
    { start: "00:00:00", title: "Intro" },
    { start: "00:05:30", title: "Huvudämne", summary: "Kort förklaring." },
  ],
};

export default meta;
```

## Driftnotering
`README.md` är avsiktligt skriven som en liten runbook för innehållsflödet, utan att ändra någon funktionalitet i applikationen.
