export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface MatchEvent {
  minute: number;
  type: 'goal' | 'card' | 'substitution' | 'var' | 'other';
  team: 'home' | 'away';
  player: string;
  detail: string;
}

export interface LiveMatchData {
  status: 'scheduled' | 'live' | 'halftime' | 'finished' | 'delayed';
  currentMinute: number;
  actualStartTime?: string;
  score: {
    home: number;
    away: number;
  };
  events: MatchEvent[];
  lastUpdated: string;
}

export interface SavedPrediction {
  id: string;
  userId: string;
  match: {
    teamA: Team;
    teamB: Team;
    league: League;
  };
  prediction: Prediction;
  stats: MatchStats;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  logo: string;
  shortName: string;
}

export interface League {
  id: string;
  name: string;
  country: string;
  logo: string;
}

export interface MarketOdds {
  oneXTwo: { home: number; draw: number; away: number };
  overUnder: string;
  handicap: string;
  source: string;
}

export interface Prediction {
  correctScore: string;
  overUnder: string;
  handicap: string;
  btts: 'Yes' | 'No';
  halfTime: string;
  corners: string;
  confidence: number;
  reasoning: string;
  marketOdds?: MarketOdds;
}

export interface PlayerStat {
  name: string;
  role: string;
  rating: number;
  goals?: number;
  assists?: number;
  status: 'Healthy' | 'Injured' | 'Suspended';
}

export interface TacticalFormation {
  formation: string;
  style: string;
  keyTactics: string[];
}

export interface HistoricalPerformance {
  goalsScored: number;
  goalsConceded: number;
  possessionAvg: number;
  cleanSheets: number;
  yellowCards: number;
  redCards: number;
  seasonRecord: {
    wins: number;
    draws: number;
    losses: number;
  };
}

export interface MatchStats {
  teamAForm: string[]; // ['W', 'D', 'L', 'W', 'W']
  teamBForm: string[];
  teamAGoalsAvg: number;
  teamBGoalsAvg: number;
  h2h: {
    teamAWins: number;
    teamBWins: number;
    draws: number;
    lastResults: string[];
    totalMatches: number;
    avgGoals: number;
  };
  venue?: {
    name: string;
    city: string;
    capacity: number;
  };
  referee?: string;
  expectedAttendance?: number;
  actualStartTime?: string;
  correctedTeams?: {
    teamA: { name: string; shortName: string; logo: string };
    teamB: { name: string; shortName: string; logo: string };
  };
  historicalStats?: {
    teamA: HistoricalPerformance;
    teamB: HistoricalPerformance;
  };
  tacticalFormations?: {
    teamA: TacticalFormation;
    teamB: TacticalFormation;
  };
  playerStats?: {
    teamA: PlayerStat[];
    teamB: PlayerStat[];
  };
}

export interface MatchSession {
  id: string;
  league: League;
  teamA: Team;
  teamB: Team;
  date: string;
  prediction?: Prediction;
  stats?: MatchStats;
}

