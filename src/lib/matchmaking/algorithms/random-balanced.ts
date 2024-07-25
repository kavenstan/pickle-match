import { playersPerCourt } from '$lib/consts';
import type { Player, Session } from '$lib/types';
import type { Match } from 'date-fns';
import { createMatch } from '../matchmaking-utils';
import { isValidMatch } from '../criteria';

export const randomBalancedMatchmaking = (
	players: Player[],
	session: Session,
	previousPairings: Set<string>
): Match[] => {
	let currentRatingDiffLimit = session.config.ratingDiffLimit;

	let iterations = 0;
	while (iterations < session.config.maxIterations) {
		const shuffledPlayers = [...players].sort(() => 0.5 - Math.random());
		const matches: Match[] = [];

		for (let i = 0; i < shuffledPlayers.length; i += playersPerCourt) {
			const team1 = [shuffledPlayers[i], shuffledPlayers[i + 1]];
			const team2 = [shuffledPlayers[i + 2], shuffledPlayers[i + 3]];

			if (isValidMatch(team1, team2, previousPairings, currentRatingDiffLimit)) {
				matches.push(createMatch(team1, team2, session));
			} else {
				break;
			}
		}

		if (matches.length === players.length / playersPerCourt) {
			return matches;
		}

		iterations++;

		if (iterations % Math.ceil(session.config.maxIterations / 50) === 0) {
			currentRatingDiffLimit *= 1.1;
		}
	}
	return [];
};
