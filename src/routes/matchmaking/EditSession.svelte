<script lang="ts">
	import type { Match, Player, Session } from '$lib/types';
	import { onMount } from 'svelte';
	import { sessionStore, subscribeToSession, updateSession } from '$lib/session';
	import { MatchmakingType } from '$lib/enums';
	import { newId } from '$lib/utils';
	import Round from './Round.svelte';
	import CreateMatch from './CreateMatch.svelte';
	import { addMatch, subscribeToMatches, sessionMatchesStore } from '$lib/match';

	export let sessionId: string;
	let session: Session | null;
	let sessionMatches: Match[] | null;
	let pendingMatches: Match[] = [];

	onMount(() => {
		const unsubscribeSession = subscribeToSession(sessionId);
		const unsubscribeSessionStore = sessionStore.subscribe((data) => {
			session = data as Session;
		});

		const unsubscribeMatches = subscribeToMatches(sessionId);
		const unsubscribeMatchStore = sessionMatchesStore.subscribe((data) => {
			sessionMatches = data as Match[];
			pendingMatches = sessionMatches.filter((x) => x.team1.length + x.team2.length < 4);
		});

		return () => {
			unsubscribeSession();
			unsubscribeSessionStore();
			unsubscribeMatches();
			unsubscribeMatchStore();
		};
	});

	const startNewRound = async () => {
		if (session) {
			session.state.currentRound++;
			await updateSession({
				id: session.id,
				state: {
					...session.state,
					currentRound: session.state.currentRound++
				}
			});
		}
	};

	const addManualMatch = async () => {
		let match: Match = {
			id: newId(),
			sessionId: session!.id,
			round: session!.state.currentRound,
			team1: [],
			team2: [],
			team1Score: 0,
			team2Score: 0
		};
		await addMatch(match);
	};
</script>

{#if session}
	{#if !sessionMatches || sessionMatches.length === 0}
		<p>No rounds found</p>
	{:else if pendingMatches.length === 0}
		<div class="rounds">
			Rounds
			<Round matches={sessionMatches} editable={true} />
		</div>
	{/if}
	{#if session.config.matchmakingType === MatchmakingType.Manual}
		{#if pendingMatches.length === 0}
			<button on:click={async () => await addManualMatch()}>Add Match</button>
		{:else}
			{#each pendingMatches as pendingMatch}
				<CreateMatch matchId={pendingMatch.id} {session} />
			{/each}
		{/if}
	{/if}
	<button on:click={async () => startNewRound()}>Start New Round</button>
{/if}

<style>
</style>
