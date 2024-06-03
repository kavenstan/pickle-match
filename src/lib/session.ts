import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  updateDoc,
  doc,
  getDoc,
  setDoc,
  onSnapshot
} from 'firebase/firestore';
import type { Session } from './types';
import { db } from '$lib/firebase';
import { SessionStatus } from './enums';
import { writable } from 'svelte/store';
import { getMatchesForSession } from './match';

const collection_sessions = 'sessions';

// Store

export const sessionStore = writable<Session | null>();

// export const activeSessionStore = writable<{ loading: boolean, error: string | null, session: Session | null }>({
//   loading: false,
//   error: null,
//   session: null
// });
// export const activeSessionStore = writable<Session | null>();

// Firestore

export const subscribeToSession = (sessionId: string) => {
  const sessionRef = doc(collection(db, collection_sessions), sessionId);

  return onSnapshot(sessionRef, (doc) => {
    sessionStore.set(doc.data() as Session);
  });
};

// export const subscribeToActiveSession = () => {
//   console.log("subscribeToActiveSession");
//   const sessionRef = collection(db, collection_sessions);
//   const sessionQuery = query(sessionRef, where('state.status', '!=', SessionStatus.Completed));

//   return onSnapshot(sessionQuery, (snapshot) => {
//     const session: Session[] = snapshot.docs.map(doc => ({
//       id: doc.id,
//       ...doc.data()
//     })) as Session[];
//     activeSessionStore.set(session[0]);
//   });
// };

export async function getSession(sessionId: string): Promise<Session> {
  const sessionRef = doc(db, collection_sessions, sessionId);
  const sessionDoc = await getDoc(sessionRef);
  return { id: sessionDoc.id, ...sessionDoc.data() } as Session;
}

export async function getSessions(): Promise<Session[]> {
  const querySnapshot = await getDocs(
    query(collection(db, collection_sessions), orderBy('date', 'desc'))
  );
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Session[];
}

export async function getActiveSession(): Promise<Session | null> {
  console.log("Get active session");

  const sessionsCollectionRef = collection(db, collection_sessions);
  const q = query(sessionsCollectionRef, where('state.status', '!=', SessionStatus.Completed));
  const querySnapshot = await getDocs(q);

  let session: Session | null = null;
  querySnapshot.forEach(doc => {
    const data = doc.data() as Session;
    if (data.state.status !== SessionStatus.Completed) {
      session = data;
      return;
    }
  });

  return session;
}

// export async function fetchActiveSession(): Promise<void> {
//   console.log("Fetch active session");
//   activeSessionStore.update(_ => (
//     { loading: true, error: null, session: null }
//   ));

//   try {
//     const sessionsCollectionRef = collection(db, collection_sessions);
//     const q = query(sessionsCollectionRef, where('state.status', '!=', SessionStatus.Completed));
//     const querySnapshot = await getDocs(q);

//     let session: Session | null = null;
//     querySnapshot.forEach(doc => {
//       const data = doc.data() as Session;
//       if (data.state.status !== SessionStatus.Completed) {
//         session = data;
//         return;
//       }
//     });

//     activeSessionStore.update(_ => (
//       { loading: false, error: null, session }
//     ));

//   } catch (error: any) {
//     activeSessionStore.update(_ => (
//       { loading: false, error: error.message, session: null }
//     ));
//   }
// }

export async function addSession(session: Session): Promise<void> {
  const sessionRef = doc(collection(db, collection_sessions), session.id);
  await setDoc(sessionRef, session);
}

export async function updateSession(session: Partial<Session>): Promise<void> {
  // console.log('Update Session', session);
  if (!session.id) {
    throw Error("Session id required for update");
  }
  const sessionRef = doc(db, collection_sessions, session.id!);
  await updateDoc(sessionRef, session);
}

export async function fixSession(sessionId: string) {
  let session = await getSession(sessionId);
  let matches = await getMatchesForSession(sessionId);

  const playerSet = new Set<string>();

  matches.forEach(match => {
    match.team1.forEach(player => playerSet.add(player));
    match.team2.forEach(player => playerSet.add(player));
  });

  let players = Array.from(playerSet);

  session.state.activePlayers = players;
  session.state.allPlayers = players;

  await updateSession({
    id: sessionId,
    state: session.state
  })
}
