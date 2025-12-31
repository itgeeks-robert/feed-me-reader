import { resilientFetch } from './fetch';

export interface HangmanWord {
    word: string;
    category: 'ACTOR' | 'FILM' | 'ARTIST' | 'SONG' | 'TECH' | 'GAMING' | 'SPORT' | 'FASHION' | 'OBJECT' | 'RANDOM';
    hint: string;
    difficulty: 1 | 2 | 3;
}

const REMOTE_SOURCES = [
    { url: 'https://raw.githubusercontent.com/vintage/party_flutter/master/assets/json/en/movies.json', cat: 'FILM' },
    { url: 'https://raw.githubusercontent.com/vintage/party_flutter/master/assets/json/en/celebrities.json', cat: 'ACTOR' },
    { url: 'https://raw.githubusercontent.com/vintage/party_flutter/master/assets/json/en/music.json', cat: 'ARTIST' },
    { url: 'https://raw.githubusercontent.com/vintage/party_flutter/master/assets/json/en/games.json', cat: 'GAMING' }
];

export const fetchDynamicHangmanData = async (): Promise<HangmanWord[]> => {
    const allDiscovered: HangmanWord[] = [];
    const fetchSource = async (src: { url: string, cat: string }) => {
        try {
            const res = await resilientFetch(src.url, { timeout: 8000 });
            if (!res.ok) return [];
            const data = await res.json();
            const items = Array.isArray(data) ? data : (data.items || data.data || []);
            return items.map((item: any) => {
                const word = typeof item === 'string' ? item : (item.name || item.title || "");
                if (!word || word.length < 3 || word.length > 30) return null;
                return {
                    word: word.toUpperCase().trim(),
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
    // --- ACTORS ---
    { word: "CARY FUKUNAGA", category: "ACTOR", hint: "True Detective S1 Director", difficulty: 2 },
    { word: "BARRY KEOGHAN", category: "ACTOR", hint: "Saltburn / Banshees", difficulty: 2 },
    { word: "TIMOTHEE CHALAMET", category: "ACTOR", hint: "Lisan al-Gaib", difficulty: 1 },
    { word: "PEDRO PASCAL", category: "ACTOR", hint: "The Last of Us lead", difficulty: 1 },
    { word: "JEREMY ALLEN WHITE", category: "ACTOR", hint: "Carmy Berzatto", difficulty: 2 },
    { word: "EMMA STONE", category: "ACTOR", hint: "Poor Things / La La Land", difficulty: 1 },
    { word: "WILLEM DAFOE", category: "ACTOR", hint: "Green Goblin / Lighthouse", difficulty: 1 },
    { word: "ROBERT PATTINSON", category: "ACTOR", hint: "The Batman / Tenet", difficulty: 1 },
    { word: "FLORENCE PUGH", category: "ACTOR", hint: "Midsommar star", difficulty: 1 },
    { word: "MIA GOTH", category: "ACTOR", hint: "Pearl / X / MaXXXine", difficulty: 1 },
    { word: "AUSTIN BUTLER", category: "ACTOR", hint: "Elvis / Feyd-Rautha", difficulty: 1 },
    { word: "TILDA SWINTON", category: "ACTOR", hint: "Chameleon of cinema", difficulty: 2 },
    { word: "OSCAR ISAAC", category: "ACTOR", hint: "Leto Atreides / Moon Knight", difficulty: 1 },
    { word: "MADDS MIKKELSEN", category: "ACTOR", hint: "Hannibal / Casino Royale", difficulty: 2 },
    { word: "LAKEITH STANFIELD", category: "ACTOR", hint: "Atlanta / Sorry to Bother You", difficulty: 2 },

    // --- FILMS ---
    { word: "MIDSOMMAR", category: "FILM", hint: "Daylight horror ritual", difficulty: 2 },
    { word: "STALKER", category: "FILM", hint: "Tarkovsky masterpiece", difficulty: 3 },
    { word: "MULHOLLAND DRIVE", category: "FILM", hint: "David Lynch nightmare", difficulty: 3 },
    { word: "BEAU IS AFRAID", category: "FILM", hint: "Ari Aster odyssey", difficulty: 3 },
    { word: "YORGOS LANTHIMOS", category: "FILM", hint: "The Favourite director", difficulty: 3 },
    { word: "CHALLENGERS", category: "FILM", hint: "Luca Guadagnino tennis drama", difficulty: 2 },
    { word: "DENIS VILLENEUVE", category: "FILM", hint: "Dune / Arrival director", difficulty: 2 },
    { word: "GRETA GERWIG", category: "FILM", hint: "Barbie / Lady Bird", difficulty: 1 },
    { word: "WES ANDERSON", category: "FILM", hint: "Symmetry king", difficulty: 1 },
    { word: "PARASITE", category: "FILM", hint: "Bong Joon-ho thriller", difficulty: 1 },
    { word: "BLADE RUNNER", category: "FILM", hint: "Do androids dream?", difficulty: 1 },
    { word: "THE LIGHTHOUSE", category: "FILM", hint: "Black and white maritime madness", difficulty: 2 },
    { word: "EX MACHINA", category: "FILM", hint: "AI Turing test gone wrong", difficulty: 2 },
    { word: "NO COUNTRY FOR OLD MEN", category: "FILM", hint: "Anton Chigurh's coin toss", difficulty: 2 },
    { word: "EVERYTHING EVERYWHERE", category: "FILM", hint: "Multiverse bagel", difficulty: 2 },
    { word: "THE WITCH", category: "FILM", hint: "Live deliciously", difficulty: 2 },
    { word: "PRIMER", category: "FILM", hint: "Low budget time travel", difficulty: 3 },
    { word: "ERASERHEAD", category: "FILM", hint: "Lynch's first feature", difficulty: 3 },
    { word: "VIDEODROME", category: "FILM", hint: "Long live the new flesh", difficulty: 3 },

    // --- ARTISTS ---
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
    { word: "CAROLINE POLACHEK", category: "ARTIST", hint: "Desire, I Want To Turn Into You", difficulty: 2 },
    { word: "CHARLI XCX", category: "ARTIST", hint: "BRAT summer", difficulty: 1 },
    { word: "SOPHIE", category: "ARTIST", hint: "Hyperpop pioneer", difficulty: 3 },
    { word: "ARCA", category: "ARTIST", hint: "Kick cycle producer", difficulty: 3 },
    { word: "NINE INCH NAILS", category: "ARTIST", hint: "Trent Reznor's industrial", difficulty: 1 },
    { word: "RADIOHEAD", category: "ARTIST", hint: "Kid A / OK Computer", difficulty: 1 },
    { word: "DEPECHE MODE", category: "ARTIST", hint: "Enjoy the Silence", difficulty: 1 },

    // --- GAMING ---
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
    { word: "SUPERHOT", category: "GAMING", hint: "Time moves when you move", difficulty: 2 },
    { word: "PORTAL", category: "GAMING", hint: "The cake is a lie", difficulty: 1 },
    { word: "BIOSHOCK", category: "GAMING", hint: "Would you kindly?", difficulty: 1 },
    { word: "SILENT HILL", category: "GAMING", hint: "Foggy town nightmare", difficulty: 2 },
    { word: "METAL GEAR SOLID", category: "GAMING", hint: "Tactical espionage action", difficulty: 2 },
    { word: "OUTER WILDS", category: "GAMING", hint: "Time loop space exploration", difficulty: 3 },
    { word: "ELDEN RING", category: "GAMING", hint: "The Lands Between", difficulty: 1 },

    // --- TECH & OBJECTS ---
    { word: "MOTHERBOARD", category: "TECH", hint: "The central nervous system of a PC", difficulty: 1 },
    { word: "TRANSISTOR", category: "TECH", hint: "The building block of digital logic", difficulty: 2 },
    { word: "FIBER OPTIC", category: "TECH", hint: "Light speed communication lines", difficulty: 2 },
    { word: "QUANTUM CHIP", category: "TECH", hint: "Future of processing power", difficulty: 3 },
    { word: "MAINFRAME", category: "TECH", hint: "Large high-speed computer central to a network", difficulty: 2 },
    { word: "NEURAL NETWORK", category: "TECH", hint: "AI inspired by biology", difficulty: 2 },
    { word: "CRYPTOGRAPHY", category: "TECH", hint: "Science of secure communication", difficulty: 3 },
    { word: "ANALOGUE", category: "TECH", hint: "Continuous signal representation", difficulty: 2 },
    { word: "CYBERPUNK", category: "TECH", hint: "High tech, low life", difficulty: 1 },
    { word: "BLOCKCHAIN", category: "TECH", hint: "Distributed ledger protocol", difficulty: 2 },
];
