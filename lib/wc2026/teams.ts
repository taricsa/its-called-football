import type { GroupLetter, SatiricalAdjustment, Team } from './types';

const TERMINOLOGY_COMPLIANT = new Set([
  'ARG',
  'AUT',
  'BRA',
  'COL',
  'CRO',
  'ECU',
  'FRA',
  'GER',
  'MEX',
  'NED',
  'NOR',
  'PAR',
  'POR',
  'SCO',
  'ESP',
  'SUI',
  'URU',
]);

const HOST_NATIONS = new Set(['CAN', 'MEX', 'USA']);

function buildAdjustments(id: string): SatiricalAdjustment[] {
  const adjustments: SatiricalAdjustment[] = [];

  if (TERMINOLOGY_COMPLIANT.has(id)) {
    adjustments.push('terminology_bonus');
  }

  if (id === 'USA') {
    adjustments.push('hand_egg_penalty');
  }

  if (id === 'JPN') {
    adjustments.push('traitor_penalty');
  }

  if (HOST_NATIONS.has(id)) {
    adjustments.push('host_advantage');
  }

  return adjustments;
}

function team(
  id: string,
  name: string,
  group: GroupLetter,
  baseElo: number,
  satiricalNote: string,
): Team {
  return {
    id,
    name,
    group,
    baseElo,
    satiricalNote,
    adjustments: buildAdjustments(id),
  };
}

