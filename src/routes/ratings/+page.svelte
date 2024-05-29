<!-- src/routes/index.svelte -->
<script lang="ts">
	import { db } from '$lib/firebase';
	import type { Player } from '$lib/types';
	import { collection, getDocs, query, orderBy } from 'firebase/firestore';
	import { onMount } from 'svelte';

	let players: Player[] = [];

	onMount(async () => {
		const querySnapshot = await getDocs(
			query(collection(db, 'players'), orderBy('rating', 'desc'))
		);
		players = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Player[];
	});
</script>

<h1>Ratings</h1>
<p>List of players, played, won, drawn, lost, rating</p>

<h1>Players</h1>
<table>
	<thead>
		<tr>
			<th scope="col">Name</th>
			<th scope="col">P</th>
			<th scope="col">W</th>
			<th scope="col">L</th>
			<th scope="col">D</th>
			<th scope="col">R</th>
		</tr>
	</thead>
	<tbody>
		{#each players as player}
			<tr>
				<td><strong>{player.name}</strong></td>
				<td></td>
				<td></td>
				<td></td>
				<td></td>
				<td>{player.rating}</td>
			</tr>
		{/each}
	</tbody>
</table>
