<script lang="ts">
	import { session } from '$lib/user';
	import type { Player, Session } from '$lib/types';
	import { createRound } from '$lib/matchmaking';
	import { onMount } from 'svelte';
	import Round from './Round.svelte';
	import {
		fetchPlayers,
		fetchSessions,
		addPlayer,
		addSession,
		getSession,
		addNewSessionRound
	} from '$lib/repo';

	let sessions: Session[] = [];
	let players: Player[] = [];

	let selectedPlayerIds: string[] = [];
	let modal: HTMLDialogElement | null = null;

	let newPlayerName: string = '';
	let newPlayerRating: number = 1200;
	let newPlayerError: string = '';

	let newSessionError: string = '';
	let activeSession: Session | null = null;
	let currentSession: Session | null = null;

	let courts: number = 4;
	let matchmakingAlgorithm: string = 'random';

	let step: number = 0;
	const totalSteps = 3;

	onMount(async () => {
		players = await fetchPlayers();
		await refreshSessions();
		// console.table(sessions);
	});

	const refreshSessions = async () => {
		sessions = await fetchSessions();
		activeSession = sessions.find((x) => x.config.status === 'active') ?? null;
		console.log('Active Session', activeSession);
	};

	const togglePlayer = (player: Player) => {
		if (selectedPlayerIds.includes(player.id)) {
			selectedPlayerIds = selectedPlayerIds.filter((id) => id !== player.id);
		} else {
			selectedPlayerIds = [...selectedPlayerIds, player.id];
		}
		// console.table(selectedPlayerIds);
	};

	const setCurrentSession = async () => {
		currentSession = activeSession;
		if (currentSession?.rounds.length === 0) {
			addNewRound();
		}
	};

	const addNewRound = async () => {
		let round = createRound(currentSession!, players);
		await addNewSessionRound(currentSession!.id!, round);
		currentSession = await getSession(currentSession!);
	};

	const closeSession = () => {
		currentSession = null;
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
				modal?.close()
			);
			players = await fetchPlayers();
			newPlayerName = '';
			newPlayerRating = 1200;
		} catch (error) {
			newPlayerError = 'Failed to add player';
			console.error(error);
		}
	};

	const startWizard = () => {
		step = 1;
	};

	const stopWizard = () => {
		step = 0;
		selectedPlayerIds = [];
		courts = 4;
		matchmakingAlgorithm = 'random';
	};

	const startSession = async () => {
		let sessionPlayers = players
			.filter((player) => selectedPlayerIds.some((id) => id === player.id))
			.map((player) => player.name);

		let newSession: Session = {
			config: {
				courtsAvailable: courts,
				players: sessionPlayers,
				status: 'active',
				matchmakingAlgorithm,
				ratingDiffLimit: 100,
				maxIterations: 1000
			},
			state: {
				sitOutIndex: 0,
				sitOutOrder: sessionPlayers.sort(() => 0.5 - Math.random())
			},
			date: new Date().toISOString().split('T')[0],
			location: 'default',
			rounds: []
		};

		try {
			await addSession(newSession);
			await refreshSessions();
			step = 3;
		} catch (error) {
			newSessionError = 'Failed to create session';
			console.error(newSessionError);
		}
	};
</script>

<div class="title">
	<h1>Matchmaking</h1>
	{#if $session?.user && step === 0 && currentSession === null}
		<button on:click={startWizard}>New Session</button>
	{/if}
	{#if currentSession !== null}
		<button on:click={closeSession}>Close</button>
	{/if}
</div>

{#if currentSession !== null}
	{#if currentSession.rounds?.length === 0}
		<p>No rounds found</p>
	{:else}
		<div class="rounds">
			{#each currentSession.rounds as round, index}
				<Round {round} number={index + 1} sessionId={currentSession.id ?? ''} editable />
			{/each}
		</div>
		<button on:click={async () => await addNewRound()}>New Round</button>
	{/if}
{/if}

{#if step === 0 && currentSession === null}
	{#if activeSession !== null}
		<h3>Active Session for {activeSession?.date} found.</h3>
		<button on:click={async () => await setCurrentSession()}>Resume</button>
	{/if}
	<h3>Previous Sessions</h3>
	<section id="accordions">
		{#each sessions.filter((x) => x.config.status !== 'active') as session}
			<details>
				<summary>{session.date} </summary>
				{#each session.rounds as round, index}
					<Round {round} number={index + 1} sessionId={session.id ?? ''} />
				{/each}
			</details>
		{/each}
	</section>
{/if}

{#if step > 0}
	<div class="wizard">
		<div class="step-indicators">
			{#each Array(totalSteps).fill(0) as _, i}
				<div class="step-indicator {i < step ? 'active' : ''}"></div>
			{/each}
		</div>

		{#if step === 1}
			<div class="title">
				<h3>Player Selection</h3>
				<button on:click={() => modal?.show()}>Add New Player</button>
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
				<button class="contrast outline" on:click={stopWizard}>Cancel</button>
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
					<option value="smart" disabled>Smart - NYI</option>
					<option value="static" disabled>Static - NYI</option>
					<option value="random">Random</option>
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

			{#if activeSession === null}
				<p>No Active Session Found</p>
			{:else}
				<button
					on:click={() => {
						setCurrentSession();
						step = 0;
					}}>Show Matches</button
				>
			{/if}
		{/if}
	</div>
{/if}

<dialog bind:this={modal}>
	<article>
		<h2>Add Player</h2>
		<form>
			<label for="name">Name</label>
			<input type="text" id="name" bind:value={newPlayerName} />
			<label for="rating">Rating</label>
			<input type="number" id="rating" bind:value={newPlayerRating} />
		</form>
		<footer>
			<button on:click={() => modal?.close()} class="secondary"> Cancel </button>
			<button on:click={() => handleAddPlayer()} class="primary"> Save </button>
		</footer>
		{#if newPlayerError}
			<p class="error">{newPlayerError}</p>
		{/if}
	</article>
</dialog>

<style>
	#accordions {
		max-width: 500px;
		margin: auto;
	}

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
	button.pill {
		border-radius: 20px;
		padding: 0.25rem 1rem;
		border-color: var(--secondary-color);
		background-color: var(--secondary-color);
	}
	button.pill.outline {
		background-color: transparent;
	}
	.session-nav {
		display: flex;
		justify-content: space-between;
	}

	.rounds {
		max-width: 600px;
		margin: auto;
	}
</style>
