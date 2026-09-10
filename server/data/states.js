import geographyData from './geography.json';

export const STATES = geographyData.map(state => ({
  code: state.name.substring(0, 2).toUpperCase(), // Simple code generation, can be mapped better if needed
  name: state.name,
  type: 'state',
  lokSabhaSeats: state.parliamentary.length,
  vidhanSabhaSeats: Object.values(state.districts).reduce((acc, acs) => acc + acs.length, 0)
}));

// Function to get districts for a state
export const getDistrictsForState = (stateName) => {
  const stateObj = geographyData.find(s => s.name === stateName);
  if (stateObj && stateObj.districts) {
    return Object.keys(stateObj.districts);
  }
  return [];
};

// Function to get constituencies for a specific district and type
export const getConstituencies = (stateName, districtName, type) => {
  const stateObj = geographyData.find(s => s.name === stateName);
  if (!stateObj) return [];
  
  if (type === 'MP_LS' || type === 'MP_RS') {
    return stateObj.parliamentary.map(pc => pc.name);
  } else {
    // MLA / MLC
    if (stateObj.districts && stateObj.districts[districtName]) {
      return stateObj.districts[districtName].map(ac => ac.name);
    }
    return [];
  }
};

export const PARTIES = {
  BJP: { name: 'Bharatiya Janata Party', bg: '#D97706', color: '#FFFFFF' },
  INC: { name: 'Indian National Congress', bg: '#2E7D32', color: '#FFFFFF' },
  AAP: { name: 'Aam Aadmi Party', bg: '#2563EB', color: '#FFFFFF' },
  CPI: { name: 'Communist Party of India', bg: '#B91C1C', color: '#FFFFFF' },
  'CPI(M)': { name: 'Communist Party of India (Marxist)', bg: '#991B1B', color: '#FFFFFF' },
  SP: { name: 'Samajwadi Party', bg: '#DC2626', color: '#FFFFFF' },
  BSP: { name: 'Bahujan Samaj Party', bg: '#1E40AF', color: '#FFFFFF' },
  TMC: { name: 'All India Trinamool Congress', bg: '#0284C7', color: '#FFFFFF' },
  'Shiv Sena': { name: 'Shiv Sena', bg: '#C2410C', color: '#FFFFFF' },
  NCP: { name: 'Nationalist Congress Party', bg: '#2563EB', color: '#FFFFFF' },
  Independent: { name: 'Independent Candidate', bg: '#6B7280', color: '#FFFFFF' }
};

export const LEADER_TYPES = {
  MP_LS: 'Member of Parliament (Lok Sabha)',
  MP_RS: 'Member of Parliament (Rajya Sabha)',
  MLA: 'Member of Legislative Assembly',
  MLC: 'Member of Legislative Council'
};
