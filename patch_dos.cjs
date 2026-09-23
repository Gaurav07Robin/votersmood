const fs = require('fs');

let pollsFile = fs.readFileSync('server/routes/polls.js', 'utf8');

// Fix community route
pollsFile = pollsFile.replace(
  `if (!question || !options || !Array.isArray(options) || options.length < 2) {`,
  `if (!question || typeof question !== 'string' || !options || !Array.isArray(options) || options.length < 2) {`
);

// Fix official route
pollsFile = pollsFile.replace(
  `if (!title || !category || !candidates || candidates.length < 2) {`,
  `if (!title || typeof title !== 'string' || !category || typeof category !== 'string' || !candidates || candidates.length < 2) {`
);

fs.writeFileSync('server/routes/polls.js', pollsFile);
console.log('Patched DoS vulnerability in polls.js!');
