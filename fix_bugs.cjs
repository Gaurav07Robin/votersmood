const fs = require('fs');

let pollsFile = fs.readFileSync('server/routes/polls.js', 'utf8');
let postsFile = fs.readFileSync('server/routes/posts.js', 'utf8');

// 1. Fix community/vote fake option dilution bug
pollsFile = pollsFile.replace(
  `const updatedOptions = (data.options || []).map(opt => {
            if (opt.id === optionId) {
              return { ...opt, votes: (opt.votes || 0) + 1 };
            }
            return opt;
          });
  
          const totalVotes = (data.totalVotes || 0) + 1;
          const updatedPoll = { ...data, id: pollId, options: updatedOptions, totalVotes };`,
  `const isValidOption = (data.options || []).some(opt => opt.id === optionId);
          if (!isValidOption) return res.status(400).json({ error: 'Invalid Option ID' });

          const updatedOptions = (data.options || []).map(opt => {
            if (opt.id === optionId) {
              return { ...opt, votes: (opt.votes || 0) + 1 };
            }
            return opt;
          });
  
          const totalVotes = (data.totalVotes || 0) + 1;
          const updatedPoll = { ...data, id: pollId, options: updatedOptions, totalVotes };`
);

// 2. Fix official/vote fake candidate dilution bug
pollsFile = pollsFile.replace(
  `let data = snap.data();
        const residentVotes = data.residentVotes || {};
        const observerVotes = data.observerVotes || {};
  
        if (isResident) {
          residentVotes[candidateId] = (residentVotes[candidateId] || 0) + 1;
        } else {
          observerVotes[candidateId] = (observerVotes[candidateId] || 0) + 1;
        }`,
  `let data = snap.data();
        const isValidCand = (data.candidates || []).some(c => c.id === candidateId);
        if (!isValidCand) return res.status(400).json({ error: 'Invalid Candidate ID' });

        const residentVotes = data.residentVotes || {};
        const observerVotes = data.observerVotes || {};
  
        if (isResident) {
          residentVotes[candidateId] = (residentVotes[candidateId] || 0) + 1;
        } else {
          observerVotes[candidateId] = (observerVotes[candidateId] || 0) + 1;
        }`
);

// 3. Fix posts.js crash vulnerability
postsFile = postsFile.replace(
  `if (poll && poll.question && Array.isArray(poll.options) && poll.options.length >= 2) {`,
  `if (poll && poll.question && typeof poll.question === 'string' && Array.isArray(poll.options) && poll.options.length >= 2) {`
);

fs.writeFileSync('server/routes/polls.js', pollsFile);
fs.writeFileSync('server/routes/posts.js', postsFile);
console.log('Fixed logical dilution bugs and crash vulnerabilities!');
