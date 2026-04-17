"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

import { formatSecondsAsClock } from "@/lib/text";

type SeekableAudioPlayerProps = {
  audioUrl: string;
  startAtSeconds?: number | null;
  focusLabel?: string | null;
};

function parseSeekSeconds(rawValue: string | null) {
  if (!rawValue) {
    return null;
  }

  const parsed = Number.parseInt(rawValue, 10);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function clampSeekTime(seconds: number, duration: number) {
  if (!Number.isFinite(duration) || duration <= 0) {
    return Math.max(0, seconds);
  }

  return Math.min(Math.max(0, seconds), Math.max(0, duration - 1));
}

export function SeekableAudioPlayer({ audioUrl, startAtSeconds, focusLabel }: SeekableAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasSeek =
    typeof startAtSeconds === "number" &&
    Number.isFinite(startAtSeconds) &&
    startAtSeconds >= 0;

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !hasSeek || typeof startAtSeconds !== "number") {
      return;
    }

    const applySeek = () => {
      audio.currentTime = clampSeekTime(startAtSeconds, audio.duration);
    };

    if (audio.readyState >= 1) {
      applySeek();
      return;
    }

    const onLoadedMetadata = () => {
      applySeek();
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata, { once: true });

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, [audioUrl, hasSeek, startAtSeconds]);

  return (
    <>
      {hasSeek ? (
        <p className="audioSeekHint">
          Lyssna från {formatSecondsAsClock(startAtSeconds)}
          {focusLabel?.trim() ? ` om ${focusLabel.trim()}` : ""}.
        </p>
      ) : null}
      <audio ref={audioRef} controls preload="none" className="audioPlayer">
        <source src={audioUrl} />
        Din webbläsare stödjer inte ljudspelaren.
      </audio>
    </>
  );
}

type SeekableAudioPlayerFromQueryProps = {
  audioUrl: string;
};

export function SeekableAudioPlayerFromQuery({ audioUrl }: SeekableAudioPlayerFromQueryProps) {
  const searchParams = useSearchParams();
  const startAtSeconds = parseSeekSeconds(searchParams.get("t"));
  const focusLabel = searchParams.get("from");

  return <SeekableAudioPlayer audioUrl={audioUrl} startAtSeconds={startAtSeconds} focusLabel={focusLabel} />;
}
