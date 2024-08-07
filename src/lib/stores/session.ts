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
	Timestamp,
	deleteDoc
} from 'firebase/firestore';
import type { Session, State } from '../types';
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

export const deleteSession = async (sessionId: string) => {
	const sessionRef = doc(collection(db, collection_name), sessionId);
	await deleteDoc(sessionRef);
};

export async function getSessions(): Promise<Session[]> {
	const querySnapshot = await getDocs(
		query(collection(db, collection_name), orderBy('date', 'desc'))
	);
	return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Session[];
}

export const getPlayerSessions = async (playerId: string) => {
	const sessionsQuery = query(
		collection(db, collection_name),
		where('state.allPlayerIds', 'array-contains', playerId)
	);
	const querySnapshot = await getDocs(sessionsQuery);
	const sessions = querySnapshot.docs.map((doc) => doc.data()) as Session[];
	return sessions.sort((a, b) => a.date.toMillis() - b.date.toMillis());
};

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

export async function fetchActiveSession() {
	const session = await getActiveSession();
	sessionStore.set(session);
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
	console.log('Update Session', session);
	if (!session.id) {
		throw Error('Session id required for update');
	}
	const sessionRef = doc(db, collection_name, session.id!);
	await updateDoc(sessionRef, session);
}

export const updateState = async (
	sessionId: string,
	stateUpdates: Partial<State>
): Promise<void> => {
	const sessionDocRef = doc(db, collection_name, sessionId);
	const updates: Record<string, any> = {};

	for (const key in stateUpdates) {
		if (stateUpdates.hasOwnProperty(key)) {
			updates[`state.${key}`] = (stateUpdates as any)[key];
		}
	}

	try {
		await updateDoc(sessionDocRef, updates);
		console.log(`Successfully updated state for session ${sessionId}`);
	} catch (error) {
		console.error(`Error updating state for session ${sessionId}:`, error);
	}
};

export async function fixSession(sessionId: string) {
	let session = await getSession(sessionId);
	let matches = await getMatchesForSession(sessionId);

	const playerSet = new Set<string>();

	matches.forEach((match) => {
		match.team1.forEach((playerId) => playerSet.add(playerId));
		match.team2.forEach((playerId) => playerSet.add(playerId));
	});

	let playerIds = Array.from(playerSet);

	await updateState(session.id, {
		activePlayerIds: playerIds,
		allPlayerIds: playerIds
	});
}
