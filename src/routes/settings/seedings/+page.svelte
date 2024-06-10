<script lang="ts">
	import { copySeedings } from '$lib/rating';
	import { addPlayer, playersStore } from '$lib/stores/player';
	import { getSeedings } from '$lib/stores/seeding';
	import type { Seeding, Player } from '$lib/types';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';

	let seedings: Seeding[] = [];
	let playerMap: Record<string, Player>;

	onMount(async () => {
		playerMap = get(playersStore);
		seedings = (await getSeedings()).sort((a, b) => b.rating.rating - a.rating.rating);
	});
</script>

<h1>Seedings</h1>
<table class="ratings">
	<thead>
		<tr>
			<th class="index" scope="col">#</th>
			<th class="name" scope="col">Name</th>
			<!-- <th class="id" scope="col">Id</th> -->
			<th class="rd" scope="col">RD</th>
			<th class="rating" scope="col">Rating</th>
		</tr>
	</thead>
	<tbody>
		{#each seedings as seeding, index}
			<tr>
				<td class="index">{index + 1}</td>
				<td class="name"><strong>{seeding.name}</strong></td>
				<!-- <td class="id">{seeding.id}</td> -->
				<td class="rd">{seeding.rating.rd}</td>
				<td class="rating"><strong>{seeding.rating.rating}</strong></td>
			</tr>
		{/each}
	</tbody>
</table>

<button on:click={() => copySeedings()}>Copy seedings to players</button>

<style>
	td,
	th {
		padding: 0.5rem;
	}
	.index {
		width: 40px;
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
