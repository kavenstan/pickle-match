<script lang="ts">
	import type { Player, Session } from '$lib/types';
	import { onMount } from 'svelte';
	import { getActiveSession } from '$lib/session';
	import { userSession } from '$lib/user';
	import EditSession from './EditSession.svelte';
	import SessionWizard from './SessionWizard.svelte';

	let session: Session | null;

	onMount(async () => {
		session = await getActiveSession();
	});
</script>

<div class="title">
	<h1>Matchmaking</h1>
</div>
{#if $userSession?.user}
	{#if !session}
		<SessionWizard />
	{:else}
		<EditSession sessionId={session.id} />
	{/if}
{/if}

<style>
</style>
