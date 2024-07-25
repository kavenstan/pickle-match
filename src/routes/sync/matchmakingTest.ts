import { MatchmakingType, SessionStatus } from '$lib/enums';
import { balancedMatchmaking } from '$lib/matchmaking/algorithms/balanced';
import type { PlayerRating } from '$lib/matchmaking/matchmaking';
import { teamPairingToken } from '$lib/matchmaking/matchmaking-utils';
import { defaultPlayerMatchStats } from '$lib/stores/player';
import type { Player, Session } from '$lib/types';

const samplePlayers: Player[] = [
	{ id: '1', name: '1', rating: { rating: 2000, rd: 100 }, matchStats: defaultPlayerMatchStats },
	{ id: '2', name: '2', rating: { rating: 1900, rd: 100 }, matchStats: defaultPlayerMatchStats },
	{ id: '3', name: '3', rating: { rating: 1800, rd: 100 }, matchStats: defaultPlayerMatchStats },
	{ id: '4', name: '4', rating: { rating: 1700, rd: 100 }, matchStats: defaultPlayerMatchStats },
	{ id: '5', name: '5', rating: { rating: 1600, rd: 100 }, matchStats: defaultPlayerMatchStats },
	{ id: '6', name: '6', rating: { rating: 1500, rd: 100 }, matchStats: defaultPlayerMatchStats },
	{ id: '7', name: '7', rating: { rating: 1400, rd: 100 }, matchStats: defaultPlayerMatchStats },
	{ id: '8', name: '8', rating: { rating: 1300, rd: 100 }, matchStats: defaultPlayerMatchStats }
	// { id: '9', name: '9', rating: { rating: 1200, rd: 100 }, matchStats: defaultPlayerMatchStats },
	// { id: '10', name: '10', rating: { rating: 1200, rd: 100 }, matchStats: defaultPlayerMatchStats },
	// { id: '11', name: '11', rating: { rating: 1200, rd: 100 }, matchStats: defaultPlayerMatchStats },
	// { id: '12', name: '12', rating: { rating: 1200, rd: 100 }, matchStats: defaultPlayerMatchStats }
];

const sampleSession: Session = {
	config: {
		courts: 4,
		matchmakingType: MatchmakingType.Balanced,
		teamRatingDiffLimit: 400,
		matchRatingDiffLimit: 300,
		allowRepeatPairings: false
	},
	id: '',
	date: null as any,
	location: '',
	state: {
		status: SessionStatus.Created,
		currentRound: 0,
		activePlayerIds: [],
		allPlayerIds: [],
		sitOutOrderPlayerIds: [],
		sitOutIndex: 0,
		startRatings: {},
		endRatings: {},
		matchStats: {}
	}
};

const pairingCounts: Record<string, number> = {};

export const runMatchmakingTest = () => {
	const numRounds = 4;

	const playerMap = samplePlayers.reduce(
		(acc, player) => {
			acc[player.id] = player;
			return acc;
		},
		{} as Record<string, Player>
	);

	const playerRatings = samplePlayers.map((s) => {
		return {
			id: s.id,
			rating: s.rating.rating
		} as PlayerRating;
	});

	for (let i = 0; i < numRounds; i++) {
		const matchmakingResult = balancedMatchmaking(playerRatings, sampleSession, pairingCounts);

		console.log(`=== Round ${i + 1} ===`);
		console.log('Generated Matches:');
		if (matchmakingResult.matches) {
			matchmakingResult.matches.forEach((match, index) => {
				pairingCounts[teamPairingToken(match.team1)] = 1;
				pairingCounts[teamPairingToken(match.team2)] = 1;

				const team1Rating =
					match.team1.reduce((acc, playerId) => acc + playerMap[playerId].rating.rating, 0) / 2;
				const team2Rating =
					match.team2.reduce((acc, playerId) => acc + playerMap[playerId].rating.rating, 0) / 2;

				console.log(`Match ${index + 1}:`);
				console.log(
					`  Team 1: ${match.team1.map((p) => p).join(',')} (Avg Rating: ${team1Rating})`
				);
				console.log(
					`  Team 2: ${match.team2.map((p) => p).join(',')} (Avg Rating: ${team2Rating})`
				);
				console.log(`  Rating Difference: ${Math.abs(team1Rating - team2Rating)}`);
			});
		} else if (matchmakingResult.error) {
			console.log('Failed to generate');
			console.log(matchmakingResult.error);
			console.log(matchmakingResult.invalidCombinationsStats);
		}
	}
};

export const runNewTest = () => {
	// generateRounds(samplePlayers, 400, 100);
};
