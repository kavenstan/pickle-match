import { getMatches } from "./match";
import { getPlayers, updateRatings } from "./player";
import { getSessions } from "./session"
import type { Match } from "./types";
import { formatDate } from "./utils";

export const recalculateRatings = async () => {
  const sessions = (await getSessions()).reverse();
  console.log(`Loaded ${sessions.length} sessions`);

  const matches = await getMatches();
  console.log(`Loaded ${matches.length} matches`);

  const players = await getPlayers();
  console.log(`Loaded ${players.length} players`);

  let ratingMap: RatingMap = {};

  players.forEach(x => {
    ratingMap[x.name] = x.rating
  })

  console.table(ratingMap);

  sessions.forEach(session => {
    console.log(`Session ${formatDate(session.date)}`);

    let sessionMatches = matches.filter(x => x.sessionId === session.id)
    console.log(`${sessionMatches} matches.`);

    ratingMap = updateRatingsMap(sessionMatches, ratingMap, false);

    console.table(ratingMap);
  });

  await updateRatings(ratingMap);
}

const K = 32;

function expectedScore(rating1: number, rating2: number) {
  return 1 / (1 + 10 ** ((rating2 - rating1) / 400));
}

export interface RatingMap {
  [key: string]: number;
}

export function updateRatingsMap(matches: Match[], currentRatings: RatingMap, useScoreDifference = false) {
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
      console.log("Rating Change:", player, ratingChange);
      updatedRatings[player] += ratingChange;
    });

    [player1_team2, player2_team2].forEach(player => {
      const playerImpact = updatedRatings[player] / team2_rating;
      const ratingChange = Math.round(team2_rating_change * playerImpact);
      console.log("Rating Change:", player, ratingChange);
      updatedRatings[player] += ratingChange;
    });
  });

  return updatedRatings;
}