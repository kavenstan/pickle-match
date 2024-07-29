import type { Session, Match } from '$lib/types';
import { generateRounds, type MatchmakingResult, type PlayerRating } from '../matchmaking';
import {
	calculateAverageRatingDifference,
	createMatch,
	playerIds
} from '../matchmaking-utils';

export const balancedMatchmaking = (
	players: PlayerRating[],
	session: Session,
	pairingCounts: Record<string, number>
): MatchmakingResult => {
	const validCombinations = generateRounds(players, session, pairingCounts);

	const bestCombination = session.config.allowRepeatPairings
		? validCombinations[Math.floor(Math.random() * validCombinations.length)]
		: validCombinations.reduce((best, current) => {
			return calculateAverageRatingDifference(current) < calculateAverageRatingDifference(best)
				? current
				: best;
		}, validCombinations[0]);

	const matchups: Match[] = [];
	bestCombination?.forEach((match) => {
		matchups.push(createMatch(playerIds(match[0]), playerIds(match[1]), session));
	});

	return {
		matches: matchups
	};
};

