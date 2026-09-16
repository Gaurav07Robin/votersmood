import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
  authDomain: "votersmood78.firebaseapp.com",
  projectId: "votersmood78",
  storageBucket: "votersmood78.firebasestorage.app",
  messagingSenderId: "908059965361",
  appId: "1:908059965361:web:aa19dcaca58574f5cd6f90"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addModi() {
  const leaderRef = doc(db, 'leaders', 'narendra-modi');
  await setDoc(leaderRef, {
    id: "narendra-modi",
    name: "Narendra Modi",
    displayName: "Narendra Modi",
    state: "Uttar Pradesh",
    district: "Varanasi",
    constituency: "Varanasi",
    party: "BJP",
    type: "MP_LS",
    repType: "MP_LS",
    chamber: "Lok Sabha",
    age: 73,
    gender: "Male",
    education: "Post Graduate",
    portfolio: "Prime Minister of India",
    portfolios: ["Prime Minister of India", "Member of Parliament"],
    seatType: "General",
    status: "Active",
    verificationStatus: "Verified",
    termStart: "2014-05-26",
    electionYear: "2024",
    profilePhoto: "https://api.dicebear.com/10.x/avataaars/svg?seed=narendra-modi",
    createdAt: Date.now(),
    openQuestionsCount: 0,
    pendingCount: 0,
    answeredCount: 0,
    totalCommentsCount: 0,
    totalReactionsCount: 0,
    agreeCount: 0,
    funnyCount: 0,
    website: "https://www.narendramodi.in/"
  }, { merge: true });
  console.log("Added Narendra Modi to Firestore");
  process.exit(0);
}

addModi();
