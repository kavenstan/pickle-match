<script lang="ts">
	import ViewMatch from '$lib/components/ViewMatch.svelte';
	import type { Match } from '$lib/types';
	import EditMatch from './EditMatch.svelte';

	export let matches: Match[] = [];
	export let editable: boolean = false;

	const groupByRound = (matches: Match[]): [number, Match[]][] => {
		const grouped = matches.reduce(
			(acc, match) => {
				(acc[match.round] = acc[match.round] || []).push(match);
				return acc;
			},
			{} as Record<number, Match[]>
		);

		return Object.entries(grouped)
			.map(([round, matches]) => [Number(round), matches] as [number, Match[]])
			.sort((a, b) => a[0] - b[0]);
	};
</script>

<div class="round">
	{#each groupByRound(matches) as [round, roundMatches] (round)}
		<div>
			<div class="round-title">Round {round}</div>
			{#each roundMatches as match}
				{#if editable}
					<EditMatch {match} />
				{:else}
					<ViewMatch {match} />
				{/if}
			{/each}
		</div>
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
