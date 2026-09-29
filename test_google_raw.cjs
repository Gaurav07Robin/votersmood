const fs = require('fs');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync('server/.env'));
const url = 'https://www.googleapis.com/customsearch/v1?key=' + env.GOOGLE_SEARCH_API_KEY + '&cx=' + env.GOOGLE_SEARCH_ENGINE_ID + '&q=test';
fetch(url).then(r=>r.json()).then(data => console.log(JSON.stringify(data, null, 2)));
