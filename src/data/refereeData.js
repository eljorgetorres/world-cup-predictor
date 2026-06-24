// FIFA referee profiles: historical stats from international duty
// yellowsPerGame, redsPerGame, penaltiesPerGame from last 3 years of international matches
// confederation: ref's home association
// style: 'lenient' | 'average' | 'strict'

export const REFEREES = {
  'Szymon Marciniak': {
    nationality: 'Poland', confederation: 'UEFA',
    yellowsPerGame: 2.6, redsPerGame: 0.04, penaltiesPerGame: 0.16,
    style: 'lenient', bigGameXP: 'elite',  // 2022 WC Final
  },
  'Facundo Tello': {
    nationality: 'Argentina', confederation: 'CONMEBOL',
    yellowsPerGame: 4.1, redsPerGame: 0.12, penaltiesPerGame: 0.24,
    style: 'strict', bigGameXP: 'high',
  },
  'Danny Makkelie': {
    nationality: 'Netherlands', confederation: 'UEFA',
    yellowsPerGame: 3.0, redsPerGame: 0.06, penaltiesPerGame: 0.20,
    style: 'average', bigGameXP: 'elite',  // 2022 WC
  },
  'Clement Turpin': {
    nationality: 'France', confederation: 'UEFA',
    yellowsPerGame: 2.8, redsPerGame: 0.05, penaltiesPerGame: 0.18,
    style: 'lenient', bigGameXP: 'elite',  // UCL Final, 2022 WC
  },
  'Antonio Mateu Lahoz': {
    nationality: 'Spain', confederation: 'UEFA',
    yellowsPerGame: 4.8, redsPerGame: 0.15, penaltiesPerGame: 0.22,
    style: 'strict', bigGameXP: 'elite',  // 2022 WC (ARG-NED, 17 yellows)
  },
  'Istvan Kovacs': {
    nationality: 'Romania', confederation: 'UEFA',
    yellowsPerGame: 3.4, redsPerGame: 0.08, penaltiesPerGame: 0.19,
    style: 'average', bigGameXP: 'high',
  },
  'Cesar Ramos': {
    nationality: 'Mexico', confederation: 'CONCACAF',
    yellowsPerGame: 3.6, redsPerGame: 0.10, penaltiesPerGame: 0.21,
    style: 'average', bigGameXP: 'high',  // 2022 WC
  },
  'Mustapha Ghorbal': {
    nationality: 'Algeria', confederation: 'CAF',
    yellowsPerGame: 3.2, redsPerGame: 0.09, penaltiesPerGame: 0.17,
    style: 'average', bigGameXP: 'high',
  },
  'Wilton Sampaio': {
    nationality: 'Brazil', confederation: 'CONMEBOL',
    yellowsPerGame: 3.8, redsPerGame: 0.11, penaltiesPerGame: 0.23,
    style: 'strict', bigGameXP: 'elite',  // 2022 WC
  },
  'Michael Oliver': {
    nationality: 'England', confederation: 'UEFA',
    yellowsPerGame: 3.1, redsPerGame: 0.07, penaltiesPerGame: 0.28,
    style: 'average', bigGameXP: 'elite',  // UCL knockouts
  },
  'Slavko Vincic': {
    nationality: 'Slovenia', confederation: 'UEFA',
    yellowsPerGame: 3.3, redsPerGame: 0.06, penaltiesPerGame: 0.20,
    style: 'average', bigGameXP: 'high',  // 2022 WC
  },
  'Janny Sikazwe': {
    nationality: 'Zambia', confederation: 'CAF',
    yellowsPerGame: 3.9, redsPerGame: 0.14, penaltiesPerGame: 0.19,
    style: 'strict', bigGameXP: 'high',
  },
  'Felix Zwayer': {
    nationality: 'Germany', confederation: 'UEFA',
    yellowsPerGame: 3.5, redsPerGame: 0.07, penaltiesPerGame: 0.22,
    style: 'average', bigGameXP: 'high',  // 2022 WC
  },
};

// Match referee assignments — update with official FIFA assignments as announced
// Key format: 'HOME-AWAY'
export const MATCH_REFEREES = {
  // Group I MD2
  'FRA-IRQ': null,
  'NOR-SEN': null,
  // Group J MD2
  'ALG-JOR': null,
  // Group K MD2
  'POR-UZB': null,
  'COL-DRC': null,
  // Group L MD2
  'ENG-GHA': null,
  'PAN-CRO': null,
  // MD3 — to be filled in as assigned
  'CAN-SUI': null,
  'BIH-QAT': null,
  'BRA-SCO': null,
  'MAR-HTI': null,
  'MEX-CZE': null,
  'RSA-KOR': null,
  'GER-ECU': null,
  'CIV-CUW': null,
  'NED-TUN': null,
  'SWE-JPN': null,
  'USA-TUR': null,
  'AUS-PAR': null,
  'FRA-NOR': null,
  'SEN-IRQ': null,
  'ESP-URU': null,
  'KSA-CPV': null,
  'EGY-IRN': null,
  'BEL-NZL': null,
  'PAN-ENG': null,
  'CRO-GHA': null,
  'COL-POR': null,
  'DRC-UZB': null,
  'ARG-JOR': null,
  'ALG-AUT': null,
};
