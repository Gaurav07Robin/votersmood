const fs = require('fs');
let c = fs.readFileSync('client/src/App.jsx', 'utf8');
c = "import PrivacyPolicy from './pages/PrivacyPolicy';\n" + c;
c = c.replace(
  /export default function App\(\) \{\s*return \(\s*<AuthProvider>/,
  `export default function App() {
  if (window.location.pathname.startsWith('/privacy-policy')) {
    return <PrivacyPolicy />;
  }

  return (
    <AuthProvider>`
);
fs.writeFileSync('client/src/App.jsx', c);
