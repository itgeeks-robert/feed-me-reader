export interface Team {
    code: string;
    name: string;
}

export interface League {
    name: string;
    teams: Team[];
}

export const leagues: League[] = [
    {
        name: "Premier League",
        teams: [
            { code: 'ARS', name: 'Arsenal' },
            { code: 'AVL', name: 'Aston Villa' },
            { code: 'BOU', name: 'Bournemouth' },
            { code: 'BRE', name: 'Brentford' },
            { code: 'BHA', name: 'Brighton & Hove Albion' },
            { code: 'CHE', name: 'Chelsea' },
            { code: 'CRY', name: 'Crystal Palace' },
            { code: 'EVE', name: 'Everton' },
            { code: 'FUL', name: 'Fulham' },
            { code: 'IPS', name: 'Ipswich Town' },
            { code: 'LEI', name: 'Leicester City' },
            { code: 'LIV', name: 'Liverpool' },
            { code: 'MCI', name: 'Manchester City' },
            { code: 'MUN', name: 'Manchester United' },
            { code: 'NEW', name: 'Newcastle United' },
            { code: 'NOT', name: 'Nottingham Forest' },
            { code: 'SOU', name: 'Southampton' },
            { code: 'TOT', name: 'Tottenham Hotspur' },
            { code: 'WHU', name: 'West Ham United' },
            { code: 'WOL', name: 'Wolverhampton Wanderers' },
        ],
    },
    {
        name: "Championship",
        teams: [
            { code: 'BBR', name: 'Blackburn Rovers' },
            { code: 'BRC', name: 'Bristol City' },
            { code: 'BUR', name: 'Burnley' },
            { code: 'CAR', name: 'Cardiff City' },
            { code: 'COV', name: 'Coventry City' },
            { code: 'DER', name: 'Derby County' },
            { code: 'HUL', name: 'Hull City' },
            { code: 'LEE', name: 'Leeds United' },
            { code: 'LUT', name: 'Luton Town' },
            { code: 'MID', name: 'Middlesbrough' },
            { code: 'MIL', name: 'Millwall' },
            { code: 'NOR', name: 'Norwich City' },
            { code: 'OXF', name: 'Oxford United' },
            { code: 'PLY', name: 'Plymouth Argyle' },
            { code: 'POR', name: 'Portsmouth' },
            { code: 'PNE', name: 'Preston North End' },
            { code: 'QPR', name: 'Queens Park Rangers' },
            { code: 'SHU', name: 'Sheffield United' },
            { code: 'SHW', name: 'Sheffield Wednesday' },
            { code: 'STO', name: 'Stoke City' },
            { code: 'SUN', name: 'Sunderland' },
            { code: 'SWA', name: 'Swansea City' },
            { code: 'WAT', name: 'Watford' },
            { code: 'WBA', name: 'West Bromwich Albion' },
        ],
    },
    {
        name: "League One",
        teams: [
            { code: 'BAR', name: 'Barnsley' },
            { code: 'BIR', name: 'Birmingham City' },
            { code: 'BLA', name: 'Blackpool' },
            { code: 'BOL', name: 'Bolton Wanderers' },
            { code: 'BRR', name: 'Bristol Rovers' },
            { code: 'BUA', name: 'Burton Albion' },
            { code: 'CAM', name: 'Cambridge United' },
            { code: 'CHA', name: 'Charlton Athletic' },
            { code: 'CRA', name: 'Crawley Town' },
            { code: 'EXE', name: 'Exeter City' },
            { code: 'HUD', name: 'Huddersfield Town' },
            { code: 'LEY', name: 'Leyton Orient' },
            { code: 'LIN', name: 'Lincoln City' },
            { code: 'MAN', name: 'Mansfield Town' },
            { code: 'NHT', name: 'Northampton Town' },
            { code: 'PET', name: 'Peterborough United' },
            { code: 'REA', name: 'Reading' },
            { code: 'ROT', name: 'Rotherham United' },
            { code: 'SHR', name: 'Shrewsbury Town' },
            { code: 'STE', name: 'Stevenage' },
            { code: 'STK', name: 'Stockport County' },
            { code: 'WIG', name: 'Wigan Athletic' },
            { code: 'WRE', name: 'Wrexham' },
            { code: 'WYC', name: 'Wycombe Wanderers' },
        ],
    },
    {
        name: "League Two",
        teams: [
            { code: 'ACC', name: 'Accrington Stanley' },
            { code: 'WIM', name: 'AFC Wimbledon' },
            { code: 'BRW', name: 'Barrow' },
            { code: 'BRA', name: 'Bradford City' },
            { code: 'BOM', name: 'Bromley' },
            { code: 'CSL', name: 'Carlisle United' },
            { code: 'CTN', name: 'Cheltenham Town' },
            { code: 'CHF', name: 'Chesterfield' },
            { code: 'COL', name: 'Colchester United' },
            { code: 'CRE', name: 'Crewe Alexandra' },
            { code: 'DON', name: 'Doncaster Rovers' },
            { code: 'FLE', name: 'Fleetwood Town' },
            { code: 'FGR', name: 'Forest Green Rovers' },
            { code: 'GIL', name: 'Gillingham' },
            { code: 'GRI', name: 'Grimsby Town' },
            { code: 'HAR', name: 'Harrogate Town' },
            { code: 'MKD', name: 'Milton Keynes Dons' },
            { code: 'MOR', name: 'Morecambe' },
            { code: 'NCP', name: 'Newport County' },
            { code: 'NTT', name: 'Notts County' },
            { code: 'POV', name: 'Port Vale' },
            { code: 'SAL', name: 'Salford City' },
            { code: 'SUT', name: 'Sutton United' },
            { code: 'SWI', name: 'Swindon Town' },
            { code: 'TRA', name: 'Tranmere Rovers' },
            { code: 'WAL', name: 'Walsall' },
        ],
    },
    {
        name: "National League",
        teams: [
            { code: 'FYL', name: 'AFC Fylde' },
        ],
    }
];

export const allTeamsMap = new Map<string, string>(
    leagues.flatMap(league => league.teams).map(team => [team.code, team.name])
);
