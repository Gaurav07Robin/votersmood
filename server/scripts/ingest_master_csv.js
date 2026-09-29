import { getDb } from '../config/firebase-admin.js';
import fetch from 'node-fetch';
import fs from 'fs';
import { pipeline } from 'stream/promises';
import csv from 'csv-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const slugify = (text) => text?.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '') || '';

async function runMasterIngestion() {
  console.log("=============================================");
  console.log("🚀 OPINAR MASTER CSV INGESTION ENGINE");
  console.log("=============================================");
  
  const db = await getDb();
  
  // We will download a massive dataset of assembly elections. 
  // For safety and speed in this demo, we'll construct a mock "Master CSV" stream of Goa 2022 and UP 2022,
  // but architect it so it processes row-by-row just like a 500MB Lok Dhaba CSV.
  
  const masterDataRows = [
    { State_Name: 'Goa', Year: '2022', Constituency_Name: 'Panaji', Candidate: 'Atanasio Monserrate', Party: 'BJP', Votes: '6787', Position: '1' },
    { State_Name: 'Goa', Year: '2022', Constituency_Name: 'Panaji', Candidate: 'Utpal Parrikar', Party: 'IND', Votes: '6071', Position: '2' },
    { State_Name: 'Goa', Year: '2022', Constituency_Name: 'Margao', Candidate: 'Digambar Kamat', Party: 'INC', Votes: '13674', Position: '1' },
    { State_Name: 'Goa', Year: '2022', Constituency_Name: 'Margao', Candidate: 'Manohar Ajgaonkar', Party: 'BJP', Votes: '5880', Position: '2' },
    { State_Name: 'Uttar Pradesh', Year: '2022', Constituency_Name: 'Gorakhpur Urban', Candidate: 'Yogi Adityanath', Party: 'BJP', Votes: '165499', Position: '1' },
    { State_Name: 'Uttar Pradesh', Year: '2022', Constituency_Name: 'Gorakhpur Urban', Candidate: 'Subhawati Shukla', Party: 'SP', Votes: '62173', Position: '2' },
    { State_Name: 'Uttar Pradesh', Year: '2022', Constituency_Name: 'Karhal', Candidate: 'Akhilesh Yadav', Party: 'SP', Votes: '148196', Position: '1' },
    { State_Name: 'Uttar Pradesh', Year: '2022', Constituency_Name: 'Karhal', Candidate: 'S.P. Singh Baghel', Party: 'BJP', Votes: '80692', Position: '2' },
  ];

  console.log("📥 Processing Master CSV stream (simulating 50MB Lok Dhaba dataset)...");
  
  const constituencyMap = {};

  // Group rows by State -> Year -> Constituency
  for (const row of masterDataRows) {
    const state = row.State_Name;
    const year = parseInt(row.Year);
    const constituency = row.Constituency_Name;
    
    const key = `${state}_${year}_${constituency}`;
    
    if (!constituencyMap[key]) {
      constituencyMap[key] = {
        state: state,
        stateSlug: slugify(state),
        year: year,
        electionType: 'ASSEMBLY',
        constituency: constituency,
        constituencySlug: slugify(constituency),
        candidates: []
      };
    }
    
    constituencyMap[key].candidates.push({
      name: row.Candidate,
      party: row.Party,
      votes: parseInt(row.Votes),
      position: parseInt(row.Position)
    });
  }

  // Push to Firestore in Batches
  const batch = db.batch();
  let count = 0;
  
  console.log("💾 Writing to elections_constituencies collection...");
  
  for (const key of Object.keys(constituencyMap)) {
    const data = constituencyMap[key];
    // Sort candidates by position (Winner is [0])
    data.candidates.sort((a, b) => a.position - b.position);
    
    // Add margin if winner and runner up exist
    if (data.candidates.length >= 2) {
      data.margin = data.candidates[0].votes - data.candidates[1].votes;
      const total = data.candidates.reduce((sum, c) => sum + c.votes, 0);
      data.margin_percent = ((data.margin / total) * 100).toFixed(2) + '%';
      data.candidates[0].vote_share = ((data.candidates[0].votes / total) * 100).toFixed(2) + '%';
    }

    const docRef = db.collection('elections_constituencies').doc(`ASSEMBLY_${data.stateSlug}_${data.year}_${data.constituencySlug}`);
    batch.set(docRef, data, { merge: true });
    count++;
  }

  await batch.commit();
  console.log(`✅ Successfully batch inserted ${count} detailed constituency records into Firestore!`);
}

// Execute
runMasterIngestion().then(() => process.exit(0));
