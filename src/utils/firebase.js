import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  onSnapshot,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  getDocs
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebaseConfig';

// ═══════════════════════════════════════════════════════════════════════════
// ENTRIES - /entries/team#/entries/entryId
// Each team's entries stored as subcollection documents
// ═══════════════════════════════════════════════════════════════════════════

// Subscribe to all entries (listens to /entries collection)
export function subscribeToEntries(callback) {
  const entriesRef = collection(db, 'entries');
  
  return onSnapshot(entriesRef, { includeMetadataChanges: true }, (teamDocsSnapshot) => {
    if (teamDocsSnapshot.empty) {
      callback([]);
      return;
    }
    
    const allEntries = [];
    
    teamDocsSnapshot.forEach((teamDoc) => {
      const data = teamDoc.data();
      
      // Each document contains entry data for a team
      if (data && data.teamNumber) {
        const deserializedData = deserializeFromFirestore(data);
        allEntries.push({ 
          ...deserializedData, 
          teamNumber: String(deserializedData.teamNumber),
          id: teamDoc.id 
        });
      }
    });
    
    callback([...allEntries]);
  }, (error) => {
    console.error('Error fetching entries:', error);
    callback([]);
  });
}

// Helper to convert arrays to objects (Firestore doesn't support nested arrays)
// Also handles base64 images specially (skips them due to size limits)
function serializeForFirestore(obj, depth = 0) {
  if (obj === null || obj === undefined) return null;
  
  // Skip base64 data URLs (images) - too large for Firestore
  if (typeof obj === 'string' && obj.startsWith('data:image/')) {
    return '[IMAGE_DATA_REMOVED]';
  }
  
  if (typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    // Check if this array contains nested arrays (like autoRoutes)
    const hasNestedArrays = obj.some(item => Array.isArray(item));
    
    if (hasNestedArrays) {
      // Convert nested arrays to objects that Firestore can store
      const converted = obj.map((item, index) => {
        if (Array.isArray(item)) {
          // Each route is an array of points - convert to object
          return {
            '_type': 'route',
            'points': item.map(p => serializeForFirestore(p, depth + 1))
          };
        }
        return serializeForFirestore(item, depth + 1);
      });
      return converted;
    }
    
    // For simple arrays (like photo URLs, intakeMech, crossPath), map directly
    // Note: Photos are now URLs stored in Firebase Storage, so they're just strings
    return obj.map(item => serializeForFirestore(item, depth + 1));
  }
  
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  
  const result = {};
  for (const key of Object.keys(obj)) {
    result[key] = serializeForFirestore(obj[key], depth + 1);
  }
  return result;
}

// Helper to restore arrays from objects (inverse of serializeForFirestore)
function deserializeFromFirestore(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  
  // Check if this is an array (has numeric keys 0, 1, 2... and a _length property)
  // This handles old data stored with numeric keys
  const keys = Object.keys(obj);
  const hasNumericKeys = keys.every(k => !isNaN(Number(k)));
  const hasLength = '_length' in obj;
  
  if (hasNumericKeys && hasLength) {
    const arr = [];
    for (let i = 0; i < obj['_length']; i++) {
      arr.push(deserializeFromFirestore(obj[i]));
    }
    return arr;
  }
  
  // Handle route objects (converted from nested arrays)
  if (obj['_type'] === 'route' && obj['points']) {
    return obj['points'].map(p => deserializeFromFirestore(p));
  }
  
  // Handle plain objects
  const result = {};
  for (const key of Object.keys(obj)) {
    result[key] = deserializeFromFirestore(obj[key]);
  }
  return result;
}

