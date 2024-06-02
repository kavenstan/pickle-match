<script lang="ts">
	import type { Match, Session } from '$lib/types';
	import { onMount } from 'svelte';
	import { getSessions } from '$lib/session';
	import { SessionStatus } from '$lib/enums';
	import { formatDate } from '$lib/utils';
	import { get } from 'svelte/store';
	import { matchesStore, fetchMatchesForSession } from '$lib/match';
	import { Loader } from '$lib/components';
	import Round from '../matchmaking/Round.svelte';
	import type { Timestamp } from 'firebase/firestore';

	let sessions: Session[] = [];
	let showDupr: boolean = false;

	onMount(async () => {
		sessions = await getSessions();
	});

	function handleToggle(sessionId: string, event: Event) {
		const target = event.target as HTMLDetailsElement;
		if (target.open && !get(matchesStore)[sessionId]) {
			fetchMatchesForSession(sessionId);
		}
	}

	function toggleDupr() {
		showDupr = !showDupr;
	}

	function duprCsv(matches: Match[], timestamp: Timestamp): string {
		let content = '';

		let date = formatDate(timestamp);

		matches.forEach((match) => {
			content += duprLine(match, date);
		});

		return content;
	}

	function duprLine(match: Match, date: string): string {
		let line = `,,,,${date},${match.team1[0]},,,${match.team1[1]}`;
		line += `,,,${match.team2[0]},,,${match.team2[1]},,,,${match.team1Score},${match.team2Score}`;

		return line + '\n';
	}

	// Implement for DUPR csv
	// function copyToClipBoard() {
	// }
</script>

<h1>Results</h1>
<section id="accordions">
	{#each sessions.filter((x) => x.state.status === SessionStatus.Completed) as session}
		<details on:toggle={(event) => handleToggle(session.id, event)}>
			<summary>{formatDate(session.date)}</summary>
			{#if $matchesStore[session.id]?.error}
				<Loader name="Matches" />
			{:else if $matchesStore[session.id]?.error}
				<p class="error">{$matchesStore[session.id].error}</p>
			{:else if $matchesStore[session.id] && $matchesStore[session.id]?.data}
				<Round matches={$matchesStore[session.id].data} />
			{/if}
			<button on:click={() => toggleDupr()}>DUPR</button>
			{#if showDupr}
				<pre>{duprCsv($matchesStore[session.id].data, session.date)}</pre>
			{/if}
		</details>
	{/each}
</section>

<!-- <button
	on:click={async () => {
		await removeMatches();
	}}>Remove Matches</button
> -->

<style>
	#accordions {
		max-width: 500px;
		margin: auto;
	}
</style>
