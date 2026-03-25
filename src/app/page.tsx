import { prisma } from "@/lib/prisma";
import Feed from "./feed";

export const dynamic = "force-dynamic";

const INITIAL_PAGE_SIZE = 20;

export default async function Home() {
  const rawTracks = await prisma.track.findMany({
    take: INITIAL_PAGE_SIZE + 1,
    orderBy: { spottedAt: "desc" },
    include: { device: { select: { name: true } } },
  });

  const hasMore = rawTracks.length > INITIAL_PAGE_SIZE;
  const tracks = hasMore ? rawTracks.slice(0, INITIAL_PAGE_SIZE) : rawTracks;
  const nextCursor = hasMore ? tracks[tracks.length - 1].id : null;

  // Serialize dates for the client component
  const serializedTracks = tracks.map((t) => ({
    id: t.id,
    title: t.title,
    artist: t.artist,
    coverUrl: t.coverUrl,
    spottedAt: t.spottedAt.toISOString(),
    device: { name: t.device.name },
  }));

  const latest = tracks[0] ?? null;

  return (
    <div className="h-screen w-screen flex flex-col relative overflow-hidden">
      {/* ── Background gradient ── */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/40 to-gray-900 -z-10" />

      {/* ── Main layout (above footer) ── */}
      <div className="flex flex-1 overflow-hidden pl-20 pb-[60px]">
        {/* ── Left sidebar + About card hover group ── */}
        <div className="group/sidebar fixed left-0 top-0 bottom-0 z-30">
          <aside className="w-20 h-full bg-gray-900/80 backdrop-blur-md flex flex-col items-center py-8 border-r border-white/5">
            <div className="flex-1" />
            <div className="flex flex-col items-center">
              <h1 className="text-vertical font-serif text-5xl text-white tracking-wider flex items-center gap-2">
                Vibe Scout
              </h1>
            </div>
            <div className="flex-1" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/vibescout.png"
              alt="VibeScout"
              className="w-10 h-10 mb-2 opacity-70"
            />
          </aside>

          {/* About card — slides in from left on sidebar hover */}
          <div className="absolute left-20 top-1/2 -translate-y-1/2 ml-4 w-[260px] glass-panel glow-yellow p-6 opacity-0 -translate-x-4 pointer-events-none transition-all duration-300 ease-out group-hover/sidebar:opacity-100 group-hover/sidebar:translate-x-0 group-hover/sidebar:pointer-events-auto">
            <h3 className="font-serif text-2xl text-white mb-3">About</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              VibeScout is a live music recognition feed that
              broadcasts what&apos;s playing in real time, promoting discovery
              and connecting listeners everywhere. Inspired by bop spotter by Riley Waltz.
            </p>
          </div>
        </div>

        {/* ── Center area ── */}
        <main className="flex-1 relative flex items-center justify-center p-8">
          {latest ? (
            <div className="glass-panel glow-green p-8 flex flex-col items-center text-center w-full max-w-[340px] z-10">
              <p className="text-sm text-gray-300 mb-2">Last Scouted</p>

              {/* Cover art */}
              {latest.coverUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={latest.coverUrl}
                  alt={`${latest.artist} – ${latest.title}`}
                  className="w-32 h-32 rounded-lg object-cover shadow-lg mb-4"
                />
              )}

              <div className="mb-6 leading-tight">
                <p className="font-serif text-xl text-gray-400">{latest.artist}</p>
                <h2 className="font-serif text-3xl text-white">{latest.title}</h2>
              </div>

              <div className="w-full flex flex-col gap-3">
                <a
                  href={`https://open.spotify.com/search/${encodeURIComponent(latest.title + " " + latest.artist)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-button w-full py-2.5 rounded-lg text-sm text-white font-medium text-center no-underline"
                >
                  Open in Spotify
                </a>
                <a
                  href={`https://music.apple.com/us/search?term=${encodeURIComponent(latest.title + " " + latest.artist)}`}
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

        {/* ── Right feed sidebar ── */}
        <aside className="w-[350px] flex-shrink-0 flex flex-col py-8 pr-8 z-10">
          <h2 className="font-serif text-3xl text-white mb-6 px-4">Feed</h2>
          <Feed initialTracks={serializedTracks} initialCursor={nextCursor} />
        </aside>
      </div>

      {/* ── Footer — fixed bottom ── */}
      <footer className="fixed bottom-0 left-0 right-0 h-[60px] bg-gray-900/90 backdrop-blur-md border-t border-white/5 flex items-center justify-between px-8 z-20 pl-24">
        {/* Left icons */}
        <div className="flex items-center gap-6 text-gray-400">
          <a href="https://github.com/simoneraffaelli/vibescout-web" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="GitHub">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>
        </div>

        {/* Center logo */}
        <div className="flex flex-col items-center opacity-50">
          <span className="font-serif text-lg text-white">VibeScout</span>
        </div>

        {/* Right links */}
        <div className="flex items-center gap-6 text-sm text-gray-400">
          <a href="https://github.com/simoneraffaelli/vibescout-web/blob/main/privacy.md" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Privacy</a>
        </div>
      </footer>
    </div>
  );
}