// Add an entry for a specific team
// /entries/team# (document ID = teamNumber)
export async function saveEntry(entry) {
  try {
    const teamNumber = String(entry.teamNumber || '');
    
    if (!teamNumber) {
      console.error('No teamNumber provided:', entry);
      throw new Error('teamNumber is required');
    }
    
    // First, upload photos to Firebase Storage if any exist
    let photoUrls = [];
    if (entry.photos && entry.photos.length > 0) {
      photoUrls = await uploadPhotos(teamNumber, entry.photos);
    }
    
    // Clean the entry data - remove any non-serializable fields
    // Replace base64 photos with URLs from Storage
    const { photos, ...rest } = entry;
    const cleanEntry = serializeForFirestore({
      ...rest,
      photos: photoUrls, // Store URLs instead of base64
      teamNumber: teamNumber,
      updatedAt: new Date().toISOString(),
      timestamp: entry.timestamp || new Date().toISOString()
    });

    // Store as a document directly under /entries/ with teamNumber as the document ID
    const entryDocRef = doc(db, 'entries', teamNumber);
    await setDoc(entryDocRef, cleanEntry);
    
    return teamNumber;
  } catch (error) {
    console.error('Error saving entry:', error, entry);
    throw error;
  }
}

// Update an existing entry
export async function updateEntry(updatedEntry) {
  try {
    const teamNumber = String(updatedEntry.teamNumber || '');
    
    if (!teamNumber) {
      console.error('No teamNumber provided for update:', updatedEntry);
      return;
    }

    // First, upload new photos to Firebase Storage if any exist (and are base64)
    let photoUrls = updatedEntry.photos || [];
    const hasNewPhotos = updatedEntry.photos && updatedEntry.photos.some(
      p => typeof p === 'string' && p.startsWith('data:image/')
    );
    
    if (hasNewPhotos) {
      photoUrls = await uploadPhotos(teamNumber, updatedEntry.photos);
    }
    
    // Serialize the data - photos are now URLs so they're simple strings
    const { photos, ...rest } = updatedEntry;
    const cleanEntry = serializeForFirestore({
      ...rest,
      photos: photoUrls,
      updatedAt: new Date().toISOString()
    });

    // Store directly under /entries/teamNumber/
    const entryDocRef = doc(db, 'entries', teamNumber);
    await setDoc(entryDocRef, cleanEntry);
  } catch (error) {
    console.error('Error updating entry:', error, updatedEntry);
    throw error;
  }
}

// Delete an entry by ID (teamNumber)
export async function deleteEntry(entryId, teamNumber) {
  const entryDocRef = doc(db, 'entries', String(teamNumber));
  await deleteDoc(entryDocRef);
}

// Clear all entries for a specific team
export async function clearTeamEntries(teamNumber) {
  const entryDocRef = doc(db, 'entries', String(teamNumber));
  await deleteDoc(entryDocRef);
}

// Clear all entries (all teams)
export async function clearAllEntries() {
  const entriesRef = collection(db, 'entries');
  
  const entriesSnapshot = await getDocs(entriesRef);
  const deletePromises = entriesSnapshot.docs.map(teamDoc => 
    deleteDoc(teamDoc.ref)
  );
  await Promise.all(deletePromises);
}

// Helper to get a single entry
export async function getEntry(teamNumber, entryId) {
  const entryDocRef = doc(db, 'entries', String(teamNumber));
  const entryDoc = await getDoc(entryDocRef);
  
  if (entryDoc.exists()) {
    const data = entryDoc.data();
    return deserializeFromFirestore({ id: entryDoc.id, ...data });
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// HISTORY - /history/compId (with teams subcollection)
// Structure: /history/{compId}/teams/{teamNumber}
// ═══════════════════════════════════════════════════════════════════════════

// Subscribe to history
export function subscribeToHistory(callback) {
  const historyRef = collection(db, 'history');
  const q = query(historyRef, orderBy('archivedAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const historyList = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      // Deserialize entries if present
      if (data.entries) {
        data.entries = deserializeFromFirestore(data.entries);
      }
      historyList.push({ id: doc.id, ...data });
    });
    callback(historyList);
  }, (error) => {
    console.error('Error fetching history:', error);
    callback([]);
  });
}

