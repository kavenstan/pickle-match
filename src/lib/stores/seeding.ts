import { db } from '$lib/firebase';
import type { Seeding } from '$lib/types';
import { newId } from '$lib/utils';
import { getDocs, query, collection, writeBatch, doc } from 'firebase/firestore';

export const getSeedings = async (): Promise<Seeding[]> => {
	const querySnapshot = await getDocs(query(collection(db, 'seedings')));
	return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Seeding);
};

export const setSeedings = async (seedings: Seeding[]): Promise<void> => {
	const batch = writeBatch(db);

	seedings.forEach((seeding) => {
		if (!seeding.id) {
			seeding.id = newId();
		}
		const seedingRef = doc(collection(db, 'seedings'), seeding.id);
		batch.set(seedingRef, seeding);
	});
	await batch.commit();
};
