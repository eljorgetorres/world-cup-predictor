// Current group standings as of June 24, 2026 (all MD2 complete)
// Each entry: { teamId, mp, w, d, l, gf, ga, pts }
export const GROUP_STANDINGS = {
  A: [
    { teamId: 'MEX', mp: 2, w: 2, d: 0, l: 0, gf: 3, ga: 0, pts: 6 },
    { teamId: 'KOR', mp: 2, w: 1, d: 0, l: 1, gf: 2, ga: 2, pts: 3 },
    { teamId: 'CZE', mp: 2, w: 0, d: 1, l: 1, gf: 2, ga: 3, pts: 1 },
    { teamId: 'RSA', mp: 2, w: 0, d: 1, l: 1, gf: 1, ga: 3, pts: 1 },
  ],
  B: [
    { teamId: 'CAN', mp: 2, w: 1, d: 1, l: 0, gf: 7, ga: 1, pts: 4 },
    { teamId: 'SUI', mp: 2, w: 1, d: 1, l: 0, gf: 5, ga: 2, pts: 4 },
    { teamId: 'BIH', mp: 2, w: 0, d: 1, l: 1, gf: 2, ga: 5, pts: 1 },
    { teamId: 'QAT', mp: 2, w: 0, d: 1, l: 1, gf: 1, ga: 7, pts: 1 },
  ],
  C: [
    { teamId: 'BRA', mp: 2, w: 1, d: 1, l: 0, gf: 4, ga: 1, pts: 4 },
    { teamId: 'MAR', mp: 2, w: 1, d: 1, l: 0, gf: 2, ga: 1, pts: 4 },
    { teamId: 'SCO', mp: 2, w: 1, d: 0, l: 1, gf: 1, ga: 1, pts: 3 },
    { teamId: 'HTI', mp: 2, w: 0, d: 0, l: 2, gf: 0, ga: 4, pts: 0 },
  ],
  D: [
    { teamId: 'USA', mp: 2, w: 2, d: 0, l: 0, gf: 6, ga: 1, pts: 6 },
    { teamId: 'AUS', mp: 2, w: 1, d: 0, l: 1, gf: 2, ga: 2, pts: 3 },
    { teamId: 'PAR', mp: 2, w: 1, d: 0, l: 1, gf: 2, ga: 4, pts: 3 },
    { teamId: 'TUR', mp: 2, w: 0, d: 0, l: 2, gf: 0, ga: 3, pts: 0 },
  ],
  E: [
    { teamId: 'GER', mp: 2, w: 2, d: 0, l: 0, gf: 9, ga: 2, pts: 6 },
    { teamId: 'CIV', mp: 2, w: 1, d: 0, l: 1, gf: 2, ga: 2, pts: 3 },
    { teamId: 'ECU', mp: 2, w: 0, d: 1, l: 1, gf: 0, ga: 1, pts: 1 },
    { teamId: 'CUW', mp: 2, w: 0, d: 1, l: 1, gf: 1, ga: 7, pts: 1 },
  ],
  F: [
    { teamId: 'NED', mp: 2, w: 1, d: 1, l: 0, gf: 7, ga: 3, pts: 4 },
    { teamId: 'JPN', mp: 2, w: 1, d: 1, l: 0, gf: 6, ga: 2, pts: 4 },
    { teamId: 'SWE', mp: 2, w: 1, d: 0, l: 1, gf: 6, ga: 6, pts: 3 },
    { teamId: 'TUN', mp: 2, w: 0, d: 0, l: 2, gf: 1, ga: 9, pts: 0 },
  ],
  G: [
    { teamId: 'EGY', mp: 2, w: 1, d: 1, l: 0, gf: 4, ga: 2, pts: 4 },
    { teamId: 'IRN', mp: 2, w: 0, d: 2, l: 0, gf: 2, ga: 2, pts: 2 },
    { teamId: 'BEL', mp: 2, w: 0, d: 2, l: 0, gf: 1, ga: 1, pts: 2 },
    { teamId: 'NZL', mp: 2, w: 0, d: 1, l: 1, gf: 3, ga: 5, pts: 1 },
  ],
  H: [
    { teamId: 'ESP', mp: 2, w: 1, d: 1, l: 0, gf: 4, ga: 0, pts: 4 },
    { teamId: 'URU', mp: 2, w: 0, d: 2, l: 0, gf: 3, ga: 3, pts: 2 },
    { teamId: 'CPV', mp: 2, w: 0, d: 2, l: 0, gf: 2, ga: 2, pts: 2 },
    { teamId: 'KSA', mp: 2, w: 0, d: 1, l: 1, gf: 1, ga: 5, pts: 1 },
  ],
  I: [
    { teamId: 'FRA', mp: 2, w: 2, d: 0, l: 0, gf: 6, ga: 1, pts: 6 },  // MD2: FRA 3-0 IRQ
    { teamId: 'NOR', mp: 2, w: 2, d: 0, l: 0, gf: 7, ga: 3, pts: 6 },  // MD2: NOR 3-2 SEN
    { teamId: 'SEN', mp: 2, w: 0, d: 0, l: 2, gf: 3, ga: 6, pts: 0 },
    { teamId: 'IRQ', mp: 2, w: 0, d: 0, l: 2, gf: 1, ga: 7, pts: 0 },
  ],
  J: [
    { teamId: 'ARG', mp: 2, w: 2, d: 0, l: 0, gf: 5, ga: 0, pts: 6 },
    { teamId: 'AUT', mp: 2, w: 1, d: 0, l: 1, gf: 3, ga: 3, pts: 3 },
    { teamId: 'ALG', mp: 2, w: 1, d: 0, l: 1, gf: 2, ga: 4, pts: 3 },  // MD2: ALG 2-1 JOR
    { teamId: 'JOR', mp: 2, w: 0, d: 0, l: 2, gf: 2, ga: 5, pts: 0 },  // eliminated
  ],
  K: [
    { teamId: 'COL', mp: 2, w: 2, d: 0, l: 0, gf: 4, ga: 1, pts: 6 },  // MD2: COL 1-0 DRC
    { teamId: 'POR', mp: 2, w: 1, d: 1, l: 0, gf: 6, ga: 1, pts: 4 },  // MD2: POR 5-0 UZB
    { teamId: 'DRC', mp: 2, w: 0, d: 1, l: 1, gf: 1, ga: 2, pts: 1 },
    { teamId: 'UZB', mp: 2, w: 0, d: 0, l: 2, gf: 1, ga: 8, pts: 0 },
  ],
  L: [
    { teamId: 'ENG', mp: 2, w: 1, d: 1, l: 0, gf: 4, ga: 2, pts: 4 },  // MD2: ENG 0-0 GHA
    { teamId: 'GHA', mp: 2, w: 1, d: 1, l: 0, gf: 1, ga: 0, pts: 4 },  // MD2: ENG 0-0 GHA
    { teamId: 'CRO', mp: 2, w: 1, d: 0, l: 1, gf: 3, ga: 4, pts: 3 },  // MD2: PAN 0-1 CRO
    { teamId: 'PAN', mp: 2, w: 0, d: 0, l: 2, gf: 0, ga: 2, pts: 0 },  // eliminated
  ],
};

