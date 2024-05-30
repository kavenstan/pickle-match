<!-- src/routes/index.svelte -->
<script lang="ts">
	import { fetchPlayers } from '$lib/repo';
	import type { Player } from '$lib/types';
	import { onMount } from 'svelte';

	let players: Player[] = [];

	onMount(async () => {
		players = await fetchPlayers();
	});
</script>

<h1>Ratings</h1>
<table>
	<thead>
		<tr>
			<th scope="col" class="ranking">#</th>
			<th scope="col">Name</th>
			<!-- <th scope="col">P</th>
			<th scope="col">W</th>
			<th scope="col">L</th>
			<th scope="col">D</th> -->
			<th scope="col" class="rating">Rating</th>
		</tr>
	</thead>
	<tbody>
		{#each players as player, index}
			<tr>
				<td>{index + 1}</td>
				<td><strong>{player.name}</strong></td>
				<!-- <td></td>
				<td></td>
				<td></td>
				<td></td> -->
				<td>{player.rating}</td>
			</tr>
		{/each}
	</tbody>
</table>

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
</style>
