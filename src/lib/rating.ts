import { getMatchesForSession, updateMatchRatings } from './stores/match';
import { getPlayers, updatePlayerRating, updateRatings } from './stores/player';
import { getSeedings } from './stores/seeding';
import { getSessions, updateState } from './stores/session';
import type { Match, Rating, Session } from './types';
import { addInfoToast } from './ui';

export const resetAllRatings = async () => {
	const sessions = (await getSessions()).reverse();

	for (const session of sessions) {
		await resetRatings(session);
	}
}

export const calculateAllRatings = async () => {
	const sessions = (await getSessions()).reverse();

	for (const session of sessions) {
		await calculateRatings(session);
	}
}

export const copySeedings = async () => {
	const seedings = await getSeedings();
	const playerMap = await getPlayers();

	// TODO : This should add any missing seedings first
	// So we're sure anyone who didn't have a seeding gets set to default 1200

	for (const seeding of seedings) {
		if (seeding.id! in playerMap) {
			continue;
		}
		await updatePlayerRating(seeding.id!, seeding.rating)
	}
};

export const calculateRatings = async (session: Session) => {
	const players = await getPlayers();

	let ratingMap: Record<string, Rating> = players.reduce(
		(acc, player) => {
			acc[player.id] = { rating: player.rating.rating, rd: player.rating.rd };
			return acc;
		},
		{} as Record<string, Rating>
	);

	console.table(ratingMap);

	if (Object.keys(session.state.startRatings).length > 0) {
		addInfoToast('Start ratings found - skipping ratings calculation');
		return;
	}

	const startRatingMap = { ...ratingMap };

	let sessionMatches = await getMatchesForSession(session.id);

	ratingMap = await calculateUpdatedRatings(sessionMatches, ratingMap);

	await updateSessionRatings(session, startRatingMap, ratingMap);

	console.table(ratingMap);
	await updateRatings(ratingMap);
};

const updateSessionRatings = async (
	session: Session,
	startRatings: Record<string, Rating>,
	endRatings: Record<string, Rating>
) => {
	const sessionPlayerIds = new Set<string>(session.state.activePlayerIds);

	const playerStartRatings = Object.fromEntries(
		Object.entries(startRatings).filter(([key]) => sessionPlayerIds.has(key))
	);

	const playerEndRatings = Object.fromEntries(
		Object.entries(endRatings).filter(([key]) => sessionPlayerIds.has(key))
	);

	await updateState(session.id, {
		startRatings: playerStartRatings,
		endRatings: playerEndRatings
	});
};

const calculateUpdatedRatings = async (
	matches: Match[],
	currentRatings: Record<string, Rating>
) => {
	const updatedRatings = { ...currentRatings };

	for (const match of matches) {

		const team1: Team = [
			updatedRatings[match.team1[0]], updatedRatings[match.team1[1]]
		];
		const team2: Team = [
			updatedRatings[match.team2[0]], updatedRatings[match.team2[1]]
		];

		const teams = calculateEloRatings(team1, team2, [match.team1Score, match.team2Score]);

		match.ratingChanges = {};
		match.ratingChanges[match.team1[0]] = teams[0][0].rating - updatedRatings[match.team1[0]].rating;
		match.ratingChanges[match.team1[1]] = teams[0][1].rating - updatedRatings[match.team1[1]].rating;
		match.ratingChanges[match.team2[0]] = teams[1][0].rating - updatedRatings[match.team2[0]].rating;
		match.ratingChanges[match.team2[1]] = teams[1][1].rating - updatedRatings[match.team2[1]].rating;
		await updateMatchRatings(match.id, match.ratingChanges);

		updatedRatings[match.team1[0]] = teams[0][0];
		updatedRatings[match.team1[1]] = teams[0][1];
		updatedRatings[match.team2[0]] = teams[1][0];
		updatedRatings[match.team2[1]] = teams[1][1];
	}

	return updatedRatings;
};

export const resetRatings = async (session: Session) => {
	await updateState(session.id, {
		startRatings: {},
		endRatings: {}
	});
}

const K = 32;

type Team = [Rating, Rating];
type Score = [number, number];

