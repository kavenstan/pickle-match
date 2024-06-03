import { getDoc, doc } from 'firebase/firestore';
import { writable, type Writable } from 'svelte/store';
import { db } from './firebase';

export const ROLE_ADMIN = 'admin';

export const PERMISSION_UPLOAD = 'upload';
export const PERMISSION_SESSION_WRITE = 'session.write';
export const PERMISSION_PLAYER_WRITE = 'player.write';

const collection_name = 'roles';

type User = {
	email?: string | null;
	displayName?: string | null;
	// photoURL?: string | null;
	// uid?: string | null;
};

export type SessionState = {
	user: User | null;
	role: string;
	loading?: boolean;
	loggedIn?: boolean;
};

export const userSession = <Writable<SessionState>>writable();

export const fetchRole = async (userId: string) => {
	const roleDoc = await getDoc(doc(db, collection_name, userId));
	let role = '';
	if (roleDoc.exists()) {
		role = roleDoc.data().role
	}

	userSession.update(curr => ({
		...curr,
		role
	}));

}

export const hasRole = (session: SessionState, role: string): boolean => {
	if (!session || !session.user || !session.role) {
		return false;
	}
	if (session.role === ROLE_ADMIN) {
		return true;
	}
	return false;
}

export const hasPermission = (session: SessionState, permission: string): boolean => {
	// console.log("hasPermission", session);
	if (!session || !session.user || !session.role) {
		return false;
	}
	if (session.role === ROLE_ADMIN) {
		return true;
	}
	return false;
}