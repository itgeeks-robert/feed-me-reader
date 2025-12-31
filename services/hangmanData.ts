import { resilientFetch } from './fetch';

export interface HangmanWord {
    word: string;
    category: 'ACTOR' | 'FILM' | 'ARTIST' | 'SONG' | 'TECH' | 'GAMING' | 'SPORT' | 'FASHION' | 'OBJECT' | 'RANDOM';
    hint: string;
    difficulty: 1 | 2 | 3;
}

// REMOTE NODES FROM GITHUB (vintage/party_flutter)
const REMOTE_SOURCES = [
    { url: 'https://raw.githubusercontent.com/vintage/party_flutter/master/assets/json/en/movies.json', cat: 'FILM' },
    { url: 'https://raw.githubusercontent.com/vintage/party_flutter/master/assets/json/en/celebrities.json', cat: 'ACTOR' },
    { url: 'https://raw.githubusercontent.com/vintage/party_flutter/master/assets/json/en/music.json', cat: 'ARTIST' },
    { url: 'https://raw.githubusercontent.com/vintage/party_flutter/master/assets/json/en/games.json', cat: 'GAMING' }
];

/**
 * Fetches dynamic terms from the external party_flutter repository.
 * Maps raw strings to our themed HangmanWord interface.
 */
export const fetchDynamicHangmanData = async (): Promise<HangmanWord[]> => {
    const allDiscovered: HangmanWord[] = [];
    
    const fetchSource = async (src: { url: string, cat: string }) => {
        try {
            const res = await resilientFetch(src.url, { timeout: 8000 });
            if (!res.ok) return [];
            const data = await res.json();
            
            // The repo structure is usually a list of strings or objects with a name
            const items = Array.isArray(data) ? data : (data.items || data.data || []);
            
            return items.map((item: any) => {
                const word = typeof item === 'string' ? item : (item.name || item.title || "");
                if (!word || word.length < 3 || word.length > 30) return null;
                
                return {
                    word: word.toUpperCase(),
                    category: src.cat as any,
                    hint: `External frequency detected in ${src.cat} sector.`,
                    difficulty: word.length > 15 ? 3 : word.length > 8 ? 2 : 1
                } as HangmanWord;
            }).filter(Boolean) as HangmanWord[];
        } catch (e) {
            console.warn(`Could not sync with node: ${src.url}`);
            return [];
        }
    };

    const results = await Promise.all(REMOTE_SOURCES.map(fetchSource));
    return results.flat();
};

export const HANGMAN_DATA: HangmanWord[] = [
    // --- EXPANDED LOCAL DATASET (FORTRESS NODES) ---
    { word: "CARY FUKUNAGA", category: "ACTOR", hint: "True Detective S1 Director", difficulty: 2 },
    { word: "MIDSOMMAR", category: "FILM", hint: "Daylight horror ritual", difficulty: 2 },
    { word: "BARRY KEOGHAN", category: "ACTOR", hint: "Saltburn / Banshees", difficulty: 2 },
    { word: "CHALAMET", category: "ACTOR", hint: "Lisan al-Gaib", difficulty: 1 },
    { word: "STALKER", category: "FILM", hint: "Tarkovsky masterpiece", difficulty: 3 },
    { word: "MULHOLLAND DRIVE", category: "FILM", hint: "David Lynch nightmare", difficulty: 3 },
    { word: "PETER PASCAL", category: "ACTOR", hint: "The Last of Us lead", difficulty: 1 },
    { word: "BEAU IS AFRAID", category: "FILM", hint: "Ari Aster odyssey", difficulty: 3 },
    { word: "THE BEAR", category: "FILM", hint: "Yes chef", difficulty: 1 },
    { word: "JEREMY ALLEN WHITE", category: "ACTOR", hint: "Carmy Berzatto", difficulty: 2 },
    { word: "EMMA STONE", category: "ACTOR", hint: "Poor Things / La La Land", difficulty: 1 },
    { word: "YORGOS LANTHIMOS", category: "FILM", hint: "The Favourite director", difficulty: 3 },
    { word: "CHALLENGERS", category: "FILM", hint: "Luca Guadagnino tennis drama", difficulty: 2 },
    { word: "ANNA TAYLOR JOY", category: "ACTOR", hint: "Furiosa / Queens Gambit", difficulty: 2 },
    { word: "WILLEM DAFOE", category: "ACTOR", hint: "Green Goblin / Lighthouse", difficulty: 1 },
    { word: "ROBERT PATTINSON", category: "ACTOR", hint: "The Batman / Tenet", difficulty: 1 },
    { word: "DENIS VILLENEUVE", category: "FILM", hint: "Dune / Arrival director", difficulty: 2 },
    { word: "GRETA GERWIG", category: "FILM", hint: "Barbie director", difficulty: 1 },
    { word: "WES ANDERSON", category: "FILM", hint: "Symmetry king", difficulty: 1 },
    
    // --- MUSIC ---
    { word: "FKA TWIGS", category: "ARTIST", hint: "Experimental pop avant-garde", difficulty: 3 },
    { word: "ETHEL CAIN", category: "ARTIST", hint: "Preacher's Daughter", difficulty: 3 },
    { word: "PHOEBE BRIDGERS", category: "ARTIST", hint: "Stranger in the Alps", difficulty: 2 },
    { word: "BOYGENIUS", category: "ARTIST", hint: "Indie supergroup", difficulty: 2 },
    { word: "FRANK OCEAN", category: "ARTIST", hint: "Blonde / Channel Orange", difficulty: 1 },
    { word: "BON IVER", category: "ARTIST", hint: "For Emma, Forever Ago", difficulty: 2 },
    { word: "TAME IMPALA", category: "ARTIST", hint: "Kevin Parker project", difficulty: 1 },
    { word: "LCD SOUNDSYSTEM", category: "ARTIST", hint: "James Murphy disco punk", difficulty: 3 },
    { word: "THE SMILE", category: "ARTIST", hint: "Radiohead side project", difficulty: 3 },
    { word: "PORTISHEAD", category: "ARTIST", hint: "Trip-hop legends", difficulty: 2 },
    { word: "MASSIVE ATTACK", category: "ARTIST", hint: "Mezzanine creators", difficulty: 2 },

    // --- GAMING & TECH ---
    { word: "HADES TWO", category: "GAMING", hint: "Melinoe's journey", difficulty: 2 },
    { word: "BALDURS GATE", category: "GAMING", hint: "Larian's massive RPG", difficulty: 1 },
    { word: "ALAN WAKE", category: "GAMING", hint: "The writer in the dark", difficulty: 2 },
    { word: "REMEDY", category: "GAMING", hint: "Control / Max Payne studio", difficulty: 2 },
    { word: "DECKARD CAIN", category: "GAMING", hint: "Stay a while and listen", difficulty: 2 },
    { word: "MALENIA", category: "GAMING", hint: "Blade of Miquella", difficulty: 3 },
    { word: "BLOODBORNE", category: "GAMING", hint: "Fear the old blood", difficulty: 2 },
    { word: "DISCO ELYSIUM", category: "GAMING", hint: "Revachol detective", difficulty: 3 },
    { word: "HOLLOW KNIGHT", category: "GAMING", hint: "Hallownest bug knight", difficulty: 1 },
    { word: "CELESTE", category: "GAMING", hint: "Mountain climbing platformer", difficulty: 1 },
    { word: "SUPERHOT", category: "GAMING", hint: "Time moves when you move", difficulty: 2 }
];
