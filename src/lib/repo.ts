import {
	collection,
	addDoc,
	doc,
	getDoc
} from 'firebase/firestore';
import { db } from '$lib/firebase';


// Generic

export async function addItem<T>(item: T, collectionName: string): Promise<void> {
	// console.log('Add Item', item);
	await addDoc(collection(db, collectionName), item as object);
}

export async function getItem<T>(collectionName: string, id: string): Promise<T> {
	// console.log('Get Item', item);
	const ref = doc(db, collectionName, id);
	const refDoc = await getDoc(ref);
	return { id: refDoc.id, ...refDoc.data() } as T;
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
