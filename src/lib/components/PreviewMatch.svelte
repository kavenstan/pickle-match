<script lang="ts">
	import { playersStore } from '$lib/stores/player';
	import type { Match, Player } from '$lib/types';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import RatingPill from './RatingPill.svelte';

	export let match: Match;

	let playerMap: Record<string, Player>;
	let team1Rating = 0;
	let team2Rating = 0;

	onMount(() => {
		playerMap = get(playersStore);
	});

	$: if (playerMap) {
		team1Rating = Math.round(
			(playerMap[match.team1[0]].rating.rating + playerMap[match.team1[1]].rating.rating) / 2
		);
		team2Rating = Math.round(
			(playerMap[match.team2[0]].rating.rating + playerMap[match.team2[1]].rating.rating) / 2
		);
	}
</script>

{#if match && playerMap}
	<div class="match">
		<div class="team right">
			<div class="player">
				<div class="name">{playerMap[match.team1[0]].name}</div>
			</div>
			<div class="player">
				<div class="name">{playerMap[match.team1[1]].name}</div>
			</div>
		</div>
		<div class="pill">
			<RatingPill value={team1Rating - team2Rating} />
		</div>
		<div>&nbsp;</div>
		<div class="pill">
			<RatingPill value={team2Rating - team1Rating} />
		</div>
		<div class="team">
			<div class="player">
				<div class="name">{playerMap[match.team2[0]].name}</div>
			</div>
			<div class="player">
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
	.right {
		text-align: right;
	}
	.team {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: space-evenly;
	}

	.pill {
		display: flex;
		align-items: center;
	}

	.player {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}
	.name {
		line-height: 1.5rem;
		white-space: nowrap;
		overflow-x: hidden;
		width: 80px;
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
