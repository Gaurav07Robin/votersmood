export const PARTY_COLORS = {
  INC: '#3B82F6', 
  BJP: '#F97316', 
  BJS: '#F97316', 
  CPI: '#EF4444',
  CPM: '#DC2626',
  TDP: '#FDE047',
  BJD: '#22C55E',
  SP: '#EF4444',
  BSP: '#3B82F6',
  AITC: '#22C55E',
  DEFAULT: '#A1A1AA'
};

export const PARTY_SYMBOLS = {
  INC: '✋',
  'INC(I)': '✋',
  BJP: '🪷',
  BJS: '🪔',
  CPI: '☭',
  CPM: '☭',
  'CPI(M)': '☭',
  BSP: '🐘',
  SP: '🚲',
  TDP: '🚲',
  NCP: '🕒',
  AITC: '🌱',
  AAP: '🧹',
  SHS: '🏹',
  RJD: '🏮',
  LJP: '🏠',
  'JD(U)': '⬆️',
  JD: '☸️',
  SAD: '⚖️',
  YSRCP: '🪭',
  TRS: '🚗',
  BRS: '🚗',
  BLD: '🧑‍🌾',
  IND: '👤'
};

export const PARTY_FLAGS = {
  INC: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Flag_of_the_Indian_National_Congress.svg',
  'INC(I)': 'https://upload.wikimedia.org/wikipedia/commons/4/45/Flag_of_the_Indian_National_Congress.svg',
  BJP: 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Flag_of_the_Bharatiya_Janata_Party.svg',
  BJS: 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Flag_of_the_Bharatiya_Janata_Party.svg',
  CPI: 'https://upload.wikimedia.org/wikipedia/commons/8/82/Flag_of_the_Communist_Party_of_India.svg',
  CPM: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Flag_of_the_Communist_Party_of_India_%28Marxist%29.svg',
  'CPI(M)': 'https://upload.wikimedia.org/wikipedia/commons/1/15/Flag_of_the_Communist_Party_of_India_%28Marxist%29.svg',
  BSP: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Flag_of_the_Bahujan_Samaj_Party.svg',
  SP: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Flag_of_the_Samajwadi_Party.svg',
  TDP: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Flag_of_the_Telugu_Desam_Party.svg',
  AITC: 'https://upload.wikimedia.org/wikipedia/commons/c/c0/All_India_Trinamool_Congress_flag.svg',
  SHS: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Flag_of_Shiv_Sena.svg',
  AAP: 'https://upload.wikimedia.org/wikipedia/commons/6/65/Aam_Aadmi_Party_logo_%28English%29.svg'
};

export const getPartyFlag = (party) => {
  // Wikimedia Commons blocks hotlinking or URLs are too brittle.
  // Returning null forces the UI to fall back to the native Emoji symbols which are 100% reliable.
  return null;
};

export const getPartySymbol = (party) => {
  if (!party) return '🏳️';
  if (PARTY_SYMBOLS[party]) return PARTY_SYMBOLS[party];
  for (const [key, symbol] of Object.entries(PARTY_SYMBOLS)) {
    if (party.includes(key)) return symbol;
  }
  return '🏳️';
};

export const getPartyColor = (party) => {
  if (!party) return PARTY_COLORS.DEFAULT;
  if (party.includes('INC')) return PARTY_COLORS.INC;
  if (party.includes('BJP') || party.includes('BJS')) return PARTY_COLORS.BJP;
  if (party.includes('CPI')) return PARTY_COLORS.CPI;
  if (party.includes('CPM')) return PARTY_COLORS.CPM;
  if (party.includes('TDP')) return PARTY_COLORS.TDP;
  return PARTY_COLORS.DEFAULT;
};
