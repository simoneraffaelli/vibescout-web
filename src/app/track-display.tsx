"use client";

import { useState } from "react";
import Feed from "./feed";

type Track = {
  id: number;
  title: string;
  artist: string;
  coverUrl: string | null;
  spottedAt: string;
  device: { name: string };
};

type TrackDisplayProps = {
  initialTracks: Track[];
  initialCursor: number | null;
  onlineScouts: number;
};

export default function TrackDisplay({ initialTracks, initialCursor, onlineScouts }: TrackDisplayProps) {
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  const latest = initialTracks[0] ?? null;
  const displayTrack = selectedTrack ?? latest;
  const isLatest = !selectedTrack || (latest && selectedTrack.id === latest.id);

  return (
    <>
      {/* ── Center area ── */}
      <main className="flex-1 relative flex items-center justify-center p-4 md:p-8">
        {displayTrack ? (
          <div className="glass-panel glow-green p-6 md:p-8 flex flex-col items-center text-center w-full max-w-[340px] z-10">
            {isLatest ? (
              <p className="text-sm text-gray-300 mb-2">Last Scouted</p>
            ) : (
              <button
                onClick={() => setSelectedTrack(null)}
                className="text-sm text-gray-400 hover:text-white transition-colors mb-2 flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back to latest
              </button>
            )}

            {/* Cover art */}
            {displayTrack.coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayTrack.coverUrl}
                alt={`${displayTrack.artist} – ${displayTrack.title}`}
                className="w-28 h-28 md:w-32 md:h-32 rounded-lg object-cover shadow-lg mb-4"
              />
            )}

            <div className="mb-6 leading-tight">
              <p className="font-serif text-xl text-gray-400">{displayTrack.artist}</p>
              <h2 className="font-serif text-2xl md:text-3xl text-white">{displayTrack.title}</h2>
            </div>

            <div className="w-full flex flex-col gap-3">
              <a
                href={`https://open.spotify.com/search/${encodeURIComponent(displayTrack.title + " " + displayTrack.artist)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-button w-full py-2.5 rounded-lg text-sm text-white font-medium text-center no-underline"
              >
                Open in Spotify
              </a>
              <a
                href={`https://music.apple.com/us/search?term=${encodeURIComponent(displayTrack.title + " " + displayTrack.artist)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-button w-full py-2.5 rounded-lg text-sm text-white font-medium text-center no-underline"
              >
                Open in Apple Music
              </a>
            </div>
          </div>
        ) : (
          <div className="glass-panel p-8 text-center max-w-[340px]">
            <p className="text-gray-400 text-lg">No tracks spotted yet</p>
            <p className="text-gray-500 text-sm mt-2">
              Start recognizing songs from the app!
            </p>
          </div>
        )}
      </main>

      {/* ── Feed sidebar (right on desktop, below on mobile) ── */}
      <aside className="w-full md:w-[350px] flex-shrink-0 flex flex-col py-4 md:py-8 px-4 md:px-0 md:pr-8 z-10 min-h-0 md:max-h-none">
        <Feed
          initialTracks={initialTracks}
          initialCursor={initialCursor}
          onTrackClick={setSelectedTrack}
          selectedTrackId={selectedTrack?.id ?? null}
          onlineScouts={onlineScouts}
        />
      </aside>
    </>
  );
}
