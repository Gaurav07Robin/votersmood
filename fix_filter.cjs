const fs = require('fs');
let c = fs.readFileSync('client/src/pages/ElectionYearDetail.jsx', 'utf8');

c = c.replace(
  /const matchState = \(selectedState === 'All' \|\| c\.state === selectedState\) && \(isLS \|\| c\.state === state\);/,
  `const matchState = (selectedState === 'All' || c.state === selectedState) && (isLS ? (c.electionType !== 'ASSEMBLY') : (c.state === state && c.electionType === 'ASSEMBLY'));`
);

fs.writeFileSync('client/src/pages/ElectionYearDetail.jsx', c);
