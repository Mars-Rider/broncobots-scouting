// Firebase configuration - Broncobots Scouting
// Project: broncobots-scouting-3185e

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  authDomain: "broncobots-scouting-3185e.firebaseapp.com",
  projectId: "broncobots-scouting-3185e",
  storageBucket: "broncobots-scouting-3185e.appspot.com",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