// Remaining matches per group (not yet played as of June 24, 2026)
export const REMAINING_MATCHES = {
  A: [
    { home: 'CZE', away: 'MEX' },
    { home: 'RSA', away: 'KOR' },
  ],
  B: [
    { home: 'SUI', away: 'CAN' },
    { home: 'BIH', away: 'QAT' },
  ],
  C: [
    { home: 'SCO', away: 'BRA' },
    { home: 'MAR', away: 'HTI' },
  ],
  D: [
    { home: 'USA', away: 'TUR' },
    { home: 'AUS', away: 'PAR' },
  ],
  E: [
    { home: 'CUW', away: 'CIV' },
    { home: 'ECU', away: 'GER' },
  ],
  F: [
    { home: 'TUN', away: 'NED' },
    { home: 'JPN', away: 'SWE' },
  ],
  G: [
    { home: 'BEL', away: 'NZL' },
    { home: 'EGY', away: 'IRN' },
  ],
  H: [
    { home: 'ESP', away: 'URU' },
    { home: 'KSA', away: 'CPV' },
  ],
  I: [
    { home: 'FRA', away: 'NOR' },
    { home: 'SEN', away: 'IRQ' },
  ],
  J: [
    { home: 'ARG', away: 'JOR' },
    { home: 'ALG', away: 'AUT' },
  ],
  K: [
    { home: 'COL', away: 'POR' },
    { home: 'DRC', away: 'UZB' },
  ],
  L: [
    { home: 'PAN', away: 'ENG' },
    { home: 'CRO', away: 'GHA' },
  ],
};

export const GROUP_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
