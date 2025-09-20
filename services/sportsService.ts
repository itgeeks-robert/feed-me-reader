import { resilientFetch } from './fetch';
import { allTeamsMap } from './sportsData';

const SPORTS_CACHE_KEY = 'sports_data_cache';
const LAST_SPORTS_FETCH_KEY = 'last_sports_fetch_timestamp';

export const needsFreshSportsData = () => {
    const lastFetch = localStorage.getItem(LAST_SPORTS_FETCH_KEY);
    return !lastFetch || (Date.now() - parseInt(lastFetch, 10)) > 2 * 60 * 60 * 1000; // 2 hours
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

export const fetchAllSportsData = async (teams: string[]): Promise<Map<string, any>> => {
    const fetchTeamData = async (teamCode: string): Promise<{ team: string; result: any; }> => {
        const teamFullName = allTeamsMap.get(teamCode.toUpperCase()) || teamCode;
        try {
            const teamSearchRes = await resilientFetch(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(teamFullName)}`);
            const teamSearchData = await teamSearchRes.json();
            const teamInfo = teamSearchData.teams?.[0];
            if (!teamInfo) throw new Error(`Team not found.`);

            const lastEventsRes = await resilientFetch(`https://www.thesportsdb.com/api/v1/json/3/eventslast.php?id=${teamInfo.idTeam}`);
            const lastEventsData = await lastEventsRes.json();
            
            const completedEvents = (lastEventsData.results || []).filter((event: any) =>
                event.strStatus === "Match Finished" || (event.intHomeScore !== null && event.intAwayScore !== null)
            );

            completedEvents.sort((a: any, b: any) => new Date(`${b.dateEvent}T${b.strTime || '00:00'}`).getTime() - new Date(`${a.dateEvent}T${a.strTime || '00:00'}`).getTime());
            const lastMatch = completedEvents[0];
            
            if (!lastMatch) throw new Error('No last match data found.');

            return { team: teamCode, result: { ...lastMatch, teamFullName: teamInfo.strTeam }};
        } catch (error) {
            return { team: teamCode, result: { error: (error as Error).message } };
        }
    };
    
    const promises = teams.map(fetchTeamData);
    const allResults = await Promise.all(promises);
    const newResults = new Map<string, any>(allResults.map(res => [res.team, res.result]));

    localStorage.setItem(SPORTS_CACHE_KEY, JSON.stringify(Array.from(newResults.entries())));
    localStorage.setItem(LAST_SPORTS_FETCH_KEY, String(Date.now()));

    return newResults;
};
