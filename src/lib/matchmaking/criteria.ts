import type { PlayerRating } from './matchmaking';
import { pairingToken, playerIds, teamsPairingToken } from './matchmaking-utils';

export const isValidMatch = (
	team1: PlayerRating[],
	team2: PlayerRating[],
	pairingCounts: Record<string, number>,
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

	const pairings = [pairingToken(player1.id, player2.id), pairingToken(player3.id, player4.id)];

	for (const pairing of pairings) {
		if (pairingCounts.hasOwnProperty(pairing)) {
			return false;
		}
	}

	return true;
};

export const isTeamRatingDifferenceValid = (
	team: PlayerRating[],
	maxDifference: number
): boolean => {
	const [player1, player2] = team;
	return Math.abs(player1.rating - player2.rating) <= maxDifference;
};

export const isMatchRatingDifferenceValid = (
	team1: PlayerRating[],
	team2: PlayerRating[],
	maxDifference: number
): boolean => {
	const avgTeam1Rating = (team1[0].rating + team1[1].rating) / 2;
	const avgTeam2Rating = (team2[0].rating + team2[1].rating) / 2;
	return Math.abs(avgTeam1Rating - avgTeam2Rating) <= maxDifference;
};

export const hasPreviousPartnerships = (
	team1: PlayerRating[],
	team2: PlayerRating[],
	previousPairings: Record<string, number>
): boolean => {
	const pairings = teamsPairingToken(playerIds(team1), playerIds(team2));

	for (const pairing of pairings) {
		if (previousPairings.hasOwnProperty(pairing)) {
			return true;
		}
	}

	return false;
};
