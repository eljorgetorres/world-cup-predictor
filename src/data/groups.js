// Current group standings as of June 22, 2026 (includes ARG 2–0 AUT)
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
    { teamId: 'NOR', mp: 1, w: 1, d: 0, l: 0, gf: 4, ga: 1, pts: 3 },
    { teamId: 'FRA', mp: 1, w: 1, d: 0, l: 0, gf: 3, ga: 1, pts: 3 },
    { teamId: 'SEN', mp: 1, w: 0, d: 0, l: 1, gf: 1, ga: 3, pts: 0 },
    { teamId: 'IRQ', mp: 1, w: 0, d: 0, l: 1, gf: 1, ga: 4, pts: 0 },
  ],
  J: [
    { teamId: 'ARG', mp: 2, w: 2, d: 0, l: 0, gf: 5, ga: 0, pts: 6 },
    { teamId: 'AUT', mp: 2, w: 1, d: 0, l: 1, gf: 3, ga: 3, pts: 3 },
    { teamId: 'JOR', mp: 1, w: 0, d: 0, l: 1, gf: 1, ga: 3, pts: 0 },
    { teamId: 'ALG', mp: 1, w: 0, d: 0, l: 1, gf: 0, ga: 3, pts: 0 },
  ],
  K: [
    { teamId: 'COL', mp: 1, w: 1, d: 0, l: 0, gf: 3, ga: 1, pts: 3 },
    { teamId: 'DRC', mp: 1, w: 0, d: 1, l: 0, gf: 1, ga: 1, pts: 1 },
    { teamId: 'POR', mp: 1, w: 0, d: 1, l: 0, gf: 1, ga: 1, pts: 1 },
    { teamId: 'UZB', mp: 1, w: 0, d: 0, l: 1, gf: 1, ga: 3, pts: 0 },
  ],
  L: [
    { teamId: 'ENG', mp: 1, w: 1, d: 0, l: 0, gf: 4, ga: 2, pts: 3 },
    { teamId: 'GHA', mp: 1, w: 1, d: 0, l: 0, gf: 1, ga: 0, pts: 3 },
    { teamId: 'PAN', mp: 1, w: 0, d: 0, l: 1, gf: 0, ga: 1, pts: 0 },
    { teamId: 'CRO', mp: 1, w: 0, d: 0, l: 1, gf: 2, ga: 4, pts: 0 },
  ],
};

// Remaining matches per group (not yet played as of June 22, 2026)
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
    { home: 'FRA', away: 'IRQ' },
    { home: 'NOR', away: 'SEN' },
    { home: 'FRA', away: 'NOR' },
    { home: 'SEN', away: 'IRQ' },
  ],
  J: [
    // ARG vs AUT played June 22: ARG 2–0 AUT
    { home: 'ALG', away: 'JOR' },
    { home: 'ARG', away: 'JOR' },
    { home: 'ALG', away: 'AUT' },
  ],
  K: [
    { home: 'COL', away: 'DRC' },
    { home: 'POR', away: 'UZB' },
    { home: 'COL', away: 'POR' },
    { home: 'DRC', away: 'UZB' },
  ],
  L: [
    { home: 'ENG', away: 'GHA' },
    { home: 'PAN', away: 'CRO' },
    { home: 'PAN', away: 'ENG' },
    { home: 'CRO', away: 'GHA' },
  ],
};

export const GROUP_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
