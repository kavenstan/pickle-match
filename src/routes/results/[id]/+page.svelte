<script lang="ts">
	import { get } from 'svelte/store';
	import type { Match, Session } from '$lib/types';
	import { deleteSession, updateState } from '$lib/stores/session';
	import { formatTimestamp } from '$lib/utils';
	import { matchesStore, deleteSessionMatches, fetchMatchesForSession } from '$lib/stores/match';
	import { Loader } from '$lib/components';
	import Round from '../../matchmaking/Round.svelte';
	import { PERMISSION_SESSION_WRITE, userSession, hasPermission } from '$lib/user';
	import SessionResultsStats from '../SessionResultsStats.svelte';
	import { addToast } from '$lib/ui';
	import { resetRatings, calculateRatings } from '$lib/rating';
	import { calculateStats, resetStats } from '$lib/stats';
	import { goto } from '$app/navigation';
	import { SessionStatus, ToastType } from '$lib/enums';
	import { onMount } from 'svelte';

	export let data;

	let session: Session;
	let matches: Match[] = [];

	onMount(() => {
		session = data.session;
		fetchMatchesForSession(session.id);
	});

	$: if (session) {
		matchesStore.subscribe((store) => {
			matches = store[session.id]?.data || [];
		});
	}

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

<div class="breadcrumbs">
	<h1>
		<a href={`/results`}>Results</a>
		{#if session}
			&gt; {formatTimestamp(session.date, 'EEE MMM do')}
		{/if}
	</h1>
</div>

{#if !session || $matchesStore[session.id]?.loading}
	<Loader name="Matches" />
{:else if $matchesStore[session.id]?.error}
	<p class="error">{$matchesStore[session.id].error}</p>
{:else if $matchesStore[session.id]?.data}
	<Round matches={$matchesStore[session.id].data} />
{/if}

{#if hasPermission($userSession, PERMISSION_SESSION_WRITE)}
	<button on:click={async () => await setSessionActive(session)}>Set Active</button>
	<button on:click={() => copyToClipboard(session)}>DUPR</button>
	<br /><br />
	<button on:click={async () => await resetRatings(session)}>Reset Ratings</button>
	<button on:click={async () => await calculateRatings(session)}>Calcuate Ratings</button>
	<br /><br />
	<button on:click={async () => await resetStats(session)}>Reset Stats</button>
	<button on:click={async () => await calculateStats(session)}>Calculate Stats</button>
	<br /><br />
	<button class="danger" on:click={async () => await deleteSessionMatches(session.id)}
		>Delete Matches</button
	>
	<button class="danger" on:click={async () => await deleteSession(session.id)}
		>Delete Session</button
	>
{/if}

{#if session?.state?.matchStats}
	<SessionResultsStats {session} {matches} />
{/if}

<style>
	.breadcrumbs a {
		color: white;
	}
</style>
