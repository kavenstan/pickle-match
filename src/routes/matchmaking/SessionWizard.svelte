<script lang="ts">
	import type { Player, Session, Rating, Match } from '$lib/types';
	import { onMount } from 'svelte';
	import { addSession, fetchActiveSession } from '$lib/stores/session';
	import {
		addPlayer,
		playersStore,
		fetchPlayers,
		defaultPlayerMatchStats,
		defaultPlayerRating
	} from '$lib/stores/player';
	import { MatchmakingType, SessionStatus, ToastType } from '$lib/enums';
	import { median, newId, standardDeviation } from '$lib/utils';
	import { Timestamp } from 'firebase/firestore';
	import { addToast } from '$lib/ui';
	import { get } from 'svelte/store';
	import { createRound, type RoundResult } from '$lib/matchmaking/matchmaking';
	import PreviewMatch from '$lib/components/PreviewMatch.svelte';

	let playerMap: Record<string, Player>;
	let sortedPlayers: Player[] = [];
	let selectedPlayerIds: string[] = [];

	let newPlayerModal: HTMLDialogElement | null = null;
	let newPlayerName: string = '';
	let newPlayerRating: Rating = defaultPlayerRating;
	let newPlayerError: string = '';

	let newSessionError: string = '';

	// Settings
	let courts: number = 4;
	let matchmakingAlgorithm: MatchmakingType = MatchmakingType.Balanced;

	// Criteria
	let teamRatingDiffLimit = 600;
	let matchRatingDiffLimit = 200;
	let allowRepeatPairings = false;

	// Previerw
	let previewSession: Session;
	let previewResult: RoundResult;
	let previewMatches: Match[] = [];

	let staticOrder = '{}';

	let step: number = 1;
	const totalSteps = 3;

	onMount(() => {
		playerMap = get(playersStore);
		sortPlayers();
		// Testing - prepick players
		// selectedPlayerIds = sortedPlayers.slice(0, 14).map((x) => x.id);
	});

	const sortPlayers = (sort: string = 'name') => {
		let unsorted = Object.values(playerMap);
		if (sort === 'rating') {
			sortedPlayers = unsorted.sort((a, b) => a.name.localeCompare(b.name));
		}
		sortedPlayers = unsorted.sort((a, b) => a.name.localeCompare(b.name));
	};

	const togglePlayer = (player: Player) => {
		if (selectedPlayerIds.includes(player.id)) {
			selectedPlayerIds = selectedPlayerIds.filter((id) => id !== player.id);
		} else {
			selectedPlayerIds = [...selectedPlayerIds, player.id];
		}
	};

	const handleAddPlayer = async () => {
		newPlayerName = newPlayerName.trim();
		if (newPlayerName === '') {
			newPlayerError = 'Player name cannot be empty';
			return;
		}
		if (newPlayerName in playerMap) {
			newPlayerError = 'Player name already exists';
			return;
		}

		try {
			let player: Player = {
				id: newId(),
				name: newPlayerName,
				rating: newPlayerRating,
				matchStats: defaultPlayerMatchStats
			};
			await addPlayer(player).then(async (_) => {
				newPlayerModal?.close();
				await fetchPlayers();
				playerMap = get(playersStore);
				sortPlayers();
				newPlayerName = '';
				newPlayerError = '';
				newPlayerRating = defaultPlayerRating;
			});
		} catch (error) {
			newPlayerError = 'Failed to add player';
			console.error(error);
		}
	};

	const restartWizard = () => {
		step = 1;
		selectedPlayerIds = [];
		courts = 4;
		matchmakingAlgorithm = MatchmakingType.Balanced;
	};

	const refreshPreview = async () => {
		let startRatings: Record<string, Rating> = Object.values(playerMap)
			.filter((player) => selectedPlayerIds.includes(player.id))
			.reduce(
				(acc, player) => {
					acc[player.id] = { rating: player.rating.rating, rd: player.rating.rd };
					return acc;
				},
				{} as Record<string, Rating>
			);

		previewSession = {
			config: {
				courts: 4,
				matchmakingType: MatchmakingType.Balanced,
				teamRatingDiffLimit,
				matchRatingDiffLimit,
				allowRepeatPairings
			},
			id: '',
			date: null as any,
			location: '',
			state: {
				status: SessionStatus.Created,
				currentRound: 0,
				activePlayerIds: selectedPlayerIds,
				allPlayerIds: selectedPlayerIds,
				sitOutOrderPlayerIds: selectedPlayerIds.sort(() => 0.5 - Math.random()),
				sitOutIndex: 0,
				startRatings,
				endRatings: {},
				matchStats: {}
			}
		};

		previewMatches = [];
		previewResult = await createRound(previewSession, []);

		if (!previewResult.error) {
			previewSession.state.sitOutIndex = previewResult.state.sitOutIndex;
			previewSession.state.currentRound = previewResult.state.currentRound;
		}
	};

	const nextPreviewRound = async () => {
		console.log(previewSession.config);
		previewMatches = previewMatches.concat(previewResult.matches!);
		previewResult = await createRound(previewSession, previewMatches);
	};

	const startSession = async () => {
		let startRatings: Record<string, Rating> = Object.values(playerMap)
			.filter((player) => selectedPlayerIds.includes(player.id))
			.reduce(
				(acc, player) => {
					acc[player.id] = { rating: player.rating.rating, rd: player.rating.rd };
					return acc;
				},
				{} as Record<string, Rating>
			);

		let newSession: Session = {
			id: newId(),
			config: {
				courts: courts,
				matchmakingType: matchmakingAlgorithm,
				teamRatingDiffLimit,
				matchRatingDiffLimit,
				allowRepeatPairings
			},
			state: {
				activePlayerIds: selectedPlayerIds,
				allPlayerIds: selectedPlayerIds,
				status: SessionStatus.Created,
				currentRound: 1,
				sitOutIndex: 0,
				sitOutOrderPlayerIds: selectedPlayerIds.sort(() => 0.5 - Math.random()),
				startRatings,
				endRatings: {},
				matchStats: {}
			},
			date: Timestamp.fromDate(new Date()),
			location: 'default'
		};

		try {
			await addSession(newSession).then(async (_) => {
				addToast({ message: 'Session Created', type: ToastType.Success });
				await fetchActiveSession();
			});
		} catch (error) {
			newSessionError = 'Failed to create session';
			console.error(newSessionError);
		}
	};

	const handleAllowRepeatPairings = async () => {
		previewSession.config.allowRepeatPairings! = true;
		await nextPreviewRound();
	};

	const handleIncreaseVariance = async () => {
		previewSession.config.teamRatingDiffLimit! *= 1.25;
		previewSession.config.matchRatingDiffLimit! *= 1.25;
		await nextPreviewRound();
	};

	const moveToPreview = async () => {
		await refreshPreview();
		step++;
	};

	let statMeanRating = 0;
	let statMedianRating = 0;
	let orderedRatings: number[] = [];

	$: orderedRatings =
		(playerMap &&
			Object.values(playerMap)
				.filter((p) => selectedPlayerIds.includes(p.id))
				.map((p) => p.rating.rating)
				.sort((a, b) => a - b)) ||
		[];

	$: statMeanRating =
		orderedRatings.reduce((acc, rating) => acc + rating, 0) / (orderedRatings.length || 1);
	$: statMedianRating = median(orderedRatings);