export const WC2026_TEAMS: Team[] = [
  team('MEX', 'Mexico', 'A', 1834, 'Host nation. Says fútbol. Court-approved.'),
  team('RSA', 'South Africa', 'A', 1529, 'Bafana Bafana. Correct continent, correct ball.'),
  team('KOR', 'South Korea', 'A', 1784, 'Chukgu is foot-ball. Acceptable etymology.'),
  team('CZE', 'Czechia', 'A', 1731, 'Fotbal. Central European compliance certified.'),

  team('CAN', 'Canada', 'B', 1806, 'Host nation. Still measuring pitch in yards internally.'),
  team('BIH', 'Bosnia and Herzegovina', 'B', 1571, 'Nogomet. Balkan linguistic precision.'),
  team('QAT', 'Qatar', 'B', 1427, 'Kurat al-qadam. Foot. Ball. Simple.'),
  team('SUI', 'Switzerland', 'B', 1897, 'Fussball in four languages. Over-engineered.'),

  team('BRA', 'Brazil', 'C', 1979, 'Five World Cups of correct terminology.'),
  team('MAR', 'Morocco', 'C', 1806, 'Koora. Atlas Lions with atlas-sized football pride.'),
  team('HAI', 'Haiti', 'C', 1542, 'First finals since 1974. Underdog with correct nouns.'),
  team('SCO', 'Scotland', 'C', 1790, 'Fitba. Tartan-clad etymological righteousness.'),

  team('USA', 'United States', 'D', 1747, 'Hand-Egg Confusion Penalty applied. Host nation.'),
  team('PAR', 'Paraguay', 'D', 1833, 'Fútbol. South American paperwork in order.'),
  team('AUS', 'Australia', 'D', 1774, 'Says "soccer" domestically. On probation.'),
  team('TUR', 'Türkiye', 'D', 1880, 'Futbol. Bridge between continents and lexicons.'),

  team('GER', 'Germany', 'E', 1910, 'Fußball. Flawless German engineering.'),
  team('CUW', 'Curaçao', 'E', 1467, 'Smallest nation here. Maximum alphabetical chaos.'),
  team('CIV', 'Côte d\'Ivoire', 'E', 1637, 'Football. Elephants never forget the correct name.'),
  team('ECU', 'Ecuador', 'E', 1933, 'Fútbol. La Tri with tri-lingual clarity.'),

  team('NED', 'Netherlands', 'F', 1959, 'Voetbal. Total football, total terminology.'),
  team('JPN', 'Japan', 'F', 1879, 'Borrowed "sakkā". Traitor penalty enforced.'),
  team('SWE', 'Sweden', 'F', 1660, 'Fotboll. IKEA instructions clearer than offside.'),
  team('TUN', 'Tunisia', 'F', 1614, 'Koora. Carthage fell; football naming endured.'),

  team('BEL', 'Belgium', 'G', 1849, 'Voetbal / Football. Dual-language compliance.'),
  team('EGY', 'Egypt', 'G', 1660, 'Koora. Pharaohs demand spherical balls only.'),
  team('IRN', 'Iran', 'G', 1754, 'Football. Persian Gulf of correct nouns.'),
  team('NZL', 'New Zealand', 'G', 1586, 'Says "soccer" at home. All Blacks exempt, Socceroos not.'),

  team('ESP', 'Spain', 'H', 2171, 'Fútbol / Balompié. Beautiful game, beautiful math.'),
  team('CPV', 'Cape Verde', 'H', 1561, 'Futebol. Island nation, continental vocabulary.'),
  team('KSA', 'Saudi Arabia', 'H', 1592, 'Kurat al-qadam. Oil-rich, ego-rich, football-correct.'),
  team('URU', 'Uruguay', 'H', 1890, 'Fútbol. Invented the World Cup. Named it correctly.'),

  team('FRA', 'France', 'I', 2063, 'Football. Bureaucratic AND athletic supremacy.'),
  team('SEN', 'Senegal', 'I', 1869, 'Football. Lions of Teranga, guardians of terminology.'),
  team('IRQ', 'Iraq', 'I', 1583, 'Koora. Mesopotamian cradle of civilization, modern pitch.'),
  team('NOR', 'Norway', 'I', 1922, 'Fotball. Haaland-powered probability engine.'),

  team('ARG', 'Argentina', 'J', 2113, 'Fútbol. Messi era legacy rating still active.'),
  team('ALG', 'Algeria', 'J', 1728, 'Koora. Desert Foxes hunt mislabeled sports.'),
  team('AUT', 'Austria', 'J', 1818, 'Fußball. Alpine air, low-altitude nonsense tolerance.'),
  team('JOR', 'Jordan', 'J', 1691, 'Koora. Royal family prefers round balls.'),

  team('POR', 'Portugal', 'K', 1976, 'Futebol. Iberian peninsula compliance. Exemplary.'),
  team('COD', 'DR Congo', 'K', 1639, 'Football. Leopards pounce on linguistic errors.'),
  team('UZB', 'Uzbekistan', 'K', 1735, 'Futbol. Silk Road to the Round of 32.'),
  team('COL', 'Colombia', 'K', 1998, 'Fútbol. Coffee-fueled counterattacks and nouns.'),

  team('ENG', 'England', 'L', 2042, 'Football. Invented the word "soccer" then abandoned it.'),
  team('CRO', 'Croatia', 'L', 1933, 'Nogomet. Checkered flag, checkered past with "soccer".'),
  team('GHA', 'Ghana', 'L', 1509, 'Football. Black Stars aligned with spherical justice.'),
  team('PAN', 'Panama', 'L', 1743, 'Fútbol. Canal connects oceans; name connects feet and ball.'),
];

let teamsByGroupCache: Map<GroupLetter, Team[]> | null = null;
let teamMapCache: Map<string, Team> | null = null;

export function getTeamsByGroup(): Map<GroupLetter, Team[]> {
  if (!teamsByGroupCache) {
    const groups = new Map<GroupLetter, Team[]>();

    for (const wcTeam of WC2026_TEAMS) {
      const existing = groups.get(wcTeam.group) ?? [];
      existing.push(wcTeam);
      groups.set(wcTeam.group, existing);
    }

    teamsByGroupCache = groups;
  }

  return teamsByGroupCache;
}

export function getTeamMap(): Map<string, Team> {
  if (!teamMapCache) {
    teamMapCache = new Map(WC2026_TEAMS.map((wcTeam) => [wcTeam.id, wcTeam]));
  }

  return teamMapCache;
}
