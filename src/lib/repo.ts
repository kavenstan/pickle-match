import {
	collection,
	getDocs,
	query,
	orderBy,
	addDoc,
	where,
	writeBatch,
	setDoc,
	updateDoc,
	doc,
	getDoc
} from 'firebase/firestore';
import type { Session, Player, Match, Round } from './types';
import { db } from '$lib/firebase';

const collection_players = 'players';
const collection_sessions = 'sessions';

export async function fetchPlayers(): Promise<Player[]> {
	const querySnapshot = await getDocs(
		query(collection(db, collection_players), orderBy('rating', 'desc'))
	);
	return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Player[];
}

export async function addPlayer(player: Player): Promise<void> {
	// console.log('Add player', player);
	await addItem<Player>(player, collection_players);
}

// Sessions

export async function fetchSessions(): Promise<Session[]> {
	const querySnapshot = await getDocs(
		query(collection(db, collection_sessions), orderBy('date', 'desc'))
	);
	return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Session[];
}

export async function addSession(session: Session): Promise<void> {
	await addDoc(collection(db, collection_sessions), session);
}

export async function updateSession(session: Partial<Session>): Promise<void> {
	// console.log('Update Session', session);
	const sessionRef = doc(db, 'sessions', session.id!);
	await updateDoc(sessionRef, session);
}

export async function getSession(session: Session): Promise<Session> {
	const sessionRef = doc(db, 'sessions', session.id!);
	const sessionDoc = await getDoc(sessionRef);
	return { id: sessionDoc.id, ...sessionDoc.data() } as Session;
}

// Session.Match
export async function addNewSessionRound(sessionId: string, round: Round): Promise<void> {
	const sessionRef = doc(db, 'sessions', sessionId);
	const sessionDoc = await getDoc(sessionRef);

	if (sessionDoc.exists()) {
		const sessionData = sessionDoc.data() as Session;

		const updatedRounds = sessionData.rounds;
		updatedRounds.push(round);

		await updateDoc(sessionRef, { rounds: updatedRounds });
	}
}

export async function updateMatchScore(sessionId: string, updatedMatch: Match): Promise<void> {
	// console.log('Update match score', sessionId, updatedMatch);
	const sessionRef = doc(db, 'sessions', sessionId);
	const sessionDoc = await getDoc(sessionRef);

	if (sessionDoc.exists()) {
		const sessionData = sessionDoc.data() as Session;

		const updatedRounds = sessionData.rounds.map((round) => {
			const updatedMatches = round.matches.map((match) =>
				match.id === updatedMatch.id ? updatedMatch : match
			);
			return { ...round, matches: updatedMatches };
		});

		await updateDoc(sessionRef, { rounds: updatedRounds });
	}
}

// Generic

export async function addItem<T>(item: T, collectionName: string): Promise<void> {
	// console.log('Add Item', item);
	await addDoc(collection(db, collectionName), item as object);
}

/*
export async function removeTest() {
	const playersRef = collection(db, 'players');
	const q = query(playersRef, where('name', '>=', 'test'), where('name', '<', 'test\uF7FF'));
	const querySnapshot = await getDocs(q);

	const batch = writeBatch(db);

	querySnapshot.forEach((doc) => {
		batch.delete(doc.ref);
	});

	await batch.commit();
}
*/
