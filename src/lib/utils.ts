import type { Timestamp } from 'firebase/firestore';
import type { Player } from './types';
import { v4 } from 'uuid';
import { format as dateFormat } from 'date-fns';


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

export function formatTimestamp(timestamp: Timestamp, format: string = 'yyyy-MM-dd'): string {
	const date = timestamp.toDate();
	return dateFormat(date, format);
}