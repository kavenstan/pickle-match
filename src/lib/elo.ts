import { getMatches } from "./match";
import { getPlayers, updateRatings, updatePlayerStats } from "./player";
import { getSessions, updateSession } from "./session"
import type { Match, PlayerMatchStats, Session, Player } from "./types";
import { formatTimestamp } from "./utils";

export const recalculateRatings = async () => {

  const sessions = (await getSessions()).reverse();
  console.log(`Loaded ${sessions.length} sessions`);

  const matches = await getMatches();
  console.log(`Loaded ${matches.length} matches`);

  const players = await getPlayers();
  console.log(`Loaded ${players.length} players`);

  const playerStats = initializePlayerStats(players);

  const playerNameIdMap = players.reduce((acc, player) => {
    acc[player.name] = player.id;
    return acc;
  }, {} as Record<string, string>);

  let ratingMap: RatingMap = {};

  // Reset ratings
  // TODO : Option to provide initial seeding values
  players.forEach(x => {
    ratingMap[x.name] = 1200;
  })

  // console.table(ratingMap);

  sessions.forEach(async (session) => {
    console.log(`Session ${formatTimestamp(session.date)}`);
    const startRatingMap = { ...ratingMap };

    let sessionMatches = matches.filter(x => x.sessionId === session.id)
    console.log(`${sessionMatches.length} matches.`);

    ratingMap = updateRatingsMap(sessionMatches, ratingMap, false);
    await updateSessionStats(session, sessionMatches, startRatingMap, ratingMap, playerStats, playerNameIdMap);
  });

  await updatePlayerStats(playerStats);

  console.table(ratingMap);
  await updateRatings(ratingMap);
}

// TODO : Variable K - higher when fewer matches played, gradually decreasing.. 1-3=50, 4-10=40, 11-30=30, 31-80=20, 81+=10
const K = 32;

const updateSessionStats = async (session: Session, matches: Match[], startRatings: RatingMap, endRatings: RatingMap, playerStats: Record<string, PlayerMatchStats>, playerNameIdMap: Record<string, string>) => {
  const sessionPlayers = new Set<string>(session.state.activePlayers);
  session.state.startRatings = ratingMapToPlayerRating(startRatings, sessionPlayers);
  session.state.endRatings = ratingMapToPlayerRating(endRatings, sessionPlayers);

  const sessionPlayerStats = extractPlayerStatistics(matches);
  session.state.matchStats = sessionPlayerStats

  mergeSessionIntoTotal(playerStats, sessionPlayerStats, playerNameIdMap);

  await updateSession({
    id: session.id,
    state: session.state
  });
};

const extractPlayerStatistics = (matches: Match[]): Record<string, PlayerMatchStats> => {
  const stats: Record<string, PlayerMatchStats> = {};

  matches.forEach(match => {
    const isDrawn = match.team1Score === match.team2Score;
    const team1Won = match.team1Score > match.team2Score;

    match.team1.forEach(player => {
      if (!stats[player]) stats[player] = initializePlayerMatchStats();
      updateStats(stats[player], isDrawn ? 'drawn' : team1Won ? 'won' : 'lost', match.team1Score, match.team2Score);
    });

    match.team2.forEach(player => {
      if (!stats[player]) stats[player] = initializePlayerMatchStats();
      updateStats(stats[player], isDrawn ? 'drawn' : team1Won ? 'lost' : 'won', match.team2Score, match.team1Score);
    });
  });

  return stats;
}

const mergeSessionIntoTotal = (
  totalStats: Record<string, PlayerMatchStats>, sessionStats: Record<string, PlayerMatchStats>, playerNameIdMap: Record<string, string>) => {
  for (const player in sessionStats) {
    const playerId = playerNameIdMap[player];
    if (sessionStats.hasOwnProperty(player)) {
      totalStats[playerId].played += sessionStats[player].played;
      totalStats[playerId].won += sessionStats[player].won;
      totalStats[playerId].lost += sessionStats[player].lost;
      totalStats[playerId].drawn += sessionStats[player].drawn;
      totalStats[playerId].pointsFor += sessionStats[player].pointsFor;
      totalStats[playerId].pointsAgainst += sessionStats[player].pointsAgainst;
    }
  }
}

