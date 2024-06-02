<script lang="ts">
	import { updateMatchScore } from '$lib/match';
	import type { Match } from '$lib/types';

	export let match: Match;

	let team1Score = match.team1Score;
	let team2Score = match.team2Score;

	const handleScoreChange = async () => {
		const updatedMatch = { ...match, team1Score, team2Score };

		try {
			await updateMatchScore(updatedMatch);
			match = updatedMatch;
		} catch (error) {
			console.error(error);
		}
	};

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
			<input
				type="number"
				class={scoreClass(match, 1)}
				on:change={handleScoreChange}
				bind:value={team1Score}
			/>
			<input
				type="number"
				class={scoreClass(match, 2)}
				on:change={handleScoreChange}
				bind:value={team2Score}
			/>
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
	.score input,
	.score div {
		font-family: monospace;
		border-width: 2px;
		border-style: solid;
		border-radius: 8px;
		padding: 5px;
		line-height: 2rem;
		font-size: 2rem;
	}
	.score input {
		width: 3rem;
		text-align: center;
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
	input[type='number']::-webkit-inner-spin-button {
		display: none;
	}
</style>
