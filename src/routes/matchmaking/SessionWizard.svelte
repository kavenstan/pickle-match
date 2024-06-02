<script lang="ts">
	import type { Player, Session } from '$lib/types';
	import { onMount } from 'svelte';
	import { addSession } from '$lib/session';
	import { getPlayers, addPlayer } from '$lib/player';
	import { MatchmakingType, SessionStatus } from '$lib/enums';
	import { newId } from '$lib/utils';
	import { Timestamp } from 'firebase/firestore';

	let session: Session | null;

	let players: Player[] = [];
	let selectedPlayerIds: string[] = [];

	let newPlayerModal: HTMLDialogElement | null = null;
	let newPlayerName: string = '';
	let newPlayerRating: number = 1200;
	let newPlayerError: string = '';

	let newSessionError: string = '';

	let courts: number = 4;
	let matchmakingAlgorithm: MatchmakingType = MatchmakingType.Random;

	let step: number = 1;
	const totalSteps = 3;

	onMount(async () => {
		players = await getPlayers();
	});

	const togglePlayer = (player: Player) => {
		if (selectedPlayerIds.includes(player.id)) {
			selectedPlayerIds = selectedPlayerIds.filter((id) => id !== player.id);
		} else {
			selectedPlayerIds = [...selectedPlayerIds, player.id];
		}
	};

	const handleAddPlayer = async () => {
		if (newPlayerName.trim() === '') {
			newPlayerError = 'Player name cannot be empty';
			return;
		}
		if (players.some((p) => p.name === newPlayerName.trim())) {
			newPlayerError = 'Player name already exists';
			return;
		}

		try {
			await addPlayer({ name: newPlayerName, rating: newPlayerRating } as Player).then((x) =>
				newPlayerModal?.close()
			);
			players = await getPlayers();
			newPlayerName = '';
			newPlayerRating = 1200;
		} catch (error) {
			newPlayerError = 'Failed to add player';
			console.error(error);
		}
	};

	const restartWizard = () => {
		step = 1;
		selectedPlayerIds = [];
		courts = 4;
		matchmakingAlgorithm = MatchmakingType.Random;
	};

	const startSession = async () => {
		let sessionPlayers = players
			.filter((player) => selectedPlayerIds.some((id) => id === player.id))
			.map((player) => player.name);

		let newSession: Session = {
			id: newId(),
			config: {
				courts: courts,
				matchmakingType: matchmakingAlgorithm,
				ratingDiffLimit: 100,
				maxIterations: 1000
			},
			state: {
				activePlayers: sessionPlayers,
				allPlayers: sessionPlayers,
				status: SessionStatus.Created,
				currentRound: 1,
				sitOutIndex: 0,
				sitOutOrder: sessionPlayers.sort(() => 0.5 - Math.random()),
				startRatings: [],
				endRatings: []
			},
			date: Timestamp.fromDate(new Date()),
			location: 'default'
		};

		try {
			await addSession(newSession);
			step = 3;
		} catch (error) {
			newSessionError = 'Failed to create session';
			console.error(newSessionError);
		}
	};
</script>

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
		{#if selectedPlayerIds.length < 4}
			<div>Select at least 4 players</div>
		{:else}
			<div>&nbsp;</div>
		{/if}
		<div class="players">
			{#each players.sort((a, b) => a.name.localeCompare(b.name)) as player}
				<button
					on:click={() => togglePlayer(player)}
					class="secondary pill {selectedPlayerIds.includes(player.id) ? '' : 'outline'}"
					>{player.name}</button
				>
			{/each}
		</div>
		<div class="session-nav">
			<button class="contrast outline" on:click={restartWizard}>Cancel</button>
			<button disabled={selectedPlayerIds.length < 4} on:click={() => (step = 2)}>Next</button>
		</div>
	{/if}

	{#if step === 2}
		<h3>Configuration</h3>

		<form>
			<label for="courts">Courts</label>
			<input type="text" id="courts" bind:value={courts} />
			<label for="matchmaking">Matchmaking Algorithm</label>
			<select id="matchmaking" bind:value={matchmakingAlgorithm}>
				{#each Object.keys(MatchmakingType) as type}
					<option value={type}>{type}</option>
				{/each}
			</select>
		</form>

		<div class="session-nav">
			<button class="outline" on:click={() => (step = 1)}>Back</button>
			<button on:click={startSession}>Start!</button>
			{#if newSessionError}
				<p class="error">{newSessionError}</p>
			{/if}
		</div>
	{/if}

	{#if step === 3}
		<h3>Matchmaking</h3>
		Figure this out
	{/if}
</div>

<dialog bind:this={newPlayerModal}>
	<article>
		<h2>Add Player</h2>
		<form>
			<label for="name">Name</label>
			<input type="text" id="name" bind:value={newPlayerName} />
			<label for="rating">Rating</label>
			<input type="number" id="rating" bind:value={newPlayerRating} />
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
	.step-indicators {
		display: flex;
		justify-content: center;
		margin-bottom: 1rem;
	}

	.wizard {
		max-width: 600px;
		margin: auto;
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
