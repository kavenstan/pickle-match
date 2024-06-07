import { getMatchesForSession } from './stores/match';
import { getPlayers, updateRatings, updatePlayerStats } from './stores/player';
import { updateSession } from './stores/session';
import type { Match, PlayerMatchStats, Session, Player } from './types';
import { formatTimestamp } from './utils';

// export const recalculateRatings = async () => {
// 	const sessions = (await getSessions()).reverse();
// 	console.log(`Loaded ${sessions.length} sessions`);
// }

export const calculateSessionRatings = async (session: Session) => {
	const players = await getPlayers();
	console.log(`Loaded ${players.length} players`);

	const playerStats = initializePlayerStats(players);

	let ratingMap: Record<string, number> = players.reduce(
		(acc, player) => {
			acc[player.id] = player.rating;
			return acc;
		},
		{} as Record<string, number>
	);

	// console.table(ratingMap);

	if (session.state.startRatings?.length > 0) {
		console.log('Start ratings found - skipping');
		return;
	}

	// console.log(`Session ${formatTimestamp(session.date)}`);
	const startRatingMap = { ...ratingMap };

	let sessionMatches = await getMatchesForSession(session.id);
	// console.log(`Loaded ${sessionMatches.length} matches.`);

	ratingMap = updateRatingsMap(sessionMatches, ratingMap, false);
	await updateSessionStats(session, sessionMatches, startRatingMap, ratingMap, playerStats);

	await updatePlayerStats(playerStats);

	// console.table(ratingMap);
	await updateRatings(ratingMap);
};

// TODO : Variable K - higher when fewer matches played, gradually decreasing.. 1-3=50, 4-10=40, 11-30=30, 31-80=20, 81+=10
const K = 32;

const updateSessionStats = async (
	session: Session,
	matches: Match[],
	startRatings: Record<string, number>,
	endRatings: Record<string, number>,
	playerStats: Record<string, PlayerMatchStats>
) => {
	const sessionPlayerIds = new Set<string>(session.state.activePlayerIds);

	session.state.startRatings = Object.fromEntries(
		Object.entries(startRatings).filter(([key]) => sessionPlayerIds.has(key))
	);

	session.state.endRatings = Object.fromEntries(
		Object.entries(endRatings).filter(([key]) => sessionPlayerIds.has(key))
	);

	const sessionPlayerStats = extractPlayerStatistics(matches);
	session.state.matchStats = sessionPlayerStats;

	mergeSessionIntoTotal(playerStats, sessionPlayerStats);

	await updateSession({
		id: session.id,
		state: session.state
	});
};

const extractPlayerStatistics = (matches: Match[]): Record<string, PlayerMatchStats> => {
	const stats: Record<string, PlayerMatchStats> = {};

	matches.forEach((match) => {
		const isDrawn = match.team1Score === match.team2Score;
		const team1Won = match.team1Score > match.team2Score;

		match.team1.forEach((playerId) => {
			if (!stats[playerId]) stats[playerId] = initializePlayerMatchStats();
			updateStats(
				stats[playerId],
				isDrawn ? 'drawn' : team1Won ? 'won' : 'lost',
				match.team1Score,
				match.team2Score
			);
		});

		match.team2.forEach((playerId) => {
			if (!stats[playerId]) stats[playerId] = initializePlayerMatchStats();
			updateStats(
				stats[playerId],
				isDrawn ? 'drawn' : team1Won ? 'lost' : 'won',
				match.team2Score,
				match.team1Score
			);
		});
	});

	return stats;
};

const mergeSessionIntoTotal = (
	totalStats: Record<string, PlayerMatchStats>,
	sessionStats: Record<string, PlayerMatchStats>
) => {
	for (const playerId in sessionStats) {
		if (sessionStats.hasOwnProperty(playerId)) {
			totalStats[playerId].played += sessionStats[playerId].played;
			totalStats[playerId].won += sessionStats[playerId].won;
			totalStats[playerId].lost += sessionStats[playerId].lost;
			totalStats[playerId].drawn += sessionStats[playerId].drawn;
			totalStats[playerId].pointsFor += sessionStats[playerId].pointsFor;
			totalStats[playerId].pointsAgainst += sessionStats[playerId].pointsAgainst;
		}
	}
};

