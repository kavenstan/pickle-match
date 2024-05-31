import type { Player } from './types';

const mapPlayerNamesToRating = (players: Player[]) => {
	const playerRatings = new Map<string, number>();
	players.forEach((p) => {
		playerRatings.set(p.name, p.rating);
	});
	return playerRatings;
};
