<script lang="ts">
	import type { Session } from '$lib/types';
	import { onMount } from 'svelte';
	import { getSessions } from '$lib/stores/session';
	import { SessionStatus } from '$lib/enums';
	import { formatTimestamp } from '$lib/utils';
	import { get } from 'svelte/store';
	import { matchesStore, fetchMatchesForSession } from '$lib/stores/match';

	let sessions: Session[] = [];

	onMount(async () => {
		sessions = await getSessions();
	});

	const handleToggle = (sessionId: string, event: Event) => {
		const target = event.target as HTMLDetailsElement;
		if (target.open && !get(matchesStore)[sessionId]) {
			fetchMatchesForSession(sessionId);
		}
	};
</script>

<h1>Results</h1>

<ul>
	{#each sessions.filter((x) => x.state.status === SessionStatus.Completed) as session}
		<li><a href={`/results/${session.id}`}>{formatTimestamp(session.date, 'EEE MMM do')}</a></li>
	{/each}
</ul>

<style>
	ul {
		padding: 0;
	}
	li {
		list-style: none;
	}
	a {
		color: var(--secondary-color);
	}
</style>
