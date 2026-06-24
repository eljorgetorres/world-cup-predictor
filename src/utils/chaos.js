import { TEAMS } from '../data/teams.js';
import { GROUP_STANDINGS } from '../data/groups.js';
import { UPCOMING_MATCHES } from '../data/upcomingMatches.js';
import { PLAYED_MATCHES } from '../data/playedMatches.js';
import { getVenue, VENUES } from '../data/venueData.js';
import { WC_H2H, HYPE_SCORE, CONFEDERATION } from '../data/chaosSignals.js';
import { TEAM_UTC_OFFSET } from '../data/teamTimezones.js';
import { INJURY_FLAGS } from '../data/injuryFlags.js';
import { REFEREES, MATCH_REFEREES } from '../data/refereeData.js';
import { SQUAD_AVG_AGE } from '../data/squadAge.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const ALL_MATCHES = [...PLAYED_MATCHES, ...UPCOMING_MATCHES];

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Home local hour (0–23) at a given UTC timestamp
function homeHourAtKickoff(utcMs, teamId) {
  const offset = TEAM_UTC_OFFSET[teamId] ?? 0;
  return ((new Date(utcMs).getUTCHours() + offset) % 24 + 24) % 24;
}

function getStanding(teamId) {
  for (const group of Object.values(GROUP_STANDINGS)) {
    const row = group.find(r => r.teamId === teamId);
    if (row) return row;
  }
  return null;
}

function momentumTier(row) {
  if (!row || row.mp === 0) return 'unknown';
  const ppg = row.pts / row.mp;
  if (ppg >= 2.5) return 'dominant';
  if (ppg >= 1.5) return 'good';
  if (ppg >= 0.8) return 'mixed';
  if (ppg > 0)    return 'poor';
  return 'winless';
}

function getH2H(id1, id2) {
  const direct = WC_H2H[`${id1}-${id2}`];
  if (direct) return direct;
  const reverse = WC_H2H[`${id2}-${id1}`];
  if (reverse) return { w1: reverse.w2, d: reverse.d, w2: reverse.w1, note: reverse.note };
  return null;
}

// Crowd lean for a team at a given venue country (0 = no lean, 1 = maximum home-like crowd)
function crowdLean(teamId, venueCountry) {
  if (teamId === 'USA' && venueCountry === 'USA') return 0.90;
  if (teamId === 'MEX' && venueCountry === 'MEX') return 0.92;
  if (teamId === 'CAN' && venueCountry === 'CAN') return 0.88;
  const conf = CONFEDERATION[teamId];
  if (conf === 'CONMEBOL' && (venueCountry === 'USA' || venueCountry === 'CAN')) return 0.38;
  if (conf === 'CONCACAF' && venueCountry === 'MEX') return 0.30;
  if (conf === 'CONCACAF' && venueCountry === 'USA') return 0.25;
  if (conf === 'CONCACAF' && venueCountry === 'CAN') return 0.20;
  if (conf === 'CAF' && (venueCountry === 'USA' || venueCountry === 'CAN')) return 0.12;
  return 0;
}

// ── Main computation ──────────────────────────────────────────────────────────

