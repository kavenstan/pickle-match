import type { Timestamp } from 'firebase/firestore';
import type { MatchmakingType, SessionStatus } from './enums';

export interface Player {
	id: string;
	name: string;
	rating: number;
	matchStats: PlayerMatchStats;
}

export interface PlayerMatchStats {
	played: number;
	won: number;
	lost: number;
	drawn: number;
	pointsFor: number;
	pointsAgainst: number;
}

export interface Session {
	id: string;
	date: Timestamp;
	location: string;
	state: State;
	config: Config;
}

export interface Config {
	courts: number;
	matchmakingType: MatchmakingType;
	ratingDiffLimit: number;
	maxIterations: number;
}

export interface State {
	status: SessionStatus;
	currentRound: number;
	activePlayers: string[];
	allPlayers: string[];
	sitOutOrder: string[];
	sitOutIndex: number;
	startRatings: Record<string, number>;
	endRatings: Record<string, number>;
	matchStats: Record<string, PlayerMatchStats>;
}

export interface PlayerRating {
	name: string;
	rating: number;
}

export interface Match {
	sessionId: string;
	round: number;
	id: string;
	team1: string[];
	team2: string[];
	team1Score: number;
	team2Score: number;
}