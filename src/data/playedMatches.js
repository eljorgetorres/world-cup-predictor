// Completed group stage matches with venues — used by chaos.js for travel + altitude signals.
// Update as matches finish. Venue string must match VENUES keys in venueData.js (before " · ").
// Dates are UTC kickoff times.

export const PLAYED_MATCHES = [
  // ═══════════════════════════════════════════════════════════════════════════
  // MATCHDAY 1  (approx June 11–17, 2026)
  // ═══════════════════════════════════════════════════════════════════════════

  // Group A
  { home: 'MEX', away: 'RSA', group: 'A', date: '2026-06-11T23:00:00Z', venue: 'Estadio Azteca · Mexico City, MEX' },
  { home: 'CZE', away: 'KOR', group: 'A', date: '2026-06-12T02:00:00Z', venue: 'AT&T Stadium · Arlington, TX' },

  // Group B
  { home: 'CAN', away: 'BIH', group: 'B', date: '2026-06-12T19:00:00Z', venue: 'BMO Field · Toronto, CAN' },
  { home: 'QAT', away: 'SUI', group: 'B', date: '2026-06-12T22:00:00Z', venue: 'Arrowhead Stadium · Kansas City, MO' },

  // Group C
  { home: 'BRA', away: 'MAR', group: 'C', date: '2026-06-13T00:00:00Z', venue: 'MetLife Stadium · East Rutherford, NJ' },
  { home: 'HTI', away: 'SCO', group: 'C', date: '2026-06-13T03:00:00Z', venue: 'Levi\'s Stadium · Santa Clara, CA' },

  // Group D
  { home: 'USA', away: 'PAR', group: 'D', date: '2026-06-13T23:00:00Z', venue: 'MetLife Stadium · East Rutherford, NJ' },
  { home: 'TUR', away: 'AUS', group: 'D', date: '2026-06-14T02:00:00Z', venue: 'SoFi Stadium · Los Angeles, CA' },

  // Group E
  { home: 'GER', away: 'CIV', group: 'E', date: '2026-06-14T20:00:00Z', venue: 'MetLife Stadium · East Rutherford, NJ' },
  { home: 'ECU', away: 'CUW', group: 'E', date: '2026-06-14T23:00:00Z', venue: 'NRG Stadium · Houston, TX' },

  // Group F
  { home: 'NED', away: 'JPN', group: 'F', date: '2026-06-15T20:00:00Z', venue: 'SoFi Stadium · Los Angeles, CA' },
  { home: 'TUN', away: 'SWE', group: 'F', date: '2026-06-15T23:00:00Z', venue: 'Rose Bowl · Pasadena, CA' },

  // Group G
  { home: 'BEL', away: 'EGY', group: 'G', date: '2026-06-16T00:00:00Z', venue: 'MetLife Stadium · East Rutherford, NJ' },
  { home: 'IRN', away: 'NZL', group: 'G', date: '2026-06-16T03:00:00Z', venue: 'Levi\'s Stadium · Santa Clara, CA' },

  // Group H
  { home: 'ESP', away: 'CPV', group: 'H', date: '2026-06-16T23:00:00Z', venue: 'SoFi Stadium · Los Angeles, CA' },
  { home: 'URU', away: 'KSA', group: 'H', date: '2026-06-17T02:00:00Z', venue: 'Hard Rock Stadium · Miami, FL' },

  // Group I
  { home: 'FRA', away: 'SEN', group: 'I', date: '2026-06-17T19:00:00Z', venue: 'Lincoln Financial Field · Philadelphia, PA' },
  { home: 'IRQ', away: 'NOR', group: 'I', date: '2026-06-17T22:00:00Z', venue: 'BC Place · Vancouver, CAN' },

  // Group J
  { home: 'ARG', away: 'ALG', group: 'J', date: '2026-06-17T23:00:00Z', venue: 'MetLife Stadium · East Rutherford, NJ' },
  { home: 'AUT', away: 'JOR', group: 'J', date: '2026-06-18T02:00:00Z', venue: 'AT&T Stadium · Arlington, TX' },

  // Group K
  { home: 'COL', away: 'UZB', group: 'K', date: '2026-06-18T20:00:00Z', venue: 'Lincoln Financial Field · Philadelphia, PA' },
  { home: 'POR', away: 'DRC', group: 'K', date: '2026-06-18T23:00:00Z', venue: 'Hard Rock Stadium · Miami, FL' },

  // Group L
  { home: 'ENG', away: 'PAN', group: 'L', date: '2026-06-19T19:00:00Z', venue: 'MetLife Stadium · East Rutherford, NJ' },
  { home: 'CRO', away: 'GHA', group: 'L', date: '2026-06-19T22:00:00Z', venue: 'Lumen Field · Seattle, WA' },

  // ═══════════════════════════════════════════════════════════════════════════
  // MATCHDAY 2 — already completed as of June 23 (Groups A–H + ARG/AUT)
  // ═══════════════════════════════════════════════════════════════════════════

  // Group A MD2
  { home: 'MEX', away: 'KOR', group: 'A', date: '2026-06-19T23:00:00Z', venue: 'AT&T Stadium · Arlington, TX' },
  { home: 'CZE', away: 'RSA', group: 'A', date: '2026-06-20T02:00:00Z', venue: 'NRG Stadium · Houston, TX' },

  // Group B MD2
  { home: 'CAN', away: 'QAT', group: 'B', date: '2026-06-20T19:00:00Z', venue: 'BC Place · Vancouver, CAN' },
  { home: 'BIH', away: 'SUI', group: 'B', date: '2026-06-20T22:00:00Z', venue: 'Lincoln Financial Field · Philadelphia, PA' },

  // Group C MD2
  { home: 'BRA', away: 'HTI', group: 'C', date: '2026-06-21T00:00:00Z', venue: 'Mercedes-Benz Stadium · Atlanta, GA' },
  { home: 'MAR', away: 'SCO', group: 'C', date: '2026-06-21T03:00:00Z', venue: 'Rose Bowl · Pasadena, CA' },

  // Group D MD2
  { home: 'USA', away: 'AUS', group: 'D', date: '2026-06-21T20:00:00Z', venue: 'MetLife Stadium · East Rutherford, NJ' },
  { home: 'TUR', away: 'PAR', group: 'D', date: '2026-06-21T23:00:00Z', venue: 'Hard Rock Stadium · Miami, FL' },

  // Group E MD2
  { home: 'GER', away: 'CUW', group: 'E', date: '2026-06-22T00:00:00Z', venue: 'Gillette Stadium · Foxborough, MA' },
  { home: 'ECU', away: 'CIV', group: 'E', date: '2026-06-22T03:00:00Z', venue: 'Arrowhead Stadium · Kansas City, MO' },

  // Group F MD2
  { home: 'NED', away: 'SWE', group: 'F', date: '2026-06-22T19:00:00Z', venue: 'Lumen Field · Seattle, WA' },
  { home: 'TUN', away: 'JPN', group: 'F', date: '2026-06-22T22:00:00Z', venue: 'NRG Stadium · Houston, TX' },

  // Group G MD2
  { home: 'BEL', away: 'IRN', group: 'G', date: '2026-06-22T19:00:00Z', venue: 'Arrowhead Stadium · Kansas City, MO' },
  { home: 'EGY', away: 'NZL', group: 'G', date: '2026-06-22T22:00:00Z', venue: 'Allegiant Stadium · Las Vegas, NV' },

  // Group H MD2
  { home: 'ESP', away: 'KSA', group: 'H', date: '2026-06-22T23:00:00Z', venue: 'Mercedes-Benz Stadium · Atlanta, GA' },
  { home: 'URU', away: 'CPV', group: 'H', date: '2026-06-23T02:00:00Z', venue: 'Levi\'s Stadium · Santa Clara, CA' },

  // Group J MD2 — ARG vs AUT only (completed Jun 22, 2–0)
  { home: 'ARG', away: 'AUT', group: 'J', date: '2026-06-22T17:00:00Z', venue: 'Allegiant Stadium · Las Vegas, NV' },
];
