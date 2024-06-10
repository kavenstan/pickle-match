<script lang="ts">
	import type { Match, Session } from '$lib/types';
	import { onMount } from 'svelte';
	import { getSessions, updateState } from '$lib/stores/session';
	import { SessionStatus, ToastType } from '$lib/enums';
	import { formatTimestamp } from '$lib/utils';
	import { get } from 'svelte/store';
	import { matchesStore, fetchMatchesForSession } from '$lib/stores/match';
	import { Loader } from '$lib/components';
	import Round from '../matchmaking/Round.svelte';
	import { PERMISSION_SESSION_WRITE, userSession, hasPermission } from '$lib/user';
	import SessionResultsStats from './SessionResultsStats.svelte';
	import { goto } from '$app/navigation';
	import { addToast } from '$lib/ui';
	import { resetRatings, calculateRatings } from '$lib/rating';
	import { calculateStats, resetStats } from '$lib/stats';

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

	const duprCsv = (session: Session): string => {
		console.log(`Get ${session.id} matches`);
		let matches = get(matchesStore)[session.id].data;
		let timestamp = session.date;

		let content = '';

		let date = formatTimestamp(timestamp);

		matches.forEach((match) => {
			content += duprLine(match, date);
		});

		return content;
	};

	const duprLine = (match: Match, date: string): string => {
		let line = `,,,,,${date},${match.team1[0]},,,${match.team1[1]}`;
		line += `,,,${match.team2[0]},,,${match.team2[1]},,,,${match.team1Score},${match.team2Score}`;

		return line + '\n';
	};

	const copyToClipboard = async (session: Session) => {
		try {
			await navigator.clipboard.writeText(duprCsv(session));
			addToast({ message: 'Text copied to clipboard!' });
		} catch (err) {
			console.error('Failed to copy text: ', err);
		}
	};

	const setSessionActive = async (session: Session) => {
		await updateState(session.id, {
			status: SessionStatus.Started
		}).then(() => {
			addToast({ message: 'Session Activated', type: ToastType.Success });
			goto('/matchmaking');
		});
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
			{:else if $matchesStore[session.id]?.data}
				<Round matches={$matchesStore[session.id].data} />
			{/if}
			{#if hasPermission($userSession, PERMISSION_SESSION_WRITE)}
				<button on:click={async () => await setSessionActive(session)}>Set Active</button>
				<button on:click={() => copyToClipboard(session)}>DUPR</button>
				<br />
				<button on:click={async () => await resetRatings(session)}>Reset Ratings</button>
				<button on:click={async () => await calculateRatings(session)}>Calcuate Ratings</button>
				<br />
				<button on:click={async () => await resetStats(session)}>Reset Stats</button>
				<button on:click={async () => await calculateStats(session)}>Calculate Stats</button>
				<!-- <button on:click={async () => await fixSession(session.id)}>Fix session</button> -->
			{/if}
			{#if session?.state?.matchStats}
				<SessionResultsStats {session} />
			{/if}
		</details>
	{/each}
</section>

<style>
	#accordions {
		max-width: 600px;
		margin: auto;
	}
</style>
