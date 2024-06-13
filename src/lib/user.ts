import { getDoc, doc } from 'firebase/firestore';
import { writable, type Writable } from 'svelte/store';
import { db } from './firebase';
import {
	getAuth,
	onAuthStateChanged,
	signOut as firebaseSignOut,
	type Auth,
	signInWithPopup,
	GoogleAuthProvider
} from 'firebase/auth';
import { app } from '$lib/firebase';

export const ROLE_ADMIN = 'admin';

export const PERMISSION_SYNC = 'sync';
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
	// loggedIn?: boolean;
};

const restrictedRoutes = [
	{ path: '/sync', permission: PERMISSION_SYNC },
	{ path: '/matchmaking', permission: PERMISSION_SESSION_WRITE }
];

export const userSession = <Writable<SessionState>>writable();

export const checkAuth = () => {
	let auth: Auth = getAuth(app);
	onAuthStateChanged(auth, async (firebaseUser) => {
		if (firebaseUser) {
			await fetchRole(firebaseUser.uid);
		}

		userSession.update((curr) => {
			return { ...curr, isLoading: false, user: firebaseUser };
		});
	});
};

export const signOut = async () => {
	let auth: Auth = getAuth(app);
	const result = await firebaseSignOut(auth);
	userSession.update((curr) => {
		return { ...curr, isLoading: false, user: null };
	});
};

export const signInPopUp = async () => {
	let auth: Auth = getAuth(app);
	let provider: GoogleAuthProvider = new GoogleAuthProvider();
	try {
		const result = await signInWithPopup(auth, provider);
		// console.log('User signed in: ', result.user.email);
	} catch (error) {
		console.error('Error signing in: ', error);
	}
};

export const fetchRole = async (userId: string) => {
	const roleDoc = await getDoc(doc(db, collection_name, userId));
	let role = '';
	if (roleDoc.exists()) {
		role = roleDoc.data().role;
	}

	userSession.update((curr) => ({
		...curr,
		role
	}));
};

export const hasRole = (session: SessionState, role: string): boolean => {
	if (!session || !session.user || !session.role) {
		return false;
	}
	if (session.role === ROLE_ADMIN) {
		return true;
	}
	return false;
};

export const hasPermission = (session: SessionState, permission: string): boolean => {
	// console.log("hasPermission", session);
	if (!session || !session.user || !session.role) {
		return false;
	}
	if (session.role === ROLE_ADMIN) {
		return true;
	}
	return false;
};

export const hasPagePermission = (session: SessionState, path: string): boolean => {
	const restrictedRoute = restrictedRoutes.find((route) => path.startsWith(route.path));
	if (!restrictedRoute) {
		return true;
	}

	return hasPermission(session, restrictedRoute.permission);
};

export const isRestrictedPage = (path: string): boolean => {
	return restrictedRoutes.some((route) => path.startsWith(route.path));
};
