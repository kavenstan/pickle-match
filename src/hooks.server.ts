import { userSession, hasPermission, PERMISSION_SYNC, PERMISSION_SESSION_WRITE } from '$lib/user';
import type { Handle } from '@sveltejs/kit';
import { get } from 'svelte/store';

export const handle: Handle = async ({ event, resolve }) => {
	const { url, locals } = event;

	// const restrictedRoutes = [
	// 	{ path: '/sync', permission: PERMISSION_SYNC },
	// 	{ path: '/matchmaking', permission: PERMISSION_SESSION_WRITE }
	// ];

	// const restrictedRoute = restrictedRoutes.find((route) => url.pathname.startsWith(route.path));

	// if (restrictedRoute && !hasPermission(get(userSession), restrictedRoute.permission)) {
	// 	return new Response('Forbidden', { status: 403 });
	// }

	return resolve(event);
};
