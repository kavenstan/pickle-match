import {
	collection,
	getDocs,
	query,
	orderBy,
	addDoc,
	writeBatch,
	doc,
	getDoc,
	setDoc,
	updateDoc
} from 'firebase/firestore';
import type { Player, PlayerMatchStats, Rating, Seeding } from '$lib/types';
import { db } from '$lib/firebase';
import { writable } from 'svelte/store';

const collection_name = 'players';

// Store

export const playersStore = writable<Record<string, Player>>({});
export const seedingStore = writable<Seeding[]>([]);

// Firestore

export const getPlayers = async (): Promise<Player[]> => {
	const querySnapshot = await getDocs(
		query(collection(db, collection_name), orderBy('rating', 'desc'))
	);
	return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Player);
};

export const fetchPlayers = async (): Promise<void> => {
	const players = await getPlayers();
	const map = players.reduce(
		(acc, player) => {
			acc[player.id] = player;
			return acc;
		},
		{} as Record<string, Player>
	);
	playersStore.set(map);
};

export const addPlayer = async (player: Player): Promise<void> => {
	console.log('Add player', player);
	const playerRef = doc(collection(db, collection_name), player.id);
	await setDoc(playerRef, player);
	playersStore.update((current) => {
		current[player.id] = player;
		return current;
	});
};

export const updateRatings = async (ratings: Record<string, Rating>): Promise<void> => {
	const batch = writeBatch(db);

	for (const playerId in ratings) {
		const playerRef = doc(db, collection_name, playerId);
		batch.update(playerRef, { rating: ratings[playerId] });
	}

	await batch.commit();
};

export const updatePlayerRating = async (id: string, rating: Rating) => {
	const ref = doc(db, collection_name, id);
	await updateDoc(ref, { rating });
}

export const updatePlayerStats = async (id: string, matchStats: PlayerMatchStats) => {
	const ref = doc(db, collection_name, id);
	await updateDoc(ref, { matchStats });
}

export const resetAllPlayerStats = async () => {
	const players = await getPlayers();
	const batch = writeBatch(db);

	const defaultMatchStats = {
		played: 0,
		won: 0,
		lost: 0,
		drawn: 0,
		pointsFor: 0,
		pointsAgainst: 0
	}

	for (const player of players) {
		const playerRef = doc(db, collection_name, player.id);
		const playerDoc = await getDoc(playerRef);
		batch.update(playerRef, { matchStats: defaultMatchStats });
	}

	await batch.commit();
}

export const updatePlayersStats = async (
	playerStats: Record<string, PlayerMatchStats>
): Promise<void> => {
	const batch = writeBatch(db);

	for (const playerId in playerStats) {
		if (playerStats.hasOwnProperty(playerId)) {
			const playerRef = doc(db, 'players', playerId);
			const playerDoc = await getDoc(playerRef);

			if (playerDoc.exists()) {
				const updatedMatchStats = {
					played: playerStats[playerId].played,
					won: playerStats[playerId].won,
					lost: playerStats[playerId].lost,
					drawn: playerStats[playerId].drawn,
					pointsFor: playerStats[playerId].pointsFor,
					pointsAgainst: playerStats[playerId].pointsAgainst
				};

				batch.update(playerRef, { matchStats: updatedMatchStats });
			} else {
				console.error(`Player with ID ${playerId} does not exist.`);
			}
		}
	}

	await batch.commit();
};
