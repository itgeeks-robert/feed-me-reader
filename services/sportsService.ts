import { resilientFetch } from './fetch';
import { allTeamsMap } from './sportsData';

const SPORTS_CACHE_KEY = 'sports_data_cache';
const LAST_SPORTS_FETCH_KEY = 'last_sports_fetch_timestamp';

export const needsFreshSportsData = () => {
    const lastFetch = localStorage.getItem(LAST_SPORTS_FETCH_KEY);
    // Refresh every 2 hours
    return !lastFetch || (Date.now() - parseInt(lastFetch, 10)) > 2 * 60 * 60 * 1000;
};

export const getCachedSportsData = (): Map<string, any> | null => {
    const cachedData = localStorage.getItem(SPORTS_CACHE_KEY);
    if (cachedData) {
        try {
            return new Map(JSON.parse(cachedData));
        } catch (e) {
            console.error("Failed to parse cached sports data", e);
            return null;
        }
    }
    return null;
};

// This function replaces your existing, flawed score fetching logic.
// It finds the latest match and adapts the result for away games.
async function fetchLatestMatchDataAndAdaptForAwayGame(teamFullName: string) {
    try {
        // --- Step 1: Get the primary team's unique ID and badge ---
        const teamSearchRes = await resilientFetch(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(teamFullName)}`);
        const teamSearchData = await teamSearchRes.json();
        const primaryTeam = teamSearchData?.teams?.[0];

        if (!primaryTeam || !primaryTeam.idTeam) {
            throw new Error(`Could not find team ID for ${teamFullName}`);
        }
        const primaryTeamId = primaryTeam.idTeam;
        const primaryTeamBadge = primaryTeam.strTeamBadge;

        // --- Step 2: Get the last 5 events for the team using their ID ---
        const lastEventsRes = await resilientFetch(`https://www.thesportsdb.com/api/v1/json/3/eventslast.php?id=${primaryTeamId}`);
        const lastEventsData = await lastEventsRes.json();
        const lastEvents = lastEventsData?.results;

        if (!lastEvents || lastEvents.length === 0) {
            throw new Error(`No recent events found for ${teamFullName}`);
        }

        // --- Step 3: Find the most recent "Finished" match AND the absolute most recent event ---
        const mostRecentFinishedMatch = lastEvents.find((event: any) => event.strStatus === "Match Finished");
        const absoluteMostRecentEvent = lastEvents[0]; // The API list is pre-sorted

        let matchToDisplay = mostRecentFinishedMatch;
        let isPendingResult = false;

        // --- Step 4: Handle API data lag for recent, unfinished games ---
        if (absoluteMostRecentEvent && (!mostRecentFinishedMatch || absoluteMostRecentEvent.idEvent !== mostRecentFinishedMatch.idEvent)) {
            const kickOffTime = new Date(`${absoluteMostRecentEvent.dateEvent}T${absoluteMostRecentEvent.strTime}`);
            const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

            if (kickOffTime > fortyEightHoursAgo) {
                matchToDisplay = absoluteMostRecentEvent;
                isPendingResult = true;
            }
        }

        if (!matchToDisplay) {
            throw new Error(`No recent completed or pending matches found for ${teamFullName}`);
        }
        
        // --- Step 5: Get opponent team's badge ---
        const opponentTeamId = matchToDisplay.idHomeTeam === primaryTeamId 
            ? matchToDisplay.idAwayTeam 
            : matchToDisplay.idHomeTeam;

        let opponentTeamBadge = null;
        try {
            const opponentTeamRes = await resilientFetch(`https://www.thesportsdb.com/api/v1/json/3/lookupteam.php?id=${opponentTeamId}`);
            const opponentTeamData = await opponentTeamRes.json();
            opponentTeamBadge = opponentTeamData?.teams?.[0]?.strTeamBadge || null;
        } catch (e) {
            console.warn(`Could not fetch opponent (${opponentTeamId}) badge`, e);
        }

        // --- Step 6: Determine if it's an away game ---
        const isAwayGame = matchToDisplay.idAwayTeam === primaryTeamId;

        // --- Step 7: Return a clean, structured result for the UI to use ---
        return {
            success: true,
            matchDate: matchToDisplay.dateEvent,
            homeTeam: matchToDisplay.strHomeTeam,
            homeScore: isPendingResult ? '-' : matchToDisplay.intHomeScore,
            homeTeamBadge: isAwayGame ? opponentTeamBadge : primaryTeamBadge,
            awayTeam: matchToDisplay.strAwayTeam,
            awayScore: isPendingResult ? '-' : matchToDisplay.intAwayScore,
            awayTeamBadge: isAwayGame ? primaryTeamBadge : opponentTeamBadge,
            wasAwayGameForPrimaryTeam: isAwayGame,
            isPending: isPendingResult,
            teamFullName: teamFullName // Pass original name for the UI's onClick handler
        };

    } catch (error) {
        console.error(`Failed to fetch match data for ${teamFullName}:`, error);
        return { success: false, error: (error as Error).message };
    }
}

export const fetchAllSportsData = async (teams: string[]): Promise<Map<string, any>> => {
    const fetchTeamData = async (teamCode: string) => {
        const teamFullName = allTeamsMap.get(teamCode.toUpperCase());
        if (!teamFullName) {
            return { team: teamCode, result: { error: `Unknown team code: ${teamCode}` } };
        }
        const result = await fetchLatestMatchDataAndAdaptForAwayGame(teamFullName);
        return { team: teamCode, result };
    };

    const promises = teams.map(fetchTeamData);
    const allResults = await Promise.all(promises);
    const newResults = new Map<string, any>(allResults.map(res => [res.team, res.result]));

    localStorage.setItem(SPORTS_CACHE_KEY, JSON.stringify(Array.from(newResults.entries())));
    localStorage.setItem(LAST_SPORTS_FETCH_KEY, String(Date.now()));

    return newResults;
};