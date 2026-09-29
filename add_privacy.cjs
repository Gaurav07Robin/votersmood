const fs = require('fs');
let c = fs.readFileSync('client/src/App.jsx', 'utf8');

if (!c.includes('import PrivacyPolicy')) {
  c = c.replace(/import ConstituencyResult from '.\/pages\/ConstituencyResult';/, 
    "import ConstituencyResult from './pages/ConstituencyResult';\nimport PrivacyPolicy from './pages/PrivacyPolicy';");
}

if (!c.includes("const KNOWN_TABS = [")) {
    console.log("Error finding KNOWN_TABS");
} else {
    c = c.replace(/const KNOWN_TABS = \['discussions', 'polls', 'insights', 'directory', 'trending', 'admin', 'elections'\];/,
      "const KNOWN_TABS = ['discussions', 'polls', 'insights', 'directory', 'trending', 'admin', 'elections', 'privacy-policy'];"
    );
}

if (!c.includes("{activeTab === 'privacy-policy'")) {
    c = c.replace(/<main style={{ flex: 1 }}>/,
      "<main style={{ flex: 1 }}>\n          {activeTab === 'privacy-policy' && <PrivacyPolicy />}"
    );
}

fs.writeFileSync('client/src/App.jsx', c);
console.log('Added PrivacyPolicy to App.jsx');
