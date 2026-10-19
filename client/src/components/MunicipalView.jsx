import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { getPartyColor, getPartySymbol } from '../utils/party_utils';
import defaultMunicipalData from '../data/municipal_elections_data.json';
import { getAllStates, getDistrictsByState } from '../utils/geo_utils';
import Search from 'lucide-react/dist/esm/icons/search';
import Trophy from 'lucide-react/dist/esm/icons/trophy';
import Building2 from 'lucide-react/dist/esm/icons/building-2';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import Clock from 'lucide-react/dist/esm/icons/clock';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';

export default function MunicipalView() {
  const [data, setData] = useState(defaultMunicipalData);
  const [selectedTier, setSelectedTier] = useState('ALL');
  const [selectedState, setSelectedState] = useState('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyBehemoths, setOnlyBehemoths] = useState(false);

  // Dynamic Years from dataset (from 2026 back to 1952)
  const yearsList = useMemo(() => {
    return Array.from(new Set(data.map(d => d.year).filter(Boolean))).sort((a, b) => b - a);
  }, [data]);

  // Dynamic States from library + dataset
  const statesList = useMemo(() => {
    try {
      const fromLib = getAllStates() || [];
      const fromData = Array.from(new Set(defaultMunicipalData.map(d => d.state))).filter(Boolean);
      const combined = Array.from(new Set([...fromData, ...fromLib])).sort();
      return combined;
    } catch (e) {
      return Array.from(new Set(defaultMunicipalData.map(d => d.state))).sort();
    }
  }, []);

  // Dynamic Districts for selected State
  const districtsList = useMemo(() => {
    if (selectedState === 'ALL') {
      const allDistricts = Array.from(new Set(data.map(d => d.district))).filter(Boolean).sort();
      return allDistricts;
    }
    try {
      const libDistricts = getDistrictsByState(selectedState) || [];
      const dataDistricts = data
        .filter(d => d.state?.toLowerCase() === selectedState.toLowerCase())
        .map(d => d.district)
        .filter(Boolean);
      return Array.from(new Set([...dataDistricts, ...libDistricts])).sort();
    } catch (e) {
      return data
        .filter(d => d.state?.toLowerCase() === selectedState.toLowerCase())
        .map(d => d.district)
        .filter(Boolean)
        .sort();
    }
  }, [selectedState, data]);

  // Sync with Firestore collection 'municipal_elections'
  useEffect(() => {
    let isMounted = true;
    async function fetchRemote() {
      try {
        const snap = await getDocs(collection(db, 'municipal_elections'));
        if (!snap.empty && isMounted) {
          const remoteList = [];
          snap.forEach(docSnap => {
            const d = docSnap.data();
            remoteList.push({ id: docSnap.id, ...d });
          });

          if (remoteList.length > 0) {
            const combined = [...defaultMunicipalData];
            remoteList.forEach(rem => {
              const idx = combined.findIndex(c => c.id === rem.id || (c.name && rem.name && c.name.toLowerCase() === rem.name.toLowerCase()));
              if (idx >= 0) {
                combined[idx] = { ...combined[idx], ...rem };
              } else {
                combined.unshift(rem);
              }
            });
            setData(combined);
          }
        }
      } catch (e) {
        console.warn('Municipal Firestore fetch fallback to local:', e.message);
      }
    }
    fetchRemote();
    return () => { isMounted = false; };
  }, []);

  // Filtered dataset
  const filteredList = useMemo(() => {
    return data.filter(item => {
      // Gram Panchayat exclusion safeguard
      if (item.type === 'GRAM_PANCHAYAT') return false;

      // Behemoth toggle
      if (onlyBehemoths && !item.isBehemoth) return false;

      // Tier filter
      if (selectedTier !== 'ALL' && item.type !== selectedTier) return false;

      // State filter
      if (selectedState !== 'ALL' && item.state?.toLowerCase() !== selectedState.toLowerCase()) return false;

      // District filter
      if (selectedDistrict !== 'ALL') {
        const itemDist = (item.district || '').toLowerCase();
        const selDist = selectedDistrict.toLowerCase();
        if (!itemDist.includes(selDist) && !selDist.includes(itemDist)) return false;
      }

      // Year filter (Supports filtering by historical election years back to 1952)
      if (selectedYear !== 'ALL' && String(item.year) !== String(selectedYear)) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name?.toLowerCase().includes(q);
        const matchesState = item.state?.toLowerCase().includes(q);
        const matchesDist = item.district?.toLowerCase().includes(q);
        const matchesMayor = item.mayor?.toLowerCase().includes(q);
        const matchesParty = item.rulingParty?.toLowerCase().includes(q);
        if (!matchesName && !matchesState && !matchesDist && !matchesMayor && !matchesParty) {
          return false;
        }
      }

      return true;
    });
  }, [data, selectedTier, selectedState, selectedDistrict, selectedYear, searchQuery, onlyBehemoths]);

  return (
    <div style={{ marginTop: '8px', color: '#E4E4E7' }}>
      
      {/* SEO METATAGS */}
      <Helmet>
        <title>Municipal Corporation & Urban Local Body Election Results India | Opinar</title>
        <meta name="description" content="Explore verified ward-wise results, party standings, and mayors for Indian municipal corporations, Mahanagar Palikas, Nagar Palikas, and Nagar Panchayats across states and districts." />
        <meta name="keywords" content="municipal election results, mahanagar palika results, mcd delhi results, bmc mumbai election, kmc kolkata results, ghmc hyderabad, nagar palika results, nagar parishad, ward results india" />
        <link rel="canonical" href="https://www.opinar.in/elections/municipal" />
      </Helmet>

      {/* FILTER CONTROLS BAR */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '14px', 
        marginBottom: '24px',
        backgroundColor: '#202023',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid #2E2E33'
      }}>
        
        {/* ROW 1: TIER SELECTOR & BEHEMOTH TOGGLE */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          
          {/* 4 Urban Local Body Tiers */}
          <div style={{ display: 'flex', gap: '4px', backgroundColor: '#18181B', padding: '4px', borderRadius: '8px', border: '1px solid #3F3F46', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'All Urban Bodies' },
              { id: 'MAHANAGAR_PALIKA', label: 'Mahanagar Palika', icon: '🏙️' },
              { id: 'NAGAR_PALIKA', label: 'Nagar Palika', icon: '🏢' },
              { id: 'NAGAR_PARISHAD', label: 'Nagar Parishad', icon: '🏛️' },
              { id: 'NAGAR_PANCHAYAT', label: 'Nagar Panchayat', icon: '🏡' }
            ].map(tier => (
              <button
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                style={{
                  backgroundColor: selectedTier === tier.id ? '#3F3F46' : 'transparent',
                  color: selectedTier === tier.id ? '#FFFFFF' : '#A1A1AA',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s'
                }}
              >
                {tier.icon && <span>{tier.icon}</span>}
                {tier.label}
              </button>
            ))}
          </div>

          {/* Mega Behemoth Quick Filter Toggle */}
          <button
            onClick={() => setOnlyBehemoths(!onlyBehemoths)}
            style={{
              backgroundColor: onlyBehemoths ? '#7C3AED' : '#27272A',
              color: '#FFFFFF',
              border: `1px solid ${onlyBehemoths ? '#8B5CF6' : '#3F3F46'}`,
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s'
            }}
          >
            <span>👑</span> Mega Behemoths Only (BMC, MCD, KMC, etc.)
          </button>
        </div>

        {/* ROW 2: SEARCH, STATE & DISTRICT SELECTORS */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
            <Search size={15} color="#71717A" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search corporation, city, district or mayor..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#18181B',
                border: '1px solid #3F3F46',
                borderRadius: '8px',
                padding: '8px 12px 8px 36px',
                color: '#FFFFFF',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* State Dropdown */}
          <div style={{ position: 'relative', minWidth: '180px' }}>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedDistrict('ALL');
              }}
              style={{
                width: '100%',
                backgroundColor: '#18181B',
                color: '#FFFFFF',
                border: '1px solid #3F3F46',
                borderRadius: '8px',
                padding: '8px 32px 8px 12px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
                appearance: 'none',
                boxSizing: 'border-box'
              }}
            >
              <option value="ALL">All States ({statesList.length})</option>
              {statesList.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
            <ChevronDown size={14} color="#A1A1AA" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>

          {/* District Dropdown */}
          <div style={{ position: 'relative', minWidth: '180px' }}>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#18181B',
                color: '#FFFFFF',
                border: '1px solid #3F3F46',
                borderRadius: '8px',
                padding: '8px 32px 8px 12px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
                appearance: 'none',
                boxSizing: 'border-box'
              }}
            >
              <option value="ALL">All Districts ({districtsList.length})</option>
              {districtsList.map(dist => (
                <option key={dist} value={dist}>{dist}</option>
              ))}
            </select>
            <ChevronDown size={14} color="#A1A1AA" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>

          {/* Year Dropdown */}
          <div style={{ position: 'relative', minWidth: '140px' }}>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#18181B',
                color: '#FFFFFF',
                border: '1px solid #3F3F46',
                borderRadius: '8px',
                padding: '8px 30px 8px 12px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
                appearance: 'none',
                boxSizing: 'border-box'
              }}
            >
              <option value="ALL">All Years ({yearsList.length})</option>
              {yearsList.map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
            <ChevronDown size={14} color="#A1A1AA" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>

          {/* Reset Filters */}
          {(selectedState !== 'ALL' || selectedDistrict !== 'ALL' || selectedYear !== 'ALL' || selectedTier !== 'ALL' || searchQuery || onlyBehemoths) && (
            <button
              onClick={() => {
                setSelectedTier('ALL');
                setSelectedState('ALL');
                setSelectedDistrict('ALL');
                setSelectedYear('ALL');
                setSearchQuery('');
                setOnlyBehemoths(false);
              }}
              style={{
                backgroundColor: '#3F3F46',
                color: '#E4E4E7',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Reset Filters
            </button>
          )}

        </div>
      </div>

      {/* METRIC STRIP */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '0 4px' }}>
        <div style={{ fontSize: '13px', color: '#A1A1AA' }}>
          Showing <span style={{ color: '#FFFFFF', fontWeight: 700 }}>{filteredList.length}</span> urban local bodies
          {selectedState !== 'ALL' && <span> in <strong style={{ color: '#60A5FA' }}>{selectedState}</strong></span>}
          {selectedDistrict !== 'ALL' && <span> • <strong style={{ color: '#34D399' }}>{selectedDistrict}</strong> district</span>}
        </div>
      </div>

      {/* CARDS GRID: CLEAN MINIMALIST DESIGN */}
      {filteredList.length === 0 ? (
        <div style={{
          backgroundColor: '#27272A',
          borderRadius: '12px',
          padding: '48px 24px',
          textAlign: 'center',
          color: '#A1A1AA',
          border: '1px solid #3F3F46'
        }}>
          <Building2 size={40} color="#71717A" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ color: '#FFFFFF', fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0' }}>No Local Bodies Found</h3>
          <p style={{ fontSize: '13px', margin: 0 }}>Try clearing your district or state filters to browse more municipal corporations.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '16px'
        }}>
          {filteredList.map((mb) => {
            const isBehemoth = mb.isBehemoth;
            const tierBadgeColor = 
              mb.type === 'MAHANAGAR_PALIKA' ? (isBehemoth ? '#A855F7' : '#3B82F6') :
              mb.type === 'NAGAR_PALIKA' ? '#10B981' :
              mb.type === 'NAGAR_PARISHAD' ? '#F59E0B' : '#06B6D4';

            const tierBadgeBg = 
              mb.type === 'MAHANAGAR_PALIKA' ? (isBehemoth ? '#A855F720' : '#3B82F620') :
              mb.type === 'NAGAR_PALIKA' ? '#10B98120' :
              mb.type === 'NAGAR_PARISHAD' ? '#F59E0B20' : '#06B6D420';

            const rulingPartyColor = getPartyColor(mb.rulingParty?.split(' ')[0] || 'IND');

            return (
              <div 
                key={mb.id}
                style={{
                  backgroundColor: '#27272A',
                  borderRadius: '12px',
                  border: isBehemoth ? '1px solid #8B5CF660' : '1px solid #3F3F46',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  transition: 'border-color 0.15s, transform 0.15s',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = isBehemoth ? '#A855F7' : '#3B82F6';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = isBehemoth ? '#8B5CF660' : '#3F3F46';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Header: Tier Badge & Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: tierBadgeColor,
                    backgroundColor: tierBadgeBg,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {isBehemoth && <span>👑</span>}
                    {mb.tierLabel || mb.type.replace('_', ' ')}
                  </span>

                  {mb.status === 'COUNTING' ? (
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: 700, 
                      color: '#EF4444', 
                      backgroundColor: '#EF444415', 
                      padding: '3px 8px', 
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#EF4444' }} /> Counting Live
                    </span>
                  ) : (
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: 700, 
                      color: '#10B981', 
                      backgroundColor: '#10B98115', 
                      padding: '3px 8px', 
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <CheckCircle2 size={12} color="#10B981" /> Result Declared
                    </span>
                  )}
                </div>

                {/* Corporation / Palika Name & Jurisdiction */}
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF', margin: 0, lineHeight: 1.3 }}>
                    {mb.name}
                  </h3>
                  <div style={{ fontSize: '13px', color: '#A1A1AA', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ color: '#D4D4D8', fontWeight: 500 }}>{mb.district}</span>
                    <span>•</span>
                    <span style={{ color: '#93C5FD' }}>{mb.state}</span>
                    <span>•</span>
                    <span style={{ color: '#FBBF24', fontWeight: 700, backgroundColor: '#FBBF2415', padding: '1px 6px', borderRadius: '4px' }}>{mb.year}</span>
                  </div>
                </div>

                {/* Total Wards & Majority Mark */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#18181B',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  border: '1px solid #3F3F46'
                }}>
                  <div>
                    <span style={{ color: '#A1A1AA' }}>Total Wards: </span>
                    <strong style={{ color: '#FFFFFF' }}>{mb.totalSeats}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#A1A1AA' }}>Majority Mark: </span>
                    <strong style={{ color: '#FBBF24' }}>{mb.majoritySeats || Math.floor(mb.totalSeats / 2) + 1}</strong>
                  </div>
                </div>

                {/* Wards Distribution Bar */}
                {Array.isArray(mb.partyStandings) && mb.partyStandings.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#3F3F46', marginBottom: '8px' }}>
                      {mb.partyStandings.map((p, pIdx) => {
                        const pct = mb.totalSeats > 0 ? (p.seats / mb.totalSeats) * 100 : 0;
                        const col = getPartyColor(p.party);
                        return (
                          <div 
                            key={pIdx} 
                            style={{ 
                              width: `${pct}%`, 
                              backgroundColor: col, 
                              height: '100%' 
                            }} 
                            title={`${p.party}: ${p.seats} seats (${pct.toFixed(1)}%)`}
                          />
                        );
                      })}
                    </div>

                    {/* Party Standings Badges */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {mb.partyStandings.slice(0, 5).map((p, pIdx) => {
                        const col = getPartyColor(p.party);
                        const sym = getPartySymbol(p.party);
                        return (
                          <span 
                            key={pIdx}
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: col,
                              backgroundColor: `${col}15`,
                              border: `1px solid ${col}30`,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            <span>{sym}</span>
                            <span>{p.party}: <strong>{p.seats}</strong></span>
                          </span>
                        );
                      })}
                      {mb.partyStandings.length > 5 && (
                        <span style={{ fontSize: '11px', color: '#71717A', alignSelf: 'center' }}>
                          +{mb.partyStandings.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Ruling Party & Mayor Information */}
                {(mb.rulingParty || mb.mayor) && (
                  <div style={{
                    backgroundColor: '#18181B',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    border: '1px solid #3F3F46',
                    marginTop: 'auto'
                  }}>
                    {mb.rulingParty && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: mb.mayor ? '4px' : '0' }}>
                        <span style={{ fontSize: '11px', color: '#A1A1AA', textTransform: 'uppercase', fontWeight: 600 }}>Ruling</span>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: rulingPartyColor }}>
                          {mb.rulingParty}
                        </span>
                      </div>
                    )}
                    {mb.mayor && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                        <span style={{ color: '#71717A' }}>Mayor / Head:</span>
                        <span style={{ color: '#E4E4E7', fontWeight: 600 }}>{mb.mayor}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Minimal summary text */}
                {mb.summary && (
                  <div style={{ fontSize: '12px', color: '#9CA3AF', lineHeight: 1.4 }}>
                    {mb.summary}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
