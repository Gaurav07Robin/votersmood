const fs = require('fs');
let code = fs.readFileSync('client/src/components/Navbar.jsx', 'utf8');

code = code.replace('<GazetteLogo size={26} />', '<img src="/opinar_logo.png" alt="Opinar" style={{ height: "36px", objectFit: "contain" }} />');

code = code.replace('THE STATE UNION', '');

// Cleanup empty span
code = code.replace(/<span className="brand-logo-text"[^>]*>\s*<\/span>/, '');

fs.writeFileSync('client/src/components/Navbar.jsx', code);
console.log('Logo updated successfully');
