// Firebase configuration - Broncobots Scouting
// Project: broncobots-scouting-3185e

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyD9z72U_9q6EwwLedAijiESyHigsWOYuM8",
  authDomain: "broncobots-scouting-3185e.firebaseapp.com",
  projectId: "broncobots-scouting-3185e",
  storageBucket: "broncobots-scouting-3185e.firebasestorage.app",
  messagingSenderId: "921887147292",
  appId: "1:921887147292:web:09f4aa778a33886e71a6d9"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