const initializePlayerStats = (players: Player[]): Record<string, PlayerMatchStats> => {
	const playerStats: Record<string, PlayerMatchStats> = {};

	players.forEach((player) => {
		playerStats[player.id] = player.matchStats ?? initializePlayerMatchStats;
	});

	return playerStats;
};

const initializePlayerMatchStats = (): PlayerMatchStats => {
	return {
		played: 0,
		won: 0,
		drawn: 0,
		lost: 0,
		pointsFor: 0,
		pointsAgainst: 0
	};
};

const updateStats = (
	playerStats: PlayerMatchStats,
	result: 'won' | 'lost' | 'drawn',
	pointsFor: number,
	pointsAgainst: number
) => {
	playerStats.played += 1;
	if (result === 'won') playerStats.won += 1;
	if (result === 'lost') playerStats.lost += 1;
	if (result === 'drawn') playerStats.drawn += 1;
	playerStats.pointsFor += pointsFor;
	playerStats.pointsAgainst += pointsAgainst;
};

const expectedScore = (rating1: number, rating2: number) => {
	return 1 / (1 + 10 ** ((rating2 - rating1) / 400));
};

export const updateRatingsMap = (
	matches: Match[],
	currentRatings: Record<string, number>,
	useScoreDifference = false
) => {
	const updatedRatings = { ...currentRatings };

	const formattedResults = matches.map((match) => ({
		player1_team1: match.team1[0],
		player2_team1: match.team1[1],
		player1_team2: match.team2[0],
		player2_team2: match.team2[1],
		score_team1: match.team1Score ?? 0,
		score_team2: match.team2Score ?? 0
	}));

	formattedResults.forEach((result) => {
		const { player1_team1, player2_team1, player1_team2, player2_team2, score_team1, score_team2 } =
			result;

		const team1_rating = (updatedRatings[player1_team1] + updatedRatings[player2_team1]) / 2;
		const team2_rating = (updatedRatings[player1_team2] + updatedRatings[player2_team2]) / 2;

		const exp_team1 = expectedScore(team1_rating, team2_rating);
		const exp_team2 = expectedScore(team2_rating, team1_rating);

		let actual_team1, actual_team2;
		if (score_team1 > score_team2) {
			actual_team1 = 1;
			actual_team2 = 0;
		} else if (score_team1 < score_team2) {
			actual_team1 = 0;
			actual_team2 = 1;
		} else {
			actual_team1 = 0.5;
			actual_team2 = 0.5;
		}

		const score_diff = Math.abs(score_team1 - score_team2);
		let team1_rating_change, team2_rating_change;
		if (useScoreDifference) {
			const impact_factor = 1 + score_diff / 10;
			team1_rating_change = impact_factor * K * (actual_team1 - exp_team1);
			team2_rating_change = impact_factor * K * (actual_team2 - exp_team2);
		} else {
			team1_rating_change = K * (actual_team1 - exp_team1);
			team2_rating_change = K * (actual_team2 - exp_team2);
		}

		[player1_team1, player2_team1].forEach((player) => {
			const playerImpact = updatedRatings[player] / team1_rating;
			const ratingChange = Math.round(team1_rating_change * playerImpact);
			// console.log("Rating Change:", player, ratingChange);
			updatedRatings[player] += ratingChange;
		});

		[player1_team2, player2_team2].forEach((player) => {
			const playerImpact = updatedRatings[player] / team2_rating;
			const ratingChange = Math.round(team2_rating_change * playerImpact);
			// console.log("Rating Change:", player, ratingChange);
			updatedRatings[player] += ratingChange;
		});
	});

	return updatedRatings;
};
