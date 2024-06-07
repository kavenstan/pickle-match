<script lang="ts">
	import { updateMatchScore } from '$lib/stores/match';
	import type { Match, Player } from '$lib/types';
	import { get } from 'svelte/store';
	import ScoreModal from './ScoreModal.svelte';
	import { playersStore } from '$lib/stores/player';
	import { onMount } from 'svelte';

	type EditMode = 'text' | 'click';

	export let match: Match;
	export let editMode: EditMode = 'click';

	let playerMap: Record<string, Player>;

	let showModal = false;
	let modalTeam = 1;

	let team1Score = match.team1Score;
	let team2Score = match.team2Score;

	onMount(() => {
		playerMap = get(playersStore);
	});

	const handleScoreChange = async () => {
		if (team1Score === match.team1Score && team2Score === match.team2Score) {
			return;
		}

		try {
			const updatedMatch = { ...match, team1Score, team2Score };
			await updateMatchScore(updatedMatch);
			match = updatedMatch;
		} catch (error) {
			console.error(error);
		}
	};

	const handleScoreSelect = async (event: CustomEvent<number>) => {
		const score = event.detail;
		if (modalTeam === 1) {
			team1Score = score;
		} else {
			team2Score = score;
		}

		await handleScoreChange().then((_) => (showModal = false));
	};

	const scoreClass = (match: Match, team: number) => {
		if (match.team1Score === match.team2Score) {
			return 'draw';
		}
		return (match.team1Score > match.team2Score && team === 1) ||
			(match.team2Score > match.team1Score && team === 2)
			? 'win'
			: 'loss';
	};

	const showScoreSelect = (team: number) => {
		showModal = true;
		modalTeam = team;
	};

	const closeModal = () => {
		showModal = false;
	};
</script>

{#if playerMap}
	<div class="match">
		<div class="team right">
			<div>{playerMap[match.team1[0]].name}</div>
			<div>{playerMap[match.team1[1]].name}</div>
		</div>
		<div class="score">
			{#if editMode === 'text'}
				<input
					type="number"
					class={scoreClass(match, 1)}
					on:change={handleScoreChange}
					bind:value={team1Score}
				/>
				<input
					type="number"
					class={scoreClass(match, 2)}
					on:change={handleScoreChange}
					bind:value={team2Score}
				/>
			{/if}
			{#if editMode === 'click'}
				<button class={`${scoreClass(match, 1)}`} on:click={() => showScoreSelect(1)}
					>{match.team1Score < 10 ? '0' : ''}{match.team1Score}</button
				>
				<button class={`${scoreClass(match, 2)}`} on:click={() => showScoreSelect(2)}>
					{match.team2Score < 10 ? '0' : ''}{match.team2Score}
				</button>
			{/if}
		</div>
		<div class="team">
			<div>{playerMap[match.team2[0]].name}</div>
			<div>{playerMap[match.team2[1]].name}</div>
		</div>
	</div>
{/if}

<ScoreModal
	open={showModal}
	close={closeModal}
	{match}
	team={modalTeam}
	on:select={handleScoreSelect}
/>

<style>
	.match {
		display: flex;
		border: 1px solid var(--primary-color);
		padding: 0.5rem;
		margin-bottom: 0.5rem;
		gap: 0.5rem;
	}
	.score input,
	.score button {
		font-family: monospace;
		border-width: 2px;
		border-style: solid;
		border-radius: 8px;
		padding: 5px;
		line-height: 2rem;
		font-size: 2rem;
		background-color: transparent;
	}
	.score input {
		width: 3rem;
		text-align: center;
	}
	.score {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
	}
	.right {
		text-align: right;
	}
	.team {
		flex: 1;
	}
	.win {
		border-color: green;
	}
	.loss {
		border-color: red;
	}
	.draw {
		border-color: yellow;
	}
	input[type='number']::-webkit-inner-spin-button {
		display: none;
	}
</style>
