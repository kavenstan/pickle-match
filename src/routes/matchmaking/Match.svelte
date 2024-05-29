<script lang="ts">
	import type { Match as MatchType } from '$lib/types';

	export let match: MatchType;
	export let editable: boolean = false;
</script>

<div class="match">
	<div class="team right">
		<div>{match.team1[0]}</div>
		<div>{match.team1[1]}</div>
	</div>
	<div class="score">
		<div>{match.team1Score < 10 ? '0' : ''}{match.team1Score}</div>
		<div>{match.team2Score < 10 ? '0' : ''}{match.team2Score}</div>
	</div>
	<div class="team">
		<div>{match.team2[0]}</div>
		<div>{match.team2[1]}</div>
	</div>
	{#if editable}
		<div>Edit</div>
	{/if}
</div>

<style>
	.match {
		display: flex;
		justify-content: center;
		border: 1px solid var(--primary-color);
		max-width: 20rem;
		padding: 1rem;
		margin-bottom: 0.5rem;
	}
	.score div {
		font-family: monospace;
		border: 1px solid var(--accent-color);
		padding: 5px;
		line-height: 1.5rem;
		cursor: pointer;
	}
	.score {
		display: flex;
		justify-content: center;
		min-width: 7rem;
		font-size: 1.5rem;
		align-items: center;
	}
	.score div:first-child {
		margin-right: 0.5rem;
	}
	.right {
		text-align: right;
	}
	.team {
		width: 8rem;
	}
</style>
