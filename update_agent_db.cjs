const fs = require('fs');
let code = fs.readFileSync('server/scripts/election_agent.js', 'utf8');

const oldCode = `      // Save to Firestore using Admin SDK
      const db = await getDb();
      const docId = \`\${state.toLowerCase()}-\${electionName.toLowerCase().replace(/\\s+/g, '-')}-\${year}\`;
      const collectionName = 'live_elections';
      
      await db.collection(collectionName).doc(docId).set(structuredData, { merge: true });`;

const newCode = `      // Save to Firestore using Admin SDK
      const db = await getDb();
      const docId = \`\${state.toLowerCase()}-\${electionName.toLowerCase().replace(/\\s+/g, '-')}-\${year}\`;
      
      // Determine collection based on election type
      let collectionName = 'live_elections';
      if (electionType === 'ASSEMBLY') {
        collectionName = 'state_elections_metadata';
      } else if (electionType === 'LOK_SABHA') {
        collectionName = 'elections_metadata';
      }

      // Map partyStandings array to partyWins object for the timeline charts
      if (collectionName === 'state_elections_metadata' || collectionName === 'elections_metadata') {
        const partyWins = {};
        if (structuredData.partyStandings && Array.isArray(structuredData.partyStandings)) {
          structuredData.partyStandings.forEach(p => {
             partyWins[p.party] = p.seatsWon;
          });
        }
        structuredData.partyWins = partyWins;
        // Ensure year is an integer
        structuredData.year = parseInt(structuredData.year) || year;
        // Ensure totalSeats is available
        structuredData.totalSeats = parseInt(structuredData.totalSeats) || 0;
      }

      await db.collection(collectionName).doc(docId).set(structuredData, { merge: true });`;

code = code.replace(oldCode, newCode);

fs.writeFileSync('server/scripts/election_agent.js', code);
console.log('election_agent.js updated successfully!');