// Archive competition to history
// /history/{compId}/teams/{teamNumber}
export async function archiveCompetition(compName, entries) {
  const compId = Date.now().toString();
  
  // Group entries by team number
  const teamEntriesMap = {};
  entries.forEach(entry => {
    const teamNum = String(entry.teamNumber);
    if (!teamEntriesMap[teamNum]) {
      teamEntriesMap[teamNum] = [];
    }
    teamEntriesMap[teamNum].push(entry);
  });
  
  // Create main competition document
  const compRef = doc(db, 'history', compId);
  await setDoc(compRef, {
    name: compName,
    archivedAt: new Date().toISOString(),
    teamCount: Object.keys(teamEntriesMap).length,
    entryCount: entries.length,
    lastUpdated: serverTimestamp()
  });
  
  // Store each team's entries as documents (serialize to handle arrays)
  const teamPromises = Object.entries(teamEntriesMap).map(([teamNum, teamEntries]) => {
    const teamRef = doc(db, 'history', compId, 'teams', teamNum);
    // Serialize the entries array
    const serializedEntries = serializeForFirestore(teamEntries);
    return setDoc(teamRef, {
      entries: serializedEntries,
      teamName: teamEntries[0]?.teamName || `Team ${teamNum}`,
      lastUpdated: serverTimestamp()
    });
  });
  
  await Promise.all(teamPromises);
  
  return compId;
}

// Delete an archived competition
export async function deleteCompetition(compId) {
  const compRef = doc(db, 'history', compId);
  
  // First, delete all team subcollections
  const teamsRef = collection(db, 'history', compId, 'teams');
  const teamsSnapshot = await getDocs(teamsRef);
  
  const deletePromises = teamsSnapshot.docs.map(teamDoc => 
    deleteDoc(teamDoc.ref)
  );
  await Promise.all(deletePromises);
  
  // Then delete the competition document
  await deleteDoc(compRef);
}

// Get entries for a specific team in a competition
export async function getTeamHistoryEntry(compId, teamNumber) {
  const teamRef = doc(db, 'history', compId, 'teams', String(teamNumber));
  const teamDoc = await getDoc(teamRef);
  
  if (teamDoc.exists()) {
    const data = teamDoc.data();
    // Deserialize the entries array
    if (data.entries) {
      data.entries = deserializeFromFirestore(data.entries);
    }
    return data;
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION - /configuration/settings
// ═══════════════════════════════════════════════════════════════════════════

// Subscribe to configuration
export function subscribeToConfig(callback) {
  const configRef = doc(db, 'configuration', 'settings');
  
  return onSnapshot(configRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data());
    } else {
      callback({ competitionName: '', teams: [] });
    }
  }, (error) => {
    console.error('Error fetching config:', error);
    callback({ competitionName: '', teams: [] });
  });
}

// Save configuration
export async function saveConfig(config) {
  const configRef = doc(db, 'configuration', 'settings');
  await setDoc(configRef, {
    ...config,
    lastUpdated: serverTimestamp()
  }, { merge: true });
}

// ═══════════════════════════════════════════════════════════════════════════
// PHOTO STORAGE - Upload photos to Firebase Storage
// ═══════════════════════════════════════════════════════════════════════════

// Upload photos to Firebase Storage and return the download URLs
export async function uploadPhotos(teamNumber, photos) {
  if (!photos || photos.length === 0) return [];
  
  const urls = [];
  
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    // Skip if already a URL (not a base64 image)
    if (typeof photo === 'string' && photo.startsWith('http')) {
      urls.push(photo);
      continue;
    }
    
    // Skip if it's the placeholder for removed photos
    if (photo === '[IMAGE_DATA_REMOVED]') {
      continue;
    }
    
    // Only process base64 images
    if (typeof photo === 'string' && photo.startsWith('data:image/')) {
      try {
        // Convert base64 to blob
        const base64Response = await fetch(photo);
        const blob = await base64Response.blob();
        
        // Create a unique filename
        const timestamp = Date.now();
        const filename = `team_${teamNumber}_${timestamp}_${i}.jpg`;
        const storageRef = ref(storage, `photos/${filename}`);
        
        // Upload the blob
        await uploadBytes(storageRef, blob);
        
        // Get the download URL
        const downloadURL = await getDownloadURL(storageRef);
        urls.push(downloadURL);
      } catch (error) {
        console.error('Error uploading photo:', error);
        // Continue with other photos if one fails
      }
    }
  }
  
  return urls;
}

