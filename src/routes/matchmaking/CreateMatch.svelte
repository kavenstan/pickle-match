<script lang="ts">
	import { matchStore, subscribeToMatch, updateMatchTeams } from '$lib/match';
	import type { Match, Session } from '$lib/types';
	import { onMount } from 'svelte';

	export let session: Session;
	export let matchId: string;

	let match: Match;

	let activePlayers = session.state.activePlayers.sort((a, b) => a.localeCompare(b));
	let availablePlayers: string[] = [];

	onMount(() => {
		console.log('Create Match : onMount');
		const unsubscribe = subscribeToMatch(matchId);
		const unsubscribeStore = matchStore.subscribe((data) => {
			match = data as Match;
		});

		return () => {
			unsubscribe();
			unsubscribeStore();
		};
	});

	$: if (match) {
		setAvailablePlayers(match);
	}

	const addPlayer = async (name: string) => {
		if (match.team1.length < 2) {
			match.team1.push(name);
		} else if (match.team2.length < 2) {
			match.team2.push(name);
		}
	};

	const removePlayer = async (name: string) => {
		if (match.team1[0] === name) {
			match.team1.splice(0, 1);
		}
		if (match.team1[1] === name) {
			match.team1.splice(1, 1);
		}
		if (match.team2[0] === name) {
			match.team2.splice(0, 1);
		}
		if (match.team2[1] === name) {
			match.team2.splice(1, 1);
		}
	};

	const togglePlayer = async (name: string) => {
		if (availablePlayers.some((x) => x === name)) {
			await addPlayer(name);
		} else {
			await removePlayer(name);
		}
		await refresh(match);
	};

	const setAvailablePlayers = (match: Match) => {
		availablePlayers = activePlayers.filter(
			(name) => !match.team1?.some((x) => x === name) && !match.team2?.some((x) => x === name)
		);
	};

	const refresh = async (match: Match) => {
		await updateMatchTeams(match).then((_) => setAvailablePlayers(match));
	};
</script>

{#if match}
	<div>Select Players</div>

	<div>
		<div class="players">
			{#each activePlayers as player}
				<button
					on:click={async () => togglePlayer(player)}
					class="secondary pill {availablePlayers.includes(player) ? '' : 'outline'}"
					>{player}</button
				>
			{/each}
		</div>
		{match.team1[0]},{match.team1[1]} vs {match.team2[0]},{match.team2[1]}
	</div>
{/if}

<style>
	.players {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin: 1rem 0;
	}
</style>
