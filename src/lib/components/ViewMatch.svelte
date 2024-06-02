<script lang="ts">
	import type { Match } from '$lib/types';

	export let match: Match;

	const scoreClass = (match: Match, team: number) => {
		if (match.team1Score === match.team2Score) {
			return 'draw';
		}
		return (match.team1Score > match.team2Score && team === 1) ||
			(match.team2Score > match.team1Score && team === 2)
			? 'win'
			: 'loss';
	};
</script>

{#if match}
	<div class="match">
		<div class="team right">
			<div>{match.team1[0]}</div>
			<div>{match.team1[1]}</div>
		</div>
		<div class="score">
			<div class={scoreClass(match, 1)}>{match.team1Score < 10 ? '0' : ''}{match.team1Score}</div>
			<div class={scoreClass(match, 2)}>
				{match.team2Score < 10 ? '0' : ''}{match.team2Score}
			</div>
		</div>
		<div class="team">
			<div>{match.team2[0]}</div>
			<div>{match.team2[1]}</div>
		</div>
	</div>
{/if}

<style>
	.match {
		display: flex;
		border: 1px solid var(--primary-color);
		padding: 0.5rem;
		margin-bottom: 0.5rem;
		gap: 0.5rem;
	}
	.score div {
		font-family: monospace;
		border-width: 2px;
		border-style: solid;
		border-radius: 8px;
		padding: 5px;
		line-height: 2rem;
		font-size: 2rem;
	}
	.score {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
	}
	.right {
		text-align: right;
	}
	.team {
		flex: 1;
	}
	.win {
		border-color: green;
	}
	.loss {
		border-color: red;
	}
	.draw {
		border-color: yellow;
	}
</style>
