<script lang="ts">
	import { session } from '$lib/user';
	import { db } from '$lib/firebase';
	import type { Session } from '$lib/types';
	import { collection, getDocs, query, orderBy } from 'firebase/firestore';
	import { onMount } from 'svelte';
	import Round from './Round.svelte';

	let sessions: Session[] = [];
	let selectedSession: Session;

	onMount(async () => {
		const querySnapshot = await getDocs(query(collection(db, 'sessions'), orderBy('date', 'desc')));
		sessions = querySnapshot.docs.map((doc) => ({ ...doc.data() })) as Session[];
	});
</script>

<h1>Matchmaking</h1>
<p>Previous Sessions</p>
{#each sessions as session}
	<p
		on:click={() => {
			selectedSession = session;
		}}
	>
		{session.date}
	</p>
{/each}

{#if selectedSession}
	{#each selectedSession.rounds as round, index}
		<Round {round} number={index + 1} />
	{/each}
{/if}

{#if $session?.user}
	<button>Start Session</button>
	<p>Start New Session, Select Players, Settings, Start</p>
{/if}
