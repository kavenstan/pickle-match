<script lang="ts">
	import { derived, writable } from 'svelte/store';
	import type { Session, PlayerMatchStats } from '$lib/types';
	import { onMount } from 'svelte';

	export let session: Session;

	interface ComputedPlayerStats extends PlayerMatchStats {
		name: string;
		pointsDifference: number;
		ratingChange: number;
	}

	let sortedColumn: string = '';
	let sortOrder: 'asc' | 'desc' = 'asc';

	const computedStats = derived([writable(session)], ([$session]) => {
		return Object.entries($session.state.matchStats).map(([name, stats]) => {
			const pointsDifference = stats.pointsFor - stats.pointsAgainst;
			const ratingChange = $session.state.endRatings[name] - $session.state.startRatings[name];

			return {
				name,
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

	onMount(() => {
		sortTable('ratingChange');
	});

	// Initialize sorted data
	$: sortedData.set([...$computedStats]);
</script>

<div>Session Stats</div>

<table>
	<thead>
		<tr>
			<th on:click={() => sortTable('name')}>Name</th>
			<th on:click={() => sortTable('played')}>P</th>
			<th on:click={() => sortTable('won')}>W</th>
			<th on:click={() => sortTable('lost')}>L</th>
			<th on:click={() => sortTable('drawn')}>D</th>
			<th on:click={() => sortTable('pointsFor')}>+</th>
			<th on:click={() => sortTable('pointsAgainst')}>-</th>
			<th on:click={() => sortTable('pointsDifference')}>PΔ</th>
			<th on:click={() => sortTable('ratingChange')}>RΔ</th>
		</tr>
	</thead>
	<tbody>
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
				<td>{stats.ratingChange}</td>
			</tr>
		{/each}
	</tbody>
</table>

<style>
</style>
