import type { Timestamp } from 'firebase/firestore';
import type { MatchmakingType, SessionStatus, ToastType } from './enums';

export interface Player {
	id: string;
	name: string;
	rating: Rating;
	matchStats: PlayerMatchStats;
}

export interface Seeding {
	id?: string;
	name: string;
	rating: Rating;
}

export interface Rating {
	rating: number;
	rd: number
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
	activePlayerIds: string[];
	allPlayerIds: string[];
	sitOutOrderPlayerIds: string[];
	sitOutIndex: number;
	startRatings: Record<string, Rating>;
	endRatings: Record<string, Rating>;
	matchStats: Record<string, PlayerMatchStats>;
}

export interface Match {
	sessionId: string;
	round: number;
	id: string;
	team1: string[];
	team2: string[];
	team1Score: number;
	team2Score: number;
	ratingChanges: Record<string, number>;
}

export interface Toast {
	id?: string;
	type?: ToastType;
	message?: string;
	dismissible?: boolean;
	timeout?: number;
}