</script>

{#if playerMap}
	<div class="wizard">
		<div class="step-indicators">
			{#each Array(totalSteps).fill(0) as _, i}
				<div class="step-indicator {i < step ? 'active' : ''}"></div>
			{/each}
		</div>

		{#if step === 1}
			<div class="title">
				<h3>Player Selection</h3>
				<button on:click={() => newPlayerModal?.show()}>Add New Player</button>
			</div>
			<div class="instructions">
				{#if selectedPlayerIds.length < 4}
					<span>Select at least four players to begin</span>
				{:else}
					<span>{selectedPlayerIds.length} players selected</span>
				{/if}
			</div>
			<div class="players">
				{#each sortedPlayers as player}
					<button
						on:click={() => togglePlayer(player)}
						class="secondary pill {selectedPlayerIds.includes(player.id) ? '' : 'outline'}"
						>{player.name}</button
					>
				{/each}
			</div>
			<div class="session-nav">
				<button class="contrast outline" on:click={restartWizard}>Reset</button>
				<button disabled={selectedPlayerIds.length < 4} on:click={() => step++}>Next</button>
			</div>
		{/if}

		{#if step === 2}
			<h3>Settings</h3>

			<form>
				<label for="matchmaking">Matchmaking Type</label>
				<select id="matchmaking" bind:value={matchmakingAlgorithm}>
					{#each Object.keys(MatchmakingType) as type}
						<option value={type}>{type}</option>
					{/each}
				</select>
				<label for="courts">Courts</label>
				<input type="text" id="courts" bind:value={courts} />

				{#if matchmakingAlgorithm === MatchmakingType.Balanced}
					<label for="teamRatingDiffLimit">Team Rating Range</label>
					<input type="text" id="teamRatingDiffLimit" bind:value={teamRatingDiffLimit} />
					<label for="matchRatingDiffLimit">Match Rating Range</label>
					<input type="text" id="matchRatingDiffLimit" bind:value={matchRatingDiffLimit} />
					<label for="allowRepeatPairings">
						<input
							type="checkbox"
							role="switch"
							id="allowRepeatPairings"
							bind:value={allowRepeatPairings}
						/>Allow Repeat Pairings
					</label>
				{/if}

				{#if matchmakingAlgorithm === MatchmakingType.Static}
					<label for="staticOrder">Matches (JSON)</label>
					<textarea rows={10} id="staticOrder" bind:value={staticOrder} />
				{/if}
			</form>

			<pre>
=== Info ===
Players: {selectedPlayerIds.length}
Mean Rating: {Math.round(statMeanRating)}
Median Rating: {Math.round(statMedianRating)}
Std. Deviation: {Math.round(standardDeviation(orderedRatings))}
				</pre>

			<div class="session-nav">
				<button class="outline" on:click={() => step--}>Back</button>
				<button on:click={async () => await moveToPreview()}>Next</button>
				{#if newSessionError}
					<p class="error">{newSessionError}</p>
				{/if}
			</div>
		{/if}

		{#if step === 3}
			<h3>Preview</h3>
			{#if previewResult?.error}
				<div class="error">
					Error: {previewResult.error}
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
				<div class="session-preview">
					{#if previewResult?.matches}
						{#each previewResult?.matches as match}
							<PreviewMatch {match} />
						{/each}
					{/if}
				</div>
				{#if previewResult?.sitOutPlayerIds}
					<div class="sit-out">
						Sitting Out:
						{#each previewResult?.sitOutPlayerIds as sitOutPlayerId, index}
							<span
								>{playerMap[sitOutPlayerId]
									.name}{#if index < previewResult.sitOutPlayerIds.length - 1},
								{/if}</span
							>
						{/each}
					</div>
				{/if}
				<div>
					<button on:click={() => refreshPreview()}>Refresh</button>
					<button on:click={() => nextPreviewRound()}>Next Round</button>
				</div>
			{/if}
			<br />
			<div class="session-nav">
				<button class="outline" on:click={() => step--}>Back</button>
				<button on:click={() => startSession()}>Start!</button>
				{#if newSessionError}
					<p class="error">{newSessionError}</p>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<dialog bind:this={newPlayerModal}>
	<article>
		<h2>Add Player</h2>
		<form>
			<label for="name">Name</label>
			<input type="text" id="name" bind:value={newPlayerName} />
			<label for="rating">Rating</label>
			<input type="number" id="rating" bind:value={newPlayerRating.rating} />
		</form>
		<footer>
			<button on:click={() => newPlayerModal?.close()} class="secondary"> Cancel </button>
			<button on:click={() => handleAddPlayer()} class="primary"> Save </button>
		</footer>
		{#if newPlayerError}
			<p class="error">{newPlayerError}</p>
		{/if}
	</article>
</dialog>

<style>
	.wizard {
		max-width: 600px;
		margin: auto;
	}

	.instructions {
		min-height: 3rem;
	}

	.step-indicators {
		display: flex;
		justify-content: center;
		margin-bottom: 1rem;
	}

	.step-indicator {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		border: 2px solid var(--secondary-color);
		background-color: transparent;
		margin: 0 5px;
	}

	.step-indicator.active {
		background-color: var(--secondary-color);
	}

	.sit-out {
		margin: 1rem 0;
	}

	.players {
		width: 100%;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.session-nav {
		display: flex;
		justify-content: space-between;
	}
</style>
