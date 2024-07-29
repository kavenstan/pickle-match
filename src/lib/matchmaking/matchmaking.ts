import { playersPerCourt } from '../consts';
import type { Player, Session, Match, State } from '$lib/types';
import { MatchmakingType } from '$lib/enums';
import { smartMatchmaking } from './algorithms/smart';
import { staticMatchmaking } from './algorithms/static';
import { roundRobinMatchmaking } from './algorithms/round-robin';
import { balancedMatchmaking } from './algorithms/balanced';
import { doubleFactorial, playerIds, teamPairingToken } from './matchmaking-utils';

export interface PlayerRating {
	id: string;
	rating: number;
}

export interface RoundResult {
	matches: Match[];
	state: State;
	sitOutPlayerIds: string[];
	error?: string;
}

export type MatchmakingResult = {
	matches?: Match[];
	error?: string;
	invalidCombinationsStats?: {
		teamRatingDifferenceExceeded: number;
		matchRatingDifferenceExceeded: number;
		previousPartnerships: number;
	};
};

export const createRound = async (
	session: Session,
	sessionMatches: Match[]
): Promise<RoundResult> => {
	if (session.config.matchmakingType === MatchmakingType.Manual) {
		return { state: session.state, matches: [], sitOutPlayerIds: [] };
	}

	const allPlayerRatings: PlayerRating[] = [];

	for (const [key, value] of Object.entries(session.state.startRatings)) {
		allPlayerRatings.push({ id: key, rating: value.rating });
	}

	const sessionPlayers = allPlayerRatings.filter((player) =>
		session.state.activePlayerIds.includes(player.id)
	);

	const pairingCounts = previousPairingCounts(sessionMatches);

	let [playingPlayers, sitOutPlayerIds] = splitGroupForSitOuts(sessionPlayers, session);

	let matches = createMatches(playingPlayers, session, pairingCounts);

	if (matches.length > 0) {
		session.state.sitOutIndex =
			(session.state.sitOutIndex + sitOutPlayerIds.length) %
			session.state.sitOutOrderPlayerIds.length;
		session.state.currentRound += 1;

		return {
			state: session.state,
			matches: matches,
			sitOutPlayerIds
		};
	}

	return {
		state: session.state,
		matches: [],
		sitOutPlayerIds: [],
		error: 'Failed to create a valid round'
	};
};

const splitGroupForSitOuts = (
	players: PlayerRating[],
	session: Session
): [PlayerRating[], string[]] => {
	const totalPlayers = players.length;
	const courtCapacity = session.config.courts * playersPerCourt;
	const sitOutCount =
		totalPlayers > courtCapacity ? totalPlayers - courtCapacity : totalPlayers % 4;

	console.log(sitOutCount);

	const sitOutPlayerIds: string[] = [];
	let currentIndex = session.state.sitOutIndex;
	console.log(currentIndex);
	for (let i = 0; i < sitOutCount; i++) {
		sitOutPlayerIds.push(session.state.sitOutOrderPlayerIds[currentIndex]);
		currentIndex = (currentIndex + 1) % session.state.sitOutOrderPlayerIds.length;
	}
	console.log(sitOutPlayerIds);
	const playingPlayers = players.filter((player) => !sitOutPlayerIds.includes(player.id));
	console.log(playingPlayers);

	return [playingPlayers, sitOutPlayerIds];
};

const createMatches = (
	players: PlayerRating[],
	session: Session,
	pairingCounts: Record<string, number>
): Match[] => {
	let matchPairings: Match[] = [];

	let result: MatchmakingResult = {};

	switch (session.config.matchmakingType) {
		case 'Random':
			result = roundRobinMatchmaking(players, session, pairingCounts);
			matchPairings = result.matches!;
			break;
		case 'RoundRobin':
			result = roundRobinMatchmaking(players, session, pairingCounts);
			matchPairings = result.matches!;
			break;
		case 'Balanced':
			result = balancedMatchmaking(players, session, pairingCounts);
			matchPairings = result.matches!;
			break;
		case 'Static':
			result = staticMatchmaking(players, session);
			matchPairings = result.matches!;
			break;
		case 'Manual':
			matchPairings = [];
			break;
		case 'Smart':
			result = smartMatchmaking(players, session.id, pairingCounts);
			matchPairings = result.matches!;
			break;
		default:
			throw new Error('Unknown matchmaking algorithm');
	}

	return matchPairings;
};

