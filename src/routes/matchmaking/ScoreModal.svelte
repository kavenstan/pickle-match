<script lang="ts">
	import { playersStore } from '$lib/stores/player';
	import type { Match, Player } from '$lib/types';
	import { createEventDispatcher, onMount } from 'svelte';
	import { get } from 'svelte/store';

	export let match: Match;
	export let team: number;
	export let open: boolean = false;
	export let close: () => void;

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

{#if playerMap}
	<dialog {open}>
		<article>
			<header>
				<button on:click={close} class="outline secondary"
					><iconify-icon icon="carbon:close" /></button
				>
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
{/if}

<style>
	header button {
		float: right;
		border: 0;
		padding: 0;
		height: 1.5rem;
		width: 1.5rem;
	}

	.scores {
		display: grid;
		grid-gap: 0.5rem;
		grid-template-columns: repeat(5, 3rem);
		grid-template-rows: repeat(5, 3rem);
		margin: auto;
		justify-content: center;
	}

	.scores button {
		font-family: monospace;
		border-width: 2px;
		border-style: solid;
		border-radius: 8px;
		padding: 0;
		line-height: 2rem;
		font-size: 2rem;
		background-color: transparent;
	}
</style>
