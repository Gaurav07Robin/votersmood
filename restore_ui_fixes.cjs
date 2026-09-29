const fs = require('fs');

// 1. App.jsx
let app = fs.readFileSync('client/src/App.jsx', 'utf8');
app = app.replace(
  /const handleSelectYear = \(year\) => \{\s*setSelectedElection\(\{ year \}\);\s*setActiveTab\('election-year-detail'\);\s*window\.history\.pushState\(\{\}, '', `\/elections\/lok-sabha\/\$\{year\}`\);\s*\};/m,
  `const handleSelectYear = (year, isLS = true, state = null) => {
    setSelectedElection({ year, isLS, state });
    setActiveTab('election-year-detail');
    if (isLS) {
      window.history.pushState({}, '', \`/elections/lok-sabha/\${year}\`);
    } else {
      const stateSlug = state.toLowerCase().replace(/ /g, '-');
      window.history.pushState({}, '', \`/elections/state/\${stateSlug}/\${year}\`);
    }
  };`
);
app = app.replace(
  /\} else if \(path\.startsWith\('elections\/lok-sabha\/'\)\) \{/,
  `} else if (path.startsWith('elections/lok-sabha/') || path.startsWith('elections/state/')) {`
);
app = app.replace(
  /<ElectionYearDetail \s*year=\{selectedElection\.year\}\s*onBack=\{\(\) => handleTabChange\('elections'\)\}\s*onSelectConstituency=\{handleSelectConstituency\}\s*\/>/m,
  `<ElectionYearDetail 
            year={selectedElection.year} 
            isLS={selectedElection.isLS}
            state={selectedElection.state}
            onBack={() => handleTabChange('elections')}
            onSelectConstituency={handleSelectConstituency}
          />`
);
fs.writeFileSync('client/src/App.jsx', app);

// 2. ElectionsHub.jsx
let hub = fs.readFileSync('client/src/pages/ElectionsHub.jsx', 'utf8');
hub = hub.replace(
  /onClick=\{\(\) => onSelectYear\(activeYear\)\}/,
  `onClick={() => onSelectYear(activeYear, isLS, selectedState)}`
);
hub = hub.replace(
  /\{\!isLS && \(/,
  `{!isLS && !isAS && (`
);
hub = hub.replace(
  /\{isLS && \(<>/,
  `{(isLS || isAS) && (<>`
);
// Make the chart work for Assembly
hub = hub.replace(
  /\{isLS \? 'All-Time Historical Trend' : 'State Historical Trend'\}/,
  `{isLS ? 'All-Time Historical Trend' : 'State Historical Trend'}`
);
if (!hub.includes('TMC Seats')) {
  hub = hub.replace(
    /<Line type="monotone" dataKey="BJP" name="BJP Seats" stroke=\{getPartyColor\('BJP'\)\} strokeWidth=\{3\} dot=\{\{r: 4, fill: getPartyColor\('BJP'\)\}\} activeDot=\{\{r: 6\}\} \/>/,
    `<Line type="monotone" dataKey="BJP" name="BJP Seats" stroke={getPartyColor('BJP')} strokeWidth={3} dot={{r: 4, fill: getPartyColor('BJP')}} activeDot={{r: 6}} />
              {isAS && <Line type="monotone" dataKey="party_wins.TMC" name="TMC Seats" stroke="#22C55E" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />}
              {isAS && <Line type="monotone" dataKey="party_wins.SP" name="SP Seats" stroke="#EF4444" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />}
              {isAS && <Line type="monotone" dataKey="party_wins.AAP" name="AAP Seats" stroke="#06B6D4" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />}`
  );
}
fs.writeFileSync('client/src/pages/ElectionsHub.jsx', hub);

// 3. ElectionYearDetail.jsx
let detail = fs.readFileSync('client/src/pages/ElectionYearDetail.jsx', 'utf8');
detail = detail.replace(
  /export default function ElectionYearDetail\(\{ year, onBack, onSelectConstituency \}\)/,
  `export default function ElectionYearDetail({ year, isLS = true, state = null, onBack, onSelectConstituency })`
);
detail = detail.replace(
  /let q = query\(collection\(db, 'elections_constituencies'\), where\('year', '==', parseInt\(year\)\)\);/,
  `let q = query(collection(db, 'elections_constituencies'), where('year', '==', parseInt(year)));
        if (!isLS) {
          q = query(q, where('electionType', '==', 'ASSEMBLY'));
          if (state) {
            q = query(q, where('state', '==', state));
          }
        }`
);
detail = detail.replace(
  /const matchState = selectedState === 'All' \|\| c\.state === selectedState;/,
  `const matchState = (selectedState === 'All' || c.state === selectedState) && (isLS ? (c.electionType !== 'ASSEMBLY') : (c.state === state && c.electionType === 'ASSEMBLY'));`
);
fs.writeFileSync('client/src/pages/ElectionYearDetail.jsx', detail);
console.log('Restored state assembly fixes cleanly.');
