import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const tracks = await prisma.track.findMany({
    take: 100,
    orderBy: { spottedAt: "desc" },
    include: { device: { select: { name: true } } },
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-5">
        <h1 className="text-2xl font-bold tracking-tight">
          🎵 VibeScout Tracker
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          {tracks.length} track{tracks.length !== 1 && "s"} spotted
        </p>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {tracks.length === 0 ? (
          <p className="text-center text-zinc-500 py-20">
            No tracks spotted yet. Start recognizing songs from the app!
          </p>
        ) : (
          <ul className="space-y-3">
            {tracks.map((track) => (
              <li
                key={track.id}
                className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-5 py-4"
              >
                <div>
                  <p className="font-semibold">{track.title}</p>
                  <p className="text-sm text-zinc-400">{track.artist}</p>
                  <p className="text-xs text-zinc-600">via {track.device.name}</p>
                </div>
                <time
                  className="text-xs text-zinc-500 whitespace-nowrap ml-4"
                  dateTime={track.spottedAt.toISOString()}
                >
                  {track.spottedAt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
