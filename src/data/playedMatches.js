// Completed group stage matches with venues — used by chaos.js for travel + altitude signals
// and by the standings/elimination logic for head-to-head tiebreakers.
// `hg`/`ag` are the final home/away goals (needed for the WC2026 head-to-head tiebreaker).
// Update as matches finish. Venue string must match VENUES keys in venueData.js (before " · ").
// Dates are UTC kickoff times.

export const PLAYED_MATCHES = [
  // ═══════════════════════════════════════════════════════════════════════════
  // MATCHDAY 1  (approx June 11–17, 2026)
  // ═══════════════════════════════════════════════════════════════════════════

  // Group A
  { home: 'MEX', away: 'RSA', hg: 2, ag: 0, group: 'A', date: '2026-06-11T23:00:00Z', venue: 'Estadio Azteca · Mexico City, MEX' },
  { home: 'CZE', away: 'KOR', hg: 1, ag: 2, group: 'A', date: '2026-06-12T02:00:00Z', venue: 'AT&T Stadium · Arlington, TX' },

  // Group B
  { home: 'CAN', away: 'BIH', hg: 1, ag: 1, group: 'B', date: '2026-06-12T19:00:00Z', venue: 'BMO Field · Toronto, CAN' },
  { home: 'QAT', away: 'SUI', hg: 1, ag: 1, group: 'B', date: '2026-06-12T22:00:00Z', venue: 'Arrowhead Stadium · Kansas City, MO' },

  // Group C
  { home: 'BRA', away: 'MAR', hg: 1, ag: 1, group: 'C', date: '2026-06-13T00:00:00Z', venue: 'MetLife Stadium · East Rutherford, NJ' },
  { home: 'HTI', away: 'SCO', hg: 0, ag: 1, group: 'C', date: '2026-06-13T03:00:00Z', venue: 'Levi\'s Stadium · Santa Clara, CA' },

  // Group D
  { home: 'USA', away: 'PAR', hg: 4, ag: 1, group: 'D', date: '2026-06-13T23:00:00Z', venue: 'MetLife Stadium · East Rutherford, NJ' },
  { home: 'TUR', away: 'AUS', hg: 0, ag: 2, group: 'D', date: '2026-06-14T02:00:00Z', venue: 'SoFi Stadium · Los Angeles, CA' },

  // Group E
  { home: 'GER', away: 'CIV', hg: 2, ag: 1, group: 'E', date: '2026-06-14T20:00:00Z', venue: 'MetLife Stadium · East Rutherford, NJ' },
  { home: 'ECU', away: 'CUW', hg: 0, ag: 0, group: 'E', date: '2026-06-14T23:00:00Z', venue: 'NRG Stadium · Houston, TX' },

  // Group F
  { home: 'NED', away: 'JPN', hg: 2, ag: 2, group: 'F', date: '2026-06-15T20:00:00Z', venue: 'SoFi Stadium · Los Angeles, CA' },
  { home: 'TUN', away: 'SWE', hg: 1, ag: 5, group: 'F', date: '2026-06-15T23:00:00Z', venue: 'Rose Bowl · Pasadena, CA' },

  // Group G
  { home: 'BEL', away: 'EGY', hg: 1, ag: 1, group: 'G', date: '2026-06-16T00:00:00Z', venue: 'MetLife Stadium · East Rutherford, NJ' },
  { home: 'IRN', away: 'NZL', hg: 2, ag: 2, group: 'G', date: '2026-06-16T03:00:00Z', venue: 'Levi\'s Stadium · Santa Clara, CA' },

  // Group H
  { home: 'ESP', away: 'CPV', hg: 0, ag: 0, group: 'H', date: '2026-06-16T23:00:00Z', venue: 'SoFi Stadium · Los Angeles, CA' },
  { home: 'URU', away: 'KSA', hg: 1, ag: 1, group: 'H', date: '2026-06-17T02:00:00Z', venue: 'Hard Rock Stadium · Miami, FL' },

  // Group I
  { home: 'FRA', away: 'SEN', hg: 3, ag: 1, group: 'I', date: '2026-06-17T19:00:00Z', venue: 'Lincoln Financial Field · Philadelphia, PA' },
  { home: 'IRQ', away: 'NOR', hg: 1, ag: 4, group: 'I', date: '2026-06-17T22:00:00Z', venue: 'BC Place · Vancouver, CAN' },

  // Group J
  { home: 'ARG', away: 'ALG', hg: 3, ag: 0, group: 'J', date: '2026-06-17T23:00:00Z', venue: 'MetLife Stadium · East Rutherford, NJ' },
  { home: 'AUT', away: 'JOR', hg: 3, ag: 1, group: 'J', date: '2026-06-18T02:00:00Z', venue: 'AT&T Stadium · Arlington, TX' },

  // Group K
  { home: 'COL', away: 'UZB', hg: 3, ag: 1, group: 'K', date: '2026-06-18T20:00:00Z', venue: 'Lincoln Financial Field · Philadelphia, PA' },
  { home: 'POR', away: 'DRC', hg: 1, ag: 1, group: 'K', date: '2026-06-18T23:00:00Z', venue: 'Hard Rock Stadium · Miami, FL' },

  // Group L  (MD1: ENG 4-2 CRO, GHA 1-0 PAN)
  { home: 'ENG', away: 'CRO', hg: 4, ag: 2, group: 'L', date: '2026-06-17T19:00:00Z', venue: 'MetLife Stadium · East Rutherford, NJ' },
  { home: 'GHA', away: 'PAN', hg: 1, ag: 0, group: 'L', date: '2026-06-17T22:00:00Z', venue: 'Lumen Field · Seattle, WA' },

  // ═══════════════════════════════════════════════════════════════════════════
  // MATCHDAY 2 — already completed as of June 23 (Groups A–H + ARG/AUT)
  // ═══════════════════════════════════════════════════════════════════════════

  // Group A MD2
  { home: 'MEX', away: 'KOR', hg: 1, ag: 0, group: 'A', date: '2026-06-19T23:00:00Z', venue: 'AT&T Stadium · Arlington, TX' },
  { home: 'CZE', away: 'RSA', hg: 1, ag: 1, group: 'A', date: '2026-06-20T02:00:00Z', venue: 'NRG Stadium · Houston, TX' },

  // Group B MD2
  { home: 'CAN', away: 'QAT', hg: 6, ag: 0, group: 'B', date: '2026-06-20T19:00:00Z', venue: 'BC Place · Vancouver, CAN' },
  { home: 'BIH', away: 'SUI', hg: 1, ag: 4, group: 'B', date: '2026-06-20T22:00:00Z', venue: 'Lincoln Financial Field · Philadelphia, PA' },

  // Group C MD2
  { home: 'BRA', away: 'HTI', hg: 3, ag: 0, group: 'C', date: '2026-06-21T00:00:00Z', venue: 'Mercedes-Benz Stadium · Atlanta, GA' },
  { home: 'MAR', away: 'SCO', hg: 1, ag: 0, group: 'C', date: '2026-06-21T03:00:00Z', venue: 'Rose Bowl · Pasadena, CA' },

  // Group D MD2
  { home: 'USA', away: 'AUS', hg: 2, ag: 0, group: 'D', date: '2026-06-21T20:00:00Z', venue: 'MetLife Stadium · East Rutherford, NJ' },
  { home: 'TUR', away: 'PAR', hg: 0, ag: 1, group: 'D', date: '2026-06-21T23:00:00Z', venue: 'Hard Rock Stadium · Miami, FL' },

  // Group E MD2
  { home: 'GER', away: 'CUW', hg: 7, ag: 1, group: 'E', date: '2026-06-22T00:00:00Z', venue: 'Gillette Stadium · Foxborough, MA' },
  { home: 'ECU', away: 'CIV', hg: 0, ag: 1, group: 'E', date: '2026-06-22T03:00:00Z', venue: 'Arrowhead Stadium · Kansas City, MO' },

  // Group F MD2
  { home: 'NED', away: 'SWE', hg: 5, ag: 1, group: 'F', date: '2026-06-22T19:00:00Z', venue: 'Lumen Field · Seattle, WA' },
  { home: 'TUN', away: 'JPN', hg: 0, ag: 4, group: 'F', date: '2026-06-22T22:00:00Z', venue: 'NRG Stadium · Houston, TX' },

  // Group G MD2
  { home: 'BEL', away: 'IRN', hg: 0, ag: 0, group: 'G', date: '2026-06-22T19:00:00Z', venue: 'Arrowhead Stadium · Kansas City, MO' },
  { home: 'EGY', away: 'NZL', hg: 3, ag: 1, group: 'G', date: '2026-06-22T22:00:00Z', venue: 'Allegiant Stadium · Las Vegas, NV' },

  // Group H MD2
  { home: 'ESP', away: 'KSA', hg: 4, ag: 0, group: 'H', date: '2026-06-22T23:00:00Z', venue: 'Mercedes-Benz Stadium · Atlanta, GA' },
  { home: 'URU', away: 'CPV', hg: 2, ag: 2, group: 'H', date: '2026-06-23T02:00:00Z', venue: 'Levi\'s Stadium · Santa Clara, CA' },

  // Group J MD2 — ARG vs AUT only (completed Jun 22, 2–0)
  { home: 'ARG', away: 'AUT', hg: 2, ag: 0, group: 'J', date: '2026-06-22T17:00:00Z', venue: 'Allegiant Stadium · Las Vegas, NV' },

  // ═══════════════════════════════════════════════════════════════════════════
  // MATCHDAY 2 — Groups I, J, K, L (completed Jun 22–24)
  // ═══════════════════════════════════════════════════════════════════════════

  // Group I MD2
  { home: 'FRA', away: 'IRQ', hg: 3, ag: 0, group: 'I', date: '2026-06-22T21:00:00Z', venue: 'Lincoln Financial Field · Philadelphia, PA' },
  { home: 'NOR', away: 'SEN', hg: 3, ag: 2, group: 'I', date: '2026-06-23T00:00:00Z', venue: 'MetLife Stadium · East Rutherford, NJ' },

  // Group J MD2
  { home: 'ALG', away: 'JOR', hg: 2, ag: 1, group: 'J', date: '2026-06-23T03:00:00Z', venue: "Levi's Stadium · Santa Clara, CA" },

  // Group K MD2
  { home: 'POR', away: 'UZB', hg: 5, ag: 0, group: 'K', date: '2026-06-23T17:00:00Z', venue: 'NRG Stadium · Houston, TX' },
  { home: 'COL', away: 'DRC', hg: 1, ag: 0, group: 'K', date: '2026-06-24T02:00:00Z', venue: 'Estadio Akron · Guadalajara, MEX' },

  // Group L MD2  (ENG 0-0 GHA, CRO 1-0 PAN → PAN eliminated)
  { home: 'ENG', away: 'GHA', hg: 0, ag: 0, group: 'L', date: '2026-06-23T20:00:00Z', venue: 'Gillette Stadium · Foxborough, MA' },
  { home: 'PAN', away: 'CRO', hg: 0, ag: 1, group: 'L', date: '2026-06-23T23:00:00Z', venue: 'BMO Field · Toronto, CAN' },
];
