<script lang="ts">
	import { matchStore, subscribeToMatch, updateMatchTeams } from '$lib/stores/match';
	import { playersStore } from '$lib/stores/player';
	import type { Match, Player, Session } from '$lib/types';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';

	export let session: Session;
	export let matchId: string;

	let match: Match;
	let playerMap: Record<string, Player>;

	let activePlayerIds = session.state.activePlayerIds;
	let availablePlayerIds: string[] = [];

	onMount(() => {
		console.log('Create Match : onMount');
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

	$: if (match) {
		setAvailablePlayerIds(match);
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
		if (availablePlayerIds.some((x) => x === id)) {
			await addPlayer(id);
		} else {
			await removePlayer(id);
		}
		await refresh(match);
	};

	const setAvailablePlayerIds = (match: Match) => {
		availablePlayerIds = activePlayerIds.filter(
			(id) => !match.team1?.some((x) => x === id) && !match.team2?.some((x) => x === id)
		);
	};

	const refresh = async (match: Match) => {
		await updateMatchTeams(match).then((_) => setAvailablePlayerIds(match));
	};
</script>

{#if match && playerMap}
	<div>Select Players</div>

	<div>
		<div class="players">
			{#each activePlayerIds as id}
				<button
					on:click={async () => togglePlayer(id)}
					class="secondary pill {availablePlayerIds.includes(id) ? '' : 'outline'}"
					>{playerMap[id].name}</button
				>
			{/each}
		</div>
		{match.team1[0] ? playerMap[match.team1[0]].name : '?'},{match.team1[1]
			? playerMap[match.team1[1]].name
			: '?'}
		vs
		{match.team2[0] ? playerMap[match.team2[0]].name : '?'},{match.team2[1]
			? playerMap[match.team2[1]].name
			: '?'}
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
