const fs = require('fs');
let c = fs.readFileSync('client/src/App.jsx', 'utf8');

if (!c.includes('import PrivacyPolicy')) {
  c = c.replace(
    /import ConstituencyResult from '\.\/pages\/ConstituencyResult';/,
    "import ConstituencyResult from './pages/ConstituencyResult';\nimport PrivacyPolicy from './pages/PrivacyPolicy';"
  );
}

// Modify the default App export to intercept /privacy-policy completely
if (!c.includes("if (window.location.pathname === '/privacy-policy')")) {
  c = c.replace(
    /export default function App\(\) \{\s*return \(\s*<AuthProvider>/,
    `export default function App() {
  if (window.location.pathname === '/privacy-policy') {
    return <PrivacyPolicy />;
  }

  return (
    <AuthProvider>`
  );
}

fs.writeFileSync('client/src/App.jsx', c);
console.log('App.jsx modified cleanly for standalone privacy policy route.');
