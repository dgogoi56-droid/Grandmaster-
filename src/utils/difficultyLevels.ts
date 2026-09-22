export interface DifficultyLevelInfo {
  level: number;
  name: string;
  elo: number;
  depth: number;
  description: string;
  shortDesc: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  blunderRate: string;
}

export const DIFFICULTY_LEVELS: DifficultyLevelInfo[] = [
  {
    level: 1,
    name: 'Novice',
    elo: 800,
    depth: 2,
    description: 'Casual fun play. Forgiving AI that makes occasional free captures and blunders.',
    shortDesc: 'Forgiving & casual',
    colorClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/10 hover:bg-emerald-500/20',
    borderClass: 'border-emerald-500/30',
    blunderRate: 'High (~50%)',
  },
  {
    level: 2,
    name: 'Beginner',
    elo: 1100,
    depth: 3,
    description: 'Developing basics. Understands basic opening moves but can miss multi-step tactics.',
    shortDesc: 'Basic opening & moves',
    colorClass: 'text-teal-400',
    bgClass: 'bg-teal-500/10 hover:bg-teal-500/20',
    borderClass: 'border-teal-500/30',
    blunderRate: 'Moderate (~35%)',
  },
  {
    level: 3,
    name: 'Club Player',
    elo: 1400,
    depth: 3,
    description: 'Sensible piece play and central control. Solid for hobbyist & amateur club players.',
    shortDesc: 'Solid central fundamentals',
    colorClass: 'text-cyan-400',
    bgClass: 'bg-cyan-500/10 hover:bg-cyan-500/20',
    borderClass: 'border-cyan-500/30',
    blunderRate: 'Occasional (~20%)',
  },
  {
    level: 4,
    name: 'Intermediate',
    elo: 1650,
    depth: 4,
    description: 'Active tactical threats, forks, and pins. Punishes undefended pieces quickly.',
    shortDesc: 'Tactical & aggressive',
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-500/10 hover:bg-blue-500/20',
    borderClass: 'border-blue-500/30',
    blunderRate: 'Low (~12%)',
  },
  {
    level: 5,
    name: 'Advanced',
    elo: 1900,
    depth: 4,
    description: 'Tournament club strength. Deep positional understanding, sound pawn structure.',
    shortDesc: 'Strong club tournament strength',
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-500/10 hover:bg-amber-500/20',
    borderClass: 'border-amber-500/30',
    blunderRate: 'Rare (~5%)',
  },
  {
    level: 6,
    name: 'Expert',
    elo: 2150,
    depth: 5,
    description: 'Sharp calculations and deep combinations. Demands high precision from player.',
    shortDesc: 'Sharp tactical calculation',
    colorClass: 'text-orange-400',
    bgClass: 'bg-orange-500/10 hover:bg-orange-500/20',
    borderClass: 'border-orange-500/30',
    blunderRate: 'Very Rare (~2%)',
  },
  {
    level: 7,
    name: 'Master',
    elo: 2400,
    depth: 6,
    description: 'FIDE Master equivalent. Relentless piece coordination and endgame technique.',
    shortDesc: 'FIDE Master strength',
    colorClass: 'text-rose-400',
    bgClass: 'bg-rose-500/10 hover:bg-rose-500/20',
    borderClass: 'border-rose-500/30',
    blunderRate: 'Negligible (<1%)',
  },
  {
    level: 8,
    name: 'Grandmaster',
    elo: 2850,
    depth: 6,
    description: 'Full-power Stockfish AI. Uncompromising minimax search with alpha-beta pruning.',
    shortDesc: 'Max engine strength',
    colorClass: 'text-purple-400',
    bgClass: 'bg-purple-500/10 hover:bg-purple-500/20',
    borderClass: 'border-purple-500/30',
    blunderRate: 'Zero (Optimal)',
  },
];

export function getDifficultyInfo(level: number): DifficultyLevelInfo {
  const found = DIFFICULTY_LEVELS.find((d) => d.level === level);
  return found || DIFFICULTY_LEVELS[4]; // Default to Level 5
}
