<script lang="ts">
	import { updateMatchScore } from '$lib/repo';
	import type { Match as MatchType } from '$lib/types';

	export let match: MatchType;
	export let editable: boolean = false;
	export let sessionId: string | null;

	let team1Score = match.team1Score;
	let team2Score = match.team2Score;

	const handleScoreChange = async () => {
		if (!editable) {
			return;
		}

		const updatedMatch = { ...match, team1Score, team2Score };

		try {
			await updateMatchScore(sessionId!, updatedMatch);
			match = updatedMatch;
		} catch (error) {
			console.error(error);
		}
	};

	const scoreClass = (match: MatchType, team: number) => {
		if (match.team1Score === match.team2Score) {
			return 'draw';
		}
		return (match.team1Score > match.team2Score && team === 1) ||
			(match.team2Score > match.team1Score && team === 2)
			? 'win'
			: 'loss';
	};
</script>

<div class="match">
	<div class="team right">
		<div>{match.team1[0]}</div>
		<div>{match.team1[1]}</div>
	</div>
	<div class="score">
		{#if editable}
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
		{:else}
			<div class={scoreClass(match, 1)}>{match.team1Score < 10 ? '0' : ''}{match.team1Score}</div>
			<div class={scoreClass(match, 2)}>
				{match.team2Score < 10 ? '0' : ''}{match.team2Score}
			</div>
		{/if}
	</div>
	<div class="team">
		<div>{match.team2[0]}</div>
		<div>{match.team2[1]}</div>
	</div>
</div>

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
	.score div {
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
