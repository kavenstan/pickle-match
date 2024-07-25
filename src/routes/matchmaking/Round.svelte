<script lang="ts">
	import ViewMatch from '$lib/components/ViewMatch.svelte';
	import type { Match } from '$lib/types';
	import EditMatch from './EditMatch.svelte';

	export let matches: Match[] = [];
	export let editable: boolean = false;
	export let currentRound: number = 1;
	export let displayedRound: number = 1;

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

	let groupedMatches: [number, Match[]][];
	$: groupedMatches = groupByRound(matches);

	let roundCount = 1;
	$: roundCount = groupedMatches.length;

	const handleChangeDisplayedRound = (round: number) => {
		displayedRound = round;
	};
</script>

{#if groupedMatches}
	<div class="round">
		{#each groupedMatches as [round, roundMatches] (round)}
			{#if displayedRound == 0 || displayedRound == round}
				<div>
					<div class="round-title">Round {round}</div>
					{#each roundMatches as match}
						{#if editable}
							<EditMatch {match} />
						{:else}
							<ViewMatch {match} />
						{/if}
					{/each}
					<div class="round-nav">
						<button
							disabled={displayedRound == 1}
							on:click={() => handleChangeDisplayedRound(--displayedRound)}>&lt;</button
						>
						<button
							disabled={displayedRound == roundCount}
							on:click={() => handleChangeDisplayedRound(++displayedRound)}>&gt;</button
						>
					</div>
				</div>
			{/if}
		{/each}
		{#if currentRound > groupedMatches.length}
			<div>
				<div class="round-title">Round {currentRound}</div>
			</div>
		{/if}
	</div>
{/if}

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
	.round-nav {
		display: flex;
		justify-content: space-between;
	}
</style>
