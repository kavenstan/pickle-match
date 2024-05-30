import { writable } from 'svelte/store';
import type { Session } from './types';

export const showModal = writable(false);


// import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
// import { app, db } from './firebase'; 

// export const currentSession = writable<Session | null>(null);

// // Function to subscribe to the document updates
// export const subscribeToDocument = (docId) => {
//     const documentRef = doc(db, 'collectionName', docId);

//     // Listen for real-time updates
//     onSnapshot(documentRef, (docSnapshot) => {
//         documentStore.set(docSnapshot.data());
//     });
// };