<!-- src/routes/index.svelte -->
<script lang="ts">
	import { recalculateRatings } from '$lib/elo';
	import { PERMISSION_PLAYER_WRITE, userSession, hasPermission } from '$lib/user';
	import { getPlayers } from '$lib/player';
	import type { Player } from '$lib/types';
	import { onMount } from 'svelte';

	let players: Player[] = [];

	onMount(async () => {
		players = await getPlayers();
	});
</script>

<h1>Ratings</h1>
<table class="ratings">
	<thead>
		<tr>
			<th scope="col" class="ranking">#</th>
			<th scope="col">Name</th>
			<th scope="col">P</th>
			<th scope="col">W</th>
			<th scope="col">L</th>
			<th scope="col">D</th>
			<th scope="col" class="rating">R</th>
		</tr>
	</thead>
	<tbody>
		{#each players as player, index}
			<tr>
				<td>{index + 1}</td>
				<td><strong>{player.name}</strong></td>
				<td>{player.matchStats?.played}</td>
				<td>{player.matchStats?.won}</td>
				<td>{player.matchStats?.lost}</td>
				<td>{player.matchStats?.drawn}</td>
				<td>{player.rating}</td>
			</tr>
		{/each}
	</tbody>
</table>

<!-- <button on:click={async () => await resetRatings()}>Reset Ratings</button> -->
{#if hasPermission($userSession, PERMISSION_PLAYER_WRITE)}
	<button on:click={async () => await recalculateRatings()}>Recalculate Ratings</button>
{/if}

<!-- <button on:click={async () => await removeMatches()}>Remove Matches</button> -->

<style>
	td,
	th {
		padding: 0.5rem;
	}
	table {
		width: 400px;
	}
	.ranking {
		width: 40px;
	}
	.rating {
		width: 60px;
	}
	.ratings {
		max-width: 600px;
		margin: 0 -1rem;
	}

	@media only screen and (max-width: 600px) {
		.ratings {
			margin: 0 -1rem;
		}
		.ratings th,
		.ratings td {
			padding: 0.25rem;
		}
	}
</style>