export function computeChaos(match) {
  const homeTeam = TEAMS[match.home];
  const awayTeam = TEAMS[match.away];
  const venue    = getVenue(match.venue);

  const homeElo = homeTeam?.elo ?? 1600;
  const awayElo = awayTeam?.elo ?? 1600;
  const eloDiff = Math.abs(homeElo - awayElo);

  const favIsHome = homeElo >= awayElo;
  const favId  = favIsHome ? match.home : match.away;
  const dogId  = favIsHome ? match.away : match.home;
  const favTeam = TEAMS[favId];
  const dogTeam = TEAMS[dogId];

  const favRow = getStanding(favId);
  const dogRow = getStanding(dogId);
  const favTier = momentumTier(favRow);
  const dogTier = momentumTier(dogRow);

  let chaosScore   = 0;
  let deltaForDog  = 0;   // positive = helps underdog win probability
  const drivers    = [];

  // ── 1. Match closeness (intrinsic variance) ──
  if (eloDiff < 80) {
    chaosScore += 20;
    deltaForDog += 4;
    drivers.push({ icon: '⚖️', text: `ELO gap just ${eloDiff}pts — genuinely even match, coin-flip territory`, delta: 4 });
  } else if (eloDiff < 160) {
    chaosScore += 12;
    deltaForDog += 2;
    drivers.push({ icon: '⚖️', text: `Tight ELO gap (${eloDiff}pts) — model barely separates these teams`, delta: 2 });
  } else if (eloDiff < 250) {
    chaosScore += 6;
  }

  // ── 2. Large ELO gap dampens chaos ──
  if (eloDiff >= 300) {
    chaosScore -= 14;
    deltaForDog -= 6;
    drivers.push({ icon: '📊', text: `${eloDiff}pt ELO gap — model has high conviction, variance is limited`, delta: -6 });
  } else if (eloDiff >= 220) {
    chaosScore -= 7;
    deltaForDog -= 3;
  }

  // ── 3. High-stakes match (both teams close on points) ──
  const favPts = favRow?.pts ?? 0;
  const dogPts = dogRow?.pts ?? 0;
  const favMp  = favRow?.mp  ?? 0;
  if (favMp >= 1 && Math.abs(favPts - dogPts) <= 1) {
    chaosScore += 14;
    deltaForDog += 4;
    drivers.push({ icon: '🎯', text: `Tight on points (${favPts} vs ${dogPts}) — must-win pressure compresses gap`, delta: 4 });
  } else if (favPts === 0 && dogPts === 0 && favMp >= 1) {
    chaosScore += 16;
    deltaForDog += 5;
    drivers.push({ icon: '🎯', text: `Both teams winless — elimination-style desperation from the underdog`, delta: 5 });
  }

  // ── 4. Temperature — outdoor venues only ──
  if (venue && !venue.indoors) {
    if (venue.tempC >= 36) {
      chaosScore += 16;
      deltaForDog += 5;
      drivers.push({ icon: '🌡️', text: `${venue.tempC}°C at ${venue.city} — extreme heat neutralises superior technique`, delta: 5 });
    } else if (venue.tempC >= 31) {
      chaosScore += 9;
      deltaForDog += 3;
      drivers.push({ icon: '🌡️', text: `${venue.tempC}°C kickoff — stamina premium, technical edges erode late`, delta: 3 });
    }
  }

  // ── 5. Humidity — outdoor only ──
  if (venue && !venue.indoors && venue.humidity >= 76) {
    chaosScore += 8;
    deltaForDog += 2;
    drivers.push({ icon: '💧', text: `${venue.humidity}% humidity — high-press systems hit a wall after 60 mins`, delta: 2 });
  }

  // ── 6. Rain probability — outdoor only ──
  if (venue && !venue.indoors) {
    if (venue.rainProb >= 0.50) {
      chaosScore += 14;
      deltaForDog += 6;
      drivers.push({ icon: '🌧️', text: `${Math.round(venue.rainProb * 100)}% rain chance — wet pitch compresses the quality gap`, delta: 6 });
    } else if (venue.rainProb >= 0.35) {
      chaosScore += 7;
      deltaForDog += 3;
      drivers.push({ icon: '🌧️', text: `${Math.round(venue.rainProb * 100)}% rain chance — slick conditions add variance`, delta: 3 });
    }
  }

  // ── 7. Altitude ──
  if (venue) {
    if (venue.altitude >= 2000) {
      chaosScore += 18;
      deltaForDog += 6;
      drivers.push({ icon: '⛰️', text: `${(venue.altitude / 1000).toFixed(1)}km altitude — aerobic capacity drops ~15% for sea-level teams`, delta: 6 });
    } else if (venue.altitude >= 1500) {
      chaosScore += 10;
      deltaForDog += 4;
      drivers.push({ icon: '⛰️', text: `${venue.altitude}m altitude at ${venue.city} — high press systems fatigue faster here`, delta: 4 });
    }
  }

  // ── 8. Rest differential ──
  const matchMs = new Date(match.date).getTime();
  const prevMatch = (teamId) =>
    ALL_MATCHES
      .filter(m => (m.home === teamId || m.away === teamId) && new Date(m.date).getTime() < matchMs)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0] ?? null;

  const lastMs = (teamId) => {
    const m = prevMatch(teamId);
    return m ? new Date(m.date).getTime() : null;
  };

  const favLast = lastMs(favId);
  const dogLast = lastMs(dogId);

  if (favLast && dogLast) {
    const favRest = (matchMs - favLast) / 86400000;
    const dogRest = (matchMs - dogLast) / 86400000;
    const diff = favRest - dogRest; // positive = fav had MORE rest (underdog disadvantaged)

    if (diff < -1.2) {
      // Favorite had noticeably less rest → helps underdog
      chaosScore += 12;
      deltaForDog += 5;
      drivers.push({ icon: '😴', text: `${favTeam?.name} played ${Math.abs(diff).toFixed(1)} fewer days ago — fatigue edge for ${dogTeam?.name}`, delta: 5 });
    } else if (diff > 1.2) {
      // Underdog had less rest → hurts underdog
      chaosScore += 6;
      deltaForDog -= 3;
      drivers.push({ icon: '😴', text: `${dogTeam?.name} with less recovery time — physical peak harder to hit`, delta: -3 });
    }
  }

  // ── 9. Crowd lean ──
  const venueCountry = venue?.country ?? 'USA';
  const favLean = crowdLean(favId, venueCountry);
  const dogLean = crowdLean(dogId, venueCountry);
  const leanDiff = dogLean - favLean; // positive = crowd favours underdog

  if (leanDiff >= 0.20) {
    chaosScore += 10;
    deltaForDog += 4;
    const pct = Math.round(dogLean * 100);
    drivers.push({ icon: '🏟️', text: `~${pct}% crowd lean for ${dogTeam?.name} — ref decisions + atmosphere skew the game`, delta: 4 });
  } else if (leanDiff <= -0.20) {
    chaosScore += 6;
    deltaForDog -= 3;
    const pct = Math.round(favLean * 100);
    drivers.push({ icon: '🏟️', text: `~${pct}% crowd behind ${favTeam?.name} — home-like atmosphere limits upsets`, delta: -3 });
  }

  // ── 10. World Cup H2H ──
  const h2h = getH2H(favId, dogId);
  if (h2h) {
    const { w1: favW, d, w2: dogW } = h2h;
    if (dogW >= favW && (dogW + d) >= 2) {
      chaosScore += 8;
      deltaForDog += 4;
      drivers.push({ icon: '📜', text: `${dogTeam?.name} holds WC H2H (${dogW}W-${d}D-${favW}L vs ${favTeam?.name}) — history backs the upset`, delta: 4 });
    } else if (favW >= dogW * 2 && favW >= 2) {
      chaosScore += 2;
      deltaForDog -= 4;
      drivers.push({ icon: '📜', text: `${favTeam?.name} dominates WC H2H ${favW}-${d}-${dogW} — history firmly against the upset`, delta: -4 });
    }
  }

  // ── 11. Underdog momentum ──
  if (dogTier === 'dominant') {
    chaosScore += 12;
    deltaForDog += 5;
    drivers.push({ icon: '⚡', text: `${dogTeam?.name} unbeaten in WC 2026 (${dogRow.w}W ${dogRow.d}D) — dangerous streak`, delta: 5 });
  } else if (dogTier === 'good') {
    chaosScore += 7;
    deltaForDog += 3;
    drivers.push({ icon: '📈', text: `${dogTeam?.name} in form — ${dogRow.pts}pts from ${dogRow.mp} games builds confidence`, delta: 3 });
  } else if (dogTier === 'winless' || dogTier === 'poor') {
    chaosScore -= 5;
    deltaForDog -= 3;
    drivers.push({ icon: '📉', text: `${dogTeam?.name} struggling (${dogRow?.pts ?? 0}pts from ${dogRow?.mp ?? 0} games) — upset window narrowing`, delta: -3 });
  }

  // ── 12. Favourite's poor form opens the door ──
  if (favTier === 'winless' || favTier === 'poor') {
    chaosScore += 13;
    deltaForDog += 6;
    drivers.push({ icon: '🔓', text: `${favTeam?.name} underperforming (${favRow?.pts ?? 0}pts) — cracks are showing before this one`, delta: 6 });
  }

  // ── 13. Media hype / overconfidence ──
  const hype = HYPE_SCORE[favId] ?? 3;
  if (hype >= 8) {
    chaosScore += 10;
    deltaForDog += 5;
    drivers.push({ icon: '📰', text: `${favTeam?.name} overwhelming media pick — tournament history punishes heavy favourites`, delta: 5 });
  } else if (hype >= 6) {
    chaosScore += 6;
    deltaForDog += 3;
    drivers.push({ icon: '📰', text: `${favTeam?.name} widely tipped to win this — overconfidence can be a liability`, delta: 3 });
  }

  // ── 14. Travel distance (haversine between consecutive venues) ──
  const getPrevVenue = (teamId) => {
    const prev = prevMatch(teamId);
    if (!prev) return null;
    const name = prev.venue?.split(' · ')[0];
    return name ? VENUES[name] : null;
  };

  const favPrevVenue = getPrevVenue(favId);
  const dogPrevVenue = getPrevVenue(dogId);
  const curVenueObj = venue;

  const favKm = (favPrevVenue && curVenueObj)
    ? haversineKm(favPrevVenue.lat, favPrevVenue.lng, curVenueObj.lat, curVenueObj.lng) : 0;
  const dogKm = (dogPrevVenue && curVenueObj)
    ? haversineKm(dogPrevVenue.lat, dogPrevVenue.lng, curVenueObj.lat, curVenueObj.lng) : 0;

  const travelDiff = favKm - dogKm; // positive = fav traveled more

  if (favKm >= 2500 && travelDiff >= 1200) {
    chaosScore += 12;
    deltaForDog += 5;
    drivers.push({ icon: '✈️', text: `${favTeam?.name} traveled ${Math.round(favKm).toLocaleString()}km vs ${Math.round(dogKm).toLocaleString()}km — cross-continental fatigue hits the favourite harder`, delta: 5 });
  } else if (favKm >= 2500) {
    chaosScore += 7;
    deltaForDog += 3;
    drivers.push({ icon: '✈️', text: `${favTeam?.name} logged ${Math.round(favKm).toLocaleString()}km since last match — long-haul travel saps sharpness`, delta: 3 });
  } else if (dogKm >= 2500 && travelDiff <= -1200) {
    chaosScore += 6;
    deltaForDog -= 4;
    drivers.push({ icon: '✈️', text: `${dogTeam?.name} traveled ${Math.round(dogKm).toLocaleString()}km while ${favTeam?.name} stayed local — legs are heavier for the underdog`, delta: -4 });
  } else if (Math.max(favKm, dogKm) >= 3500) {
    chaosScore += 5;
    drivers.push({ icon: '✈️', text: `Both teams crossed ${Math.round(Math.min(favKm, dogKm)).toLocaleString()}km+ — shared travel fatigue keeps the gap tight`, delta: 0 });
  }

  // ── 15. Altitude change (acclimation disadvantage) ──
  const favAltPrev = favPrevVenue?.altitude ?? curVenueObj?.altitude ?? 0;
  const dogAltPrev = dogPrevVenue?.altitude ?? curVenueObj?.altitude ?? 0;
  const curAlt = curVenueObj?.altitude ?? 0;

  const favAltJump = curAlt - favAltPrev;
  const dogAltJump = curAlt - dogAltPrev;

  if (favAltJump >= 1500 && favAltJump > dogAltJump + 600) {
    chaosScore += 10;
    deltaForDog += 4;
    drivers.push({ icon: '🏔️', text: `${favTeam?.name} jumps +${Math.round(favAltJump)}m in altitude since last match — acclimation gap narrows the quality edge`, delta: 4 });
  } else if (dogAltJump >= 1500 && dogAltJump > favAltJump + 600) {
    chaosScore += 6;
    deltaForDog -= 3;
    drivers.push({ icon: '🏔️', text: `${dogTeam?.name} faces a +${Math.round(dogAltJump)}m altitude jump vs ${favTeam?.name}'s acclimated lungs`, delta: -3 });
  }

  // ── 16. Body clock disruption (kickoff during biological night at home) ──
  const favHomeHour = homeHourAtKickoff(matchMs, favId);
  const dogHomeHour = homeHourAtKickoff(matchMs, dogId);

  const inDeadZone = h => h >= 0 && h < 6;
  const inLateZone = h => h >= 23 || h < 2;

  const favDead = inDeadZone(favHomeHour);
  const dogDead = inDeadZone(dogHomeHour);
  const favLate = inLateZone(favHomeHour);

  if (favDead && !dogDead) {
    chaosScore += 10;
    deltaForDog += 4;
    const h = favHomeHour < 10 ? `0${favHomeHour}:00` : `${favHomeHour}:00`;
    drivers.push({ icon: '🌙', text: `Kickoff hits at ~${h} home time for ${favTeam?.name} — biological night erodes precision and decision-making`, delta: 4 });
  } else if (dogDead && !favDead) {
    chaosScore += 7;
    deltaForDog -= 3;
    const h = dogHomeHour < 10 ? `0${dogHomeHour}:00` : `${dogHomeHour}:00`;
    drivers.push({ icon: '🌙', text: `~${h} home time for ${dogTeam?.name} — circadian disruption is an extra hill to climb for the underdog`, delta: -3 });
  } else if (favDead && dogDead) {
    chaosScore += 6;
    drivers.push({ icon: '🌙', text: `Both teams playing through biological night — shared fatigue keeps the gap tighter than form suggests`, delta: 0 });
  } else if (favLate && !dogDead) {
    chaosScore += 5;
    deltaForDog += 2;
    drivers.push({ icon: '🌙', text: `Late night for ${favTeam?.name}'s home time zone — tiredness creeps into the final 20 mins`, delta: 2 });
  }

  // ── 17. Injury / key player suspension ──
  const favInj = INJURY_FLAGS[favId];
  const dogInj = INJURY_FLAGS[dogId];

  if (favInj?.keyPlayerOut) {
    chaosScore += 14;
    deltaForDog += 7;
    drivers.push({ icon: '🚑', text: `Key ${favTeam?.name} starter unavailable${favInj.note ? ` (${favInj.note})` : ''} — lineup disruption is the most reliable upset signal`, delta: 7 });
  } else if ((favInj?.yellowsAtRisk ?? 0) >= 2) {
    chaosScore += 6;
    deltaForDog += 2;
    drivers.push({ icon: '🟨', text: `${favInj.yellowsAtRisk} ${favTeam?.name} starters one booking from suspension — tactical caution limits aggression`, delta: 2 });
  }

  if (dogInj?.keyPlayerOut) {
    chaosScore += 8;
    deltaForDog -= 5;
    drivers.push({ icon: '🚑', text: `${dogTeam?.name} missing a key player — upset window narrows significantly without their best`, delta: -5 });
  }

  // ── 18. Squad age — peak window vs. aging risk ──
  const favAge = SQUAD_AVG_AGE[favId];
  const dogAge = SQUAD_AVG_AGE[dogId];
  const ageDiff = (favAge ?? 27) - (dogAge ?? 27);

  if ((favAge ?? 0) >= 30.0) {
    chaosScore += 10;
    deltaForDog += 4;
    drivers.push({ icon: '⏳', text: `${favTeam?.name} avg ${favAge?.toFixed(1)}yrs — squads past 30 show −8% win rate vs ELO expectation at late tournaments`, delta: 4 });
  } else if ((favAge ?? 0) >= 29.0) {
    chaosScore += 5;
    deltaForDog += 2;
    drivers.push({ icon: '⏳', text: `${favTeam?.name} at ${favAge?.toFixed(1)}yrs avg — approaching the age fatigue threshold in deep tournament runs`, delta: 2 });
  }

  if ((dogAge ?? 99) <= 23.0) {
    chaosScore += 7;
    drivers.push({ icon: '⚡', text: `${dogTeam?.name} avg just ${dogAge?.toFixed(1)}yrs — young squads run 12% higher upset rates; inconsistent but explosive`, delta: 0 });
  }

  if (ageDiff >= 3.5 && (favAge ?? 0) >= 29.0) {
    chaosScore += 5;
    deltaForDog += 3;
    drivers.push({ icon: '⏳', text: `${Math.abs(ageDiff).toFixed(1)}yr age gap — younger legs vs aging leadership is a classic late-tournament upset recipe`, delta: 3 });
  }

  // ── 19. Referee card tendency ──
  const refName = MATCH_REFEREES[`${match.home}-${match.away}`]
    ?? MATCH_REFEREES[`${match.away}-${match.home}`];
  const ref = refName ? REFEREES[refName] : null;

  if (ref) {
    if (ref.style === 'strict' && ref.yellowsPerGame >= 4.0) {
      chaosScore += 8;
      deltaForDog += 3;
      drivers.push({ icon: '🟥', text: `${refName} averages ${ref.yellowsPerGame} yellows/game — physical referees disrupt technical favourites' rhythm`, delta: 3 });
    } else if (ref.style === 'lenient' && ref.yellowsPerGame <= 2.8) {
      chaosScore -= 4;
      deltaForDog -= 2;
      drivers.push({ icon: '🤝', text: `${refName} runs a clean game (${ref.yellowsPerGame} yellows avg) — fluent football rewards the technically superior side`, delta: -2 });
    }
    if (ref.penaltiesPerGame >= 0.26) {
      chaosScore += 5;
      deltaForDog += 2;
      drivers.push({ icon: '⚽', text: `${refName} awards penalties at ${ref.penaltiesPerGame}/game — spot-kick risk adds a random-outcome layer`, delta: 2 });
    }
  }

  // ── Finalise ──────────────────────────────────────────────────────────────
  const finalScore = Math.min(100, Math.max(0, Math.round(chaosScore)));
  const level = finalScore >= 56 ? 'HIGH' : finalScore >= 28 ? 'MED' : 'LOW';

  // Limit directional adjustment to ±18 percentage points
  const clampedDelta = Math.min(18, Math.max(-18, Math.round(deltaForDog)));

  // Sort drivers by absolute impact descending, cap at 5
  const topDrivers = [...drivers]
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 5);

  return {
    chaosScore: finalScore,
    level,
    drivers: topDrivers,
    deltaForDog:  clampedDelta,
    favId, dogId,
    favTeam, dogTeam,
    venue,
    eloDiff,
  };
}
