import { playersPerCourt } from '../consts';
import type { Player, Session, Match, State } from '$lib/types';
import { MatchmakingType } from '$lib/enums';
import { runSmartGenerator } from './algorithms/smart';
import { randomMatchmaking } from './algorithms/random';
import { staticMatchmaking } from './algorithms/static';
import { balancedMatchmaking } from './algorithms/balanced';
import { teamPairingToken } from './matchmaking-utils';

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
		session.state.activePlayerIds.some((playerId) => playerId === player.id)
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
	players: PlayerRating[],
	session: Session,
	pairingCounts: Record<string, number>
): Match[] => {
	let matchPairings: Match[] = [];

	switch (session.config.matchmakingType) {
		case 'Random':
			matchPairings = []; //randomMatchmaking(players, session);
			break;
		case 'RoundRobin':
			matchPairings = []; //roundRobinMatchmaking(players, session, pairingCounts);
			break;
		case 'Balanced':
			const result = balancedMatchmaking(players, session, pairingCounts);
			matchPairings = result.matches!;
			break;
		case 'Static':
			matchPairings = []; //staticMatchmaking(players, session);
			break;
		case 'Manual':
			matchPairings = [];
			break;
		case 'Smart':
			matchPairings = []; //runSmartGenerator(players, session.id);
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
