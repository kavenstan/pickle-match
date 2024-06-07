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
	onSnapshot,
	Timestamp
} from 'firebase/firestore';
import type { Session } from '../types';
import { db } from '$lib/firebase';
import { SessionStatus } from '../enums';
import { writable } from 'svelte/store';
import { getMatchesForSession } from './match';

const collection_name = 'sessions';

// Store

export const sessionStore = writable<Session | null>();

// Firestore

export const subscribeToSession = (sessionId: string) => {
	const sessionRef = doc(collection(db, collection_name), sessionId);

	return onSnapshot(sessionRef, (doc) => {
		sessionStore.set(doc.data() as Session);
	});
};

export async function getSession(sessionId: string): Promise<Session> {
	const sessionRef = doc(db, collection_name, sessionId);
	const sessionDoc = await getDoc(sessionRef);
	return { id: sessionDoc.id, ...sessionDoc.data() } as Session;
}

export async function getSessions(): Promise<Session[]> {
	const querySnapshot = await getDocs(
		query(collection(db, collection_name), orderBy('date', 'desc'))
	);
	return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Session[];
}

export async function getActiveSession(): Promise<Session | null> {
	// console.log("Get active session");

	const sessionsCollectionRef = collection(db, collection_name);
	const q = query(sessionsCollectionRef, where('state.status', '!=', SessionStatus.Completed));
	const querySnapshot = await getDocs(q);

	let session: Session | null = null;
	querySnapshot.forEach((doc) => {
		const data = doc.data() as Session;
		if (data.state.status !== SessionStatus.Completed) {
			session = data;
			return;
		}
	});

	return session;
}

export async function getSessionsByDate(timestamp: Timestamp): Promise<Session[]> {
	const sessionsCollectionRef = collection(db, collection_name);
	const q = query(sessionsCollectionRef, where('date', '==', timestamp));
	const querySnapshot = await getDocs(q);
	console.log(querySnapshot.docs);
	return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Session[];
}

export async function addSession(session: Session): Promise<void> {
	const sessionRef = doc(collection(db, collection_name), session.id);
	await setDoc(sessionRef, session);
}

export async function updateSession(session: Partial<Session>): Promise<void> {
	// console.log('Update Session', session);
	if (!session.id) {
		throw Error('Session id required for update');
	}
	const sessionRef = doc(db, collection_name, session.id!);
	await updateDoc(sessionRef, session);
}

export async function fixSession(sessionId: string) {
	let session = await getSession(sessionId);
	let matches = await getMatchesForSession(sessionId);

	const playerSet = new Set<string>();

	matches.forEach((match) => {
		match.team1.forEach((playerId) => playerSet.add(playerId));
		match.team2.forEach((playerId) => playerSet.add(playerId));
	});

	let playerIds = Array.from(playerSet);

	session.state.activePlayerIds = playerIds;
	session.state.allPlayerIds = playerIds;

	await updateSession({
		id: sessionId,
		state: session.state
	});
}
