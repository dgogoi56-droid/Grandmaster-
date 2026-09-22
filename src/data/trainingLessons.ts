import { Square } from '../types';

export type LessonCategory = 
  | 'openings'
  | 'opening-tactics'
  | 'middlegame-tactics'
  | 'endgame-tactics';

export type LessonDifficulty = 'Novice' | 'Intermediate' | 'Advanced' | 'Master';

export interface DrillStep {
  playerMove: string; // SAN e.g. 'Bxh7+' or 'd5'
  playerMoveUci?: string; // e.g. 'd7d5'
  hint: string;
  coachNote: string;
  opponentReply?: {
    san: string;
    uci?: string;
    explanation: string;
  };
}

export interface TrainingLesson {
  id: string;
  category: LessonCategory;
  title: string;
  subtitle: string;
  eco?: string;
  difficulty: LessonDifficulty;
  tags: string[];
  fen: string;
  playerColor: 'w' | 'b';
  objective: string;
  explanation: string;
  keyIdeas: string[];
  steps: DrillStep[];
  successMessage: string;
  commonMistakes?: string[];
  historicalContext?: string;
}

export const TRAINING_LESSONS: TrainingLesson[] = [
  // ==========================================
  // CATEGORY 1: OPENINGS & REPERTOIRE
  // ==========================================
  {
    id: 'opening-ruy-lopez',
    category: 'openings',
    title: 'Ruy Lopez (The Spanish Game)',
    subtitle: 'Classic mastery of center pressure & piece coordination',
    eco: 'C60-C99',
    difficulty: 'Intermediate',
    tags: ['King Pawn', 'Open Game', 'Positional Pressure', 'Morfhy Defense'],
    fen: 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3',
    playerColor: 'b',
    objective: 'Black to play: Respond with Morphy\'s Defense (a6) to question White\'s Spanish Bishop on b5.',
    explanation: 'The Ruy Lopez (1.e4 e5 2.Nf3 Nc6 3.Bb5) is one of the oldest and most deeply analyzed openings in chess history. White attacks the knight guarding e5, aiming for long-term central domination.',
    keyIdeas: [
      'Morphy Defense (3...a6) forces the bishop to declare its intentions immediately.',
      'White usually retreats with 4.Ba4, retaining the bishop pair and pressure.',
      'Black gains queenside space with ...b5 when needed, freeing the c6 knight from pins.',
      'Watch out for the Exchange Variation (4.Bxc6) where Black accepts doubled c-pawns for rapid piece activity.'
    ],
    steps: [
      {
        playerMove: 'a6',
        playerMoveUci: 'a7a6',
        hint: 'Kick the light-squared bishop immediately with a flank pawn.',
        coachNote: 'Excellent! 3...a6 is Morphy\'s Defense, the most versatile response.',
        opponentReply: {
          san: 'Ba4',
          uci: 'b5a4',
          explanation: 'White preserves the bishop along the a4-e8 diagonal.'
        }
      },
      {
        playerMove: 'Nf6',
        playerMoveUci: 'g8f6',
        hint: 'Develop the kingside knight to attack White\'s undefended e4 pawn.',
        coachNote: 'Strong move! 4...Nf6 applies direct counter-pressure on e4.',
        opponentReply: {
          san: 'O-O',
          uci: 'e1g1',
          explanation: 'White castles quickly, inviting Black into the Open Ruy Lopez if 5...Nxe4.'
        }
      },
      {
        playerMove: 'Be7',
        playerMoveUci: 'f8e7',
        hint: 'Develop your bishop to prepare kingside castling and avoid tactical pins.',
        coachNote: 'Perfect! The Closed Ruy Lopez setup is solid, flexible, and grandmaster-tested.',
      }
    ],
    successMessage: 'Well played! You successfully navigated the fundamental mainline of the Closed Ruy Lopez.',
    commonMistakes: [
      '3...d6 (Steinitz Defense) is playable but gives White an easy d4 push and restricts your dark bishop.',
      'Capturing immediately on e4 with 5...Nxe4 leads to the sharp Open Ruy Lopez, demanding precise theoretical memory.'
    ]
  },
  {
    id: 'opening-italian-game',
    category: 'openings',
    title: 'Italian Game (Giuoco Piano)',
    subtitle: 'Harmonious piece development targeting the vulnerable f7 square',
    eco: 'C50-C54',
    difficulty: 'Novice',
    tags: ['King Pawn', 'Giuoco Piano', 'Center Control', 'f7 Target'],
    fen: 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
    playerColor: 'w',
    objective: 'White to play: Build an imposing classical pawn center with c3.',
    explanation: 'The Italian Game begins 1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5. Both players activate their bishops rapidly toward the opponent\'s king, targeting the fragile f2 and f7 pawns.',
    keyIdeas: [
      '3.Bc4 immediately pressures f7, the only square guarded solely by the king.',
      'The plan with 4.c3 prepares the central push d2-d4 to challenge Black\'s bishop and seize center space.',
      'Keep your light-squared bishop active; it remains an offensive powerhouse.'
    ],
    steps: [
      {
        playerMove: 'c3',
        playerMoveUci: 'c2c3',
        hint: 'Support the d4 push by advancing the c-pawn.',
        coachNote: 'Great move! 4.c3 is the Main Line Giuoco Piano, aiming for full central control.',
        opponentReply: {
          san: 'Nf6',
          uci: 'g8f6',
          explanation: 'Black develops the knight and counter-attacks White\'s e4 pawn.'
        }
      },
      {
        playerMove: 'd4',
        playerMoveUci: 'd2d4',
        hint: 'Strike in the center now with your prepared pawn push!',
        coachNote: 'Boom! 5.d4 challenges Black\'s bishop on c5 and opens lines for White\'s pieces.',
        opponentReply: {
          san: 'exd4',
          uci: 'e5d4',
          explanation: 'Black captures in the center to avoid losing a central outpost.'
        }
      },
      {
        playerMove: 'cxd4',
        playerMoveUci: 'c3d4',
        hint: 'Recapture with the c-pawn to establish a dual pawn center on d4 and e4.',
        coachNote: 'Superb! White has achieved the ideal classical center with pawns on d4 and e4.',
      }
    ],
    successMessage: 'Mastery achieved! White commands a dominant center and active diagonals.',
    commonMistakes: [
      'Playing 4.d3 (Giuoco Pianissimo) is safe but less ambitious than 4.c3.',
      'Recapturing 5.Nxd4?! surrenders White\'s central dream and eases Black\'s defense.'
    ]
  },
  {
    id: 'opening-sicilian-najdorf',
    category: 'openings',
    title: 'Sicilian Defense: Najdorf Variation',
    subtitle: 'The sharpest, most combative defense in modern grandmaster play',
    eco: 'B90-B99',
    difficulty: 'Advanced',
    tags: ['Asymmetric', 'Sharp Counterplay', 'Najdorf', 'Kasparov Favorite'],
    fen: 'r1bqkb1r/pp2pppp/2np1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 1 6',
    playerColor: 'b',
    objective: 'Black to play: Establish the Najdorf foundation with 5...a6.',
    explanation: 'The Najdorf (1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6) is championed by Bobby Fischer and Garry Kasparov. The modest move 5...a6 controls the critical b5 square, preparing queenside counterplay with ...b5 and flexibility in the center.',
    keyIdeas: [
      '5...a6 stops White\'s knights and light-squared bishop from hopping to b5.',
      'Black prepares ...e5 (or ...e6 depending on White\'s setup) with dynamic counter-chances.',
      'The half-open c-file provides Black natural attacking avenues toward White\'s queenside.'
    ],
    steps: [
      {
        playerMove: 'a6',
        playerMoveUci: 'a7a6',
        hint: 'Prevent White from using the b5 square with a quiet pawn step.',
        coachNote: 'Brilliant! 5...a6 defines the legendary Najdorf Variation.',
        opponentReply: {
          san: 'Be3',
          uci: 'c1e3',
          explanation: 'White prepares the English Attack with f3, Qd2, and 0-0-0.'
        }
      },
      {
        playerMove: 'e5',
        playerMoveUci: 'e7e5',
        hint: 'Seize space in the center and kick the centralized d4 knight!',
        coachNote: 'Sharp and aggressive! 6...e5 fights for the d4 square while accepting a backward d6 pawn.',
        opponentReply: {
          san: 'Nb3',
          uci: 'd4b3',
          explanation: 'The knight retreats safely to b3 to participate in queenside defense.'
        }
      },
      {
        playerMove: 'Be6',
        playerMoveUci: 'c8e6',
        hint: 'Develop the light-squared bishop to reinforce the d5 square.',
        coachNote: 'Flawless! Black is fully developed, possesses healthy central tension, and holds immense counter-punching potential.',
      }
    ],
    successMessage: 'Magnificent! You have mastered the signature opening sequence of the Sicilian Najdorf.',
    commonMistakes: [
      'Playing 5...e5 before 5...a6 allows 6.Bb5+! causing Black severe tactical distress.'
    ]
  },
  {
    id: 'opening-queens-gambit',
    category: 'openings',
    title: "Queen's Gambit: Solid Slav Defense",
    subtitle: 'Bulletproof pawn reinforcement for Black against 1.d4',
    eco: 'D10-D19',
    difficulty: 'Intermediate',
    tags: ['Queens Gambit', 'Slav Defense', 'Solid Structure', 'Light Bishop Freedom'],
    fen: 'rnbqkbnr/pp1ppppp/2p5/8/2PP4/8/PP2PPPP/RNBQKBNR b KQkq - 0 2',
    playerColor: 'b',
    objective: 'Black to play: Reinforce d5 with 2...d5 without trapping the c8 bishop.',
    explanation: 'The Slav Defense (1.d4 d5 2.c4 c6) is respected at World Championship levels because, unlike the Queen\'s Gambit Declined (2...e6), Black keeps the c8 bishop free to develop to f5 or g4.',
    keyIdeas: [
      '2...c6 reinforces d5 solidly while retaining the ability to activate the c8 bishop.',
      'Black can capture on c4 at opportune moments to seek queenside pawn expansion with ...b5.',
      'Extremely resilient pawn skeleton that withstands intense positional pressure.'
    ],
    steps: [
      {
        playerMove: 'd5',
        playerMoveUci: 'd7d5',
        hint: 'Occupy the center with your queen pawn.',
        coachNote: 'Rock solid! Black erects the classical Slav barrier.',
        opponentReply: {
          san: 'Nf3',
          uci: 'g1f3',
          explanation: 'White develops naturally, preventing early ...e5.'
        }
      },
      {
        playerMove: 'Nf6',
        playerMoveUci: 'g8f6',
        hint: 'Develop your kingside knight to control e4 and d5.',
        coachNote: 'Spot on! Both sides contest the e4 square.',
        opponentReply: {
          san: 'Nc3',
          uci: 'b1c3',
          explanation: 'White piles more pressure onto Black\'s d5 anchor.'
        }
      },
      {
        playerMove: 'dxc4',
        playerMoveUci: 'd5c4',
        hint: 'Accept the gambit pawn temporarily to clear diagonals for your bishop!',
        coachNote: 'Precision! 4...dxc4 is the Open Slav, allowing Black to develop ...Bf5 unhindered before White can play e4.',
      }
    ],
    successMessage: 'Superb technique! You navigated the Slav Defense with master-grade discipline.',
  },

  // ==========================================
  // CATEGORY 2: OPENING TACTICS & TRAPS
  // ==========================================
  {
    id: 'trap-fried-liver',
    category: 'opening-tactics',
    title: 'The Fried Liver Attack',
    subtitle: 'Devastating knight sacrifice on f7 against careless King defense',
    eco: 'C57',
    difficulty: 'Intermediate',
    tags: ['Sacrifice', 'f7 Attack', 'King Hunt', 'Italian Game'],
    fen: 'r1bqkb1r/ppp2ppp/2n5/3np1N1/2B5/8/PPPP1PPP/RNBQK2R w KQkq - 0 6',
    playerColor: 'w',
    objective: 'White to play: Sacrifice your knight on f7 to drag Black\'s King into the firing line!',
    explanation: 'The Fried Liver Attack is one of the most vicious opening gambits in the Two Knights Defense. White sacrifices a knight on f7 to lure the black king into the open center, where it faces relentless checks.',
    keyIdeas: [
      '6.Nxf7! forces the Black King to capture (6...Kxf7), losing castling rights.',
      '7.Qf3+ brings the queen into the assault with a double attack on d5 and check on the king.',
      'Never allow the Black King a moment of peace; every tempo must press the attack.'
    ],
    steps: [
      {
        playerMove: 'Nxf7',
        playerMoveUci: 'g5f7',
        hint: 'Sacrifice the knight on the vulnerable f7 square!',
        coachNote: 'Boom! 6.Nxf7 forks queen and rook, forcing the black king into the open.',
        opponentReply: {
          san: 'Kxf7',
          uci: 'e8f7',
          explanation: 'Black has no choice but to capture the aggressive knight.'
        }
      },
      {
        playerMove: 'Qf3+',
        playerMoveUci: 'd1f3',
        hint: 'Bring your queen out with check and attack the pinned knight on d5!',
        coachNote: 'Lethal! 7.Qf3+ forces Black\'s king further forward to Ke6 to defend the d5 knight.',
        opponentReply: {
          san: 'Ke6',
          uci: 'f7e6',
          explanation: 'Black\'s king is forced onto e6 in the center of the board.'
        }
      },
      {
        playerMove: 'Nc3',
        playerMoveUci: 'b1c3',
        hint: 'Develop your remaining knight to pile a third attacker onto d5.',
        coachNote: 'Brilliant! Black is completely paralyzed defending the pinned knight against White\'s overwhelming firepower.',
      }
    ],
    successMessage: 'Devastating attack executed! White will win the d5 knight with a crushing positional and material advantage.',
    commonMistakes: [
      'Playing 6.d4 prematurely lets Black reorganize without King exposure.'
    ]
  },
  {
    id: 'trap-legals-mate',
    category: 'opening-tactics',
    title: "Legal's Trap (The Queen Sacrifice)",
    subtitle: 'Feigning a blunder to deliver an astonishing minor piece mate',
    eco: 'C41',
    difficulty: 'Novice',
    tags: ['Queen Sacrifice', 'Checkmate', 'Deception', 'Italian / Philidor'],
    fen: 'r2qkb1r/ppp2ppp/2np1n2/4p3/2B1P1b1/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 1 5',
    playerColor: 'w',
    objective: 'White to play: Ignore the pin on your Queen and strike at e5 with your knight!',
    explanation: "Sire de Légal's famous trap from 1750 demonstrates that piece coordination and checkmate always trump raw material value. White allows Black to capture the Queen, setting up an unavoidable mating net.",
    keyIdeas: [
      '5.Nxe5! appears to lose the Queen on d1, but Black\'s king is undefended.',
      'If Black takes the queen with 5...Bxd1, White strikes with 6.Bxf7+ Ke7 7.Nd5# checkmate!',
      'Always calculate forcing moves before greedily snapping up queens.'
    ],
    steps: [
      {
        playerMove: 'Nxe5',
        playerMoveUci: 'f3e5',
        hint: 'Capture the e5 pawn with your knight, daring Black to take your Queen!',
        coachNote: 'Magnificent audacity! 5.Nxe5 breaks the pin with tactical venom.',
        opponentReply: {
          san: 'Bxd1',
          uci: 'g4d1',
          explanation: 'Black falls headfirst into the trap and greedily takes your Queen.'
        }
      },
      {
        playerMove: 'Bxf7+',
        playerMoveUci: 'c4f7',
        hint: 'Deliver a devastating check on f7 with your bishop!',
        coachNote: 'Check! 6.Bxf7+ strips Black\'s king of all retreat squares except e7.',
        opponentReply: {
          san: 'Ke7',
          uci: 'e8e7',
          explanation: 'The only legal square for the Black King.'
        }
      },
      {
        playerMove: 'Nd5#',
        playerMoveUci: 'c3d5',
        hint: 'Deliver checkmate with your c3 knight!',
        coachNote: 'CHECKMATE! The two knights and bishop deliver pure geometric perfection!',
      }
    ],
    successMessage: 'Pure brilliance! You delivered one of the most famous checkmates in chess history.',
  },
  {
    id: 'trap-noahs-ark',
    category: 'opening-tactics',
    title: "Noah's Ark Trap",
    subtitle: 'Trap White\'s proud Ruy Lopez bishop behind pawn bars',
    eco: 'C71',
    difficulty: 'Intermediate',
    tags: ['Bishop Trap', 'Ruy Lopez', 'Pawn Push', 'Queenside Net'],
    fen: 'r1bqk2r/2p1bppp/p1np4/1p2p3/4P3/1B1P1N2/PPP2PPP/RNBQ1RK1 b kq - 0 8',
    playerColor: 'b',
    objective: 'Black to play: Begin the operation to trap White\'s bishop on b3 using your pawns.',
    explanation: "The Noah's Ark Trap is a classic Ruy Lopez trap where Black uses queenside pawns (a6, b5, and eventually c4) to enclose White's light-squared bishop, suffocating it on b3.",
    keyIdeas: [
      'Black pushes ...Na5 to trade White\'s bishop or ...c5 followed by ...c4.',
      'Once Black plays ...c4, the bishop has zero retreat squares and is lost for a pawn.',
      'Always be alert to pieces becoming trapped behind an advancing pawn chain.'
    ],
    steps: [
      {
        playerMove: 'Na5',
        playerMoveUci: 'c6a5',
        hint: 'Hop your knight to a5 to target the bishop on b3.',
        coachNote: 'Smart! 8...Na5 immediately eyes the bishop.',
        opponentReply: {
          san: 'd4',
          uci: 'd3d4',
          explanation: 'White strikes centrally, trying to distract Black.'
        }
      },
      {
        playerMove: 'c5',
        playerMoveUci: 'c7c5',
        hint: 'Advance your c-pawn to prepare trapping the bishop and challenge d4.',
        coachNote: 'Strong! 9...c5 sets up the decisive squeeze.',
        opponentReply: {
          san: 'd5',
          uci: 'd4d5',
          explanation: 'White closes the center, missing the impending doom.'
        }
      },
      {
        playerMove: 'c4',
        playerMoveUci: 'c5c4',
        hint: 'Drop the cage! Advance the c-pawn to c4 and trap the bishop.',
        coachNote: 'Gotcha! The bishop on b3 is trapped with nowhere to escape.',
      }
    ],
    successMessage: 'Trap sprung! Black wins a full minor piece and achieves an overwhelming advantage.',
  },
  {
    id: 'trap-blackburne-shilling',
    category: 'opening-tactics',
    title: 'Blackburne Shilling Gambit Trap',
    subtitle: 'Punish White\'s greedy capture of e5 with a royal assault',
    eco: 'C50',
    difficulty: 'Novice',
    tags: ['Italian Game', 'Trap', 'Queen Attack', 'Smothered Mate Threat'],
    fen: 'r1bqk1nr/pppp1ppp/8/2b1n3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 4',
    playerColor: 'b',
    objective: 'Black has played 3...Nd4, baiting 4.Nxe5. White took on e5! Black to play: Unleash the Queen counter-strike on g2.',
    explanation: 'Joseph Henry Blackburne reportedly used this trap in coffeehouses to win shillings from amateurs. White greedily snatches the e5 pawn, ignoring Black\'s venomous queen maneuver to g5.',
    keyIdeas: [
      '4...Qg5 attacks both the knight on e5 and the g2 pawn simultaneously.',
      'If White takes f7 with 5.Nxf7, 5...Qxg2 threatens the rook and checkmate.',
      'Leads to a magnificent smothered mate if White tries to save the rook.'
    ],
    steps: [
      {
        playerMove: 'Qg5',
        playerMoveUci: 'd8g5',
        hint: 'Swing your queen diagonally to g5, attacking both e5 and g2.',
        coachNote: 'Terrific! 4...Qg5 creates an unstoppable double threat.',
        opponentReply: {
          san: 'Nxf7',
          uci: 'e5f7',
          explanation: 'White aggressively forks Black\'s queen and rook, oblivious to the danger.'
        }
      },
      {
        playerMove: 'Qxg2',
        playerMoveUci: 'g5g2',
        hint: 'Infiltrate with your Queen by capturing on g2!',
        coachNote: 'Decisive! White\'s h1 rook is doomed.',
        opponentReply: {
          san: 'Rf1',
          uci: 'h1f1',
          explanation: 'White attempts to save the rook.'
        }
      },
      {
        playerMove: 'Qxe4+',
        playerMoveUci: 'g2e4',
        hint: 'Capture the e4 pawn with check to expose White\'s king!',
        coachNote: 'Devastating check! If White blocks with 7.Be2, 7...Nf3# is a clean smothered mate!',
      }
    ],
    successMessage: 'Outstanding tactics! White is completely routed and will be checkmated on the next move.',
  },

  // ==========================================
  // CATEGORY 3: MIDDLEGAME TACTICS & STRATEGY
  // ==========================================
  {
    id: 'mid-greek-gift',
    category: 'middlegame-tactics',
    title: 'The Greek Gift Sacrifice (Bxh7+)',
    subtitle: 'The timeless bishop sacrifice obliterating the castled king',
    difficulty: 'Intermediate',
    tags: ['Sacrifice', 'King Attack', 'Kingside Storm', 'Bxh7+ Motif'],
    fen: 'r1bq1rk1/ppp2ppp/2n1pn2/3p4/2PP4/2NBPN2/PP3PPP/R1BQK2R w KQ - 4 7',
    playerColor: 'w',
    objective: 'White to play: Position check! Imagine the typical Greek Gift setup. White plays Bxh7+ to initiate the mating attack.',
    explanation: 'The classic Greek Gift (Bxh7+) is the premier attacking motif against an unfortified castled king. When Black lacks a knight on f6 to guard h7, a bishop sacrifice opens the h-file for the Queen and Ng5+.',
    keyIdeas: [
      'Prerequisites: A bishop on the b1-h7 diagonal, a knight ready to jump to g5, and queen access to h5 or g4.',
      'After ...Kxh7, Ng5+ forces the king back to g8 (or into the open board with ...Kg6).',
      'Qh5 then threatens unstoppable checkmate on h7 or f7.'
    ],
    steps: [
      {
        playerMove: 'Bxh7+',
        playerMoveUci: 'd3h7',
        hint: 'Sacrifice the bishop on h7 with check!',
        coachNote: 'Classic Greek Gift! 1.Bxh7+ shatters Black\'s king sanctuary.',
        opponentReply: {
          san: 'Kxh7',
          uci: 'g8h7',
          explanation: 'Black accepts the sacrifice.'
        }
      },
      {
        playerMove: 'Ng5+',
        playerMoveUci: 'f3g5',
        hint: 'Jump your knight into g5 with check to control h7 and f7.',
        coachNote: 'Powerful check! Black must either retreat or venture into the fire.',
        opponentReply: {
          san: 'Kg8',
          uci: 'h7g8',
          explanation: 'The king cowers back to g8.'
        }
      },
      {
        playerMove: 'Qh5',
        playerMoveUci: 'd1h5',
        hint: 'Bring your Queen to h5, setting up unstoppable mate on h7.',
        coachNote: 'Lethal! Checkmate on h7 is completely unavoidable.',
      }
    ],
    successMessage: 'Masterpiece! You executed the quintessential attacking sacrifice in chess history.',
  },
  {
    id: 'mid-smothered-mate',
    category: 'middlegame-tactics',
    title: "Smothered Mate (Philidor's Legacy)",
    subtitle: 'Trap the enemy king inside his own army using Queen & Knight harmony',
    difficulty: 'Advanced',
    tags: ['Smothered Mate', 'Queen Sacrifice', 'Double Check', 'Knight Mastery'],
    fen: '6k1/5ppp/8/8/8/5N2/1Q4PP/4q1K1 w - - 0 1', // We will use classic smothered mate setup
    playerColor: 'w',
    objective: 'White to play: Execute the forced Philidor\'s smothered mate sequence starting with Nh6++ or Qg8+!',
    explanation: 'Smothered mate is one of the most aesthetic maneuvers in chess. A double check forces the king to the corner, followed by a shocking queen sacrifice that forces an enemy piece to suffocate its own monarch, allowing a single knight to deliver checkmate.',
    keyIdeas: [
      'Double check is the most coercive move in chess: the king MUST move; blocks or captures of checking pieces are illegal.',
      'Forces the king into the corner square h8.',
      'The Queen sacrifice on g8 forces ...Rxg8 (the king cannot take because it\'s defended by the knight).',
      'Nf7# delivers the final, breathtaking smothered checkmate.'
    ],
    steps: [
      {
        playerMove: 'Nh6+',
        playerMoveUci: 'f3h6',
        hint: 'Deliver double check with knight and queen!',
        coachNote: 'Double check! The King is forced to retreat to h8.',
        opponentReply: {
          san: 'Kh8',
          uci: 'g8h8',
          explanation: 'Black has no other legal move.'
        }
      },
      {
        playerMove: 'Qg8+',
        playerMoveUci: 'b2g8',
        hint: 'The legendary Queen sacrifice right in front of the King!',
        coachNote: 'Breathtaking! The black rook is forced to take because the knight defends the Queen.',
        opponentReply: {
          san: 'Rxg8',
          uci: 'e1g8',
          explanation: 'The rook captures the queen, entombing the king.'
        }
      },
      {
        playerMove: 'Nf7#',
        playerMoveUci: 'h6f7',
        hint: 'Drop the knight into f7 for the smothered checkmate!',
        coachNote: 'CHECKMATE! The King is smothered by his own pieces. A true work of art!',
      }
    ],
    successMessage: 'Perfection! You have mastered Philidor\'s Legacy, the crown jewel of chess tactics.',
  },
  {
    id: 'mid-absolute-pin',
    category: 'middlegame-tactics',
    title: 'Exploiting the Absolute Pin',
    subtitle: 'Pile attackers onto a pinned piece until it collapses',
    difficulty: 'Novice',
    tags: ['Pin', 'Tactics', 'Overloaded', 'Fundamental'],
    fen: '3r2k1/ppp2ppp/8/8/4b3/1BP5/P4PPP/R5K1 w - - 0 1',
    playerColor: 'w',
    objective: 'White to play: Find the tactical move that targets Black\'s vulnerable piece or back rank.',
    explanation: 'A piece pinned to the king cannot move under any circumstance. The golden tactical rule: attack the pinned piece with pawns or pieces of lesser value until the defense breaks down.',
    keyIdeas: [
      'Identify pinned pieces immediately during board scans.',
      'Apply maximum pressure before the opponent can unpin.',
      'Combine pins with back-rank threats for instant tactical wins.'
    ],
    steps: [
      {
        playerMove: 'Re1',
        playerMoveUci: 'a1e1',
        hint: 'Seize the open e-file and pin Black\'s bishop along the file.',
        coachNote: 'Great move! The e-file rook creates relentless pressure.',
        opponentReply: {
          san: 'Bc6',
          uci: 'e4c6',
          explanation: 'Black retreats the bishop to safety.'
        }
      },
      {
        playerMove: 'Re8#',
        playerMoveUci: 'e1e8',
        hint: 'Deliver back-rank checkmate!',
        coachNote: 'Checkmate! The back-rank weakness proves instantly fatal.',
      }
    ],
    successMessage: 'Brilliant tactical vision! You exploited the geometric weakness with decisive precision.',
  },
  {
    id: 'mid-knight-fork',
    category: 'middlegame-tactics',
    title: 'The Royal Family Fork',
    subtitle: 'The unique jumping capability of the knight attacking King and Queen',
    difficulty: 'Novice',
    tags: ['Fork', 'Knight', 'Double Attack', 'Tactics'],
    fen: 'r3k2r/ppp2ppp/2n5/3q4/3PN1b1/8/PPP2PPP/R1BQK2R w KQkq - 0 10',
    playerColor: 'w',
    objective: 'White to play: Black\'s queen and bishop are loose. Find the winning knight or queen move.',
    explanation: 'Knights are the ultimate forking machines because their jumping move cannot be blocked. A royal fork attacks the King and Queen simultaneously, leaving the opponent no escape.',
    keyIdeas: [
      'Look for squares where a knight can hit two valuable targets simultaneously.',
      'Check if tactical prerequisites like deflection or sacrifice can set up the fork.'
    ],
    steps: [
      {
        playerMove: 'Qxg4',
        playerMoveUci: 'd1g4',
        hint: 'Capture Black\'s unprotected bishop on g4 with your Queen!',
        coachNote: 'Excellent! Black\'s bishop on g4 was completely undefended.',
        opponentReply: {
          san: 'Nxd4',
          uci: 'c6d4',
          explanation: 'Black tries to counter-attack White\'s c2 pawn.'
        }
      },
      {
        playerMove: 'O-O',
        playerMoveUci: 'e1g1',
        hint: 'Castle your king to safety and safeguard the e1 square.',
        coachNote: 'Perfect! White remains up a clean piece with a dominating position.',
      }
    ],
    successMessage: 'Crisp tactical alertness! You punished Black\'s loose piece instantly.',
  },

  // ==========================================
  // CATEGORY 4: ENDGAME TACTICS & TECHNIQUE
  // ==========================================
  {
    id: 'end-lucena-position',
    category: 'endgame-tactics',
    title: 'The Lucena Position (Building a Bridge)',
    subtitle: 'The definitive winning technique in Rook & Pawn endgames',
    difficulty: 'Advanced',
    tags: ['Endgame', 'Rook Ending', 'Bridge Building', 'Lucena'],
    fen: '1K1R4/3P1k2/8/8/8/8/6r1/8 w - - 1 1',
    playerColor: 'w',
    objective: 'White to play: Build the famous Lucena Bridge to escort the d7 pawn to queen safely!',
    explanation: 'The Lucena Position is the foundational winning technique in rook and pawn endgames. White has a pawn on the 7th rank with the king in front of it. By checking Black\'s king away and placing the rook on the 4th rank, White creates a "bridge" to shield the king from checks.',
    keyIdeas: [
      'Step 1: Check Black\'s king away from the promotion file (1.Rf8+ Ke7).',
      'Step 2: Place the White Rook on the 4th rank (2.Rd4!). This is the crucial bridge height.',
      'Step 3: Step the White King out (Kd7/Kc7) to unblock the pawn.',
      'Step 4: Interpose the rook (Rd4-d5) to block the final check, enabling pawn promotion!'
    ],
    steps: [
      {
        playerMove: 'Rf8+',
        playerMoveUci: 'd8f8',
        hint: 'Check Black\'s King to drive him away from the d-file!',
        coachNote: 'Crucial first move! The Black King must give way.',
        opponentReply: {
          san: 'Ke7',
          uci: 'f7e7',
          explanation: 'Black\'s king steps to e7.'
        }
      },
      {
        playerMove: 'Rf4',
        playerMoveUci: 'f8f4',
        hint: 'Place your rook on the 4th rank! This builds the foundation of the bridge.',
        coachNote: 'Brilliant! 2.Rf4 establishes the classic 4th-rank shield.',
        opponentReply: {
          san: 'Rd2',
          uci: 'g2d2',
          explanation: 'Black prepares to check White\'s king from behind.'
        }
      },
      {
        playerMove: 'Kc7',
        playerMoveUci: 'b8c7',
        hint: 'Step your king out to c7, clearing the path for your pawn!',
        coachNote: 'The King steps out! Black will give check on c2.',
        opponentReply: {
          san: 'Rc2+',
          uci: 'd2c2',
          explanation: 'Black checks the king.'
        }
      },
      {
        playerMove: 'Kb6',
        playerMoveUci: 'c7b6',
        hint: 'Advance toward your rook.',
        coachNote: 'Moving down the board toward the 4th-rank bridge.',
        opponentReply: {
          san: 'Rb2+',
          uci: 'c2b2',
          explanation: 'Another check by Black.'
        }
      },
      {
        playerMove: 'Rb4',
        playerMoveUci: 'f4b4',
        hint: 'Shield the King! Interpose your rook on b4 to block the check.',
        coachNote: 'THE BRIDGE IS COMPLETE! The check is shielded and d8=Q cannot be stopped!',
      }
    ],
    successMessage: 'Monumental mastery! You have executed the Lucena Bridge, the most important theoretical technique in all of chess.',
  },
  {
    id: 'end-philidor-defense',
    category: 'endgame-tactics',
    title: 'The Philidor Defense (3rd Rank Waiting)',
    subtitle: 'The golden drawing technique for defending rook endgames',
    difficulty: 'Advanced',
    tags: ['Endgame', 'Rook Ending', 'Draw Fortress', 'Philidor'],
    fen: '4k3/R7/8/4P3/8/8/8/4K2r b - - 0 1',
    playerColor: 'b',
    objective: 'Black to play: Maintain the rook on the 6th rank (or 3rd rank from White\'s view) to prevent White\'s king from invading!',
    explanation: 'The Philidor Defense is the ultimate drawing technique when defending down a pawn in a rook endgame. By holding the 6th rank, the defending rook keeps the enemy king from advancing. As soon as the pawn pushes forward, the rook drops to the 1st rank to deliver endless checks from behind!',
    keyIdeas: [
      'Do NOT allow the attacker\'s king to reach the 6th rank.',
      'Keep your rook patrolling the 6th rank as a barrier.',
      'The moment the attacker pushes the pawn (e6), drop your rook immediately to the 1st rank (e.g. Rh1/Rh8) and deliver continuous back checks.'
    ],
    steps: [
      {
        playerMove: 'Rh6',
        playerMoveUci: 'h1h6',
        hint: 'Keep your rook on the 6th rank to build an impenetrable barrier against the White King!',
        coachNote: 'Textbook Philidor! The White King is completely denied access to the 6th rank.',
        opponentReply: {
          san: 'e6',
          uci: 'e5e6',
          explanation: 'White gives up on king invasion and pushes the pawn forward.'
        }
      },
      {
        playerMove: 'Rh1',
        playerMoveUci: 'h6h1',
        hint: 'Now that the pawn moved, the White King has lost shelter! Drop your rook to the 1st rank.',
        coachNote: 'Flawless execution! With the pawn pushed to e6, White\'s king has no refuge from vertical checks.',
        opponentReply: {
          san: 'Kd6',
          uci: 'e1d6',
          explanation: 'White tries to advance the king.'
        }
      },
      {
        playerMove: 'Rd1+',
        playerMoveUci: 'h1d1',
        hint: 'Check White\'s king from the rear!',
        coachNote: 'Perpetual check secured! White cannot avoid endless checks without relinquishing the pawn.',
      }
    ],
    successMessage: 'Ironclad defense! You successfully demonstrated François-André Danican Philidor\'s famous drawing method.',
  },
  {
    id: 'end-rule-of-square',
    category: 'endgame-tactics',
    title: 'The Rule of the Square',
    subtitle: 'Calculate pawn promotion in seconds without counting moves',
    difficulty: 'Novice',
    tags: ['Endgame', 'Pawn Ending', 'Rule of Square', 'Calculation'],
    fen: '8/8/8/3P4/8/8/6k1/4K3 b - - 0 1',
    playerColor: 'b',
    objective: 'Black to play: Determine if your King can enter the square of the pawn on d5. Step toward the pawn!',
    explanation: 'The Rule of the Square is a geometric mental shortcut. Count the number of squares from the pawn to its promotion square (including the pawn\'s square). Draw a square with that side length toward the enemy king. If the king can step inside this square on its move, it can catch the pawn; if not, the pawn promotes unstoppable!',
    keyIdeas: [
      'The d5 pawn has 4 squares to reach d8 (d5, d6, d7, d8).',
      'The square extends from d5 to d8, and horizontally 4 squares to g5 and g8.',
      'Black\'s King on g2 can step into the square with ...Kf3!',
    ],
    steps: [
      {
        playerMove: 'Kf3',
        playerMoveUci: 'g2f3',
        hint: 'Step toward the promotion square and enter the perimeter of the square!',
        coachNote: 'Brilliant! Black enters the square at f4/f3. The pawn cannot escape.',
        opponentReply: {
          san: 'd6',
          uci: 'd5d6',
          explanation: 'White pushes the pawn desperately.'
        }
      },
      {
        playerMove: 'Ke3',
        playerMoveUci: 'f3e3',
        hint: 'Continue marching toward the d-file to intercept.',
        coachNote: 'Direct interception! The pawn will be captured next turn.',
      }
    ],
    successMessage: 'Calculation shortcut mastered! You can now instantly evaluate pawn races at a single glance.',
  },
  {
    id: 'end-king-opposition',
    category: 'endgame-tactics',
    title: 'The Opposition (Direct & Outflanking)',
    subtitle: 'The foundational king-duel principle in pure pawn endgames',
    difficulty: 'Intermediate',
    tags: ['Endgame', 'Pawn Ending', 'Opposition', 'Zugzwang'],
    fen: '8/8/4k3/8/4K3/8/4P3/8 w - - 0 1',
    playerColor: 'w',
    objective: 'White to play: Take the direct opposition by placing your King directly facing Black\'s King with an odd number of squares between them!',
    explanation: 'The Opposition is a state of mutual Zugzwang where two kings face each other separated by one square. The player who has taken the opposition forces the opponent\'s king to give ground ("outflanking"), creating a clear highway for the pawn to promote.',
    keyIdeas: [
      'Having the opposition means it is the OPPONENT\'S turn to move away.',
      'When the enemy king steps to the left, outflank to the right, and vice versa.',
      'Never push the pawn until the king has secured a controlling outpost in front of it.'
    ],
    steps: [
      {
        playerMove: 'Kd4',
        playerMoveUci: 'e4d4',
        hint: 'Step to d4 to seize the diagonal opposition or wait for Black.',
        coachNote: 'Solid step! White controls key forward squares.',
        opponentReply: {
          san: 'Kd6',
          uci: 'e6d6',
          explanation: 'Black takes the direct opposition.'
        }
      },
      {
        playerMove: 'e4',
        playerMoveUci: 'e2e4',
        hint: 'Use your reserve tempo! Push the pawn one square to pass the move back to Black.',
        coachNote: 'Master stroke! Using the pawn\'s reserve tempo forces Black to step aside.',
        opponentReply: {
          san: 'Ke6',
          uci: 'd6e6',
          explanation: 'Black\'s king is forced to yield ground.'
        }
      },
      {
        playerMove: 'Kc5',
        playerMoveUci: 'd4c5',
        hint: 'Outflank! Invade Black\'s territory on the side he just vacated.',
        coachNote: 'OUTFLANKED! White\'s king takes total command of the c6 and d6 promotion corridor.',
      }
    ],
    successMessage: 'Theoretical excellence! You outflanked the defender and guaranteed pawn promotion.',
  },
  {
    id: 'end-rook-cut-off',
    category: 'endgame-tactics',
    title: 'Basic Checkmate: King & Rook',
    subtitle: 'Systematically shrink the box to deliver checkmate',
    difficulty: 'Novice',
    tags: ['Basic Mate', 'Rook & King', 'Box Method', 'Checkmate'],
    fen: '8/3k4/8/8/8/4K3/8/4R3 w - - 0 1',
    playerColor: 'w',
    objective: 'White to play: Cut the Black King off along the e-file or 4th rank to shrink his prison.',
    explanation: 'Checkmating with a King and Rook requires confining the enemy King to an edge of the board. The rook cuts off files or ranks while your King steps in opposition to force the opponent backward.',
    keyIdeas: [
      'Use the rook as an electric fence to trap the king in a shrinking rectangle.',
      'Advance your king opposite the enemy king to force him into zugzwang.',
      'Deliver the final blow when the enemy king is trapped on the rim with your king in opposition.'
    ],
    steps: [
      {
        playerMove: 'Kd4',
        playerMoveUci: 'e3d4',
        hint: 'Centralize your king to support the rook.',
        coachNote: 'Great centralization! White\'s king steps forward.',
        opponentReply: {
          san: 'Kd6',
          uci: 'd7d6',
          explanation: 'Black tries to stand his ground in opposition.'
        }
      },
      {
        playerMove: 'Re4',
        playerMoveUci: 'e1e4',
        hint: 'Shrink the box! Cut Black off horizontally along the 4th rank.',
        coachNote: 'Textbook technique! Black\'s king cannot cross the 4th rank or e-file.',
      }
    ],
    successMessage: 'Box successfully shrunk! The enemy king has no escape.',
  }
];

export const CATEGORY_INFO: Record<LessonCategory, { name: string; description: string; icon: string; color: string }> = {
  'openings': {
    name: 'Openings & Repertoire',
    description: 'Master grandmaster mainlines, pawn structures, and strategic plans for White & Black.',
    icon: 'BookOpen',
    color: 'from-blue-600 to-indigo-700',
  },
  'opening-tactics': {
    name: 'Opening Traps & Tactics',
    description: 'Punish opening blunders, master classic gambits, and avoid deadly opening pitfalls.',
    icon: 'Zap',
    color: 'from-amber-600 to-orange-700',
  },
  'middlegame-tactics': {
    name: 'Middlegame Warfare',
    description: 'Pins, forks, skewers, Greek gifts, double checks, and devastating sacrifices.',
    icon: 'Swords',
    color: 'from-rose-600 to-red-700',
  },
  'endgame-tactics': {
    name: 'Endgame Mastery',
    description: 'Lucena Bridge, Philidor Defense, Rule of the Square, Opposition, and basic checkmates.',
    icon: 'Trophy',
    color: 'from-emerald-600 to-teal-700',
  },
};
