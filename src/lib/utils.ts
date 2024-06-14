import type { Timestamp } from 'firebase/firestore';
import type { Match, Player, Rating } from './types';
import { v4 } from 'uuid';
import { format as dateFormat } from 'date-fns';
import { playersStore } from '$lib/stores/player';
import { get } from 'svelte/store';

export const mapPlayerNamesToRating = (players: Player[]): Record<string, Rating> => {
	const playerRatings: Record<string, Rating> = {};
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
	return Object.values(playerMap).sort((a, b) => b.rating.rating - a.rating.rating);
}

export function getMatchPlayerIds(match: Match): string[] {
	return [...match.team1, ...match.team2];
}

export const factorial = (n: number): number => {
	if (n <= 0) {
		return 1;
	}
	return n * factorial(n - 1);
}

export const combinations = (n: number, k: number): number => {
	if (n === 0 || k === 0 || n < k) {
		return 0;
	}
	return factorial(n) / (factorial(k) * factorial(n - k));
}

export const median = (values: number[]): number => {
	if (values.length === 0) {
		return 0;
	}
	values.sort((a, b) => a - b);
	const middle = Math.floor(values.length / 2);

	if (values.length % 2 === 0) {
		return (values[middle - 1] + values[middle]) / 2;
	} else {
		return values[middle];
	}
}

export const standardDeviation = (numbers: number[]): number => {
	if (numbers.length === 0) {
		return 0;
	}
	const mean = numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
	const variance = numbers.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / numbers.length;
	return Math.sqrt(variance);
};