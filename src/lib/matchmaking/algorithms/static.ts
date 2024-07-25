import { getPresets } from '$lib/preset';
import type { Player, Session, Match } from '$lib/types';
import { createMatch } from '../matchmaking-utils';

export const staticMatchmaking = (players: Player[], session: Session): Match[] => {
	// Sort players by rating
	players.sort((a, b) => a.rating.rating - b.rating.rating);

	// let matchPairings: Round[] = [];
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
				matches.push(createMatch(team1, team2, session));
			} else {
				sitOuts.push(players[match - 1]);
			}
		});

		matchPairings.push(...matches);
	});

	return matchPairings;
};
