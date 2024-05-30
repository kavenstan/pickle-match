<script lang="ts">
	import type { Round as RoundType } from '$lib/types';
	import Match from './Match.svelte';

	export let round: RoundType;
	export let number: number;
	export let sessionId: string;

	export let editable: boolean = false;
</script>

<div class="round">
	<div class="round-title">Round {number}</div>
	{#each round.matches as match}
		<Match {match} {editable} {sessionId} />
	{/each}
</div>

<style>
	.round {
		margin-bottom: 1rem;
	}
	.round-title {
		border: 1px solid black;
		text-align: center;
		font-weight: bold;

		background-color: var(--light-color);
		color: var(--primary-color);
	}
</style>
