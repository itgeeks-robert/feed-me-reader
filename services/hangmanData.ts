
export interface HangmanWord {
    word: string;
    category: 'ACTOR' | 'FILM' | 'ARTIST' | 'SONG' | 'TECH' | 'GAMING' | 'SPORT' | 'FASHION';
    hint: string;
    difficulty: 1 | 2 | 3;
}

export const HANGMAN_DATA: HangmanWord[] = [
    { word: "TIMOTHEE CHALAMET", category: "ACTOR", hint: "Lisan al-Gaib", difficulty: 1 },
    { word: "BLADE RUNNER", category: "FILM", hint: "Replicants in the rain", difficulty: 1 },
    { word: "DAVID BOWIE", category: "ARTIST", hint: "The Man Who Fell to Earth", difficulty: 1 },
    { word: "STARBOY", category: "SONG", hint: "The Weeknd's persona", difficulty: 1 },
    { word: "FLORENCE PUGH", category: "ACTOR", hint: "Yelena Belova", difficulty: 1 },
    { word: "INTERSTELLAR", category: "FILM", hint: "Cooper's space odyssey", difficulty: 1 },
    { word: "LANA DEL REY", category: "ARTIST", hint: "Norman F***ing Rockwell", difficulty: 2 },
    { word: "OPPENHEIMER", category: "FILM", hint: "Los Alamos physicist", difficulty: 1 },
    { word: "BILLIE EILISH", category: "ARTIST", hint: "Lunch / Bad Guy", difficulty: 1 },
    { word: "SUCCESSION", category: "FILM", hint: "The Roy Family drama", difficulty: 1 },
    { word: "ZENDAYA", category: "ACTOR", hint: "Euphoria star", difficulty: 1 },
    { word: "RADIOHEAD", category: "ARTIST", hint: "Kid A / Paranoid Android", difficulty: 2 },
    { word: "PARASITE", category: "FILM", hint: "Bong Joon-ho thriller", difficulty: 1 },
    { word: "MITSKI", category: "ARTIST", hint: "Bury Me at Makeout Creek", difficulty: 2 },
    { word: "PEDRO PASCAL", category: "ACTOR", hint: "Joel Miller / Din Djarin", difficulty: 1 },
    { word: "HIDEO KOJIMA", category: "GAMING", hint: "Death Stranding creator", difficulty: 2 },
    { word: "CARY GRANT", category: "ACTOR", hint: "North by Northwest", difficulty: 2 },
    { word: "BOHEMIAN RHAPSODY", category: "SONG", hint: "Queen's six-minute epic", difficulty: 1 },
    { word: "DAFT PUNK", category: "ARTIST", hint: "One More Time", difficulty: 1 },
    { word: "MAD MAX FURY ROAD", category: "FILM", hint: "Immortal Joe's chase", difficulty: 1 },
    { word: "KATE BUSH", category: "ARTIST", hint: "Running Up That Hill", difficulty: 2 },
    { word: "THE MATRIX", category: "FILM", hint: "There is no spoon", difficulty: 1 },
    { word: "PURPLE RAIN", category: "SONG", hint: "Prince classic", difficulty: 2 },
    { word: "FLEABAG", category: "FILM", hint: "Phoebe Waller-Bridge", difficulty: 2 },
    { word: "TAYLOR SWIFT", category: "ARTIST", hint: "The Eras Tour", difficulty: 1 },
    { word: "ELTON JOHN", category: "ARTIST", hint: "Rocketman", difficulty: 1 },
    { word: "ELDEN RING", category: "GAMING", hint: "The Lands Between", difficulty: 2 },
    { word: "ANNA DE ARMAS", category: "ACTOR", hint: "Knives Out / Blonde", difficulty: 2 },
    { word: "LIONEL MESSI", category: "SPORT", hint: "The Flea of Argentina", difficulty: 1 },
    { word: "NOVAK DJOKOVIC", category: "SPORT", hint: "The Serbinator", difficulty: 2 },
    { word: "SIMONE BILES", category: "SPORT", hint: "GOAT of gymnastics", difficulty: 1 },
    { word: "VIVIENNE WESTWOOD", category: "FASHION", hint: "Punk fashion icon", difficulty: 2 },
    { word: "GUCCI", category: "FASHION", hint: "Double G house", difficulty: 1 },
    { word: "SHOHEI OHTANI", category: "SPORT", hint: "Shotime MLB star", difficulty: 2 },
    { word: "KYLIAN MBAPPE", category: "SPORT", hint: "Real Madrid's French star", difficulty: 1 },
    { word: "ALEXANDER MCQUEEN", category: "FASHION", hint: "Savage Beauty", difficulty: 3 },
    { word: "BALENCIAGA", category: "FASHION", hint: "Luxury speed sneakers", difficulty: 2 },
    { word: "HALO", category: "GAMING", hint: "Master Chief's saga", difficulty: 1 },
    { word: "TIKTOK", category: "TECH", hint: "ByteDance short video", difficulty: 1 },
    { word: "STADIA", category: "TECH", hint: "Google's failed cloud gaming", difficulty: 2 },
    { word: "NIKE", category: "FASHION", hint: "Just Do It", difficulty: 1 },
    { word: "LEBRON JAMES", category: "SPORT", hint: "King James / Lakers", difficulty: 1 },
    { word: "SUPER MARIO", category: "GAMING", hint: "Nintendo's plumber mascot", difficulty: 1 },
    { word: "MINECRAFT", category: "GAMING", hint: "The blocky sandbox world", difficulty: 1 },
    { word: "IPHONE", category: "TECH", hint: "Apple's flagship mobile device", difficulty: 1 },
    { word: "NETFLIX", category: "TECH", hint: "The streaming giant", difficulty: 1 }
];
