import { getDb } from '../config/firebase-admin.js';
import fetch from 'node-fetch';
import { createGunzip } from 'zlib';
import { parse } from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATE_FILE = path.join(__dirname, 'tcpd_ingest_state.json');

async function ingestTCPD() {
    console.log("[Data Ingestor] Initiating TCPD Master Archive Download...");
    const url = 'https://raw.githubusercontent.com/tcpd/tcpd-ld-data-archive/main/downloads/All_States/All_States_AE.csv.gz';
    
    let lastProcessedRow = 0;
    if (fs.existsSync(STATE_FILE)) {
        try {
            const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
            lastProcessedRow = state.lastProcessedRow || 0;
        } catch (e) {}
    }

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        console.log(`[Data Ingestor] Resuming from row offset: ${lastProcessedRow}`);
        const db = await getDb();
        
        let currentRow = 0;
        let ingestedThisRun = 0;
        let batch = db.batch();
        let batchCount = 0;
        let commits = 0;

        const parser = response.body.pipe(createGunzip()).pipe(parse({
            columns: true,
            skip_empty_lines: true
        }));

        for await (const row of parser) {
            currentRow++;
            if (currentRow <= lastProcessedRow) continue;

            // Only ingest winners to save writes
            if (row.Position !== '1') continue;

            const state = row.State_Name.replace(/_/g, ' ');
            const year = parseInt(row.Year, 10);
            const constituency = row.Constituency_Name;
            let stateSlug = state.toLowerCase().replace(/ /g, '-');
            
            const docRef = db.collection('elections_constituencies').doc(`${stateSlug}_${year}_${constituency.toLowerCase().replace(/[^a-z0-9]/g, '-')}`);
            batch.set(docRef, {
                state: state,
                stateSlug: stateSlug,
                year: year,
                electionType: 'ASSEMBLY',
                constituency: constituency,
                winner: row.Candidate,
                party: row.Party,
                margin: parseInt(row.Margin, 10) || 0,
                votes: parseInt(row.Votes, 10) || 0,
                source: 'TCPD_ARCHIVE',
                tcpd_pid: row.pid || null,
                timestamp: new Date().toISOString()
            });

            batchCount++;
            ingestedThisRun++;

            if (batchCount === 490) {
                await batch.commit();
                commits++;
                console.log(`[Data Ingestor] Committed batch ${commits} (Total imported this run: ${ingestedThisRun})`);
                batch = db.batch();
                batchCount = 0;
                fs.writeFileSync(STATE_FILE, JSON.stringify({ lastProcessedRow: currentRow }));
            }
            
            // Limit to 500 writes per cycle to respect Firebase Free Tier (20k/day)
            if (ingestedThisRun >= 500) {
                console.log("[Data Ingestor] Reached 500 limit for this hourly cycle. Pausing.");
                break;
            }
        }
        
        if (batchCount > 0) {
            await batch.commit();
            fs.writeFileSync(STATE_FILE, JSON.stringify({ lastProcessedRow: currentRow }));
        }
        
        console.log(`[Data Ingestor] ✅ SUCCESS! Ingested ${ingestedThisRun} TCPD records in this cycle.`);
    } catch (err) {
        console.error("[Data Ingestor] Fatal Error:", err);
    }
}

ingestTCPD();
