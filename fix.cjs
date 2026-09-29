const fs = require('fs');
let c = fs.readFileSync('server/scripts/election_agent.js', 'utf8');
c = c.replace(/\\`Bearer \\\${process\.env\.CLOUDFLARE_API_TOKEN}\\`/g, '`Bearer ${process.env.CLOUDFLARE_API_TOKEN}`');
fs.writeFileSync('server/scripts/election_agent.js', c);
