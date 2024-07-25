import { playersStore } from '$lib/stores/player';
import type { Player, Session, Match } from '$lib/types';
import { newId } from '$lib/utils';
import type { PlayerRating } from './matchmaking';

const playerIdSeparator = '-';

export const createMatch = (team1: string[], team2: string[], session: Session): Match => {
	return {
		id: newId(),
		sessionId: session.id,
		round: session.state.currentRound,
		team1,
		team2,
		team1Score: 0,
		team2Score: 0,
		ratingChanges: {}
	};
};

export const playerIds = (players: PlayerRating[]): string[] => {
	return players.map((x) => x.id);
};

export const pairingToken = (id1: string, id2: string): string => {
	return id1 < id2 ? `${id1}${playerIdSeparator}${id2}` : `${id2}${playerIdSeparator}${id1}`;
};

export const teamPairingToken = (team: string[]) => pairingToken(team[0], team[1]);

export const teamsPairingToken = (team1: string[], team2: string[]) => {
	const team1Token = pairingToken(team1[0], team1[1]);
	const team2Token = pairingToken(team2[0], team2[1]);
	return pairingToken(team1Token, team2Token);
};

export const matchPairingTokens = (match: Match) => {
	return teamsPairingToken(match.team1, match.team2);
};

const combinations = <T>(arr: T[], k: number): T[][] => {
	if (k === 0) {
		return [[]];
	}
	if (arr.length < k) {
		return [];
	}
	const [first, ...rest] = arr;
	const combsWithFirst = combinations(rest, k - 1).map((comb) => [first, ...comb]);
	const combsWithoutFirst = combinations(rest, k);
	return [...combsWithFirst, ...combsWithoutFirst];
};

export const calculateAverageRatingDifference = (matchRatings: PlayerRating[][][]): number => {
	let totalDifference = 0;
	matchRatings.forEach((matchRating) => {
		const difference = calculateTeamRatingDifference(matchRating[0], matchRating[1]);
		totalDifference += difference;
	});
	return totalDifference / matchRatings.length;
};

export const calculateTeamRatingDifference = (
	team1: PlayerRating[],
	team2: PlayerRating[]
): number => {
	let team1AverageRating = (team1[0].rating + team1[1].rating) / 2;
	let team2AverageRating = (team2[0].rating + team2[1].rating) / 2;
	return Math.abs(team1AverageRating - team2AverageRating);
};

export const doubleFactorial = (n: number): number => {
	if (n <= 0) return 1;
	return n * doubleFactorial(n - 2);
};
