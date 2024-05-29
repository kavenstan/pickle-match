<script lang="ts">
	import type { Round as RoundType } from '$lib/types';
	import Match from './Match.svelte';

	export let round: RoundType;
	export let number: number;
	// export let editable: boolean = false;
</script>

<div class="round">
	<div class="title">Round {number}</div>
	{#each round.matches as match}
		<Match {match} />
	{/each}
</div>

<style>
	.round {
		margin-bottom: 1rem;
	}
	.title {
		width: 20rem;
		border: 1px solid black;
		text-align: center;
		font-weight: bold;

		background-color: var(--light-color);
		color: var(--primary-color);
	}
</style>
