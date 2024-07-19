import { getMatchesForSession } from './stores/match';
import { defaultPlayerMatchStats, getPlayers, updatePlayersStats } from './stores/player';
import { getSessions, updateState } from './stores/session';
import type { Match, Player, PlayerMatchStats, Session } from './types';

export const resetAllStats = async () => {
	const sessions = (await getSessions()).reverse();

	for (const session of sessions) {
		await resetStats(session);
	}
};

export const calculateAllStats = async () => {
	const sessions = (await getSessions()).reverse();

	for (const session of sessions) {
		await calculateStats(session);
	}
};

export const resetStats = async (session: Session) => {
	const players = await getPlayers();

	const playerStats = initializePlayerStats(players);

	removeSessionStatsFromTotal(playerStats, session.state.matchStats);
	await updatePlayersStats(playerStats);

	await updateState(session.id, {
		matchStats: {}
	});
};

export const calculateStats = async (session: Session) => {
	const players = await getPlayers();

	const playerStats = initializePlayerStats(players);

	if (Object.keys(session.state.matchStats).length > 0) {
		console.log('Session stats non-empty - skipping');
		return;
	}

	let sessionMatches = await getMatchesForSession(session.id);
	// console.log(`Loaded ${sessionMatches.length} matches.`);

	await updateSessionStats(session, sessionMatches, playerStats);

	console.table(playerStats);
	await updatePlayersStats(playerStats);
};

const updateSessionStats = async (
	session: Session,
	matches: Match[],
	playerStats: Record<string, PlayerMatchStats>
) => {
	const sessionPlayerStats = extractPlayerStatistics(matches);
	session.state.matchStats = sessionPlayerStats;

	mergeSessionIntoTotal(playerStats, sessionPlayerStats);

	await updateState(session.id, {
		matchStats: sessionPlayerStats
	});
};

const extractPlayerStatistics = (matches: Match[]): Record<string, PlayerMatchStats> => {
	const stats: Record<string, PlayerMatchStats> = {};

	matches.forEach((match) => {
		const isDrawn = match.team1Score === match.team2Score;
		const team1Won = match.team1Score > match.team2Score;

		match.team1.forEach((playerId) => {
			if (!stats[playerId]) {
				stats[playerId] = initializePlayerMatchStats();
			}
			updateStats(
				stats[playerId],
				isDrawn ? 'drawn' : team1Won ? 'won' : 'lost',
				match.team1Score,
				match.team2Score
			);
		});

		match.team2.forEach((playerId) => {
			if (!stats[playerId]) {
				stats[playerId] = initializePlayerMatchStats();
			}
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
		if (totalStats.hasOwnProperty(playerId)) {
			totalStats[playerId].played += sessionStats[playerId].played;
			totalStats[playerId].won += sessionStats[playerId].won;
			totalStats[playerId].lost += sessionStats[playerId].lost;
			totalStats[playerId].drawn += sessionStats[playerId].drawn;
			totalStats[playerId].pointsFor += sessionStats[playerId].pointsFor;
			totalStats[playerId].pointsAgainst += sessionStats[playerId].pointsAgainst;
		}
	}
};

const removeSessionStatsFromTotal = (
	totalStats: Record<string, PlayerMatchStats>,
	sessionStats: Record<string, PlayerMatchStats>
) => {
	for (const playerId in sessionStats) {
		if (totalStats.hasOwnProperty(playerId)) {
			totalStats[playerId].played -= sessionStats[playerId].played;
			totalStats[playerId].won -= sessionStats[playerId].won;
			totalStats[playerId].lost -= sessionStats[playerId].lost;
			totalStats[playerId].drawn -= sessionStats[playerId].drawn;
			totalStats[playerId].pointsFor -= sessionStats[playerId].pointsFor;
			totalStats[playerId].pointsAgainst -= sessionStats[playerId].pointsAgainst;
		}
	}
};

const initializePlayerStats = (players: Player[]): Record<string, PlayerMatchStats> => {
	const playerStats: Record<string, PlayerMatchStats> = {};

	players.forEach((player) => {
		playerStats[player.id] = player.matchStats ?? initializePlayerMatchStats();
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
