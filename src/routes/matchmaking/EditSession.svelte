<script lang="ts">
	import type { Match, Player, Session } from '$lib/types';
	import { onMount } from 'svelte';
	import { sessionStore, subscribeToSession, updateState } from '$lib/stores/session';
	import { MatchmakingType, SessionStatus, ToastType } from '$lib/enums';
	import { getMatchPlayerIds, newId } from '$lib/utils';
	import Round from './Round.svelte';
	import CreateMatch from './CreateMatch.svelte';
	import { addMatch, subscribeToMatches, sessionMatchesStore, addMatches } from '$lib/stores/match';
	import { goto } from '$app/navigation';
	import { addToast } from '$lib/ui';
	import {
		activateSessionPlayer,
		createRound,
		deactiveSessionPlayer,
		type RoundResult
	} from '$lib/matchmaking/matchmaking';
	import { playersStore } from '$lib/stores/player';
	import { get } from 'svelte/store';

	export let sessionId: string;
	let session: Session | null;
	let sessionMatches: Match[] | null;
	let pendingMatches: Match[] = [];
	let availablePlayerIds: string[];
	let roundResult: RoundResult;
	let displayedRound = 1;
	let showSettings: boolean = false;
	let playerMap: Record<string, Player>;

	onMount(() => {
		playerMap = get(playersStore);

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

	const toggleSettings = () => {
		showSettings = !showSettings;
	};

	const toggleActive = (playerId: string) => {
		if (session!.state.activePlayerIds.includes(playerId)) {
			deactiveSessionPlayer(session!, playerId);
		} else {
			activateSessionPlayer(session!, playerId);
		}
	};

	const startNewRound = async () => {
		if (session?.config.matchmakingType === MatchmakingType.Manual) {
			session.state.currentRound++;
			await updateState(session.id, {
				currentRound: session.state.currentRound++
			});
		} else {
			roundResult = await createRound(session!, sessionMatches!);
			if (!roundResult.error) {
				await updateState(session!.id, {
					currentRound: roundResult.state.currentRound,
					sitOutIndex: roundResult.state.sitOutIndex
				});
				await addMatches(roundResult.matches);
				displayedRound = roundResult.state.currentRound - 1;
			}
		}
	};

	const handleAllowRepeatPairings = async () => {
		session!.config.allowRepeatPairings! = true;
		await startNewRound();
	};

	const handleIncreaseVariance = async () => {
		session!.config.teamRatingDiffLimit! *= 1.25;
		session!.config.matchRatingDiffLimit! *= 1.25;
		await startNewRound();
	};

	const addManualMatch = async () => {
		let match: Match = {
			id: newId(),
			sessionId: session!.id,
			round: session!.state.currentRound,
			team1: [],
			team2: [],
			team1Score: 0,
			team2Score: 0,
			ratingChanges: {}
		};
		await addMatch(match);
	};

	const endSession = async () => {
		await updateState(session!.id, {
			status: SessionStatus.Completed
		}).then((_) => {
			addToast({ message: 'Session Ended', type: ToastType.Success });
			goto('/results');
		});
	};

	$: if (session && sessionMatches && sessionMatches.length > 0) {
		let roundPlayerIds: Set<string> = new Set<string>();
		sessionMatches
			.filter(
				(sm) =>
					sm.round === session!.state.currentRound && sm.team1.length == 2 && sm.team2.length == 2
			)
			.forEach((match) => {
				roundPlayerIds = new Set([...roundPlayerIds, ...getMatchPlayerIds(match)]);
			});
		availablePlayerIds = session!.state.activePlayerIds.filter((id) => !roundPlayerIds.has(id));
	}

	$: if (session) {
		console.log(session.id);
	}
</script>

{#if session}
	<div class="session">
		{#if roundResult?.error}
			<div class="error">
				Error: {roundResult.error}
				<br />
				<button on:click={async () => await handleAllowRepeatPairings()}
					>Allow Repeat Pairings</button
				>
				<br />
				<button on:click={async () => await handleIncreaseVariance()}
					>Increase allowed variance</button
				>
			</div>
		{:else}
			{#if !sessionMatches || sessionMatches.length === 0}
				<p>No rounds found</p>
			{:else if pendingMatches.length === 0}
				<div class="rounds">
					<Round
						matches={sessionMatches}
						editable={true}
						currentRound={session.state.currentRound - 1}
						{displayedRound}
					/>
				</div>
			{/if}

			{#if session.config.matchmakingType === MatchmakingType.Manual}
				{#if pendingMatches.length === 0}
					<button on:click={async () => await addManualMatch()}>Add Match</button>
				{:else}
					{#each pendingMatches as pendingMatch}
						<CreateMatch
							matchId={pendingMatch.id}
							{availablePlayerIds}
							round={session.state.currentRound}
						/>
					{/each}
				{/if}
			{/if}

			{#if session.config.matchmakingType !== MatchmakingType.Manual || pendingMatches.length == 0}
				<button on:click={async () => startNewRound()}>Create New Round </button>
			{/if}
		{/if}
		<br /><br />
		{#if session.config.matchmakingType !== MatchmakingType.Manual || pendingMatches.length == 0}
			<button on:click={async () => endSession()}>End Session</button>
		{/if}

		<br /><br />

		<button on:click={toggleSettings}>Settings</button>
		{#if showSettings}
			<div>
				<form>
					<label for="teamRatingDiffLimit">Team Rating Range</label>
					<input
						type="text"
						id="teamRatingDiffLimit"
						bind:value={session.config.teamRatingDiffLimit}
					/>
					<label for="matchRatingDiffLimit">Match Rating Range</label>
					<input
						type="text"
						id="matchRatingDiffLimit"
						bind:value={session.config.matchRatingDiffLimit}
					/>
					<label for="allowRepeatPairings">
						<input
							type="checkbox"
							role="switch"
							id="allowRepeatPairings"
							bind:value={session.config.allowRepeatPairings}
						/>Allow Repeat Pairings
					</label>
					{#each availablePlayerIds as playerId}
						<button
							on:click={() => toggleActive(playerId)}
							class="secondary pill {session.state.activePlayerIds.includes(playerId)
								? ''
								: 'outline'}">{playerMap[playerId].name}</button
						>
					{/each}
				</form>
			</div>
		{/if}
	</div>
{/if}

<style>
	.session {
		max-width: 600px;
		margin: auto;
	}
</style>
