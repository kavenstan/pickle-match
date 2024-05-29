export interface Player {
	id: string;
	name: string;
	rating: number;
}

export interface Session {
	config: Config;
	date: Date;
	location: string;
	rounds: Round[];
}

export interface Config {
	courtsAvailable: number;
	players: string[];
}

export interface Round {
	matches: Match[];
}

export interface Match {
	team1: string[];
	team2: string[];
	team1Score: number;
	team2Score: number;
}
