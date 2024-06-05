<!-- src/routes/index.svelte -->
<script lang="ts">
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
			<th class="index" scope="col">#</th>
			<th class="name" scope="col">Name</th>
			<th class="played" scope="col">P</th>
			<th class="won" scope="col">W</th>
			<th class="lost" scope="col">L</th>
			<th class="drawn" scope="col">D</th>
			<th class="rating" scope="col">Rating</th>
		</tr>
	</thead>
	<tbody>
		{#each players as player, index}
			<tr>
				<td class="index">{index + 1}</td>
				<td class="name"><strong>{player.name}</strong></td>
				<td class="played">{player.matchStats?.played}</td>
				<td class="won">{player.matchStats?.won}</td>
				<td class="lost">{player.matchStats?.lost}</td>
				<td class="drawn">{player.matchStats?.drawn}</td>
				<td class="rating"><strong>{player.rating}</strong></td>
			</tr>
		{/each}
	</tbody>
</table>

<style>
	td,
	th {
		padding: 0.5rem;
	}
	.index {
		width: 40px;
	}
	@media only screen and (max-width: 400px) {
		.played,
		.won,
		.lost,
		.drawn {
			display: none;
		}
	}
	.rating {
		width: 60px;
		text-align: right;
		font-weight: bold;
	}
	.ratings {
		margin: auto;
		max-width: 600px;
	}
</style>
