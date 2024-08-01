import { getPresets } from '$lib/matchmaking/preset';
import type { Player, Session, Match } from '$lib/types';
import type { MatchmakingResult, PlayerRating } from '../matchmaking';
import { createMatch, playerIds } from '../matchmaking-utils';

export const staticMatchmaking = (
	players: PlayerRating[],
	session: Session
): MatchmakingResult => {

	players.sort((a, b) => a.rating - b.rating);

	let matchPairings: Match[] = [];
	const numPlayers = players.length;

	const rounds = getPresets(numPlayers);

	rounds.forEach((round) => {
		const matches: Match[] = [];
		const sitOuts: Player[] = [];

		round.forEach((match) => {
			if (Array.isArray(match)) {
				const team1 = [players[match[0] - 1]];
				const team2 = [players[match[1] - 1]];
				matches.push(createMatch(playerIds(team1), playerIds(team2), session));
			}
		});

		matchPairings.push(...matches);
	});

	return {
		matches: matchPairings
	};
};
