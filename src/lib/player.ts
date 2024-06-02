import {
  collection,
  getDocs,
  query,
  orderBy,
  addDoc,
  writeBatch,
  doc,
  where
} from 'firebase/firestore';
import type { Player } from './types';
import { db } from '$lib/firebase';
import type { RatingMap } from './elo';

const collection_name = 'players';

export async function getPlayers(): Promise<Player[]> {
  const querySnapshot = await getDocs(
    query(collection(db, collection_name), orderBy('rating', 'desc'))
  );
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Player[];
}

export async function addPlayer(player: Player): Promise<void> {
  console.log('Add player', player);
  await addDoc(collection(db, collection_name), player);
}

export async function updateRatings(ratingMap: RatingMap) {
  const playersRef = collection(db, collection_name);
  const players = await getDocs(playersRef);

  const batch = writeBatch(db);

  players.docs.forEach((playerDoc) => {
    const docRef = doc(db, collection_name, playerDoc.id);
    const player = playerDoc.data() as Player;
    batch.update(docRef, { rating: ratingMap[player.name] });
  });

  // await batch.commit();
}


export async function removeTest() {
  const playersRef = collection(db, 'players');
  const q = query(playersRef, where('name', '>=', 'test'), where('name', '<', 'test\uF7FF'));
  const querySnapshot = await getDocs(q);

  const batch = writeBatch(db);

  querySnapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });

  // await batch.commit();
}


export async function resetRatings() {
  const playersRef = collection(db, collection_name);
  const players = await getDocs(playersRef);

  const batch = writeBatch(db);

  players.docs.forEach((playerDoc) => {
    const docRef = doc(db, collection_name, playerDoc.id);
    batch.update(docRef, { rating: 1200 });
  });

  // await batch.commit();
}