const calculateEloRatings = (team1: Team, team2: Team, scores: Score): [Team, Team] => {
	const team1Rating = (team1[0].rating + team1[1].rating) / 2;
	const team2Rating = (team2[0].rating + team2[1].rating) / 2;

	const actualScoreTeam1 = scores[0] > scores[1] ? 1 : (scores[0] < scores[1] ? 0 : 0.5);
	const actualScoreTeam2 = scores[1] > scores[0] ? 1 : (scores[1] < scores[0] ? 0 : 0.5);

	const calculateExpectedScore = (rating1: number, rating2: number) => {
		return 1 / (1 + 10 ** ((rating2 - rating1) / 400));
	};

	const updatePlayer = (player: Rating, teamRating: number, opponentRating: number, actualScore: number) => {
		const expectedScore = calculateExpectedScore(teamRating, opponentRating);
		// const scalingFactor = 1 + (opponentRating - player.rating) / 400;
		const scalingFactor = 1;
		const ratingChange = K * scalingFactor * (actualScore - expectedScore);

		const newRating = player.rating + ratingChange;

		return {
			rating: newRating,
			rd: player.rd
		};
	};

	const newTeam1: Team = [
		updatePlayer(team1[0], team1Rating, team2Rating, actualScoreTeam1),
		updatePlayer(team1[1], team1Rating, team2Rating, actualScoreTeam1)
	];

	const newTeam2: Team = [
		updatePlayer(team2[0], team2Rating, team1Rating, actualScoreTeam2),
		updatePlayer(team2[1], team2Rating, team1Rating, actualScoreTeam2)
	];

	return [newTeam1, newTeam2];
}

export const calculateGlickoRatings = (team1: Team, team2: Team, scores: Score): [Team, Team] => {
	const q = Math.log(10) / 400;
	const g = (rd: number) => 1 / Math.sqrt(1 + 3 * (q * q) * (rd * rd) / (Math.PI * Math.PI));
	const E = (r1: number, r2: number, rd2: number) => 1 / (1 + Math.exp(-g(rd2) * (r1 - r2) / 400));

	const updatePlayer = (player: Rating, teamAverageRating: number, opponentTeamAverageRating: number, opponentRD: number, actualScore: number): Rating => {
		const gRD = g(opponentRD);
		const EScore = E(teamAverageRating, opponentTeamAverageRating, opponentRD);

		const d2_inv = (gRD ** 2) * EScore * (1 - EScore);
		const d2 = 1 / (q * q * d2_inv);

		const ratingChange = (q / ((1 / (player.rd * player.rd)) + (1 / d2))) * gRD * (actualScore - EScore);

		const newRD = Math.sqrt(((1 / (player.rd * player.rd)) + (1 / d2)) ** -1);

		return {
			rating: player.rating + ratingChange,
			rd: newRD
		};
	};

	const team1Rating = (team1[0].rating + team1[1].rating) / 2;
	const team2Rating = (team2[0].rating + team2[1].rating) / 2;

	const team1RD = Math.sqrt((team1[0].rd * team1[0].rd + team1[1].rd * team1[1].rd) / 2);
	const team2RD = Math.sqrt((team2[0].rd * team2[0].rd + team2[1].rd * team2[1].rd) / 2);

	const actualScoreTeam1 = scores[0] > scores[1] ? 1 : (scores[0] < scores[1] ? 0 : 0.5);
	const actualScoreTeam2 = scores[1] > scores[0] ? 1 : (scores[1] < scores[0] ? 0 : 0.5);

	const newTeam1: Team = [
		updatePlayer(team1[0], team1Rating, team2Rating, team2RD, actualScoreTeam1),
		updatePlayer(team1[1], team1Rating, team2Rating, team2RD, actualScoreTeam1)
	];

	const newTeam2: Team = [
		updatePlayer(team2[0], team2Rating, team1Rating, team1RD, actualScoreTeam2),
		updatePlayer(team2[1], team2Rating, team1Rating, team1RD, actualScoreTeam2)
	];

	return [newTeam1, newTeam2];
}


export const simulate = () => {

	const player1: Rating = { rating: 1100, rd: 250 };
	const player2: Rating = { rating: 1200, rd: 50 };
	const player3: Rating = { rating: 1300, rd: 150 };
	const player4: Rating = { rating: 1400, rd: 100 };

	const team1: Team = [player1, player2];
	const team2: Team = [player3, player4];
	const updated = calculateGlickoRatings(team1, team2, [11, 1]);

	console.table(updated[0]);
	console.table(updated[1]);
}