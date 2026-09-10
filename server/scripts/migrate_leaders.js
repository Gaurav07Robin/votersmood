import { app, db } from '../config/firebase.js';
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const geoData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/geography.json'), 'utf-8'));

const OLD_STATE_CODES = {
  "AP": "Andhra Pradesh", "AR": "Arunachal Pradesh", "AS": "Assam", "BR": "Bihar",
  "CT": "Chhattisgarh", "CG": "Chhattisgarh", "GA": "Goa", "GJ": "Gujarat",
  "HR": "Haryana", "HP": "Himachal Pradesh", "JH": "Jharkhand", "KA": "Karnataka",
  "KL": "Kerala", "MP": "Madhya Pradesh", "MH": "Maharashtra", "MN": "Manipur",
  "ML": "Meghalaya", "MZ": "Mizoram", "NL": "Nagaland", "OR": "Odisha", "OD": "Odisha",
  "PB": "Punjab", "RJ": "Rajasthan", "SK": "Sikkim", "TN": "Tamil Nadu",
  "TG": "Telangana", "TS": "Telangana", "TR": "Tripura", "UP": "Uttar Pradesh",
  "UT": "Uttarakhand", "UK": "Uttarakhand", "WB": "West Bengal",
  "AN": "Andaman and Nicobar Islands", "CH": "Chandigarh",
  "DN": "Dadra and Nagar Haveli and Daman and Diu",
  "DD": "Dadra and Nagar Haveli and Daman and Diu",
  "DL": "Delhi", "JK": "Jammu and Kashmir", "LA": "Ladakh",
  "LD": "Lakshadweep", "PY": "Puducherry"
};

const fuzzyMatch = (str1, str2) => {
  if (!str1 || !str2) return false;
  const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');
  return s1 === s2 || s1.includes(s2) || s2.includes(s1);
};

const runMigration = async () => {
  console.log('Fetching leaders from Firestore...');
  const snap = await getDocs(collection(db, 'leaders'));
  const leaders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`Found ${leaders.length} leaders.`);

  let updatedCount = 0;
  let failedCount = 0;

  // Process in batches of 500
  for (let i = 0; i < leaders.length; i += 500) {
    const batch = writeBatch(db);
    const chunk = leaders.slice(i, i + 500);

    for (const leader of chunk) {
      let rawConst = leader.constituency || '';
      if (rawConst.includes(',')) {
        rawConst = rawConst.split(',')[0].trim();
      }

      let targetState = OLD_STATE_CODES[leader.state] || leader.state;
      
      let matchedState = '';
      let matchedDistrict = '';
      let matchedConst = '';

      const isMP = leader.type === 'MP_LS' || leader.type === 'MP_RS' || leader.repType === 'MP_LS' || leader.repType === 'MP_RS';

      let found = false;
      let stateObj = geoData.find(s => s.name === targetState || fuzzyMatch(s.name, targetState));
      
      if (stateObj) {
        if (isMP) {
          const c = stateObj.parliamentary.find(pc => fuzzyMatch(pc.name, rawConst));
          if (c) {
            matchedState = stateObj.name;
            matchedConst = c.name;
            found = true;
          }
        } else {
          for (const [dist, acs] of Object.entries(stateObj.districts)) {
            const c = acs.find(ac => fuzzyMatch(ac.name, rawConst));
            if (c) {
              matchedState = stateObj.name;
              matchedDistrict = dist;
              matchedConst = c.name;
              found = true;
              break;
            }
          }
        }
      }

      if (!found) {
        for (const s of geoData) {
          if (isMP) {
            const c = s.parliamentary.find(pc => fuzzyMatch(pc.name, rawConst));
            if (c) {
              matchedState = s.name;
              matchedConst = c.name;
              found = true;
              break;
            }
          } else {
            for (const [dist, acs] of Object.entries(s.districts)) {
              const c = acs.find(ac => fuzzyMatch(ac.name, rawConst));
              if (c) {
                matchedState = s.name;
                matchedDistrict = dist;
                matchedConst = c.name;
                found = true;
                break;
              }
            }
          }
          if (found) break;
        }
      }

      if (found) {
        batch.update(doc(db, 'leaders', leader.id), {
          state: matchedState,
          district: matchedDistrict,
          constituency: matchedConst
        });
        updatedCount++;
      } else {
        if (stateObj) {
          batch.update(doc(db, 'leaders', leader.id), {
            state: stateObj.name
          });
          updatedCount++;
        } else {
          failedCount++;
        }
      }
    }
    
    await batch.commit();
    console.log(`Committed batch of ${chunk.length} leaders.`);
  }

  console.log(`Migration Complete. Successfully updated: ${updatedCount}. Failed: ${failedCount}.`);
  process.exit(0);
};

runMigration();
