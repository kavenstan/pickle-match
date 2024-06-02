import type { Timestamp } from 'firebase/firestore';
import type { Player } from './types';
import { v4 } from 'uuid';


export const mapPlayerNamesToRating = (players: Player[]) => {
	const playerRatings = new Map<string, number>();
	players.forEach((p) => {
		playerRatings.set(p.name, p.rating);
	});
	return playerRatings;
};

export const newId = (): string => {
	return v4()
}

export function formatDate(timestamp: Timestamp): string {
	const date = timestamp.toDate();
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}