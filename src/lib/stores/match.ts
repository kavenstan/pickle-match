import { writable } from 'svelte/store';
import type { Match } from '../types';
import {
	collection,
	query,
	where,
	getDocs,
	doc,
	setDoc,
	writeBatch,
	updateDoc,
	onSnapshot,
	getDoc,
	deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';

const collection_name = 'matches';

// Store

export const matchesStore = writable<{
	[sessionId: string]: { loading: boolean; error: string | null; data: Match[] };
}>({});
export const sessionMatchesStore = writable<Match[]>([]);
export const matchStore = writable<Match | null>();

// Fire Store

export const subscribeToMatch = (matchId: string) => {
	const matchRef = doc(collection(db, collection_name), matchId);

	return onSnapshot(matchRef, (doc) => {
		matchStore.set(doc.data() as Match);
	});
};

export const removeMatch = async (matchId: string) => {
	const matchRef = doc(collection(db, collection_name), matchId);
	await deleteDoc(matchRef);
}

export const subscribeToMatches = (sessionId: string) => {
	console.log('subscribeToMatches', sessionId);
	const matchesRef = collection(db, collection_name);
	const matchesQuery = query(matchesRef, where('sessionId', '==', sessionId));

	return onSnapshot(matchesQuery, (snapshot) => {
		const matches: Match[] = snapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data()
		})) as Match[];
		sessionMatchesStore.set(matches);
	});
};

export async function getMatch(matchId: string): Promise<Match> {
	const matchRef = doc(db, collection_name, matchId);
	return (await getDoc(matchRef)).data() as Match;
}

export async function getMatches(): Promise<Match[]> {
	const matchesRef = collection(db, collection_name);
	const matches = await getDocs(matchesRef);
	return matches.docs.map((x) => x.data() as Match);
}

export async function fetchMatchesForSession(sessionId: string): Promise<void> {
	console.log('Fetch matches for session', sessionId);
	matchesStore.update((state) => ({
		...state,
		[sessionId]: { loading: true, error: null, data: [] }
	}));

	try {
		const matchesCollectionRef = collection(db, collection_name);
		const q = query(matchesCollectionRef, where('sessionId', '==', sessionId));
		const querySnapshot = await getDocs(q);
		const matches: Match[] = querySnapshot.docs.map((doc) => doc.data() as Match);

		matchesStore.update((state) => ({
			...state,
			[sessionId]: { loading: false, error: null, data: matches }
		}));
	} catch (error: any) {
		matchesStore.update((state) => ({
			...state,
			[sessionId]: { loading: false, error: error.message, data: [] }
		}));
	}
}

export async function getMatchesForSession(sessionId: string): Promise<Match[]> {
	const matchesCollectionRef = collection(db, collection_name);
	const q = query(matchesCollectionRef, where('sessionId', '==', sessionId));
	const querySnapshot = await getDocs(q);
	const matches: Match[] = querySnapshot.docs.map((doc) => doc.data() as Match);
	return matches;
}

export async function addMatch(match: Match) {
	console.log('Add match', match);
	const matchRef = doc(collection(db, collection_name), match.id);
	await setDoc(matchRef, match);
}

export async function addMatches(matches: Match[]) {
	// console.log("AddMatches", matches);
	const batch = writeBatch(db);

	matches.forEach((match) => {
		const matchRef = doc(collection(db, collection_name), match.id);
		batch.set(matchRef, match);
	});

	await batch.commit();
}

export async function updateMatchTeams(match: Match) {
	// console.log('Update match teams', match);
	const matchRef = doc(db, collection_name, match.id);
	await updateDoc(matchRef, { team1: match.team1, team2: match.team2 });
}

export async function updateMatchScore(match: Match): Promise<void> {
	// console.log('Update match score', match);
	const matchRef = doc(db, collection_name, match.id);
	await updateDoc(matchRef, { team1Score: match.team1Score, team2Score: match.team2Score });
}

export async function removeMatches() {
	const matchesRef = collection(db, collection_name);
	//
	//
	const q = query(matchesRef, where('sessionId', '==', 'dfb921c6-d672-41a4-b1b8-56d911b5f2ce'));
	const querySnapshot = await getDocs(q);

	const batch = writeBatch(db);

	querySnapshot.forEach((doc) => {
		batch.delete(doc.ref);
	});

	// await batch.commit();
}
