import { getTeamMap } from './teams';

const CODE_TO_TEAM_ID: Record<string, string> = {
  ALG: 'ALG',
  ARG: 'ARG',
  AUS: 'AUS',
  AUT: 'AUT',
  BEL: 'BEL',
  BIH: 'BIH',
  BRA: 'BRA',
  CAN: 'CAN',
  CPV: 'CPV',
  COL: 'COL',
  CIV: 'CIV',
  CRO: 'CRO',
  CUW: 'CUW',
  COD: 'COD',
  CGO: 'COD',
  CZE: 'CZE',
  ECU: 'ECU',
  EGY: 'EGY',
  ENG: 'ENG',
  FRA: 'FRA',
  GER: 'GER',
  GHA: 'GHA',
  HAI: 'HAI',
  IRN: 'IRN',
  IRQ: 'IRQ',
  JOR: 'JOR',
  JPN: 'JPN',
  KOR: 'KOR',
  KSA: 'KSA',
  MAR: 'MAR',
  MEX: 'MEX',
  NED: 'NED',
  NOR: 'NOR',
  NZL: 'NZL',
  PAN: 'PAN',
  PAR: 'PAR',
  POR: 'POR',
  QAT: 'QAT',
  RSA: 'RSA',
  SCO: 'SCO',
  SEN: 'SEN',
  ESP: 'ESP',
  SUI: 'SUI',
  SWE: 'SWE',
  TUN: 'TUN',
  TUR: 'TUR',
  USA: 'USA',
  URU: 'URU',
  UZB: 'UZB',
};

const NAME_TO_TEAM_ID: Record<string, string> = {
  Algeria: 'ALG',
  Argentina: 'ARG',
  Australia: 'AUS',
  Austria: 'AUT',
  Belgium: 'BEL',
  'Bosnia and Herzegovina': 'BIH',
  Brazil: 'BRA',
  Canada: 'CAN',
  'Cape Verde': 'CPV',
  Colombia: 'COL',
  'Ivory Coast': 'CIV',
  "Cote D'Ivoire": 'CIV',
  Croatia: 'CRO',
  Curacao: 'CUW',
  'DR Congo': 'COD',
  'Congo DR': 'COD',
  Czechia: 'CZE',
  'Czech Republic': 'CZE',
  Ecuador: 'ECU',
  Egypt: 'EGY',
  England: 'ENG',
  France: 'FRA',
  Germany: 'GER',
  Ghana: 'GHA',
  Haiti: 'HAI',
  Iran: 'IRN',
  Iraq: 'IRQ',
  Jordan: 'JOR',
  Japan: 'JPN',
  'Korea Republic': 'KOR',
  'South Korea': 'KOR',
  'Saudi Arabia': 'KSA',
  Morocco: 'MAR',
  Mexico: 'MEX',
  Netherlands: 'NED',
  Norway: 'NOR',
  'New Zealand': 'NZL',
  Panama: 'PAN',
  Paraguay: 'PAR',
  Portugal: 'POR',
  Qatar: 'QAT',
  'South Africa': 'RSA',
  Scotland: 'SCO',
  Senegal: 'SEN',
  Spain: 'ESP',
  Switzerland: 'SUI',
  Sweden: 'SWE',
  Tunisia: 'TUN',
  Turkey: 'TUR',
  Turkiye: 'TUR',
  'United States': 'USA',
  Uruguay: 'URU',
  Uzbekistan: 'UZB',
};

export function mapApiTeamToId(code: string | null, name: string): string | null {
  if (code) {
    const mapped = CODE_TO_TEAM_ID[code.toUpperCase()];
    if (mapped) {
      return mapped;
    }
  }

  const byName = NAME_TO_TEAM_ID[name];
  if (byName) {
    return byName;
  }

  const teamMap = getTeamMap();
  for (const team of teamMap.values()) {
    if (team.name.toLowerCase() === name.toLowerCase()) {
      return team.id;
    }
  }

  return null;
}