export const POPULAR_LEAGUES: League[] = [
  { id: 'pl', name: 'Premier League', country: 'England', logo: 'https://media.api-sports.io/football/leagues/39.png' },
  { id: 'laliga', name: 'La Liga', country: 'Spain', logo: 'https://media.api-sports.io/football/leagues/140.png' },
  { id: 'seriea', name: 'Serie A', country: 'Italy', logo: 'https://media.api-sports.io/football/leagues/135.png' },
  { id: 'bundesliga', name: 'Bundesliga', country: 'Germany', logo: 'https://media.api-sports.io/football/leagues/78.png' },
  { id: 'ligue1', name: 'Ligue 1', country: 'France', logo: 'https://media.api-sports.io/football/leagues/61.png' },
  { id: 'cl', name: 'Champions League', country: 'Europe', logo: 'https://media.api-sports.io/football/leagues/2.png' },
  { id: 'mls', name: 'MLS', country: 'USA', logo: 'https://media.api-sports.io/football/leagues/253.png' },
  { id: 'saudi', name: 'Pro League', country: 'Saudi Arabia', logo: 'https://media.api-sports.io/football/leagues/307.png' },
  { id: 'uae', name: 'UAE Pro', country: 'UAE', logo: 'https://media.api-sports.io/football/leagues/301.png' },
  { id: 'qatar', name: 'Stars League', country: 'Qatar', logo: 'https://media.api-sports.io/football/leagues/305.png' },
  { id: 'j1', name: 'J1 League', country: 'Japan', logo: 'https://media.api-sports.io/football/leagues/98.png' },
  { id: 'k1', name: 'K League 1', country: 'South Korea', logo: 'https://media.api-sports.io/football/leagues/292.png' },
  { id: 'thai', name: 'Thai League 1', country: 'Thailand', logo: 'https://media.api-sports.io/football/leagues/296.png' },
  { id: 'isl', name: 'Indian Super League', country: 'India', logo: 'https://media.api-sports.io/football/leagues/323.png' },
  { id: 'brazil', name: 'Serie A', country: 'Brazil', logo: 'https://media.api-sports.io/football/leagues/71.png' },
  { id: 'arg', name: 'Primera Div', country: 'Argentina', logo: 'https://media.api-sports.io/football/leagues/128.png' },
  { id: 'egypt', name: 'Premier League', country: 'Egypt', logo: 'https://media.api-sports.io/football/leagues/233.png' },
  { id: 'rsa', name: 'PSL', country: 'South Africa', logo: 'https://media.api-sports.io/football/leagues/288.png' },
  { id: 'eredivisie', name: 'Eredivisie', country: 'Netherlands', logo: 'https://media.api-sports.io/football/leagues/88.png' },
  { id: 'cpl', name: 'Cambodian Premier League', country: 'Cambodia', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5e/Cambodian_Premier_League_Logo.png/320px-Cambodian_Premier_League_Logo.png' },
];

export const TEAMS_BY_LEAGUE: Record<string, Team[]> = {
  pl: [
    { id: 'ars', name: 'Arsenal', shortName: 'ARS', logo: 'https://media.api-sports.io/football/teams/42.png' },
    { id: 'mci', name: 'Man City', shortName: 'MCI', logo: 'https://media.api-sports.io/football/teams/50.png' },
    { id: 'liv', name: 'Liverpool', shortName: 'LIV', logo: 'https://media.api-sports.io/football/teams/40.png' },
    { id: 'mun', name: 'Man United', shortName: 'MUN', logo: 'https://media.api-sports.io/football/teams/33.png' },
    { id: 'che', name: 'Chelsea', shortName: 'CHE', logo: 'https://media.api-sports.io/football/teams/49.png' },
    { id: 'tot', name: 'Tottenham', shortName: 'TOT', logo: 'https://media.api-sports.io/football/teams/47.png' },
    { id: 'new', name: 'Newcastle', shortName: 'NEW', logo: 'https://media.api-sports.io/football/teams/34.png' },
    { id: 'avl', name: 'Aston Villa', shortName: 'AVL', logo: 'https://media.api-sports.io/football/teams/66.png' },
    { id: 'whu', name: 'West Ham', shortName: 'WHU', logo: 'https://media.api-sports.io/football/teams/48.png' },
    { id: 'bha', name: 'Brighton', shortName: 'BHA', logo: 'https://media.api-sports.io/football/teams/51.png' },
    { id: 'cry', name: 'Crystal Palace', shortName: 'CRY', logo: 'https://media.api-sports.io/football/teams/52.png' },
    { id: 'eve', name: 'Everton', shortName: 'EVE', logo: 'https://media.api-sports.io/football/teams/45.png' },
  ],
  laliga: [
    { id: 'rma', name: 'Real Madrid', shortName: 'RMA', logo: 'https://media.api-sports.io/football/teams/541.png' },
    { id: 'bar', name: 'Barcelona', shortName: 'BAR', logo: 'https://media.api-sports.io/football/teams/529.png' },
    { id: 'atm', name: 'Atlético Madrid', shortName: 'ATM', logo: 'https://media.api-sports.io/football/teams/530.png' },
    { id: 'rso', name: 'Real Sociedad', shortName: 'RSO', logo: 'https://media.api-sports.io/football/teams/548.png' },
    { id: 'sev', name: 'Sevilla', shortName: 'SEV', logo: 'https://media.api-sports.io/football/teams/536.png' },
    { id: 'bil', name: 'Athletic Club', shortName: 'BIL', logo: 'https://media.api-sports.io/football/teams/531.png' },
    { id: 'vil', name: 'Villarreal', shortName: 'VIL', logo: 'https://media.api-sports.io/football/teams/533.png' },
    { id: 'bet', name: 'Real Betis', shortName: 'BET', logo: 'https://media.api-sports.io/football/teams/543.png' },
    { id: 'val', name: 'Valencia', shortName: 'VAL', logo: 'https://media.api-sports.io/football/teams/532.png' },
    { id: 'gir', name: 'Girona', shortName: 'GIR', logo: 'https://media.api-sports.io/football/teams/547.png' },
  ],
  seriea: [
    { id: 'int', name: 'Inter Milan', shortName: 'INT', logo: 'https://media.api-sports.io/football/teams/505.png' },
    { id: 'juv', name: 'Juventus', shortName: 'JUV', logo: 'https://media.api-sports.io/football/teams/496.png' },
    { id: 'mil', name: 'AC Milan', shortName: 'MIL', logo: 'https://media.api-sports.io/football/teams/489.png' },
    { id: 'nap', name: 'Napoli', shortName: 'NAP', logo: 'https://media.api-sports.io/football/teams/492.png' },
    { id: 'rom', name: 'AS Roma', shortName: 'ROM', logo: 'https://media.api-sports.io/football/teams/497.png' },
    { id: 'ata', name: 'Atalanta', shortName: 'ATA', logo: 'https://media.api-sports.io/football/teams/499.png' },
    { id: 'laz', name: 'Lazio', shortName: 'LAZ', logo: 'https://media.api-sports.io/football/teams/487.png' },
    { id: 'fio', name: 'Fiorentina', shortName: 'FIO', logo: 'https://media.api-sports.io/football/teams/502.png' },
    { id: 'bol', name: 'Bologna', shortName: 'BOL', logo: 'https://media.api-sports.io/football/teams/500.png' },
    { id: 'tor', name: 'Torino', shortName: 'TOR', logo: 'https://media.api-sports.io/football/teams/503.png' },
  ],
  bundesliga: [
    { id: 'bay', name: 'Bayern Munich', shortName: 'BAY', logo: 'https://media.api-sports.io/football/teams/157.png' },
    { id: 'lev', name: 'B. Leverkusen', shortName: 'LEV', logo: 'https://media.api-sports.io/football/teams/168.png' },
    { id: 'dor', name: 'B. Dortmund', shortName: 'DOR', logo: 'https://media.api-sports.io/football/teams/165.png' },
    { id: 'rbl', name: 'RB Leipzig', shortName: 'RBL', logo: 'https://media.api-sports.io/football/teams/173.png' },
    { id: 'stu', name: 'Stuttgart', shortName: 'STU', logo: 'https://media.api-sports.io/football/teams/172.png' },
    { id: 'sge', name: 'Eintracht Frankfurt', shortName: 'SGE', logo: 'https://media.api-sports.io/football/teams/169.png' },
    { id: 'scf', name: 'SC Freiburg', shortName: 'SCF', logo: 'https://media.api-sports.io/football/teams/160.png' },
    { id: 'tsg', name: 'Hoffenheim', shortName: 'TSG', logo: 'https://media.api-sports.io/football/teams/167.png' },
    { id: 'svw', name: 'Werder Bremen', shortName: 'SVW', logo: 'https://media.api-sports.io/football/teams/162.png' },
    { id: 'wob', name: 'Wolfsburg', shortName: 'WOB', logo: 'https://media.api-sports.io/football/teams/161.png' },
  ],
  ligue1: [
    { id: 'psg', name: 'PSG', shortName: 'PSG', logo: 'https://media.api-sports.io/football/teams/85.png' },
    { id: 'mar', name: 'Marseille', shortName: 'MAR', logo: 'https://media.api-sports.io/football/teams/81.png' },
    { id: 'mon', name: 'Monaco', shortName: 'MON', logo: 'https://media.api-sports.io/football/teams/91.png' },
    { id: 'lyo', name: 'Lyon', shortName: 'LYO', logo: 'https://media.api-sports.io/football/teams/80.png' },
    { id: 'lil', name: 'Lille', shortName: 'LIL', logo: 'https://media.api-sports.io/football/teams/79.png' },
    { id: 'rcl', name: 'Lens', shortName: 'RCL', logo: 'https://media.api-sports.io/football/teams/116.png' },
    { id: 'ren', name: 'Rennes', shortName: 'REN', logo: 'https://media.api-sports.io/football/teams/94.png' },
    { id: 'ogc', name: 'Nice', shortName: 'OGC', logo: 'https://media.api-sports.io/football/teams/84.png' },
    { id: 'sdr', name: 'Reims', shortName: 'SDR', logo: 'https://media.api-sports.io/football/teams/93.png' },
    { id: 'bre', name: 'Brest', shortName: 'BRE', logo: 'https://media.api-sports.io/football/teams/106.png' },
  ],
  mls: [
    { id: 'mia', name: 'Inter Miami', shortName: 'MIA', logo: 'https://media.api-sports.io/football/teams/9568.png' },
    { id: 'lax', name: 'LAFC', shortName: 'LAX', logo: 'https://media.api-sports.io/football/teams/1602.png' },
    { id: 'lag', name: 'LA Galaxy', shortName: 'LAG', logo: 'https://media.api-sports.io/football/teams/1601.png' },
    { id: 'sea', name: 'Seattle Sounders', shortName: 'SEA', logo: 'https://media.api-sports.io/football/teams/1608.png' },
    { id: 'nyc', name: 'NYCFC', shortName: 'NYC', logo: 'https://media.api-sports.io/football/teams/1604.png' },
    { id: 'clb', name: 'Columbus Crew', shortName: 'CLB', logo: 'https://media.api-sports.io/football/teams/1595.png' },
    { id: 'cin', name: 'FC Cincinnati', shortName: 'CIN', logo: 'https://media.api-sports.io/football/teams/1593.png' },
    { id: 'nyr', name: 'NY Red Bulls', shortName: 'NYR', logo: 'https://media.api-sports.io/football/teams/1605.png' },
    { id: 'atl', name: 'Atlanta United', shortName: 'ATL', logo: 'https://media.api-sports.io/football/teams/1591.png' },
    { id: 'dal', name: 'FC Dallas', shortName: 'DAL', logo: 'https://media.api-sports.io/football/teams/1596.png' },
  ],
  saudi: [
    { id: 'hil', name: 'Al Hilal', shortName: 'HIL', logo: 'https://media.api-sports.io/football/teams/2939.png' },
    { id: 'nas', name: 'Al Nassr', shortName: 'NAS', logo: 'https://media.api-sports.io/football/teams/2937.png' },
    { id: 'itt', name: 'Al Ittihad', shortName: 'ITT', logo: 'https://media.api-sports.io/football/teams/2931.png' },
    { id: 'ahl', name: 'Al Ahli', shortName: 'AHL', logo: 'https://media.api-sports.io/football/teams/2935.png' },
    { id: 'ett', name: 'Al Ettifaq', shortName: 'ETT', logo: 'https://media.api-sports.io/football/teams/2932.png' },
    { id: 'shb', name: 'Al Shabab', shortName: 'SHB', logo: 'https://media.api-sports.io/football/teams/2930.png' },
    { id: 'taw', name: 'Al Taawoun', shortName: 'TAW', logo: 'https://media.api-sports.io/football/teams/2933.png' },
    { id: 'fat', name: 'Al Fateh', shortName: 'FAT', logo: 'https://media.api-sports.io/football/teams/2934.png' },
    { id: 'khj', name: 'Al Khaleej', shortName: 'KHJ', logo: 'https://media.api-sports.io/football/teams/2953.png' },
    { id: 'fyh', name: 'Al Fayha', shortName: 'FYH', logo: 'https://media.api-sports.io/football/teams/2936.png' },
  ],
  uae: [
    { id: 'ain', name: 'Al Ain', shortName: 'AIN', logo: 'https://media.api-sports.io/football/teams/3313.png' },
    { id: 'was', name: 'Al Wasl', shortName: 'WAS', logo: 'https://media.api-sports.io/football/teams/3312.png' },
    { id: 'sha', name: 'Al Sharjah', shortName: 'SHA', logo: 'https://media.api-sports.io/football/teams/3314.png' },
    { id: 'wah', name: 'Al Wahda', shortName: 'WAH', logo: 'https://media.api-sports.io/football/teams/3315.png' },
    { id: 'sah', name: 'Shabab Al Ahli', shortName: 'SAH', logo: 'https://media.api-sports.io/football/teams/3311.png' },
    { id: 'jaz', name: 'Al Jazira', shortName: 'JAZ', logo: 'https://media.api-sports.io/football/teams/3318.png' },
    { id: 'nas-u', name: 'Al Nasr UAE', shortName: 'NAS', logo: 'https://media.api-sports.io/football/teams/3316.png' },
    { id: 'ajm', name: 'Ajman', shortName: 'AJM', logo: 'https://media.api-sports.io/football/teams/3319.png' },
  ],
  qatar: [
    { id: 'sad', name: 'Al Sadd', shortName: 'SAD', logo: 'https://media.api-sports.io/football/teams/3336.png' },
    { id: 'duh', name: 'Al Duhail', shortName: 'DUH', logo: 'https://media.api-sports.io/football/teams/3337.png' },
    { id: 'ray', name: 'Al Rayyan', shortName: 'RAY', logo: 'https://media.api-sports.io/football/teams/3338.png' },
    { id: 'gha', name: 'Al Gharafa', shortName: 'GHA', logo: 'https://media.api-sports.io/football/teams/3339.png' },
    { id: 'wak', name: 'Al Wakrah', shortName: 'WAK', logo: 'https://media.api-sports.io/football/teams/3341.png' },
    { id: 'arb', name: 'Al Arabi', shortName: 'ARB', logo: 'https://media.api-sports.io/football/teams/3340.png' },
    { id: 'umm', name: 'Umm Salal', shortName: 'UMM', logo: 'https://media.api-sports.io/football/teams/3344.png' },
    { id: 'qat', name: 'Qatar SC', shortName: 'QAT', logo: 'https://media.api-sports.io/football/teams/3342.png' },
  ],
  egypt: [
    { id: 'ahy', name: 'Al Ahly', shortName: 'AHY', logo: 'https://media.api-sports.io/football/teams/1029.png' },
    { id: 'zam', name: 'Zamalek', shortName: 'ZAM', logo: 'https://media.api-sports.io/football/teams/1031.png' },
    { id: 'pyr', name: 'Pyramids', shortName: 'PYR', logo: 'https://media.api-sports.io/football/teams/9274.png' },
    { id: 'mas', name: 'Al Masry', shortName: 'MAS', logo: 'https://media.api-sports.io/football/teams/1033.png' },
    { id: 'fut', name: 'Modern Future', shortName: 'FUT', logo: 'https://media.api-sports.io/football/teams/9275.png' },
    { id: 'smo', name: 'Smouha', shortName: 'SMO', logo: 'https://media.api-sports.io/football/teams/1034.png' },
    { id: 'ism', name: 'Ismaily', shortName: 'ISM', logo: 'https://media.api-sports.io/football/teams/1032.png' },
    { id: 'enp', name: 'ENPPI', shortName: 'ENP', logo: 'https://media.api-sports.io/football/teams/1030.png' },
  ],
  rsa: [
    { id: 'msu', name: 'Mamelodi Sundowns', shortName: 'SUN', logo: 'https://media.api-sports.io/football/teams/1183.png' },
    { id: 'opi', name: 'Orlando Pirates', shortName: 'PIR', logo: 'https://media.api-sports.io/football/teams/1180.png' },
    { id: 'kch', name: 'Kaizer Chiefs', shortName: 'KAI', logo: 'https://media.api-sports.io/football/teams/1181.png' },
    { id: 'swk', name: 'Stellenbosch', shortName: 'STE', logo: 'https://media.api-sports.io/football/teams/6912.png' },
    { id: 'ssu', name: 'SuperSport Utd', shortName: 'SSU', logo: 'https://media.api-sports.io/football/teams/1182.png' },
    { id: 'ctc', name: 'Cape Town City', shortName: 'CTC', logo: 'https://media.api-sports.io/football/teams/4083.png' },
    { id: 'tsg', name: 'TS Galaxy', shortName: 'TSG', logo: 'https://media.api-sports.io/football/teams/6913.png' },
    { id: 'sek', name: 'Sekhukhune Utd', shortName: 'SEK', logo: 'https://media.api-sports.io/football/teams/10484.png' },
  ],
  j1: [
    { id: 'vis', name: 'Vissel Kobe', shortName: 'KOB', logo: 'https://media.api-sports.io/football/teams/283.png' },
    { id: 'yok', name: 'F. Marinos', shortName: 'YOM', logo: 'https://media.api-sports.io/football/teams/280.png' },
    { id: 'kaw', name: 'Kawasaki Frontale', shortName: 'KAW', logo: 'https://media.api-sports.io/football/teams/282.png' },
    { id: 'ura', name: 'Urawa Reds', shortName: 'URA', logo: 'https://media.api-sports.io/football/teams/284.png' },
    { id: 'ant', name: 'Kashima Antlers', shortName: 'ANT', logo: 'https://media.api-sports.io/football/teams/285.png' },
    { id: 'sfr', name: 'Sanfrecce Hiroshima', shortName: 'SFR', logo: 'https://media.api-sports.io/football/teams/281.png' },
    { id: 'gam', name: 'Gamba Osaka', shortName: 'GAM', logo: 'https://media.api-sports.io/football/teams/279.png' },
    { id: 'cer', name: 'Cerezo Osaka', shortName: 'CER', logo: 'https://media.api-sports.io/football/teams/276.png' },
    { id: 'nag', name: 'Nagoya Grampus', shortName: 'NAG', logo: 'https://media.api-sports.io/football/teams/275.png' },
    { id: 'tok', name: 'FC Tokyo', shortName: 'TOK', logo: 'https://media.api-sports.io/football/teams/278.png' },
  ],
  k1: [
    { id: 'uls', name: 'Ulsan HD', shortName: 'ULS', logo: 'https://media.api-sports.io/football/teams/982.png' },
    { id: 'poh', name: 'Pohang Steelers', shortName: 'POH', logo: 'https://media.api-sports.io/football/teams/985.png' },
    { id: 'jeo', name: 'Jeonbuk Motors', shortName: 'JEO', logo: 'https://media.api-sports.io/football/teams/983.png' },
    { id: 'seo', name: 'FC Seoul', shortName: 'SEO', logo: 'https://media.api-sports.io/football/teams/988.png' },
    { id: 'gwa', name: 'Gwangju FC', shortName: 'GWA', logo: 'https://media.api-sports.io/football/teams/1000.png' },
    { id: 'inc', name: 'Incheon United', shortName: 'INC', logo: 'https://media.api-sports.io/football/teams/984.png' },
    { id: 'gan', name: 'Gangwon FC', shortName: 'GAN', logo: 'https://media.api-sports.io/football/teams/987.png' },
    { id: 'dae', name: 'Daejeon Citizen', shortName: 'DAE', logo: 'https://media.api-sports.io/football/teams/986.png' },
    { id: 'gim', name: 'Gimcheon Sangmu', shortName: 'GIM', logo: 'https://media.api-sports.io/football/teams/990.png' },
    { id: 'jej', name: 'Jeju United', shortName: 'JEJ', logo: 'https://media.api-sports.io/football/teams/989.png' },
  ],
  thai: [
    { id: 'bur', name: 'Buriram United', shortName: 'BUR', logo: 'https://media.api-sports.io/football/teams/1125.png' },
    { id: 'ban', name: 'Bangkok United', shortName: 'BAN', logo: 'https://media.api-sports.io/football/teams/1120.png' },
    { id: 'bgp', name: 'BG Pathum Utd', shortName: 'BGP', logo: 'https://media.api-sports.io/football/teams/1118.png' },
    { id: 'por-t', name: 'Port FC', shortName: 'POR', logo: 'https://media.api-sports.io/football/teams/1124.png' },
    { id: 'mua', name: 'Muangthong Utd', shortName: 'MUA', logo: 'https://media.api-sports.io/football/teams/1123.png' },
    { id: 'cho', name: 'Chonburi', shortName: 'CHO', logo: 'https://media.api-sports.io/football/teams/1122.png' },
    { id: 'rat', name: 'Ratchaburi', shortName: 'RAT', logo: 'https://media.api-sports.io/football/teams/1131.png' },
    { id: 'crutd', name: 'Chiangrai United', shortName: 'CRU', logo: 'https://media.api-sports.io/football/teams/1126.png' },
    { id: 'suk', name: 'Sukhothai', shortName: 'SUK', logo: 'https://media.api-sports.io/football/teams/1127.png' },
  ],
  isl: [
    { id: 'mbg', name: 'Mohun Bagan SG', shortName: 'MBG', logo: 'https://media.api-sports.io/football/teams/11546.png' },
    { id: 'mum', name: 'Mumbai City', shortName: 'MUM', logo: 'https://media.api-sports.io/football/teams/3362.png' },
    { id: 'goa', name: 'FC Goa', shortName: 'GOA', logo: 'https://media.api-sports.io/football/teams/3358.png' },
    { id: 'ker', name: 'Kerala Blasters', shortName: 'KER', logo: 'https://media.api-sports.io/football/teams/3361.png' },
    { id: 'ben-i', name: 'Bengaluru FC', shortName: 'BEN', logo: 'https://media.api-sports.io/football/teams/3359.png' },
    { id: 'ebf', name: 'East Bengal', shortName: 'EB', logo: 'https://media.api-sports.io/football/teams/4932.png' },
    { id: 'odi', name: 'Odisha FC', shortName: 'ODI', logo: 'https://media.api-sports.io/football/teams/10382.png' },
    { id: 'che-i', name: 'Chennaiyin FC', shortName: 'CHE', logo: 'https://media.api-sports.io/football/teams/3357.png' },
    { id: 'hyd', name: 'Hyderabad FC', shortName: 'HYD', logo: 'https://media.api-sports.io/football/teams/9435.png' },
  ],
  brazil: [
    { id: 'pal', name: 'Palmeiras', shortName: 'PAL', logo: 'https://media.api-sports.io/football/teams/121.png' },
    { id: 'fla', name: 'Flamengo', shortName: 'FLA', logo: 'https://media.api-sports.io/football/teams/127.png' },
    { id: 'bot', name: 'Botafogo', shortName: 'BOT', logo: 'https://media.api-sports.io/football/teams/120.png' },
    { id: 'sao', name: 'Sao Paulo', shortName: 'SAO', logo: 'https://media.api-sports.io/football/teams/126.png' },
    { id: 'cor', name: 'Corinthians', shortName: 'COR', logo: 'https://media.api-sports.io/football/teams/131.png' },
    { id: 'flu', name: 'Fluminense', shortName: 'FLU', logo: 'https://media.api-sports.io/football/teams/124.png' },
    { id: 'gre', name: 'Gremio', shortName: 'GRE', logo: 'https://media.api-sports.io/football/teams/130.png' },
    { id: 'atm-b', name: 'Atlético Mineiro', shortName: 'CAM', logo: 'https://media.api-sports.io/football/teams/118.png' },
    { id: 'int-b', name: 'Internacional', shortName: 'INT', logo: 'https://media.api-sports.io/football/teams/119.png' },
    { id: 'cru', name: 'Cruzeiro', shortName: 'CRU', logo: 'https://media.api-sports.io/football/teams/122.png' },
  ],
  arg: [
    { id: 'riv', name: 'River Plate', shortName: 'RIV', logo: 'https://media.api-sports.io/football/teams/435.png' },
    { id: 'boc', name: 'Boca Juniors', shortName: 'BOC', logo: 'https://media.api-sports.io/football/teams/451.png' },
    { id: 'rac', name: 'Racing Club', shortName: 'RAC', logo: 'https://media.api-sports.io/football/teams/434.png' },
    { id: 'ind', name: 'Independiente', shortName: 'IND', logo: 'https://media.api-sports.io/football/teams/453.png' },
    { id: 'slr', name: 'San Lorenzo', shortName: 'SLO', logo: 'https://media.api-sports.io/football/teams/436.png' },
    { id: 'est', name: 'Estudiantes', shortName: 'EST', logo: 'https://media.api-sports.io/football/teams/445.png' },
    { id: 'vel', name: 'Vélez Sarsfield', shortName: 'VEL', logo: 'https://media.api-sports.io/football/teams/448.png' },
    { id: 'tal', name: 'Talleres Cordoba', shortName: 'TAL', logo: 'https://media.api-sports.io/football/teams/455.png' },
    { id: 'lan', name: 'Lanús', shortName: 'LAN', logo: 'https://media.api-sports.io/football/teams/442.png' },
    { id: 'nob', name: 'Newells Old Boys', shortName: 'NOB', logo: 'https://media.api-sports.io/football/teams/443.png' },
  ],
  eredivisie: [
    { id: 'psv', name: 'PSV Eindhoven', shortName: 'PSV', logo: 'https://media.api-sports.io/football/teams/194.png' },
    { id: 'fey', name: 'Feyenoord', shortName: 'FEY', logo: 'https://media.api-sports.io/football/teams/197.png' },
    { id: 'aja', name: 'Ajax', shortName: 'AJA', logo: 'https://media.api-sports.io/football/teams/195.png' },
    { id: 'az', name: 'AZ Alkmaar', shortName: 'AZ', logo: 'https://media.api-sports.io/football/teams/201.png' },
    { id: 'twe', name: 'Twente', shortName: 'TWE', logo: 'https://media.api-sports.io/football/teams/196.png' },
    { id: 'utr', name: 'Utrecht', shortName: 'UTR', logo: 'https://media.api-sports.io/football/teams/200.png' },
    { id: 'hee', name: 'Heerenveen', shortName: 'HEE', logo: 'https://media.api-sports.io/football/teams/204.png' },
    { id: 'spa', name: 'Sparta Rotterdam', shortName: 'SPA', logo: 'https://media.api-sports.io/football/teams/205.png' },
  ],
  cl: [
    { id: 'cl_rma', name: 'Real Madrid', shortName: 'RMA', logo: 'https://media.api-sports.io/football/teams/541.png' },
    { id: 'cl_mci', name: 'Man City', shortName: 'MCI', logo: 'https://media.api-sports.io/football/teams/50.png' },
    { id: 'cl_bay', name: 'Bayern Munich', shortName: 'BAY', logo: 'https://media.api-sports.io/football/teams/157.png' },
    { id: 'cl_psg', name: 'PSG', shortName: 'PSG', logo: 'https://media.api-sports.io/football/teams/85.png' },
    { id: 'cl_liv', name: 'Liverpool', shortName: 'LIV', logo: 'https://media.api-sports.io/football/teams/40.png' },
    { id: 'cl_bar', name: 'Barcelona', shortName: 'BAR', logo: 'https://media.api-sports.io/football/teams/529.png' },
    { id: 'cl_int', name: 'Inter Milan', shortName: 'INT', logo: 'https://media.api-sports.io/football/teams/505.png' },
    { id: 'cl_ars', name: 'Arsenal', shortName: 'ARS', logo: 'https://media.api-sports.io/football/teams/42.png' },
    { id: 'cl_atm', name: 'Atlético Madrid', shortName: 'ATM', logo: 'https://media.api-sports.io/football/teams/530.png' },
    { id: 'cl_dor', name: 'B. Dortmund', shortName: 'DOR', logo: 'https://media.api-sports.io/football/teams/165.png' },
    { id: 'cl_lev', name: 'B. Leverkusen', shortName: 'LEV', logo: 'https://media.api-sports.io/football/teams/168.png' },
    { id: 'cl_juv', name: 'Juventus', shortName: 'JUV', logo: 'https://media.api-sports.io/football/teams/496.png' },
  ],
  other: [
    { id: 'ben', name: 'Benfica', shortName: 'BEN', logo: 'https://media.api-sports.io/football/teams/211.png' },
    { id: 'por', name: 'FC Porto', shortName: 'POR', logo: 'https://media.api-sports.io/football/teams/212.png' },
    { id: 'spo', name: 'Sporting CP', shortName: 'SPO', logo: 'https://media.api-sports.io/football/teams/228.png' },
    { id: 'tur', name: 'Galatasaray', shortName: 'GAL', logo: 'https://media.api-sports.io/football/teams/610.png' },
    { id: 'fen', name: 'Fenerbahce', shortName: 'FEN', logo: 'https://media.api-sports.io/football/teams/611.png' },
    { id: 'bes', name: 'Besiktas', shortName: 'BES', logo: 'https://media.api-sports.io/football/teams/607.png' },
    { id: 'cel', name: 'Celtic', shortName: 'CEL', logo: 'https://media.api-sports.io/football/teams/252.png' },
    { id: 'ran', name: 'Rangers', shortName: 'RAN', logo: 'https://media.api-sports.io/football/teams/257.png' },
  ],
  cpl: [
    { id: 'ppc', name: 'Phnom Penh Crown', shortName: 'PPC', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/fa/Phnom_Penh_Crown_FC_logo.svg/320px-Phnom_Penh_Crown_FC_logo.svg.png' },
    { id: 'svr', name: 'PKR Svay Rieng', shortName: 'SVR', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/dc/Preah_Khan_Reach_Svay_Rieng_FC_logo.png/300px-Preah_Khan_Reach_Svay_Rieng_FC_logo.png' },
    { id: 'vis', name: 'Visakha FC', shortName: 'VIS', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Visakha_FC_Logo.png/300px-Visakha_FC_Logo.png' },
    { id: 'bkc', name: 'Boeung Ket', shortName: 'BKC', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/05/Boeung_Ket_FC.png/260px-Boeung_Ket_FC.png' },
    { id: 'nwg', name: 'NagaWorld', shortName: 'NWG', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b2/Naga_World_FC_logo.png/260px-Naga_World_FC_logo.png' },
    { id: 'isi', name: 'ISI Dangkor Senchey', shortName: 'ISI', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/87/ISI_Dangkor_Senchey_FC_logo.png/260px-ISI_Dangkor_Senchey_FC_logo.png' },
    { id: 'atg', name: 'Angkor Tiger', shortName: 'ATG', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/ef/Angkor_Tiger_FC_logo.png/260px-Angkor_Tiger_FC_logo.png' },
    { id: 'ks_senchey', name: 'Kirivong Sok Sen Chey', shortName: 'KSS', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/36/Kirivong_Sok_Sen_Chey_FC.png/260px-Kirivong_Sok_Sen_Chey_FC.png' },
    { id: 'tfa', name: 'Tiffy Army', shortName: 'TFA', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/52/Tiffy_Army_FC_logo.png/260px-Tiffy_Army_FC_logo.png' },
    { id: 'moi', name: 'Ministry of Interior FA', shortName: 'MOI', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Police_Commissary_FC_logo.png/260px-Police_Commissary_FC_logo.png' }
  ]
};
