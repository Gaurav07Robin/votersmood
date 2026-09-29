const fs = require('fs');
let c = fs.readFileSync('client/src/App.jsx', 'utf8');

c = c.replace(/import PrivacyPolicy from '.\/pages\/PrivacyPolicy';\n?/g, '');
c = c.replace(/'privacy-policy', /g, '');
c = c.replace(/, 'privacy-policy'/g, '');
c = c.replace(/\s*\{activeTab === 'privacy-policy' && <PrivacyPolicy \/>\}/g, '');
c = c.replace(/\s*<footer[\s\S]*?<\/footer>/g, '');

fs.writeFileSync('client/src/App.jsx', c);
