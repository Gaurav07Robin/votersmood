const fs = require('fs');
let c = fs.readFileSync('client/src/App.jsx', 'utf8');
c = c.replace(/if \(window\.location\.pathname === '\/privacy-policy'\)/, "if (window.location.pathname.includes('/privacy-policy'))");
fs.writeFileSync('client/src/App.jsx', c);
