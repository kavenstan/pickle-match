<script lang="ts">
	import type { Session } from '$lib/types';
	import { onMount } from 'svelte';
	import { sessionStore, fetchActiveSession } from '$lib/stores/session';
	import { PERMISSION_SESSION_WRITE, userSession, hasPermission } from '$lib/user';
	import EditSession from './EditSession.svelte';
	import SessionWizard from './SessionWizard.svelte';

	let session: Session | null = null;

	onMount(async () => {
		await fetchActiveSession();
		sessionStore.subscribe((value) => {
			session = value;
		});
	});
</script>

<div class="title">
	<h1>Matchmaking</h1>
</div>
{#if hasPermission($userSession, PERMISSION_SESSION_WRITE)}
	{#if !session}
		<SessionWizard />
	{:else}
		<EditSession sessionId={session.id} />
	{/if}
{/if}

<style>
</style>
