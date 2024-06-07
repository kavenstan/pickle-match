<script lang="ts">
	import { playersStore } from '$lib/stores/player';
	import type { Player } from '$lib/types';

	let players: Player[] = [];

	$: players = Object.values($playersStore)
		.sort((a, b) => b.rating - a.rating)
		.filter((p) => p.matchStats.played > 1);

	const grade = (rating: number) => {
		if (rating > 1450) {
			return 'diamond';
		} else if (rating > 1300) {
			return 'gold';
		} else if (rating > 1150) {
			return 'silver';
		}
		return 'bronze';
	};

	const percentage = (decimal: number) => {
		return (decimal * 100).toFixed(0) + '%';
	};
</script>

<h1>Ratings</h1>
<table class="ratings">
	<thead>
		<tr>
			<th class="grade"></th>
			<th class="index" scope="col">#</th>
			<th class="name" scope="col">Name</th>
			<th class="played" scope="col">P</th>
			<th class="won" scope="col">W</th>
			<th class="won" scope="col">W%</th>
			<th class="lost" scope="col">L</th>
			<th class="drawn" scope="col">D</th>
			<!-- <th class="rating" scope="col">Rating</th> -->
		</tr>
	</thead>
	<tbody>
		{#each players as player, index}
			<tr>
				<th class={`grade ${grade(player.rating)}`}></th>
				<td class="index">{index + 1}</td>
				<td class="name"><strong>{player.name}</strong></td>
				<td class="played">{player.matchStats?.played}</td>
				<td class="won">{player.matchStats?.won}</td>
				<td class="won">{percentage(player.matchStats?.won / player.matchStats?.played)}</td>
				<td class="lost">{player.matchStats?.lost}</td>
				<td class="drawn">{player.matchStats?.drawn}</td>
				<!-- <td class="rating"><strong>{player.rating}</strong></td> -->
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

	.grade {
		padding: 0;
		width: 0.3rem;
	}
	.diamond {
		background-color: turquoise;
	}
	.gold {
		background-color: gold;
	}
	.silver {
		background-color: silver;
	}
	.bronze {
		background-color: brown;
	}
</style>
