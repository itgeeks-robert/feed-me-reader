/**
 * THE VOID // SPORTS_SERVICE v2.0
 * Fetches latest match data from TheSportsDB.
 *
 * Improvements over v1:
 * - Uses IndexedDB via cacheService (survives localStorage quota limits)
 * - Per-team cache with individual TTLs (avoids re-fetching teams that haven't played)
 * - Parallel fetches with concurrency cap (avoids hammering the API)
 * - Cleaner result type
 */

import { resilientFetch } from './fetch';
import { allTeamsMap } from './sportsData';
import { get as idbGet, set as idbSet } from './cacheService';

const SPORTS_CACHE_KEY = 'void_sports_cache_v2';
const CACHE_TTL_MS     = 2 * 60 * 60 * 1_000; // 2 hours
const CONCURRENT_LIMIT = 3;                     // max simultaneous API calls
const API_BASE         = 'https://www.thesportsdb.com/api/v1/json/3';

export interface MatchResult {
  success:                  true;
  matchDate:                string;
  homeTeam:                 string;
  homeScore:                string | number;
  homeTeamBadge:            string | null;
  awayTeam:                 string;
  awayScore:                string | number;
  awayTeamBadge:            string | null;
  wasAwayGameForPrimaryTeam: boolean;
  isPending:                boolean;
  teamFullName:             string;
}

export interface MatchError {
  success: false;
  error:   string;
}

export type MatchData = MatchResult | MatchError;

/* ── Cache entry (stored per-team) ── */
interface CacheEntry {
  data:      MatchData;
  fetchedAt: number;
}

/* ── Load / save the full cache ── */
const loadCache = async (): Promise<Record<string, CacheEntry>> => {
  try {
    return (await idbGet<Record<string, CacheEntry>>(SPORTS_CACHE_KEY)) ?? {};
  } catch {
    return {};
  }
};

const saveCache = async (cache: Record<string, CacheEntry>): Promise<void> => {
  try {
    await idbSet(SPORTS_CACHE_KEY, cache);
  } catch {}
};

const isFresh = (entry: CacheEntry): boolean =>
  Date.now() - entry.fetchedAt < CACHE_TTL_MS;

/* ── API helpers ── */
const apiGet = async (path: string): Promise<any> => {
  const res = await resilientFetch(`${API_BASE}/${path}`, { timeout: 10_000, directTimeout: 4_000 });
  if (!res.ok) throw new Error(`Sports API ${path} → HTTP ${res.status}`);
  return res.json();
};

/** Fetch the latest match for a single team by full name */
const fetchMatch = async (teamFullName: string): Promise<MatchData> => {
  try {
    /* 1. Resolve team ID + badge */
    const search      = await apiGet(`searchteams.php?t=${encodeURIComponent(teamFullName)}`);
    const primaryTeam = search?.teams?.[0];
    if (!primaryTeam?.idTeam) throw new Error(`Team not found: ${teamFullName}`);

    const primaryTeamId    = primaryTeam.idTeam as string;
    const primaryTeamBadge = primaryTeam.strTeamBadge as string | null;

    /* 2. Last 5 events */
    const eventsData = await apiGet(`eventslast.php?id=${primaryTeamId}`);
    const events     = eventsData?.results as any[] | undefined;
    if (!events?.length) throw new Error(`No recent events for ${teamFullName}`);

    /* 3. Pick best event to display */
    const finished = events.find(e => e.strStatus === 'Match Finished');
    const latest   = events[0];
    let match      = finished;
    let isPending  = false;

    if (latest && latest.idEvent !== finished?.idEvent) {
      const kickOff       = new Date(`${latest.dateEvent}T${latest.strTime}`);
      const fortyEightAgo = new Date(Date.now() - 48 * 60 * 60 * 1_000);
      if (kickOff > fortyEightAgo) { match = latest; isPending = true; }
    }

    if (!match) throw new Error(`No displayable match for ${teamFullName}`);

    /* 4. Opponent badge */
    const isAway       = match.idAwayTeam === primaryTeamId;
    const opponentId   = isAway ? match.idHomeTeam : match.idAwayTeam;
    let opponentBadge: string | null = null;

    try {
      const oppData  = await apiGet(`lookupteam.php?id=${opponentId}`);
      opponentBadge  = oppData?.teams?.[0]?.strTeamBadge ?? null;
    } catch {}

    return {
      success:                   true,
      matchDate:                 match.dateEvent,
      homeTeam:                  match.strHomeTeam,
      homeScore:                 isPending ? '-' : match.intHomeScore,
      homeTeamBadge:             isAway ? opponentBadge : primaryTeamBadge,
      awayTeam:                  match.strAwayTeam,
      awayScore:                 isPending ? '-' : match.intAwayScore,
      awayTeamBadge:             isAway ? primaryTeamBadge : opponentBadge,
      wasAwayGameForPrimaryTeam: isAway,
      isPending,
      teamFullName,
    };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
};

/* ── Concurrency limiter ── */
const withConcurrencyLimit = async <T>(
  tasks:  (() => Promise<T>)[],
  limit:  number,
): Promise<T[]> => {
  const results: T[] = [];
  let i = 0;

  const run = async (): Promise<void> => {
    while (i < tasks.length) {
      const idx = i++;
      results[idx] = await tasks[idx]();
    }
  };

  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, run));
  return results;
};

/* ─────────────────────────────────────────────────
   PUBLIC API
───────────────────────────────────────────────── */

/**
 * Returns match data for every team code supplied.
 * Uses a per-team cache; only re-fetches stale entries.
 */
export const fetchAllSportsData = async (
  teamCodes: string[],
): Promise<Map<string, MatchData>> => {
  const cache  = await loadCache();
  const result = new Map<string, MatchData>();
  const toFetch: { code: string; name: string }[] = [];

  for (const code of teamCodes) {
    const upper = code.toUpperCase();
    const name  = allTeamsMap.get(upper);
    if (!name) {
      result.set(upper, { success: false, error: `Unknown team code: ${upper}` });
      continue;
    }

    const entry = cache[upper];
    if (entry && isFresh(entry)) {
      result.set(upper, entry.data);
    } else {
      toFetch.push({ code: upper, name });
    }
  }

  if (toFetch.length > 0) {
    const tasks = toFetch.map(({ code, name }) => async () => {
      const data = await fetchMatch(name);
      cache[code] = { data, fetchedAt: Date.now() };
      result.set(code, data);
    });

    await withConcurrencyLimit(tasks, CONCURRENT_LIMIT);
    await saveCache(cache);
  }

  return result;
};

/** Force-refresh a single team regardless of cache freshness */
export const refreshTeam = async (teamCode: string): Promise<MatchData> => {
  const upper = teamCode.toUpperCase();
  const name  = allTeamsMap.get(upper);
  if (!name) return { success: false, error: `Unknown team code: ${upper}` };

  const data  = await fetchMatch(name);
  const cache = await loadCache();
  cache[upper] = { data, fetchedAt: Date.now() };
  await saveCache(cache);
  return data;
};

export const needsFreshSportsData = async (teamCodes: string[]): Promise<boolean> => {
  const cache = await loadCache();
  return teamCodes.some(code => {
    const entry = cache[code.toUpperCase()];
    return !entry || !isFresh(entry);
  });
};
