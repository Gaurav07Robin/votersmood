const fs = require('fs');
let code = fs.readFileSync('server/scripts/election_agent.js', 'utf8');

const target1 = "const collectionName = 'live_elections';";
const target2 = "await db.collection(collectionName).doc(docId).set(structuredData, { merge: true });";

if (code.includes(target1) && code.includes(target2)) {
  code = code.replace(target1, `let collectionName = 'live_elections';
      if (electionType === 'ASSEMBLY') collectionName = 'state_elections_metadata';
      if (electionType === 'LOK_SABHA') collectionName = 'elections_metadata';

      if (collectionName !== 'live_elections') {
        const partyWins = {};
        if (structuredData.partyStandings) {
          structuredData.partyStandings.forEach(p => partyWins[p.party] = p.seatsWon);
        }
        structuredData.partyWins = partyWins;
        structuredData.year = parseInt(structuredData.year) || year;
        structuredData.totalSeats = parseInt(structuredData.totalSeats) || 0;
      }`);
  fs.writeFileSync('server/scripts/election_agent.js', code);
  console.log("Success");
} else {
  console.log("Not found");
}
