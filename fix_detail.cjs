const fs = require('fs');
let c = fs.readFileSync('client/src/pages/ElectionYearDetail.jsx', 'utf8');

c = c.replace(
  /export default function ElectionYearDetail\(\{ year, onBack, onSelectConstituency \}\) \{/,
  'export default function ElectionYearDetail({ year, isLS = true, state = null, onBack, onSelectConstituency }) {'
);

c = c.replace(
  /const q = query\(collection\(db, 'elections_constituencies'\), where\('year', '==', parseInt\(year\)\)\);/,
  `let q = query(collection(db, 'elections_constituencies'), where('year', '==', parseInt(year)));
        if (!isLS) {
          q = query(q, where('electionType', '==', 'ASSEMBLY'));
          if (state) {
            q = query(q, where('state', '==', state));
          }
        } else {
          // Lok Sabha legacy data doesn't have electionType, so we just filter by LOK_SABHA or empty
          // Actually, let's just use the year for LS, assuming assemblies are marked 'ASSEMBLY'
        }`
);

// If state is selected, filter constituencies client side too just in case
c = c.replace(
  /const matchState = selectedState === 'All' \|\| c\.state === selectedState;/,
  `const matchState = (selectedState === 'All' || c.state === selectedState) && (isLS || c.state === state);`
);

// Change title from "1977 Lok Sabha Results" to handle state
c = c.replace(
  /\{year\} Lok Sabha Results/,
  `{year} {isLS ? 'Lok Sabha' : state + ' Assembly'} Results`
);

fs.writeFileSync('client/src/pages/ElectionYearDetail.jsx', c);
console.log('Fixed ElectionYearDetail!');
