<script lang="ts">
	import { derived, get, writable } from 'svelte/store';
	import type { Session, PlayerMatchStats, Player } from '$lib/types';
	import { onMount } from 'svelte';
	import { playersStore } from '$lib/stores/player';

	export let session: Session;

	interface ComputedPlayerStats extends PlayerMatchStats {
		id: string;
		name: string;
		pointsDifference: number;
		ratingChange: number;
	}

	let playerMap: Record<string, Player>;
	onMount(() => {
		playerMap = get(playersStore);
	});

	let sortedColumn: string = '';
	let sortOrder: 'asc' | 'desc' = 'asc';

	const computedStats = derived([writable(session), playersStore], ([$session, $playersStore]) => {
		if (!playersStore) {
			return [];
		}
		return Object.entries($session.state.matchStats).map(([id, stats]) => {
			const pointsDifference = stats.pointsFor - stats.pointsAgainst;
			const ratingChange = $session.state.endRatings[id] - $session.state.startRatings[id];

			return {
				id,
				name: $playersStore[id]?.name || '...',
				...stats,
				pointsDifference,
				ratingChange
			};
		});
	});

	const sortedData = writable<ComputedPlayerStats[]>([]);

	function sortTable(column: keyof ComputedPlayerStats) {
		if (sortedColumn == column) {
			sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
		} else {
			if (column == 'name') {
				sortOrder = 'asc';
			} else {
				sortOrder = 'desc';
			}
		}
		sortedColumn = column;

		const sorted = [...$computedStats].sort((a, b) => {
			const aValue = a[column];
			const bValue = b[column];

			if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
			if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
			return 0;
		});

		sortedData.set(sorted);
	}

	// Initialize sorted data
	$: sortedData.set([...$computedStats]);
</script>

<div>Session Stats</div>

<table class="stats">
	<thead>
		<tr>
			<th on:click={() => sortTable('name')} class="name">Name</th>
			<th on:click={() => sortTable('played')}>P</th>
			<th on:click={() => sortTable('won')}>W</th>
			<th on:click={() => sortTable('lost')}>L</th>
			<th on:click={() => sortTable('drawn')}>D</th>
			<th on:click={() => sortTable('pointsFor')}>+</th>
			<th on:click={() => sortTable('pointsAgainst')}>-</th>
			<th on:click={() => sortTable('pointsDifference')}>PΔ</th>
			<th on:click={() => sortTable('ratingChange')} class="rating">RΔ</th>
		</tr>
	</thead>
	<tbody>
		{#if playerMap}
			{#each $sortedData as stats}
				<tr>
					<td>{stats.name}</td>
					<td>{stats.played}</td>
					<td>{stats.won}</td>
					<td>{stats.lost}</td>
					<td>{stats.drawn}</td>
					<td>{stats.pointsFor}</td>
					<td>{stats.pointsAgainst}</td>
					<td>{stats.pointsDifference}</td>
					<td class="rating">{stats.ratingChange}</td>
				</tr>
			{/each}
		{/if}
	</tbody>
</table>

<style>
	.stats {
		max-width: 600px;
	}
	.stats .rating {
		text-align: right;
	}
	.stats th {
		width: 30px;
	}
	.stats th.name {
		/* width: 100%; */
	}
</style>
