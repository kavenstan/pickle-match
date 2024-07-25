<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import type { Player, Session } from '$lib/types';
	import { getPlayer } from '$lib/stores/player';
	import { getPlayerSessions } from '$lib/stores/session';
	import {
		Chart,
		LineController,
		LineElement,
		PointElement,
		LinearScale,
		Title,
		CategoryScale,
		Filler
	} from 'chart.js';

	Chart.register(
		LineController,
		LineElement,
		PointElement,
		LinearScale,
		Title,
		CategoryScale,
		Filler
	);

	type DateRating = {
		date: Date;
		rating: number;
	};

	let playerId: string;
	let player: Player | null = null;
	let sessions: Session[] = [];
	let ratings: DateRating[] = [];
	let chart: Chart;

	$: playerId = $page.params.id;

	onMount(async () => {
		player = await getPlayer(playerId);
		sessions = await getPlayerSessions(playerId);

		ratings = sessions.map(
			(session) =>
				({
					date: session.date.toDate(),
					rating: session.state.endRatings[playerId].rating
				}) as DateRating
		);

		const canvas = document.getElementById('ratingChart') as HTMLCanvasElement;
		const ctx = canvas.getContext('2d');
		chart = new Chart(ctx!, {
			type: 'line',
			data: {
				labels: ratings.map((r) => r.date.toLocaleDateString()),
				datasets: [
					{
						label: 'Player Rating Over Time',
						data: ratings.map((r) => r.rating),
						borderColor: 'rgba(75, 192, 192, 1)',
						backgroundColor: 'rgba(75, 192, 192, 0.2)',
						fill: true,
						tension: 0.25
					}
				]
			}
		});
	});
</script>

{#if player}
	<div>
		<h1>{player.name}</h1>
		<p>Current Rating: {Math.round(player.rating.rating)}</p>
		<div class="chart-container">
			<canvas id="ratingChart" width="400" height="200"></canvas>
		</div>
	</div>
{:else}
	<div>
		<p>Loading player info...</p>
	</div>
{/if}

<style>
	.chart-container {
		max-width: 600px;
		max-height: 600px;
	}
</style>
