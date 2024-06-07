import type { Timestamp } from 'firebase/firestore';
import type { Match, Player } from './types';
import { v4 } from 'uuid';
import { format as dateFormat } from 'date-fns';
import { playersStore } from '$lib/stores/player';
import { get } from 'svelte/store';

export const mapPlayerNamesToRating = (players: Player[]): Record<string, number> => {
	const playerRatings: Record<string, number> = {};
	players.forEach((p) => {
		playerRatings[p.name] = p.rating;
	});
	return playerRatings;
};

export const newId = (): string => {
	return v4();
};

export function formatTimestamp(timestamp: Timestamp, format: string = 'yyyy-MM-dd'): string {
	return formatDate(timestamp.toDate(), format);
}

export function formatDate(date: Date, format: string = 'yyyy-MM-dd'): string {
	return dateFormat(date, format);
}

export function getPlayerInfo(id: string): Player {
	const playerMap = get(playersStore);
	return playerMap[id];
}

export function getPlayersSortedByName(): Player[] {
	const playerMap = get(playersStore);
	return Object.values(playerMap).sort((a, b) => a.name.localeCompare(b.name));
}

export function getPlayersSortedByRating(): Player[] {
	const playerMap = get(playersStore);
	return Object.values(playerMap).sort((a, b) => b.rating - a.rating);
}

export function getMatchPlayerIds(match: Match): string[] {
	return [...match.team1, ...match.team2];
}
