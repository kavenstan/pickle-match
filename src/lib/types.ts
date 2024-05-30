import type { SessionState } from './user';

export interface Player {
	id: string;
	name: string;
	rating: number;
}

export interface Session {
	id?: string | null;
	config: Config;
	state: State;
	date: string;
	location: string;
	rounds: Round[];
}

export interface Config {
	courtsAvailable: number;
	players: string[];
	status: string;
	matchmakingAlgorithm: string;
	ratingDiffLimit: number;
	maxIterations: number;
}

export interface State {
	sitOutOrder: string[];
	sitOutIndex: number;
}

export interface Round {
	id: string | null;
	matches: Match[];
}

export interface Match {
	id: string | null;
	team1: string[];
	team2: string[];
	team1Score: number;
	team2Score: number;
}
