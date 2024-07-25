import type { Session, Match } from '$lib/types';
import { type MatchmakingResult, type PlayerRating } from '../matchmaking';
import {
	calculateAverageRatingDifference,
	createMatch,
	doubleFactorial,
	teamPairingToken,
	playerIds
} from '../matchmaking-utils';

export const balancedMatchmaking = (
	players: PlayerRating[],
	session: Session,
	pairingCounts: Record<string, number>
): MatchmakingResult => {
	const validCombinations = generateRounds(players, session, pairingCounts);

	const bestCombination = session.config.allowRepeatPairings
		? validCombinations[Math.floor(Math.random() * validCombinations.length)]
		: validCombinations.reduce((best, current) => {
				return calculateAverageRatingDifference(current) < calculateAverageRatingDifference(best)
					? current
					: best;
			}, validCombinations[0]);

	const matchups: Match[] = [];
	bestCombination?.forEach((match) => {
		matchups.push(createMatch(playerIds(match[0]), playerIds(match[1]), session));
	});

	return {
		matches: matchups
	};
};

const generateRounds = (
	players: PlayerRating[],
	session: Session,
	pairingCounts: Record<string, number>
): PlayerRating[][][][] => {
	const pairingGroups = generatePairingGroups(players, session.config.teamRatingDiffLimit!);
	const validRounds: PlayerRating[][][][] = [];

	for (const group of pairingGroups) {
		const round: PlayerRating[][][] = [];
		let isValidRound = true;

		for (let i = 0; i < group.length; i += 4) {
			const pair1 = [group[i], group[i + 1]];
			const pair2 = [group[i + 2], group[i + 3]];

			const pair1AvgRating = (pair1[0].rating + pair1[1].rating) / 2;
			const pair2AvgRating = (pair2[0].rating + pair2[1].rating) / 2;

			if (Math.abs(pair1AvgRating - pair2AvgRating) > session.config.matchRatingDiffLimit!) {
				isValidRound = false;
				break;
			}

			if (
				!session.config.allowRepeatPairings &&
				pairingCounts.hasOwnProperty(teamPairingToken(playerIds(pair1)))
			) {
				isValidRound = false;
				break;
			}

			if (
				!session.config.allowRepeatPairings &&
				pairingCounts.hasOwnProperty(teamPairingToken(playerIds(pair2)))
			) {
				isValidRound = false;
				break;
			}

			round.push([
				[pair1[0], pair1[1]],
				[pair2[0], pair2[1]]
			]);
		}

		if (isValidRound) {
			validRounds.push(round);
		}
	}

	console.log(`${validRounds.length} valid rounds`);
	// console.log(validRounds);

	return validRounds;
};

const generatePairingGroups = (
	players: PlayerRating[],
	ratingDifferenceLimit: number
): PlayerRating[][] => {
	if (players.length % 4 !== 0) {
		throw new Error('Number of players must be a multiple of 4');
	}

	const countAllCombinations = doubleFactorial(players.length - 1);
	console.log(`Pairing Combinations: ${countAllCombinations}`);

	const results: PlayerRating[][] = [];
	const pairs: PlayerRating[][] = [];

	const backtrack = (remainingPlayers: PlayerRating[]) => {
		if (remainingPlayers.length === 0) {
			results.push(pairs.flat());
			return;
		}

		for (let i = 1; i < remainingPlayers.length; i++) {
			const player1 = remainingPlayers[0];
			const player2 = remainingPlayers[i];

			const ratingDifference = Math.abs(player1.rating - player2.rating);

			if (ratingDifference <= ratingDifferenceLimit) {
				const newPair = [player1, player2];
				pairs.push(newPair);
				const nextRemainingPlayers = remainingPlayers
					.slice(1, i)
					.concat(remainingPlayers.slice(i + 1));
				backtrack(nextRemainingPlayers);
				pairs.pop();
			}
		}
	};

	backtrack(players);

	console.log(`Valid Pairing Rounds: ${results.length}`);
	// console.log(results);

	return results;
};
