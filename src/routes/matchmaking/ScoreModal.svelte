<script lang="ts">
	import { playersStore } from '$lib/stores/player';
	import type { Match, Player } from '$lib/types';
	import { createEventDispatcher, onMount } from 'svelte';
	import { get } from 'svelte/store';

	export let match: Match;
	export let team: number;

	const dispatch = createEventDispatcher();
	const scores = Array.from({ length: 25 }, (_, i) => i);

	let playerMap: Record<string, Player>;

	onMount(() => {
		playerMap = get(playersStore);
	});

	const handleScoreSelect = (score: number) => {
		dispatch('select', score);
	};

	const formatTeamNames = (team: string[]): string => {
		return team.map((id) => playerMap[id].name).join(' & ');
	};
</script>

<dialog open>
	<article>
		<header>
			<button aria-label="Close" rel="prev"></button>
			<p>
				<strong
					>Set score for {team === 1
						? formatTeamNames(match.team1)
						: formatTeamNames(match.team2)}</strong
				>
			</p>
		</header>
		<div class="scores">
			{#each scores as score}
				<button on:click={() => handleScoreSelect(score)}>{score < 10 ? '0' : ''}{score}</button>
			{/each}
		</div>
	</article>
</dialog>

<style>
	.scores {
		display: flex;
		flex-direction: row;
		gap: 0.5rem;
		max-width: 350px;
		flex-wrap: wrap;
		margin: auto;
		justify-content: center;
	}
	.scores button {
		font-family: monospace;
		border-width: 2px;
		border-style: solid;
		border-radius: 8px;
		padding: 5px;
		line-height: 2rem;
		font-size: 2rem;
		background-color: transparent;
	}
</style>
