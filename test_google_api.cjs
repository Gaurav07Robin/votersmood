const fs = require('fs');
const dotenv = require('dotenv');
const envConfig = dotenv.parse(fs.readFileSync('server/.env'));
const apiKey = envConfig.GOOGLE_SEARCH_API_KEY;
const cx = envConfig.GOOGLE_SEARCH_ENGINE_ID;

if (!apiKey || !cx) {
  console.log('Error: Keys not found in .env');
  process.exit(1);
}

const q = encodeURIComponent('Uttar Pradesh election results filetype:csv OR filetype:pdf site:ashoka.edu.in');
const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${q}`;

fetch(url)
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      console.error('API Error:', data.error.message);
    } else if (data.items) {
      console.log('Success! Found ' + data.items.length + ' results.');
      console.log('Top Result:', data.items[0].title);
      console.log('Link:', data.items[0].link);
    } else {
      console.log('No results found, but request succeeded:', data);
    }
  })
  .catch(err => console.error('Fetch error:', err));
