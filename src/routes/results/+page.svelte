<script lang="ts">
	import type { Match, Session } from '$lib/types';
	import { onMount } from 'svelte';
	import { fixSession, getSessions, updateSession } from '$lib/session';
	import { MatchmakingType, SessionStatus } from '$lib/enums';
	import { formatTimestamp } from '$lib/utils';
	import { get } from 'svelte/store';
	import { matchesStore, fetchMatchesForSession } from '$lib/match';
	import { Loader } from '$lib/components';
	import Round from '../matchmaking/Round.svelte';
	import type { Timestamp } from 'firebase/firestore';
	import { PERMISSION_SESSION_WRITE, userSession, hasPermission } from '$lib/user';
	import ViewMatch from '$lib/components/ViewMatch.svelte';
	import EditMatch from '../matchmaking/EditMatch.svelte';
	import SessionResultsStats from './SessionResultsStats.svelte';

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
		console.log(sessions[0].date);
	}

	function toggleDupr() {
		showDupr = !showDupr;
	}

	function duprCsv(matches: Match[], timestamp: Timestamp): string {
		let content = '';

		let date = formatTimestamp(timestamp);

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

	const setSessionActive = async (session: Session) => {
		await updateSession({
			id: session.id,
			state: {
				status: SessionStatus.Started
			}
		} as Partial<Session>);
	};
</script>

<h1>Results</h1>
<section id="accordions">
	{#each sessions.filter((x) => x.state.status === SessionStatus.Completed) as session}
		<details on:toggle={(event) => handleToggle(session.id, event)}>
			<summary>{formatTimestamp(session.date, 'EEE MMM do')}</summary>
			{#if $matchesStore[session.id]?.error}
				<Loader name="Matches" />
			{:else if $matchesStore[session.id]?.error}
				<p class="error">{$matchesStore[session.id].error}</p>
			{:else if $matchesStore[session.id] && $matchesStore[session.id]?.data}
				{#if session.config.matchmakingType === MatchmakingType.Manual}
					{#each $matchesStore[session.id].data as match}
						{#if session.state.status === SessionStatus.Completed}
							<ViewMatch {match} />
						{:else}
							<EditMatch {match} />
						{/if}
					{/each}
				{:else}
					<Round matches={$matchesStore[session.id].data} />
				{/if}
			{/if}
			{#if hasPermission($userSession, PERMISSION_SESSION_WRITE)}
				<button on:click={async () => await setSessionActive(session)}>Set Active</button>
				<!-- <button on:click={async () => await fixSession(session.id)}>Fix session</button> -->
			{/if}
			<button on:click={() => toggleDupr()}>DUPR</button>
			{#if showDupr}
				<pre>{duprCsv($matchesStore[session.id].data, session.date)}</pre>
			{/if}
			{#if session?.state?.matchStats}
				<SessionResultsStats {session} />
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
		max-width: 600px;
		margin: auto;
	}
</style>
