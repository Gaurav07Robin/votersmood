const fs = require('fs');
let c = fs.readFileSync('client/src/pages/ElectionsHub.jsx', 'utf8');

c = c.replace(
  /{!isLS && \([\s\S]*?<p>This section is currently being mapped with historical data\.<\/p>[\s\S]*?<\/div>\s*\)}/,
  `{!isLS && !isAS && (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#27272A', borderRadius: '12px', color: '#A1A1AA', marginBottom: '24px' }}>
          <h3 style={{ color: '#FFFFFF', fontSize: '20px', marginBottom: '8px' }}>Module Active</h3>
          <p>This section is currently being mapped with historical data.</p>
        </div>
      )}`
);

c = c.replace(/{isLS && \(\<\>/, `{(isLS || isAS) && (<>`);

fs.writeFileSync('client/src/pages/ElectionsHub.jsx', c);
console.log('Fixed ElectionsHub UI bug!');
