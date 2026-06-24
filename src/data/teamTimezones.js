// UTC offset (hours) for each team's home country in June (DST applied where relevant)
// Used to compute body-clock disruption when a kickoff falls in a team's biological night
export const TEAM_UTC_OFFSET = {
  // South America (no DST in June — Southern Hemisphere winter)
  ARG: -3, BRA: -3, COL: -5, URU: -3, ECU: -5, PAR: -4,

  // Western Europe (CEST/BST in June)
  ESP: 2, FRA: 2, GER: 2, NED: 2, BEL: 2, SUI: 2,
  CRO: 2, AUT: 2, BIH: 2, NOR: 2, SWE: 2, CZE: 2,
  POR: 1, SCO: 1, ENG: 1,

  // Eastern Europe / Middle East
  TUR: 3, EGY: 3, JOR: 3, IRQ: 3, KSA: 3, QAT: 3, IRN: 4,

  // Central Asia
  UZB: 5,

  // East Asia / Pacific
  JPN: 9, KOR: 9,
  AUS: 10,   // AEST (June = Aus winter, no DST)
  NZL: 12,   // NZST (June = NZ winter, no DST)

  // Africa
  SEN: 0, GHA: 0, CIV: 0,
  MAR: 1, ALG: 1, TUN: 1, DRC: 1,
  RSA: 2, CPV: -1,

  // CONCACAF
  USA: -4,   // EDT (most USMNT player base: East Coast)
  MEX: -5,   // CDT (Mexico City)
  CAN: -4,   // EDT (Toronto)
  PAN: -5,   // EST (no DST)
  CUW: -4,   // AST (no DST)
  HTI: -4,   // EDT
};