const initializePlayerStats = (players: Player[]): Record<string, PlayerMatchStats> => {
  const playerStats: Record<string, PlayerMatchStats> = {};

  players.forEach(player => {
    playerStats[player.id] = initializePlayerMatchStats()
  })

  return playerStats;
}

const initializePlayerMatchStats = (): PlayerMatchStats => {
  return {
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    pointsFor: 0,
    pointsAgainst: 0
  };
}

const updateStats = (playerStats: PlayerMatchStats, result: 'won' | 'lost' | 'drawn', pointsFor: number, pointsAgainst: number) => {
  playerStats.played += 1;
  if (result === 'won') playerStats.won += 1;
  if (result === 'lost') playerStats.lost += 1;
  if (result === 'drawn') playerStats.drawn += 1;
  playerStats.pointsFor += pointsFor;
  playerStats.pointsAgainst += pointsAgainst;
}

const expectedScore = (rating1: number, rating2: number) => {
  return 1 / (1 + 10 ** ((rating2 - rating1) / 400));
}

const ratingMapToPlayerRating = (ratingMap: RatingMap, sessionPlayers: Set<string>): Record<string, number> => {

  const playerRatings: Record<string, number> = {};

  for (const key in ratingMap) {
    if (sessionPlayers.has(key)) {
      playerRatings[key] = ratingMap[key];;
    }
  }

  return playerRatings;
}

export interface RatingMap {
  [key: string]: number;
}

export const updateRatingsMap = (matches: Match[], currentRatings: RatingMap, useScoreDifference = false) => {
  const updatedRatings = { ...currentRatings };

  const formattedResults = matches.map(match => ({
    player1_team1: match.team1[0],
    player2_team1: match.team1[1],
    player1_team2: match.team2[0],
    player2_team2: match.team2[1],
    score_team1: match.team1Score ?? 0,
    score_team2: match.team2Score ?? 0
  }));

  formattedResults.forEach(result => {
    const { player1_team1, player2_team1, player1_team2, player2_team2, score_team1, score_team2 } = result;

    const team1_rating = (updatedRatings[player1_team1] + updatedRatings[player2_team1]) / 2;
    const team2_rating = (updatedRatings[player1_team2] + updatedRatings[player2_team2]) / 2;

    const exp_team1 = expectedScore(team1_rating, team2_rating);
    const exp_team2 = expectedScore(team2_rating, team1_rating);

    let actual_team1, actual_team2;
    if (score_team1 > score_team2) {
      actual_team1 = 1;
      actual_team2 = 0;
    } else if (score_team1 < score_team2) {
      actual_team1 = 0;
      actual_team2 = 1;
    } else {
      actual_team1 = 0.5;
      actual_team2 = 0.5;
    }

    const score_diff = Math.abs(score_team1 - score_team2);
    let team1_rating_change, team2_rating_change;
    if (useScoreDifference) {
      const impact_factor = 1 + (score_diff / 10);
      team1_rating_change = impact_factor * K * (actual_team1 - exp_team1);
      team2_rating_change = impact_factor * K * (actual_team2 - exp_team2);
    } else {
      team1_rating_change = K * (actual_team1 - exp_team1);
      team2_rating_change = K * (actual_team2 - exp_team2);
    }

    [player1_team1, player2_team1].forEach(player => {
      const playerImpact = updatedRatings[player] / team1_rating;
      const ratingChange = Math.round(team1_rating_change * playerImpact);
      // console.log("Rating Change:", player, ratingChange);
      updatedRatings[player] += ratingChange;
    });

    [player1_team2, player2_team2].forEach(player => {
      const playerImpact = updatedRatings[player] / team2_rating;
      const ratingChange = Math.round(team2_rating_change * playerImpact);
      // console.log("Rating Change:", player, ratingChange);
      updatedRatings[player] += ratingChange;
    });
  });

  return updatedRatings;
}