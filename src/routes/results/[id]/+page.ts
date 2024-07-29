import { getSession } from '$lib/stores/session';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const session = await getSession(params.id);
	return {
		session
	};
};
