<script lang="ts">
	import type { Player, Session, Rating } from '$lib/types';
	import { onMount } from 'svelte';
	import { addSession } from '$lib/stores/session';
	import {
		addPlayer,
		playersStore,
		fetchPlayers,
		defaultPlayerMatchStats,
		defaultPlayerRating
	} from '$lib/stores/player';
	import { MatchmakingType, SessionStatus, ToastType } from '$lib/enums';
	import {
		combinations,
		mapPlayerNamesToRating,
		median,
		newId,
		standardDeviation
	} from '$lib/utils';
	import { Timestamp } from 'firebase/firestore';
	import { goto } from '$app/navigation';
	import { addToast } from '$lib/ui';
	import { get } from 'svelte/store';

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
	let ratingDiffLimit = 100;
	let maxIterations = 10000;
	let staticOrder = '{}';

	let step: number = 1;
	const totalSteps = 3;

	onMount(() => {
		playerMap = get(playersStore);
		sortPlayers();
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
		addToast({ message: 'Not yet implemented' });
	};

	const startSession = async () => {
		let sessionPlayers = Object.values(playerMap).filter((player) =>
			selectedPlayerIds.some((id) => id === player.id)
		);

		let newSession: Session = {
			id: newId(),
			config: {
				courts: courts,
				matchmakingType: matchmakingAlgorithm,
				ratingDiffLimit: 100,
				maxIterations: 1000
			},
			state: {
				activePlayerIds: selectedPlayerIds,
				allPlayerIds: selectedPlayerIds,
				status: SessionStatus.Created,
				currentRound: 1,
				sitOutIndex: 0,
				sitOutOrderPlayerIds: selectedPlayerIds.sort(() => 0.5 - Math.random()),
				startRatings: mapPlayerNamesToRating(sessionPlayers),
				endRatings: {},
				matchStats: {}
			},
			date: Timestamp.fromDate(new Date()),
			location: 'default'
		};

		try {
			await addSession(newSession).then((_) => {
				addToast({ message: 'Session Created', type: ToastType.Success });
				goto('/matchmaking');
			});
		} catch (error) {
			newSessionError = 'Failed to create session';
			console.error(newSessionError);
		}
	};

	const countValidCombinations = (ratings: number[], ratingDifferenceLimit: number): number => {
		let validCombinations = 0;

		for (let i = 0; i < ratings.length; i++) {
			for (let j = i + 1; j < ratings.length; j++) {
				if (Math.abs(ratings[i] - ratings[j]) <= ratingDifferenceLimit) {
					validCombinations++;
				}
			}
		}

		return validCombinations;
	};

	let statMeanRating = 0;
	let statMedianRating = 0;
	let statCombinations = 0;
	let statValidCombinations = 0;
	let orderedRatings: number[] = [];
	let ratingDifferenceLimit = 300;

	$: orderedRatings =
		(playerMap &&
			Object.values(playerMap)
				.filter((p) => selectedPlayerIds.includes(p.id))
				.map((p) => p.rating.rating)
				.sort((a, b) => a - b)) ||
		[];

	$: statCombinations = combinations(orderedRatings.length, 2);
	$: statValidCombinations = countValidCombinations(orderedRatings, ratingDifferenceLimit);

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
			<pre>
=== Info ===
Players: {selectedPlayerIds.length}
Mean Rating: {Math.round(statMeanRating)}
Median Rating: {Math.round(statMedianRating)}
Std. Deviation: {Math.round(standardDeviation(orderedRatings))}

Rating Difference Limit: {ratingDifferenceLimit}
Valid Combinations: {statValidCombinations} / {statCombinations}
</pre>

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
					<label for="ratingDiffLimit">Rating Range</label>
					<input type="text" id="ratingDiffLimit" bind:value={ratingDiffLimit} />
					<label for="maxIterations">Max Iterations</label>
					<input type="text" id="maxIterations" bind:value={maxIterations} />
				{/if}
				{#if matchmakingAlgorithm === MatchmakingType.Static}
					<label for="staticOrder">Matches (JSON)</label>
					<textarea rows={10} id="staticOrder" bind:value={staticOrder} />
				{/if}
			</form>

			<pre>
Info

</pre>

			<div class="session-nav">
				<button class="outline" on:click={() => step--}>Back</button>
				<button
					on:click={() => {
						step++;
					}}>Next</button
				>
				{#if newSessionError}
					<p class="error">{newSessionError}</p>
				{/if}
			</div>
		{/if}

		{#if step === 3}
			<h3>Preview</h3>
			<div class="session-preview"></div>
			<div>
				<button on:click={() => refreshPreview()}>Refresh</button>
			</div>
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
