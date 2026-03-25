"use client";

import { useState, useCallback } from "react";

type Track = {
  id: number;
  title: string;
  artist: string;
  coverUrl: string | null;
  spottedAt: string;
  device: { name: string };
};

type FeedProps = {
  initialTracks: Track[];
  initialCursor: number | null;
  onTrackClick?: (track: Track) => void;
  selectedTrackId?: number | null;
  onlineScouts: number;
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatSpottedAt(isoDate: string) {
  const d = new Date(isoDate);
  // Deterministic pseudo-random value from timestamp for color variety
  const ts = d.getTime();
  const ageMin = (((ts >>> 16) ^ ts) & 0x7fffffff) % 80;

  const day = DAYS[d.getDay()];
  const date = `${day}, ${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

  // Dot color based on age
  let dot = {
    border: "border-green-200/50",
    bg: "bg-green-200/20",
    glow: "shadow-[0_0_10px_rgba(187,247,208,0.5)]",
    timeColor: "text-[#d9f99d]",
  };
  if (ageMin >= 60) {
    dot = {
      border: "border-orange-300/50",
      bg: "bg-orange-300/20",
      glow: "shadow-[0_0_10px_rgba(253,186,116,0.5)]",
      timeColor: "text-[#fdba74]",
    };
  } else if (ageMin >= 15) {
    dot = {
      border: "border-lime-200/50",
      bg: "bg-lime-200/20",
      glow: "shadow-[0_0_10px_rgba(217,249,157,0.5)]",
      timeColor: "text-[#ecfccb]",
    };
  } else if (ageMin >= 5) {
    dot = {
      border: "border-orange-200/50",
      bg: "bg-orange-200/20",
      glow: "shadow-[0_0_10px_rgba(254,215,170,0.5)]",
      timeColor: "text-[#fed7aa]",
    };
  }

  return { date, time, dot };
}

export default function Feed({ initialTracks, initialCursor, onTrackClick, selectedTrackId, onlineScouts }: FeedProps) {
  const [tracks, setTracks] = useState(initialTracks);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(async () => {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tracks?limit=20&cursor=${cursor}`);
      const json = await res.json();
      setTracks((prev) => [...prev, ...json.data]);
      setCursor(json.nextCursor);
    } finally {
      setLoading(false);
    }
  }, [cursor, loading]);

  const scoutCta = (
    <a
      href="https://github.com/simoneraffaelli/vibescout-web/blob/main/become-a-scout.md"
      target="_blank"
      rel="noopener noreferrer"
      className="w-full glass-panel glow-yellow py-3 px-4 flex justify-between items-center text-sm text-gray-300 hover:text-white transition-colors rounded-xl hover:bg-white/10 no-underline"
    >
      <span>Become a Scout</span>
      <span className="flex items-center gap-2 text-white">
        <svg
          className="w-3.5 h-3.5 opacity-70"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
          />
        </svg>
        Sign Up
      </span>
    </a>
  );

  return (
    <>
      {/* CTA above feed on mobile */}
      <div className="md:hidden px-4 mb-4 flex-shrink-0">
        {scoutCta}
      </div>

        <div className="sticky top-0 z-10 pb-4 px-4 md:px-4">
          <h2 className="font-serif text-3xl text-white mb-2">Feed</h2>
          <div className="flex items-center gap-1.5">
            <span className={`inline-block h-2 w-2 rounded-full ${onlineScouts > 0 ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" : "bg-gray-600"}`} />
            <span className="text-xs text-gray-400">
              {onlineScouts} scout{onlineScouts !== 1 && "s"} online
            </span>
          </div>
        </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-4">

        <ul className="space-y-4 md:space-y-6 relative">
          {tracks.map((track) => {
            const { date, time, dot } = formatSpottedAt(track.spottedAt);
            return (
              <li key={track.id} className="flex gap-4 relative feed-item">
                {/* Timeline dot + vertical line */}
                <div className="feed-line pt-2">
                  <div
                    className={`w-5 h-5 rounded-md border flex-shrink-0 ${dot.border} ${dot.bg} ${dot.glow}`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Spotted timestamp */}
                  <div className="mb-2">
                    <p className="text-[11px] text-gray-400 leading-tight">
                      {date}
                    </p>
                    <p
                      className={`text-2xl md:text-3xl font-serif ${dot.timeColor} leading-none mt-0.5`}
                    >
                      {time}
                    </p>
                  </div>

                  {/* Track info card */}
                  <div className="group/track relative">
                    <div
                      onClick={() => onTrackClick?.(track)}
                      className={`flex items-center gap-3 bg-white/5 rounded-lg p-2 border transition-colors cursor-pointer ${selectedTrackId === track.id ? "border-green-400/40 bg-green-400/10" : "border-white/10 hover:border-white/20"}`}
                    >
                      {track.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={track.coverUrl}
                          alt={`${track.artist} – ${track.title}`}
                          className="w-10 h-10 rounded object-cover flex-shrink-0 shadow-md"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-gray-700/60 flex-shrink-0 flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-gray-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z"
                            />
                          </svg>
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider truncate">
                          {track.device.name}
                        </p>
                        <p className="text-sm text-white font-medium truncate">
                          {track.artist} &ndash; {track.title}
                        </p>
                      </div>
                    </div>

                    {/* Popover — full artist & title on hover */}
                    <div className="absolute left-0 right-0 bottom-full mb-2 z-20 glass-panel !bg-[rgba(17,24,39,0.95)] !backdrop-blur-xl p-3 opacity-0 translate-y-1 pointer-events-none transition-all duration-200 ease-out group-hover/track:opacity-100 group-hover/track:translate-y-0 group-hover/track:pointer-events-auto">
                      <p className="text-xs text-gray-400 mb-1">{track.device.name}</p>
                      <p className="text-sm text-white font-medium leading-snug">
                        {track.artist} &ndash; {track.title}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Load more */}
        {cursor && (
          <div className="pt-6 pb-2 text-center">
            <button
              onClick={loadMore}
              disabled={loading}
              className="text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-40"
            >
              {loading ? "Loading…" : "Load more"}
            </button>
          </div>
        )}
      </div>

      {/* CTA at bottom of feed (desktop only) */}
      <div className="hidden md:block mt-6 px-4 flex-shrink-0">
        {scoutCta}
      </div>
    </>
  );
}
