import {
	collection,
	getDocs,
	query,
	orderBy,
	addDoc,
	writeBatch,
	doc,
	getDoc,
	setDoc
} from 'firebase/firestore';
import type { Player, PlayerMatchStats, Seeding } from '$lib/types';
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

export const updateRatings = async (ratingMap: Record<string, number>): Promise<void> => {
	const playersRef = collection(db, collection_name);
	const players = await getDocs(playersRef);

	const batch = writeBatch(db);

	players.docs.forEach((playerDoc) => {
		const docRef = doc(db, collection_name, playerDoc.id);
		const player = playerDoc.data() as Player;
		batch.update(docRef, { rating: ratingMap[player.id] });
	});

	await batch.commit();
};

// export const removeTest = async (): Promise<void>  => {
// 	const playersRef = collection(db, 'players');
// 	const q = query(playersRef, where('name', '>=', 'test'), where('name', '<', 'test\uF7FF'));
// 	const querySnapshot = await getDocs(q);

// 	const batch = writeBatch(db);

// 	querySnapshot.forEach((doc) => {
// 		batch.delete(doc.ref);
// 	});

// 	await batch.commit();
// }

// export const resetRatings = async (): Promise<void>  => {
// 	const playersRef = collection(db, collection_name);
// 	const players = await getDocs(playersRef);

// 	const batch = writeBatch(db);

// 	players.docs.forEach((playerDoc) => {
// 		const docRef = doc(db, collection_name, playerDoc.id);
// 		batch.update(docRef, { rating: 1200 });
// 	});

// 	// await batch.commit();
// }

export const updatePlayerStats = async (
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
