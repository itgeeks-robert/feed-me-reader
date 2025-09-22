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

export const fetchAllSportsData = async (teams: string[]): Promise<Map<string, any>> => {
    const fetchTeamData = async (teamCode: string): Promise<{ team: string; result: any; }> => {
        const teamFullName = allTeamsMap.get(teamCode.toUpperCase()) || teamCode;
        try {
            // Step 1: Find the team's unique, official ID.
            const teamSearchResponse = await resilientFetch(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(teamFullName)}`);
            if (!teamSearchResponse.ok) throw new Error(`Team search API failed for ${teamFullName}`);
            const teamSearchData = await teamSearchResponse.json();
            const teamId = teamSearchData?.teams?.[0]?.idTeam;
    
            if (!teamId) {
                throw new Error(`Could not find a valid team ID for ${teamFullName}`);
            }
    
            // Step 2: Fetch the team's last 5 events.
            const lastEventsResponse = await resilientFetch(`https://www.thesportsdb.com/api/v1/json/3/eventslast.php?id=${teamId}`);
            if (!lastEventsResponse.ok) throw new Error(`Last events API failed for ${teamFullName}`);
            const lastEventsData = await lastEventsResponse.json();
            const lastEvents = lastEventsData?.results;
    
            if (!lastEvents || !Array.isArray(lastEvents) || lastEvents.length === 0) {
                throw new Error(`No recent events found for ${teamFullName}`);
            }

            // --- REVISED LOGIC ---
            const latestEvent = lastEvents[0];

            // Case 1: The most recent event is officially finished. Use it.
            if (latestEvent.strStatus === "Match Finished") {
                return { team: teamCode, result: { ...latestEvent, teamFullName } };
            }

            // Case 2: The most recent event is not finished. Check its time.
            // Append 'Z' to ensure the date is parsed as UTC/GMT, as per API docs.
            const kickOffTime = new Date(`${latestEvent.dateEvent}T${latestEvent.strTime}Z`);
            
            if (isNaN(kickOffTime.getTime())) {
                throw new Error(`Invalid date/time for latest event for ${teamFullName}.`);
            }
            
            const estimatedEndTime = new Date(kickOffTime.getTime() + 120 * 60 * 1000); // Add 120 mins
            const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

            // Case 2a: Game ended > 4 hours ago, but API is delayed. Show a pending result.
            if (estimatedEndTime < fourHoursAgo) {
                return {
                    team: teamCode,
                    result: {
                        ...latestEvent,
                        teamFullName,
                        intHomeScore: '-',
                        intAwayScore: '-',
                        isPending: true
                    }
                };
            }
            
            // Case 2b: Game is in the < 4 hour grace period. Show nothing.
            throw new Error(`Latest match for ${teamFullName} is in the grace period; score is not yet confirmed.`);
    
        } catch (error) {
            console.error(`Error fetching data for ${teamFullName}:`, error);
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