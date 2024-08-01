<script lang="ts">
	import { derived, get, writable } from 'svelte/store';
	import type { Session, PlayerMatchStats, Player, Match } from '$lib/types';
	import { onMount } from 'svelte';
	import { playersStore } from '$lib/stores/player';

	export let session: Session;
	export let matches: Match[];

	interface ComputedPlayerStats extends PlayerMatchStats {
		id: string;
		name: string;
		pointsDifference: number;
		ratingChange: number;
	}

	let playerMap: Record<string, Player>;
	let averageTeamRatingDifference = 0;
	let averageMatchRatingDifference = 0;

	onMount(() => {
		playerMap = get(playersStore);
	});

	$: if (playerMap && Object.keys(playerMap).length > 0 && matches.length > 0) {
		let totalTeamDiff = 0;
		let totalMatchDiff = 0;

		if (matches) {
			matches.forEach((match) => {
				const player1Rating = playerMap[match.team1[0]].rating.rating;
				const player2Rating = playerMap[match.team1[1]].rating.rating;
				const player3Rating = playerMap[match.team2[0]].rating.rating;
				const player4Rating = playerMap[match.team2[1]].rating.rating;

				const team1Rating = (player1Rating + player2Rating) / 2;
				const team2Rating = (player3Rating + player4Rating) / 2;

				const team1RatingDiff = Math.abs(player1Rating - player2Rating);
				const team2RatingDiff = Math.abs(player3Rating - player4Rating);

				totalTeamDiff += team1RatingDiff + team2RatingDiff;

				const matchRatingDiff = Math.abs(team1Rating - team2Rating);

				totalMatchDiff += matchRatingDiff;
			});

			averageTeamRatingDifference = Math.round(totalTeamDiff / (matches.length * 2));
			averageMatchRatingDifference = Math.round(totalMatchDiff / matches.length);
		}
	}

	let sortedColumn: string = '';
	let sortOrder: 'asc' | 'desc' = 'asc';

	const computedStats = derived([writable(session), playersStore], ([$session, $playersStore]) => {
		if (!playersStore) {
			return [];
		}
		return Object.entries($session.state.matchStats).map(([id, stats]) => {
			const pointsDifference = stats.pointsFor - stats.pointsAgainst;
			const ratingChange =
				($session.state.endRatings?.[id]?.rating ?? 0) -
				($session.state.startRatings?.[id]?.rating ?? 0);

			return {
				id,
				name: $playersStore[id]?.name ?? '...',
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
					<td class="rating">{Math.round(stats.ratingChange)}</td>
				</tr>
			{/each}
		{/if}
	</tbody>
</table>

<div>
	Average team rating difference: {averageTeamRatingDifference}
	<br />
	Average match rating difference: {averageMatchRatingDifference}
</div>

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
</style>
