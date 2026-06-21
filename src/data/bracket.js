// Round of 32 matchup structure for 2026 FIFA World Cup
// slot types: 'winner', 'runner-up', 'best-3rd'
// For 'best-3rd', eligibleGroups lists which groups' 3rd-place teams can fill this slot

export const R32_MATCHES = [
  {
    id: 73,
    slot1: { type: 'runner-up', group: 'A', label: 'Runner-up Group A' },
    slot2: { type: 'runner-up', group: 'B', label: 'Runner-up Group B' },
  },
  {
    id: 74,
    slot1: { type: 'winner', group: 'E', label: 'Winner Group E' },
    slot2: { type: 'best-3rd', eligibleGroups: ['A', 'B', 'C', 'D', 'F'], label: 'Best 3rd A/B/C/D/F' },
  },
  {
    id: 75,
    slot1: { type: 'winner', group: 'F', label: 'Winner Group F' },
    slot2: { type: 'runner-up', group: 'C', label: 'Runner-up Group C' },
  },
  {
    id: 76,
    slot1: { type: 'winner', group: 'C', label: 'Winner Group C' },
    slot2: { type: 'runner-up', group: 'F', label: 'Runner-up Group F' },
  },
  {
    id: 77,
    slot1: { type: 'winner', group: 'I', label: 'Winner Group I' },
    slot2: { type: 'best-3rd', eligibleGroups: ['C', 'D', 'F', 'G', 'H'], label: 'Best 3rd C/D/F/G/H' },
  },
  {
    id: 78,
    slot1: { type: 'runner-up', group: 'E', label: 'Runner-up Group E' },
    slot2: { type: 'runner-up', group: 'I', label: 'Runner-up Group I' },
  },
  {
    id: 79,
    slot1: { type: 'winner', group: 'A', label: 'Winner Group A' },
    slot2: { type: 'best-3rd', eligibleGroups: ['C', 'E', 'F', 'H', 'I'], label: 'Best 3rd C/E/F/H/I' },
  },
  {
    id: 80,
    slot1: { type: 'winner', group: 'L', label: 'Winner Group L' },
    slot2: { type: 'best-3rd', eligibleGroups: ['E', 'H', 'I', 'J', 'K'], label: 'Best 3rd E/H/I/J/K' },
  },
  {
    id: 81,
    slot1: { type: 'winner', group: 'D', label: 'Winner Group D' },
    slot2: { type: 'best-3rd', eligibleGroups: ['B', 'E', 'F', 'I', 'J'], label: 'Best 3rd B/E/F/I/J' },
  },
  {
    id: 82,
    slot1: { type: 'winner', group: 'G', label: 'Winner Group G' },
    slot2: { type: 'best-3rd', eligibleGroups: ['A', 'E', 'H', 'I', 'J'], label: 'Best 3rd A/E/H/I/J' },
  },
  {
    id: 83,
    slot1: { type: 'runner-up', group: 'K', label: 'Runner-up Group K' },
    slot2: { type: 'runner-up', group: 'L', label: 'Runner-up Group L' },
  },
  {
    id: 84,
    slot1: { type: 'winner', group: 'H', label: 'Winner Group H' },
    slot2: { type: 'runner-up', group: 'J', label: 'Runner-up Group J' },
  },
  {
    id: 85,
    slot1: { type: 'winner', group: 'B', label: 'Winner Group B' },
    slot2: { type: 'best-3rd', eligibleGroups: ['E', 'F', 'G', 'I', 'J'], label: 'Best 3rd E/F/G/I/J' },
  },
  {
    id: 86,
    slot1: { type: 'winner', group: 'J', label: 'Winner Group J' },
    slot2: { type: 'runner-up', group: 'H', label: 'Runner-up Group H' },
  },
  {
    id: 87,
    slot1: { type: 'winner', group: 'K', label: 'Winner Group K' },
    slot2: { type: 'best-3rd', eligibleGroups: ['D', 'E', 'I', 'J', 'L'], label: 'Best 3rd D/E/I/J/L' },
  },
  {
    id: 88,
    slot1: { type: 'runner-up', group: 'D', label: 'Runner-up Group D' },
    slot2: { type: 'runner-up', group: 'G', label: 'Runner-up Group G' },
  },
];

// Round of 16: winner of which R32 match vs winner of which R32 match
export const R16_MATCHES = [
  { id: 89, match1: 74, match2: 77 },
  { id: 90, match1: 73, match2: 75 },
  { id: 91, match1: 76, match2: 78 },
  { id: 92, match1: 79, match2: 80 },
  { id: 93, match1: 83, match2: 84 },
  { id: 94, match1: 81, match2: 82 },
  { id: 95, match1: 86, match2: 88 },
  { id: 96, match1: 85, match2: 87 },
];

// Quarterfinals
export const QF_MATCHES = [
  { id: 97, match1: 89, match2: 90 },
  { id: 98, match1: 93, match2: 94 },
  { id: 99, match1: 91, match2: 92 },
  { id: 100, match1: 95, match2: 96 },
];

// Semifinals
export const SF_MATCHES = [
  { id: 101, match1: 97, match2: 98 },
  { id: 102, match1: 99, match2: 100 },
];

// Final
export const FINAL_MATCH = { id: 104, match1: 101, match2: 102 };

// 3rd-place slot eligibility: group → which R32 match IDs (that have a 'best-3rd' slot) it can fill
// Only matches 74,77,79,80,81,82,85,87 have best-3rd slots.
// Each is derived directly from the slot's eligibleGroups list.
export const THIRD_PLACE_ELIGIBILITY = {
  A: [74, 82],
  B: [74, 81],
  C: [74, 77, 79],
  D: [74, 77, 87],
  E: [79, 80, 81, 82, 85, 87],
  F: [74, 77, 79, 81, 85],
  G: [77, 85],
  H: [77, 79, 80, 82],
  I: [77, 79, 80, 81, 82, 85, 87],
  J: [80, 81, 82, 85, 87],
  K: [80],
  L: [87],
};
