import type { Player, Round, Session, Config, Match, State } from './types';
import { v4 as uuidv4 } from 'uuid';

export const createRound = (session: Session, allPlayers: Player[]): Round => {
	const players = allPlayers.filter((player) =>
		session.config.players.some((playerName) => playerName === player.name)
	);

	const playerRatings = new Map<string, number>();
	allPlayers.forEach((p) => {
		playerRatings.set(p.name, p.rating);
	});

	const previousPairings = new Set(
		session.rounds.flatMap((round) =>
			round.matches.flatMap((match) => {
				return [match.team1.join(','), match.team2.join(',')];
			})
		)
	);

	const playersPerCourt = 4;
	const totalPlayers = players.length;
	const courtCapacity = session.config.courtsAvailable * playersPerCourt;
	const sitOutCount =
		totalPlayers > courtCapacity ? totalPlayers - courtCapacity : totalPlayers % 4;

	const sitOutPlayers: string[] = [];
	let currentIndex = session.state.sitOutIndex;
	for (let i = 0; i < sitOutCount; i++) {
		sitOutPlayers.push(session.state.sitOutOrder[currentIndex]);
		currentIndex = (currentIndex + 1) % session.state.sitOutOrder.length;
	}
	const playingPlayers = players.filter((player) => !sitOutPlayers.includes(player.name));

	let iterations = 0;
	let currentRatingDiffLimit = session.config.ratingDiffLimit;

	while (iterations < session.config.maxIterations) {
		const shuffledPlayers = [...playingPlayers].sort(() => 0.5 - Math.random());
		const matches: Match[] = [];

		for (let i = 0; i < shuffledPlayers.length; i += playersPerCourt) {
			const team1 = [shuffledPlayers[i], shuffledPlayers[i + 1]];
			const team2 = [shuffledPlayers[i + 2], shuffledPlayers[i + 3]];

			if (isValidMatch(team1, team2, previousPairings, currentRatingDiffLimit)) {
				matches.push(createMatch(team1, team2));
			} else {
				break;
			}
		}

		if (matches.length === playingPlayers.length / playersPerCourt) {
			session.state.sitOutIndex =
				(session.state.sitOutIndex + sitOutCount) % session.state.sitOutOrder.length;
			return { id: uuidv4(), matches };
		}

		iterations++;

		if (iterations % Math.ceil(session.config.maxIterations / 10) === 0) {
			currentRatingDiffLimit *= 1.1;
		}
	}

	throw new Error('Failed to create a valid round within max iterations');
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
		Math.abs(player1.rating - player2.rating) > ratingDiffLimit ||
		Math.abs(player3.rating - player4.rating) > ratingDiffLimit
	) {
		return false;
	}

	const avgTeam1Rating = (player1.rating + player2.rating) / 2;
	const avgTeam2Rating = (player3.rating + player4.rating) / 2;

	if (Math.abs(avgTeam1Rating - avgTeam2Rating) > ratingDiffLimit) {
		return false;
	}

	const pairings = [
		`${player1.name}-${player2.name}`,
		`${player2.name}-${player1.name}`,
		`${player3.name}-${player4.name}`,
		`${player4.name}-${player3.name}`
	];

	for (const pairing of pairings) {
		if (previousPairings.has(pairing)) {
			return false;
		}
	}

	return true;
};

const createMatch = (team1: Player[], team2: Player[]): Match => {
	return {
		id: uuidv4(),
		team1: team1.map((player) => player.name),
		team2: team2.map((player) => player.name),
		team1Score: 0,
		team2Score: 0
	};
};
