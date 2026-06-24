// World Cup H2H records between notable pairs at the World Cup specifically
// format: 'FAV-DOG': { w1 (fav wins), d, w2 (dog wins), note }
export const WC_H2H = {
  'FRA-ENG': { w1: 1, d: 1, w2: 2, note: 'England leads WC H2H 2-1-1' },
  'ARG-BRA': { w1: 1, d: 1, w2: 0, note: 'Argentina leads Brazil at WC' },
  'GER-ESP': { w1: 1, d: 0, w2: 1, note: 'Spain won 2010 SF 1-0' },
  'FRA-BRA': { w1: 2, d: 0, w2: 0, note: 'France 2-0 all-time at WC' },
  'ENG-GER': { w1: 2, d: 0, w2: 2, note: 'Even WC rivalry, drama every time' },
  'NED-ARG': { w1: 0, d: 2, w2: 1, note: 'Argentina edges Netherlands at WC' },
  'FRA-ARG': { w1: 2, d: 0, w2: 1, note: 'France leads but Argentina won 2022 final' },
  'BRA-GER': { w1: 3, d: 0, w2: 2, note: 'Brazil leads but 7-1 in 2014 looms large' },
  'COL-BRA': { w1: 0, d: 0, w2: 1, note: 'Brazil won sole WC meeting (2014)' },
  'URU-ARG': { w1: 1, d: 0, w2: 1, note: 'Split in WC encounters' },
  'BRA-ARG': { w1: 0, d: 1, w2: 1, note: 'Argentina leads in WC encounters' },
  'ENG-GHA': { w1: 0, d: 0, w2: 0, note: 'No WC meeting — blank slate' },
  'CRO-BRA': { w1: 0, d: 0, w2: 2, note: 'Brazil perfect vs Croatia at WC' },
  'MEX-ARG': { w1: 0, d: 0, w2: 3, note: 'Argentina 3-0 all-time vs Mexico at WC' },
  'USA-MEX': { w1: 0, d: 0, w2: 1, note: 'Mexico won the one WC meeting' },
};

// Media/narrative hype score 0–10
// High = team is widely touted as dominant — historically correlates with overconfidence
export const HYPE_SCORE = {
  ARG: 9, FRA: 8, ENG: 8, BRA: 7, ESP: 7, POR: 7,
  MEX: 7, GER: 6, USA: 6, NED: 5, CRO: 4, BEL: 5,
  URU: 4, COL: 4, MAR: 4, JPN: 4, NOR: 4, ALG: 3,
  SUI: 3, ECU: 3, SWE: 3, AUS: 3, KOR: 3, SEN: 3,
  EGY: 3, GHA: 3, CAN: 5, IRN: 2, TUN: 1, SCO: 2,
  DRC: 2, TUR: 2, PAR: 2, CZE: 2, BIH: 1, KSA: 2,
  RSA: 1, CPV: 1, IRQ: 1, QAT: 2, UZB: 1, NZL: 1,
  PAN: 1, CUW: 1, JOR: 1, HTI: 1,
};

// FIFA confederation — used for crowd lean at North American venues
export const CONFEDERATION = {
  ARG: 'CONMEBOL', BRA: 'CONMEBOL', COL: 'CONMEBOL', URU: 'CONMEBOL',
  ECU: 'CONMEBOL', PAR: 'CONMEBOL',
  ESP: 'UEFA', FRA: 'UEFA', GER: 'UEFA', ENG: 'UEFA', POR: 'UEFA',
  NED: 'UEFA', BEL: 'UEFA', CRO: 'UEFA', SUI: 'UEFA', SWE: 'UEFA',
  AUT: 'UEFA', BIH: 'UEFA', SCO: 'UEFA', NOR: 'UEFA', TUR: 'UEFA',
  CZE: 'UEFA', NZL: 'UEFA',
  USA: 'CONCACAF', MEX: 'CONCACAF', CAN: 'CONCACAF', PAN: 'CONCACAF',
  CUW: 'CONCACAF', HTI: 'CONCACAF',
  SEN: 'CAF', GHA: 'CAF', MAR: 'CAF', CIV: 'CAF', EGY: 'CAF',
  ALG: 'CAF', DRC: 'CAF', TUN: 'CAF', RSA: 'CAF', CPV: 'CAF',
  JPN: 'AFC', KOR: 'AFC', AUS: 'AFC', IRN: 'AFC', KSA: 'AFC',
  UZB: 'AFC', JOR: 'AFC', IRQ: 'AFC', QAT: 'AFC',
};
