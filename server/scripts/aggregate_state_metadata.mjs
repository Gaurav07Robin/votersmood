import { getDb } from '../config/firebase-admin.js';

async function aggregateStateMetadata() {
    console.log("=========================================");
    console.log("📊 AGGREGATING STATE ELECTIONS METADATA");
    console.log("=========================================\n");

    const db = await getDb();
    console.log("Fetching all constituencies from elections_constituencies...");
    
    // Fetch all constituencies (Firebase Admin SDK has high limits, this is fine for ~25k docs)
    const snap = await db.collection('elections_constituencies').get();
    console.log(`Found ${snap.size} constituencies.`);

    // Group by State and Year
    const aggregations = {};

    snap.forEach(doc => {
        const data = doc.data();
        const state = data.state;
        const year = data.year;
        const key = `${state}_${year}`;

        if (!aggregations[key]) {
            aggregations[key] = {
                state: state,
                stateSlug: state.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                year: year,
                total_seats: 0,
                party_wins: {}
            };
        }

        aggregations[key].total_seats += 1;

        // Find the winner
        if (data.candidates && data.candidates.length > 0) {
            // Sort by votes
            const winner = data.candidates.sort((a, b) => b.votes - a.votes)[0];
            const party = winner.party || 'IND';
            
            if (!aggregations[key].party_wins[party]) {
                aggregations[key].party_wins[party] = 0;
            }
            aggregations[key].party_wins[party] += 1;
        }
    });

    console.log(`Aggregated into ${Object.keys(aggregations).length} distinct state elections.`);
    console.log("Pushing to state_elections_metadata...");

    const batch = db.batch();
    let batchCount = 0; batch = db.batch();
    let totalCommits = 0;

    for (const key of Object.keys(aggregations)) {
        const data = aggregations[key];
        // e.g. STATE_uttar-pradesh_2022
        const docRef = db.collection('state_elections_metadata').doc(`STATE_${data.stateSlug}_${data.year}`);
        batch.set(docRef, data, { merge: true });
        batchCount++;

        if (batchCount === 400) {
            await batch.commit();
            totalCommits += batchCount;
            console.log(`Committed ${totalCommits} documents...`);
            batchCount = 0;
        }
    }

    if (batchCount > 0) {
        await batch.commit();
        totalCommits += batchCount;
        console.log(`Committed ${totalCommits} documents...`);
    }

    console.log("\n✅ ALL METADATA SUCCESSFULLY AGGREGATED AND PUSHED!");
}

aggregateStateMetadata().then(() => process.exit(0)).catch(console.error);
