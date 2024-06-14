<script lang="ts">
	import { matchStore, deleteMatch, subscribeToMatch, updateMatchTeams } from '$lib/stores/match';
	import { playersStore } from '$lib/stores/player';
	import type { Match, Player } from '$lib/types';
	import { getMatchPlayerIds } from '$lib/utils';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';

	export let matchId: string;
	export let availablePlayerIds: string[];
	export let round: number;

	let match: Match;
	let playerMap: Record<string, Player>;

	let selectedPlayerIds: string[];

	let sortedPlayers: Player[] = [];

	onMount(() => {
		const unsubscribe = subscribeToMatch(matchId);
		const unsubscribeStore = matchStore.subscribe((data) => {
			match = data as Match;
		});

		playerMap = get(playersStore);

		return () => {
			unsubscribe();
			unsubscribeStore();
		};
	});

	$: if (match && playerMap && availablePlayerIds.length) {
		// console.log(availablePlayerIds);
		selectedPlayerIds = getMatchPlayerIds(match);
		sortedPlayers = [];
		for (const playerId of availablePlayerIds) {
			sortedPlayers.push(playerMap[playerId]);
		}
		sortedPlayers.sort((a, b) => a.name.localeCompare(b.name));
	}

	const addPlayer = async (id: string) => {
		if (match.team1.length < 2) {
			match.team1.push(id);
		} else if (match.team2.length < 2) {
			match.team2.push(id);
		}
	};

	const removePlayer = async (id: string) => {
		if (match.team1[0] === id) {
			match.team1.splice(0, 1);
		}
		if (match.team1[1] === id) {
			match.team1.splice(1, 1);
		}
		if (match.team2[0] === id) {
			match.team2.splice(0, 1);
		}
		if (match.team2[1] === id) {
			match.team2.splice(1, 1);
		}
	};

	const togglePlayer = async (id: string) => {
		if (selectedPlayerIds.some((x) => x === id)) {
			await removePlayer(id);
		} else {
			await addPlayer(id);
		}
		await refresh();
	};

	const refresh = async () => {
		await updateMatchTeams(match);
	};

	const cancel = async () => {
		await deleteMatch(match.id);
	};
</script>

{#if match && playerMap}
	<h3>Round {round}</h3>

	<div>Select Players</div>

	<div>
		<div class="players">
			{#each sortedPlayers as player}
				<button
					on:click={async () => togglePlayer(player.id)}
					class="secondary pill {selectedPlayerIds.includes(player.id) ? 'outline' : ''}"
					>{player.name}</button
				>
			{/each}
		</div>
		<div class="match">
			<div class="team right">
				<div>{playerMap[match.team1[0]]?.name ?? '[________]'}</div>
				<div>{playerMap[match.team1[1]]?.name ?? '[________]'}</div>
			</div>
			<div class="score">
				<div>00</div>
				<div>00</div>
			</div>
			<div class="team">
				<div>{playerMap[match.team2[0]]?.name ?? '[________]'}</div>
				<div>{playerMap[match.team2[1]]?.name ?? '[________]'}</div>
			</div>
		</div>
	</div>

	<button on:click={cancel}>Cancel</button>
{/if}

<style>
	.players {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin: 1rem 0;
	}

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
	.score div {
		border-color: yellow;
	}
</style>
