const MB_BASE = "https://musicbrainz.org/ws/2";
const CAA_BASE = "https://coverartarchive.org";
const USER_AGENT = "VibeScout/1.0 (https://github.com/simoneraffaelli/vibescout-web)";

/**
 * Search MusicBrainz for a recording and return the Cover Art Archive
 * front-cover URL for its first release. Returns null on any failure.
 */
export async function fetchCoverUrl(
  title: string,
  artist: string,
): Promise<string | null> {
  try {
    // 1. Search for the recording
    const query = `recording:"${encodeURIComponent(title)}" AND artist:"${encodeURIComponent(artist)}"`;
    const searchUrl = `${MB_BASE}/recording?query=${query}&fmt=json&limit=5`;

    const searchRes = await fetch(searchUrl, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    });
    if (!searchRes.ok) return null;

    const searchData = await searchRes.json();
    const recordings = searchData.recordings as Array<{
      releases?: Array<{ id: string }>;
    }>;
    if (!recordings?.length) return null;

    // Collect unique release IDs from top results
    const releaseIds: string[] = [];
    for (const rec of recordings) {
      for (const rel of rec.releases ?? []) {
        if (!releaseIds.includes(rel.id)) releaseIds.push(rel.id);
        if (releaseIds.length >= 3) break;
      }
      if (releaseIds.length >= 3) break;
    }
    if (!releaseIds.length) return null;

    // 2. Try each release until we find one with cover art
    for (const releaseId of releaseIds) {
      const coverUrl = await getCoverForRelease(releaseId);
      if (coverUrl) return coverUrl;
    }

    return null;
  } catch {
    return null;
  }
}

async function getCoverForRelease(
  releaseId: string,
): Promise<string | null> {
  try {
    const caaUrl = `${CAA_BASE}/release/${releaseId}`;
    const caaRes = await fetch(caaUrl, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    });
    if (!caaRes.ok) return null;

    const caaData = await caaRes.json();
    const images = caaData.images as Array<{
      front: boolean;
      thumbnails?: { small?: string; "250"?: string; large?: string };
      image?: string;
    }>;
    if (!images?.length) return null;

    // Prefer the front cover
    const front = images.find((img) => img.front) ?? images[0];

    // Return a small thumbnail (250px) for performance, fall back to full
    const url =
      front.thumbnails?.["250"] ??
      front.thumbnails?.small ??
      front.thumbnails?.large ??
      front.image ??
      null;

    // CAA returns http:// URLs; upgrade to https:// for CSP compliance
    return url?.replace(/^http:\/\//, "https://") ?? null;
  } catch {
    return null;
  }
}
