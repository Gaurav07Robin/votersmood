import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = util.promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function runScript(scriptName) {
    console.log(`[Orchestrator] Launching ${scriptName}...`);
    try {
        const { stdout, stderr } = await execAsync(`node ${path.join(__dirname, scriptName)}`);
        if (stdout) console.log(`[${scriptName}] ${stdout.trim()}`);
        if (stderr) console.error(`[${scriptName}] ERR: ${stderr.trim()}`);
        return true;
    } catch (e) {
        console.error(`[Orchestrator] Fatal error running ${scriptName}:`, e.message);
        return false;
    }
}

async function startBrain() {
    console.log("=========================================");
    console.log("🧠 MASTER ORCHESTRATOR DAEMON ONLINE");
    console.log("=========================================\n");

    let cycleCount = 0;

    while (true) {
        cycleCount++;
        console.log(`\n[Orchestrator] Starting cycle ${cycleCount} at ${new Date().toISOString()}`);

        // 1. Data Ingestion (TCPD)
        console.log("[Orchestrator] Triggering TCPD Historical Data Ingestion...");
        await runScript('tcpd_ingestor.js');
        
        await delay(10000);

        // 2. Data Verification
        console.log("[Orchestrator] Triggering Data Verifier Audit...");
        await runScript('data_verifier.js');

        await delay(10000);

        // 3. AI Insights Generation
        console.log("[Orchestrator] Commanding AI Journalist to write new Insight...");
        await runScript('generate_insight.js');

        await delay(10000);

        // 4. Live Election Radar (Runs once every 24 cycles = 24 hours)
        if (cycleCount === 1 || cycleCount % 24 === 0) {
            console.log("[Orchestrator] 📡 Triggering 24-Hour Live Election & Bypoll Radar...");
            await runScript('live_election_tracker.js');
        }

        console.log("\n[Orchestrator] Cycle complete. Sleeping for 1 hour to prevent API limits...");
        await delay(3600000); // 1 hour
    }
}

startBrain().catch(console.error);
