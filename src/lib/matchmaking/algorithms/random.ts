import type { Player, Session, Match } from '$lib/types';

export const randomMatchmaking = (players: Player[], session: Session): Match[] => {
	let iterations = 0;
	while (iterations < session.config.maxIterations) {
		const shuffledPlayers = [...players].sort(() => 0.5 - Math.random());
		const matches: Match[] = [];

		for (let i = 0; i < shuffledPlayers.length; i += playersPerCourt) {
			const team1 = [shuffledPlayers[i], shuffledPlayers[i + 1]];
			const team2 = [shuffledPlayers[i + 2], shuffledPlayers[i + 3]];

			if (isValidMatch(team1, team2, new Set<string>(), Infinity)) {
				matches.push(createMatch(team1, team2, session));
			} else {
				break;
			}
		}

		if (matches.length === players.length / playersPerCourt) {
			return matches;
		}

		iterations++;
	}
	return [];
};
