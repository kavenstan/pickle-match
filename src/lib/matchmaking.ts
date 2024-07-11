import { playersPerCourt } from './consts';
import { getPresets } from './preset';
import type { Player, Session, Match } from '$lib/types';
import { MatchmakingType } from '$lib/enums';
import { newId } from '$lib/utils';
import { updateState } from './stores/session';
import { addMatches } from './stores/match';
import { runSmartGenerator } from './matchup-generator';

export const createRound = async (
	session: Session,
	sessionMatches: Match[],
	allPlayers: Player[]
) => {
	if (session.config.matchmakingType === MatchmakingType.Manual) {
		return [];
	}

	const sessionPlayers = allPlayers.filter((player) =>
		session.state.activePlayerIds.some((playerId) => playerId === player.id)
	);

	const previousPairingSet = previousPairings(sessionMatches);

	let [playingPlayers, sitOutPlayerNames] = splitGroupForSitOuts(sessionPlayers, session);

	let matches = createMatches(playingPlayers, session, previousPairingSet);

	if (matches.length > 0) {
		session.state.sitOutIndex =
			(session.state.sitOutIndex + sitOutPlayerNames.length) %
			session.state.sitOutOrderPlayerIds.length;
		session.state.currentRound += 1;

		await updateState(session.id, {
			currentRound: session.state.currentRound,
			sitOutIndex: session.state.sitOutIndex
		})
		await addMatches(matches);
	}

	throw new Error('Failed to create a valid round within max iterations');
};

const previousPairings = (matches: Match[]): Set<string> => {
	let playerIdCombos = matches.flatMap((match) => {
		return [match.team1.join(','), match.team2.join(',')];
	});
	return new Set(playerIdCombos);
};

const splitGroupForSitOuts = (players: Player[], session: Session): [Player[], string[]] => {
	const totalPlayers = players.length;
	const courtCapacity = session.config.courts * playersPerCourt;
	const sitOutCount =
		totalPlayers > courtCapacity ? totalPlayers - courtCapacity : totalPlayers % 4;

	const sitOutPlayerIds: string[] = [];
	let currentIndex = session.state.sitOutIndex;
	for (let i = 0; i < sitOutCount; i++) {
		sitOutPlayerIds.push(session.state.sitOutOrderPlayerIds[currentIndex]);
		currentIndex = (currentIndex + 1) % session.state.sitOutOrderPlayerIds.length;
	}
	const playingPlayers = players.filter((player) => !sitOutPlayerIds.includes(player.id));

	return [playingPlayers, sitOutPlayerIds];
};

const createMatches = (
	players: Player[],
	session: Session,
	previousPairings: Set<string>
): Match[] => {
	let matchPairings: Match[] = [];

	switch (session.config.matchmakingType) {
		case 'Random':
			matchPairings = randomMatchmaking(players, session);
			break;
		case 'RoundRobin':
			matchPairings = roundRobinMatchmaking(players, session, previousPairings);
			break;
		case 'Balanced':
			matchPairings = balancedMatchmaking(players, session, previousPairings);
			break;
		case 'Static':
			matchPairings = staticMatchmaking(players, session);
			break;
		case 'Manual':
			matchPairings = [];
			break;
		case 'Smart':
			matchPairings = runSmartGenerator(players, session.id);
			break;
		default:
			throw new Error('Unknown matchmaking algorithm');
	}

	return matchPairings;
};

const randomMatchmaking = (players: Player[], session: Session): Match[] => {
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

const balancedMatchmaking = (
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

const staticMatchmaking = (players: Player[], session: Session): Match[] => {
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

const isValidMatch = (
	team1: Player[],
	team2: Player[],
	previousPairings: Set<string>,
	ratingDiffLimit: number
): boolean => {
	const [player1, player2] = team1;
	const [player3, player4] = team2;

	if (
		Math.abs(player1.rating.rating - player2.rating.rating) > ratingDiffLimit ||
		Math.abs(player3.rating.rating - player4.rating.rating) > ratingDiffLimit
	) {
		return false;
	}

	const avgTeam1Rating = (player1.rating.rating + player2.rating.rating) / 2;
	const avgTeam2Rating = (player3.rating.rating + player4.rating.rating) / 2;

	if (Math.abs(avgTeam1Rating - avgTeam2Rating) > ratingDiffLimit) {
		return false;
	}

	const pairings = [
		`${player1.id}-${player2.id}`,
		`${player2.id}-${player1.id}`,
		`${player3.id}-${player4.id}`,
		`${player4.id}-${player3.id}`
	];

	for (const pairing of pairings) {
		if (previousPairings.has(pairing)) {
			return false;
		}
	}

	return true;
};

const createMatch = (team1: Player[], team2: Player[], session: Session): Match => {
	return {
		id: newId(),
		sessionId: session.id,
		round: session.state.currentRound,
		team1: team1.map((player) => player.id),
		team2: team2.map((player) => player.id),
		team1Score: 0,
		team2Score: 0,
		ratingChanges: {}
	};
};

// TODO : Check this
const addPlayerToSession = async (session: Session, player: Player) => {
	if (!session.state.allPlayerIds.some((playerId) => playerId === player.id)) {
		session.state.allPlayerIds.push(player.id);
	}
	if (!session.state.activePlayerIds.some((playerId) => playerId === player.id)) {
		session.state.activePlayerIds.push(player.id);
		session.state.sitOutOrderPlayerIds.splice(session.state.sitOutIndex, 0, player.id);
		session.state.sitOutIndex += 1;
	}
};

// TODO : Implement this
const removePlayerFromSession = async (session: Session, player: Player) => {
	let activeIndex = session.state.activePlayerIds.findIndex((playerId) => playerId === player.id);
	if (activeIndex >= 0) {
		// splice
	}

	let sitOutIndex = session.state.sitOutOrderPlayerIds.findIndex(
		(playerId) => playerId === player.id
	);
	if (sitOutIndex >= 0) {
		// splice
		// session.state.sitOutIndex
	}
};
