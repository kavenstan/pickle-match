import type { Session, Match } from '$lib/types';
import { generateRounds, type MatchmakingResult, type PlayerRating } from '../matchmaking';
import { createMatch, playerIds } from '../matchmaking-utils';

export const roundRobinMatchmaking = (
	players: PlayerRating[],
	session: Session,
	pairingCounts: Record<string, number>
): MatchmakingResult => {
	const validCombinations = generateRounds(players, session, pairingCounts);

	const randomCombination = validCombinations[Math.floor(Math.random() * validCombinations.length)];

	const matchups: Match[] = [];
	randomCombination?.forEach((match) => {
		matchups.push(createMatch(playerIds(match[0]), playerIds(match[1]), session));
	});

	return {
		matches: matchups
	};
};
