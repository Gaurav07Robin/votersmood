const fs = require('fs');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync('server/.env'));

const key = env.SERPER_API_KEY;
console.log('Key found:', key ? key.substring(0, 10) + '...' : 'NOT FOUND');

fetch('https://google.serper.dev/search', {
  method: 'POST',
  headers: {
    'X-API-KEY': key,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ q: 'Uttar Pradesh 2022 assembly election results CSV lok dhaba tcpd', num: 5 })
})
.then(r => r.json())
.then(data => {
  if (data.error) {
    console.error('API Error:', data.error);
  } else if (data.organic) {
    console.log('SUCCESS! Found', data.organic.length, 'results.');
    data.organic.forEach((r, i) => {
      console.log(`\n[${i+1}] ${r.title}`);
      console.log('    URL:', r.link);
    });
  } else {
    console.log('Unexpected response:', JSON.stringify(data, null, 2));
  }
})
.catch(err => console.error('Fetch error:', err));
