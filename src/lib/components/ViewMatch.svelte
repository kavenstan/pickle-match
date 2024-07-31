<script lang="ts">
	import { playersStore } from '$lib/stores/player';
	import type { Match, Player } from '$lib/types';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import RatingPill from './RatingPill.svelte';

	export let match: Match;

	let playerMap: Record<string, Player>;

	onMount(() => {
		playerMap = get(playersStore);
	});

	const scoreClass = (match: Match, team: number) => {
		if (match.team1Score === match.team2Score) {
			return 'draw';
		}
		return (match.team1Score > match.team2Score && team === 1) ||
			(match.team2Score > match.team1Score && team === 2)
			? 'win'
			: 'loss';
	};

	let showRatingChanges = true;
</script>

{#if match && playerMap}
	<div class="match">
		<div class="team right">
			<div class="player">
				<div class="name">{playerMap[match.team1[0]].name}</div>
				{#if showRatingChanges && match.ratingChanges?.[match.team1[0]]}
					<RatingPill value={Math.round(match.ratingChanges?.[match.team1[0]])} />
				{/if}
			</div>
			<div class="player">
				<div class="name">{playerMap[match.team1[1]].name}</div>
				{#if showRatingChanges && match.ratingChanges?.[match.team1[1]]}
					<RatingPill value={Math.round(match.ratingChanges?.[match.team1[1]])} />
				{/if}
			</div>
		</div>
		<div class="score">
			<div class={scoreClass(match, 1)}>{match.team1Score < 10 ? '0' : ''}{match.team1Score}</div>
			<div class={scoreClass(match, 2)}>
				{match.team2Score < 10 ? '0' : ''}{match.team2Score}
			</div>
		</div>
		<div class="team">
			<div class="player">
				{#if showRatingChanges && match.ratingChanges?.[match.team2[0]]}
					<RatingPill value={Math.round(match.ratingChanges?.[match.team2[0]])} />
				{/if}
				<div class="name">{playerMap[match.team2[0]].name}</div>
			</div>
			<div class="player">
				{#if showRatingChanges && match.ratingChanges?.[match.team2[1]]}
					<RatingPill value={Math.round(match.ratingChanges?.[match.team2[1]])} />
				{/if}
				<div class="name">{playerMap[match.team2[1]].name}</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.match {
		display: flex;
		border: 1px solid var(--primary-color);
		padding: 0.5rem;
		margin-bottom: 0.5rem;
		gap: 0.5rem;
	}
	.score div {
		font-family: monospace;
		border-width: 2px;
		border-style: solid;
		border-radius: 8px;
		padding: 5px;
		line-height: 2rem;
		font-size: 2rem;
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
		display: flex;
		flex-direction: column;
		justify-content: space-evenly;
	}

	.player {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}
	.name {
		line-height: 1rem;
	}
	.right .player {
		justify-content: flex-end;
	}

	.win {
		border-color: var(--color-status-win);
	}
	.loss {
		border-color: var(--color-status-loss);
	}
	.draw {
		border-color: var(--color-status-draw);
	}
</style>
