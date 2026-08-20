export interface UpdateInfo {
  version: string;
  url: string;
  notes: string;
}

export type UpdateCheckResult = { ok: boolean; update: UpdateInfo | null };

const REPO = "Tenth-G/Reverie";
const RELEASES_URL = `https://api.github.com/repos/${REPO}/releases/latest`;

/** Parse "v1.2.3" / "1.2.3" into [1, 2, 3]. */
function parseVersion(v: string): number[] {
  return String(v)
    .replace(/^v/i, "")
    .split(".")
    .map((n) => parseInt(n, 10) || 0);
}

/** Compare two version strings; > 0 if `a` is newer than `b`. */
export function compareVersions(a: string, b: string): number {
  const av = parseVersion(a);
  const bv = parseVersion(b);
  const len = Math.max(av.length, bv.length);
  for (let i = 0; i < len; i++) {
    const d = (av[i] ?? 0) - (bv[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

/**
 * Fetch the latest release from the GitHub repo.
 * - 404 (no releases yet) is treated as "no update".
 * - 403 / network failures return ok:false so the caller can report a check error.
 */
export async function checkLatestRelease(): Promise<UpdateCheckResult> {
  try {
    const res = await fetch(RELEASES_URL, {
      headers: { Accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 404) return { ok: true, update: null };
    if (!res.ok) return { ok: false, update: null };
    const data = (await res.json()) as {
      tag_name?: string;
      html_url?: string;
      body?: string;
      draft?: boolean;
      prerelease?: boolean;
    };
    if (!data.tag_name || data.draft || data.prerelease) {
      return { ok: true, update: null };
    }
    return {
      ok: true,
      update: {
        version: String(data.tag_name).replace(/^v/i, ""),
        url: data.html_url ?? `https://github.com/${REPO}/releases`,
        notes: String(data.body ?? "").slice(0, 2000),
      },
    };
  } catch {
    return { ok: false, update: null };
  }
}
