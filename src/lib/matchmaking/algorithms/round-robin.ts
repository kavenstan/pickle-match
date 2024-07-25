const roundRobinMatchmaking = (
	players: Player[],
	session: Session,
	previousPairings: Set<string>
): Match[] => {
	let iterations = 0;
	while (iterations < session.config.maxIterations) {
		const shuffledPlayers = [...players].sort(() => 0.5 - Math.random());
		const matches: Match[] = [];

		for (let i = 0; i < shuffledPlayers.length; i += playersPerCourt) {
			const team1 = [shuffledPlayers[i], shuffledPlayers[i + 1]];
			const team2 = [shuffledPlayers[i + 2], shuffledPlayers[i + 3]];

			if (isValidMatch(team1, team2, previousPairings, Infinity)) {
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
