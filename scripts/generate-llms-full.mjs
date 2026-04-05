import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUTPUT_PATH = path.join(ROOT, "public", "llms-full.txt");
const TRANSCRIPT_DIRS = [
  path.join(ROOT, "Transcript"),
  path.join(ROOT, "content", "transcripts"),
];

const TIMING_LINE = /^\d{2}:\d{2}:\d{2}[.,]\d{3}\s+-->\s+\d{2}:\d{2}:\d{2}[.,]\d{3}/;
const SBV_TIMING = /^\d{2}:\d{2}\.\d{3},\d{2}:\d{2}\.\d{3}/;
const INDEX_LINE = /^\d+$/;

function isTranscriptFile(name) {
  return name.toLowerCase().endsWith(".vtt") || name.toLowerCase().endsWith(".sbv");
}

function listTranscriptFiles() {
  const files = [];

  for (const dir of TRANSCRIPT_DIRS) {
    if (!fs.existsSync(dir)) {
      continue;
    }

    for (const entry of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);

      if (!stat.isFile() || !isTranscriptFile(entry)) {
        continue;
      }

      files.push(fullPath);
    }
  }

  return files.sort((a, b) => a.localeCompare(b, "sv"));
}

function stripExtension(fileName) {
  return fileName.replace(/\.(vtt|sbv)$/i, "");
}

function extractTranscriptText(raw) {
  const lines = raw
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/);

  const paragraphs = [];
  let buffer = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      if (buffer.length) {
        paragraphs.push(buffer.join(" ").replace(/\s+/g, " ").trim());
        buffer = [];
      }
      continue;
    }

    if (trimmed === "WEBVTT") {
      continue;
    }

    if (TIMING_LINE.test(trimmed) || SBV_TIMING.test(trimmed) || INDEX_LINE.test(trimmed)) {
      continue;
    }

    buffer.push(trimmed);
  }

  if (buffer.length) {
    paragraphs.push(buffer.join(" ").replace(/\s+/g, " ").trim());
  }

  return paragraphs.filter(Boolean).join("\n");
}

function buildOutput(files) {
  const sections = [
    "# Make Sweden Stronger – Full Transcripts",
    "",
    "Detta dokument innehåller samtliga transkriberingar i rå textform.",
    "Varje avsnitt börjar med en rubrik och följs av transkriptet.",
    "",
  ];

  for (const filePath of files) {
    const fileName = path.basename(filePath);
    const title = stripExtension(fileName);
    const raw = fs.readFileSync(filePath, "utf8");
    const text = extractTranscriptText(raw);

    sections.push(`## ${title}`);
    sections.push(text || "(Transkript saknas)");
    sections.push("");
  }

  return sections.join("\n");
}

const files = listTranscriptFiles();
const output = buildOutput(files);
fs.writeFileSync(OUTPUT_PATH, output, "utf8");

console.log(`Wrote ${files.length} transcripts to ${OUTPUT_PATH}`);
