const fs = require('fs');
let c = fs.readFileSync('client/src/App.jsx', 'utf8');
const lines = c.split('\n');
// Remove the first line which is the duplicate import
if (lines[0].includes('import PrivacyPolicy from')) {
    lines.shift();
}
fs.writeFileSync('client/src/App.jsx', lines.join('\n'));
