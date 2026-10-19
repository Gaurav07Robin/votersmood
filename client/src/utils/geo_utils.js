import statesDistrictsMap from '../data/india_states_districts.json';

export const getAllStates = () => {
  return Object.keys(statesDistrictsMap || {}).sort();
};

export const getDistrictsByState = (state) => {
  if (!state || state === 'ALL') return [];
  
  // Exact match
  if (statesDistrictsMap[state]) {
    return statesDistrictsMap[state];
  }
  
  // Case-insensitive match
  const lowerState = state.toLowerCase().trim();
  const matchedKey = Object.keys(statesDistrictsMap).find(k => k.toLowerCase() === lowerState);
  if (matchedKey) {
    return statesDistrictsMap[matchedKey];
  }

  return [];
};

export const getAllStatesWithDistricts = () => {
  return statesDistrictsMap || {};
};

export default {
  getAllStates,
  getDistrictsByState,
  getAllStatesWithDistricts
};