const requiredNumberOfMatches = (players: Player[], playersPerCourt: number): number => {
	return players.length / playersPerCourt;
};

export const generateUniqueCombinations = (
	players: PlayerRating[],
	groupSize: number = 4
): PlayerRating[][][] => {
	const result: PlayerRating[][][] = [];
	const usedCombinations = new Set<string>();

	const generateMatches = (
		currentMatches: PlayerRating[][],
		remainingPlayers: PlayerRating[]
	): void => {
		if (currentMatches.length === players.length / groupSize) {
			// Sort current matches to ensure uniqueness
			const sortedCurrentMatches = currentMatches
				.map((match) => match.map((player) => player.id).sort())
				.sort();
			const matchKey = JSON.stringify(sortedCurrentMatches);
			if (!usedCombinations.has(matchKey)) {
				usedCombinations.add(matchKey);
				result.push(currentMatches);
			}
			return;
		}

		for (let i = 0; i < remainingPlayers.length - groupSize + 1; i++) {
			for (let j = i + 1; j < remainingPlayers.length - groupSize + 2; j++) {
				for (let k = j + 1; k < remainingPlayers.length - groupSize + 3; k++) {
					for (let l = k + 1; l < remainingPlayers.length; l++) {
						const newMatch = [
							remainingPlayers[i],
							remainingPlayers[j],
							remainingPlayers[k],
							remainingPlayers[l]
						];
						generateMatches(
							[...currentMatches, newMatch],
							remainingPlayers.filter((_, index) => ![i, j, k, l].includes(index))
						);
					}
				}
			}
		}
	};

	generateMatches([], players);
	return result;
};

const previousPairingCounts = (matches: Match[]): Record<string, number> => {
	const pairingCounts: Record<string, number> = {};

	matches.forEach((match) => {
		const teams = [match.team1, match.team2];
		teams.forEach((team) => {
			const pairingKey = teamPairingToken(team);
			if (pairingCounts.hasOwnProperty(pairingKey)) {
				pairingCounts[pairingKey]++;
			} else {
				pairingCounts[pairingKey] = 1;
			}
		});
	});

	return pairingCounts;
};

export const activateSessionPlayer = async (session: Session, playerId: string) => {
	if (!session.state.allPlayerIds.some((id) => id === playerId)) {
		session.state.allPlayerIds.push(playerId);
	}
	if (!session.state.activePlayerIds.some((id) => id === playerId)) {
		session.state.activePlayerIds.push(playerId);
		session.state.sitOutOrderPlayerIds.splice(session.state.sitOutIndex, 0, playerId);
		session.state.sitOutIndex += 1;
	}
};

export const deactiveSessionPlayer = async (session: Session, playerId: string) => {
	let activeIndex = session.state.activePlayerIds.findIndex((id) => id === playerId);
	if (activeIndex >= 0) {
		session?.state.activePlayerIds.splice(activeIndex, 1);
	}

	let sitOutIndex = session.state.sitOutOrderPlayerIds.findIndex((id) => id === playerId);
	if (sitOutIndex >= 0) {
		session?.state.sitOutOrderPlayerIds.splice(sitOutIndex, 1);
		if (session.state.sitOutIndex >= session?.state.sitOutOrderPlayerIds.length) {
			session.state.sitOutIndex = 0;
		}
	}
};

export const generateRounds = (
	players: PlayerRating[],
	session: Session,
	pairingCounts: Record<string, number>
): PlayerRating[][][][] => {
	const pairingGroups = generatePairingGroups(players, session.config.teamRatingDiffLimit);
	const validRounds: PlayerRating[][][][] = [];

	for (const group of pairingGroups) {
		const round: PlayerRating[][][] = [];
		let isValidRound = true;

		for (let i = 0; i < group.length; i += 4) {
			const pair1 = [group[i], group[i + 1]];
			const pair2 = [group[i + 2], group[i + 3]];

			const pair1AvgRating = (pair1[0].rating + pair1[1].rating) / 2;
			const pair2AvgRating = (pair2[0].rating + pair2[1].rating) / 2;

			if (session.config.matchRatingDiffLimit && Math.abs(pair1AvgRating - pair2AvgRating) > session.config.matchRatingDiffLimit) {
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

export const generatePairingGroups = (
	players: PlayerRating[],
	ratingDifferenceLimit?: number
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

			if (ratingDifferenceLimit === undefined || ratingDifference <= ratingDifferenceLimit) {
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

