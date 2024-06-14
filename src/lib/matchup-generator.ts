// Describes a player
class Player {

	name: string;
	rank: number;
	byeCount: number;
	gameCount: number;

	constructor(name: string, rank: number) {
		this.name = name;
		this.rank = rank;
		this.byeCount = 0; // how many times had a bye already
		this.gameCount = 0;
	}

	getName() { return this.name; }
	getRank() { return this.rank; }
	addGame() {
		this.gameCount++;
	}
}

// Describes a Pair of players which can participate in a Match
class Pair {

	player1: Player;
	player2: Player;
	pairRank: number;

	constructor(player1: Player, player2: Player) {
		this.player1 = player1;
		this.player2 = player2;
		this.pairRank = player1.rank + player2.rank;
	}

	getPlayer1Name() {
		return this.player1.name;
	}

	getPlayer2Name() {
		return this.player2.name;
	}

	getPairRank() {
		return this.pairRank;
	}

	addGame() {
		this.player1.addGame();
		this.player2.addGame();
	}
}


// Describes a Match between two Pairs
class Match {
	pair1: Pair;
	pair2: Pair;
	rankDiff: number;
	playerNames: string[];
	constructor(pair1: Pair, pair2: Pair) {
		this.pair1 = pair1;
		this.pair2 = pair2;
		this.rankDiff = pair1.pairRank - pair2.pairRank;
		this.playerNames = [];
	}

	getPlayerNames() {
		if (this.playerNames.length == 0) {
			this.playerNames.push(this.pair1.getPlayer1Name());
			this.playerNames.push(this.pair1.getPlayer2Name());
			this.playerNames.push(this.pair2.getPlayer1Name());
			this.playerNames.push(this.pair2.getPlayer2Name());
		}
		return this.playerNames;
	}

	getMatchDescription() {
		return this.pair1.getPlayer1Name() + "|" +
			this.pair1.getPlayer2Name() + " vs " +
			this.pair2.getPlayer1Name() + "|" + this.pair2.getPlayer2Name() +
			" (" + this.rankDiff + ")";
	}

	// do the given matches clash on scheduled players?
	clashesWith(oMatch: Match) {
		let oPlayers = oMatch.getPlayerNames();
		let mPlayers = this.getPlayerNames();

		for (let n = 0; n < mPlayers.length; n++) {
			for (let j = 0; j < oPlayers.length; j++) {
				if (mPlayers[n] == oPlayers[j]) {
					return true;
				}
			}
		}
		return false;
	}

	updatePlayerGameCount() {
		this.pair1.addGame();
		this.pair2.addGame();
	}

	hasAllPlayers(requiredPlayers: Player[]) {
		let requiredPlayerNames = [];
		for (let q = 0; q < requiredPlayers.length; q++) {
			requiredPlayerNames.push(requiredPlayers[q].name);
		}

		let myPlayers = this.getPlayerNames();

		myPlayers.sort();
		requiredPlayerNames.sort();
		for (var i = 0; i < myPlayers.length; i++) {
			if (myPlayers[i] !== requiredPlayerNames[i]) return false;
		}

		return true;
	}
}

class Round {
	courtCount: number;
	courts: Match[];
	scheduledPlayers: string[];
	constructor(courtCount: number) {
		this.courtCount = courtCount;
		this.courts = []; // Matches go here, each court has one match in the round
		this.scheduledPlayers = [];
	}

	scheduleMatch(match: Match | null) {
		if (match == null) {
			return false;
		}
		if (this.courtCount > 0) {
			let smPlayerNames = match.getPlayerNames();
			for (let c = 0; c < this.courts.length; c++) {
				let oMatch = this.courts[c];
				let omPlayerNames = oMatch.getPlayerNames();

				for (let d = 0; d < omPlayerNames.length; d++) {
					for (let e = 0; e < smPlayerNames.length; e++) {
						if (omPlayerNames[d] == smPlayerNames[e]) {
							// clashing player
							return false;
						}
					}
				}
			}
		}

		// can just add this match onto a court
		this.courts.push(match);

		let matchPlayers = match.getPlayerNames();
		for (const p in matchPlayers) {
			this.scheduledPlayers.push(matchPlayers[p]);
		}

		// update Player game count
		match.updatePlayerGameCount();
		return true;
	}

	// get the list if players NOT scheduled in this round
	// Use this for the 'last pick' where we need to just make a match
	getRemainderPlayers(allPlayers: Player[]) {
		let remainder = [];
		for (let p = 0; p < allPlayers.length; p++) {
			let found = false;
			for (let sp = 0; sp < this.scheduledPlayers.length; sp++) {
				if (allPlayers[p].getName() == this.scheduledPlayers[sp]) {
					found = true;
					break;
				}
			}
			if (!found) {
				remainder.push(allPlayers[p]);
			}
		}
		return remainder;
	}
}

// generate a MAX number of rounds - can discard any we don't use later...
var MAX_ROUNDS = 20; // this will be changed to playerList.length + 2 later
const MAX_COURTS = 4; // hall only has 4 courts but scheduler will reduce this based on player count
const MAX_ALLOWED_RDIFF = 20; // just going to filter any heavily unbalanced matches away

// START BODGE
// TODO: Fix this to include rankings in the data we read in instead of this bodge!!
//
// load player names & implied ranking (name order is ranking...)
// var players = require('./player-names-ranking-order.json');
// console.log("Generating for " + players.playerNames.length + " players....")

// munge into an array of objects
// var playerList: Player[] = [];
// var rank = 1;
// for (p in players.playerNames) {
// 	playerList.push(new Player(players.playerNames[p], rank));
// 	rank = rank + 1;
// }
// END BODGE

// TODO: Pass in
// const playerList: Player[] = [];

import type { Player as AppPlayer, Match as AppMatch } from '$lib/types';
import { newId } from './utils';

export const runSmartGenerator = (appPlayers: AppPlayer[], sessionId: string) => {

	let appMatches: AppMatch[] = [];

	let playerList: Player[] = appPlayers
		.sort((a, b) => b.rating.rating - a.rating.rating)
		.map((p, i) =>
			new Player(p.id, i)
		);

	MAX_ROUNDS = playerList.length + 3; // generate 3 round more than we have players - stupid rounds can be dropped
	console.log("Adjusted MAX_ROUNDS is now : " + MAX_ROUNDS);

	// generating ALL possible pairings now from the playerList
	// the Player & Pair objects will handle ranking etc
	var pairingsList = generatePairings(playerList);

	// Now map the matches we'd like to support
	// - break them down by the ranking difference
	// - each rdiff mapped into a list under the same key
	var mappedMatches: Record<string, Match[]> = {};
	var matchCount = 0;
	for (var i = 0; i < pairingsList.length; i++) {
		for (var j = i + 1; j < pairingsList.length; j++) {

			// Take the current Pairs on the indexes
			let p1 = pairingsList[i];
			let p2 = pairingsList[j];

			// confirm no players the same on each pair
			if (!noPlayersInCommon(p1, p2)) {
				// skip this one, invalid & cannot be played at all!
				continue;
			}

			// map pairs, into a Match
			// Match will handle combined Pair ranking & rDiff calculations
			var nextMatch = new Match(p1, p2);

			if (nextMatch.rankDiff <= MAX_ALLOWED_RDIFF) {
				// store the match details under a key identifying the absolute difference for the match
				// this will be a *lot* of matches if MAX_ALLOWED_RDIFF is relatively high
				let mKey = makeMapKey(nextMatch.rankDiff);
				let mList = mappedMatches[mKey];
				if (mList == null) {
					mList = [];
				}
				mList.push(nextMatch);
				mappedMatches[mKey] = mList;
				matchCount++;
			}
		}
	}

	// DEBUG - can remove later...
	console.log("Generated " + matchCount + " total matches!");
	for (const k in mappedMatches) {
		console.log(k + " --> " + mappedMatches[k].length);
	}

	// Need this? Store the match list to a file?
	//fs.writeFile("matches-out.json", 
	//	JSON.stringify(mappedMatches, null, 2),
	//	err => {
	//		if(err) throw err;
	//		
	//		console.log("Wrote matches file!");
	//	});

	interface Schedule {
		courtCount: number;
		rounds: Round[],
		maxRounds: number
	}

	// figure out how many courts we need 	
	let schedule: Schedule = {
		courtCount: Math.trunc(playerList.length / 4),
		rounds: [],
		maxRounds: MAX_ROUNDS
	};

	// check and force to the MAX allowed if we have more players than courts can support in one go
	if (schedule.courtCount > MAX_COURTS) {
		schedule.courtCount = MAX_COURTS;
	}

	// store Rounds as a list 
	console.log(schedule);

	// Now do scheduling...
	for (let cr = 0; cr < schedule.maxRounds; cr++) {
		console.log("Next round..." + cr);
		var currentRound = new Round(schedule.courtCount);
		schedule.rounds.push(currentRound);
		let roundPicks: Player[] = [];
		// each round, try to schedule ALL players into fair matches across ALL available courts
		sortEntries(playerList);

		// seems that there's a relationship between number of rounds, number of players & selections in groups of 4
		// due to the way the player selections shift around between rounds.... (harmonics maybe? must google for any theories...)
		// We shift around in groups of 4, so if (playerCount % 4 == 0) then groups can become 'pinned' together
		// relative to the rest of the list (that sub-group gets the game count increment together so even sorting can't split them)
		// - this means we run out of fair games faster for those sub-groups
		// We would like to counteract this with a 'nudge' on the list to swap 2 players at random
		// on the current player order before we start selections / scheduling courts
		// - trying this to prevent the list beginning to flip-flop between *dead* states?
		if (playerList.length % cr == 0) {
			console.log("...................... NUDGE ........................");
			// swap two random players on the list every time we hit this - trying to avoid dead states
			let l = playerList.length;
			let s1 = Math.floor(Math.random() * l);
			let s2 = Math.floor(Math.random() * l);
			let t = playerList[s1];
			let q = playerList[s2];
			playerList[s1] = q;
			playerList[s2] = t;
		}

		for (let mcr = 0; mcr < schedule.courtCount; mcr++) {
			console.log("Court --> " + mcr);
			var scheduled = false;
			var shuffleCount = 0;
			var MAX_SHUFFLES = 20; // MAX number of times we'll shuffle and take our chances
			while (shuffleCount < MAX_SHUFFLES && !scheduled) {
				// first attempt here is at the sorted list - if this succeeds, we just move on to the next 4, keep going till we fail
				if (!doSchedule(playerList, 9, false, roundPicks, currentRound)) {
					// shuffle allPlayers a bit as we're stuck in a rut
					// next Round iteration will sort properly again anyway
					shufflePlayerDeck(playerList);

					// now try schedule again after the shuffle
					scheduled = doSchedule(playerList, -1, false, roundPicks, currentRound);
				}
				else {
					scheduled = true;
				}
				shuffleCount++;
			}

			// STILL not scheduled - last chance, brute force & take ANYTHING that will fit
			if (!scheduled) {

				console.log("------- GAP FILL!! -----");
				// sort first - prioritize players with least games
				sortEntries(playerList);
				// select first 4, find ANY game for them
				let gapPlayerStart = 0;
				while (!scheduled && gapPlayerStart < playerList.length - 4) {
					let gapPlayers = pickNext4(playerList, gapPlayerStart);
					scheduled = scheduleGroup(gapPlayers, roundPicks, currentRound);
					gapPlayerStart++; // move up one if there was no match found
					// shifting the player group window to the right by one position (but not off the end) 
				}
			}

			if (!scheduled) {
				// Giving up now - human intervention required to fix this!
				// At the end we print the round showing the courts scheduled & the remainder players
				// so should be enough info for a person to resolve manually if needed.....
				console.log("Failed to complete all courts - real eyes needed here");
			}
		}
		console.log("Courts should be filled..."); // may not be entirely true

		// update notpicked for all those not chosen in this round
		for (const z in playerList) {
			if (roundPicks.indexOf(playerList[z]) < 0) {
				playerList[z].byeCount++;
			}
		}
		console.log("Round completed!");
	}

	//console.log(JSON.stringify(schedule, null, 2));
	for (const [idx, f] of schedule.rounds.entries()) {
		//console.log(schedule.rounds[f]);
		console.log("Round :" + f);
		for (let g = 0; g < f.courts.length; g += 2) {
			let e1 = f.courts[g];
			let e2 = f.courts[g + 1];
			if (e1 != null && e2 != null) {

				appMatches.push(matchToAppMatch(e1, idx));
				appMatches.push(matchToAppMatch(e2, idx));

				console.log("\tCourt " + (g + 1) + ": " + e1.getMatchDescription() +
					"\tCourt " + (g + 2) + ": " + e2.getMatchDescription());
			}
			else if (e1 != null && e2 == null) {
				// in case there's a gap in the courts layout...
				console.log("\tCourt " + (g + 1) + ": " + e1.getMatchDescription());
				appMatches.push(matchToAppMatch(e1, idx));
			}
		}

		console.log("Sitting for this round --> \t");
		console.log(f.getRemainderPlayers(playerList));
		console.log();
	}
	console.log("=======");
	console.log(playerList);
	return appMatches;

	function matchToAppMatch(match: Match, round: number): AppMatch {
		let appMatch: AppMatch = {
			id: newId(),
			sessionId,
			team1: [match.pair1.player1.name, match.pair1.player2.name],
			team2: [match.pair2.player1.name, match.pair2.player2.name],
			team1Score: 0,
			team2Score: 0,
			round,
			ratingChanges: {}
		}

		return appMatch;
	}

	// ***********************************************
	// * Utility and helper functions down here
	// ***********************************************

	// Pick 4 starting at the given position in the given list, pass to the schedule call & return the result
	function doSchedule(availablePlayers: Player[], startPos: number, callerStartPosGiven: boolean, roundPicks: Player[], currentRound: Round) {

		let playerStart = 0 + roundPicks.length;
		if (callerStartPosGiven) {
			playerStart = startPos;
		}

		let pickedPlayers = pickNext4(availablePlayers, playerStart);
		return scheduleGroup(pickedPlayers, roundPicks, currentRound)
	}

	// Try to locate the fairest match for the given players
	// Return the result to the caller
	function scheduleGroup(givenPlayers: Player[], roundPicks: Player[], currentRound: Round) {

		let fmatch = getFairestMatchForTargetPlayers(mappedMatches, givenPlayers);
		let result = currentRound.scheduleMatch(fmatch);
		if (result) {
			// record that we've used them in this round
			for (const o in givenPlayers) {
				roundPicks.push(givenPlayers[o]);
			}
			return true;
		}
		else {

			return false;
		}
	}

	function shufflePlayerDeck(array: Player[]) {
		console.log("++++++++++++ SHUFFLE +++++++++++++");
		for (var i = array.length - 1; i > 0; i--) {
			var rand = Math.floor(Math.random() * (i + 1));
			[array[i], array[rand]] = [array[rand], array[i]]
		}
	}

	// NOT USED
	function getRandomMatch(requiredRDiff: number, matchMap: Record<string, Match[]>) {
		let k = makeMapKey(requiredRDiff);
		let matchList = matchMap[k];
		if (matchList != null && matchList.length > 0) {
			let l = matchList.length;
			let p = Math.floor(Math.random() * l);
			let match = matchList[p];
			let fMatchList = matchList.filter(function (e) { return e !== match });
			matchMap[k] = fMatchList;
			return match;
		}
		return null;
	}

	// Find the fairest match which includes all of the given players
	function getFairestMatchForTargetPlayers(matchMap: Record<string, Match[]>, players: Player[]): Match | null {
		//console.log("Find match for ..." + JSON.stringify(players));
		let checkCount = 0; // how many matches we checked
		for (var i = 0; i <= MAX_ALLOWED_RDIFF; i++) {
			var k = makeMapKey(i);
			//console.log(k);
			var found = false;
			var matchList = matchMap[k];
			if (matchList != null && matchList.length > 0) {
				let match: Match | null = null;
				for (var z = 0; z < matchList.length; z++) {
					match = matchList[z];
					checkCount++;
					if (match.hasAllPlayers(players)) {
						found = true;
						break; // found one that works
					}
				}

				if (found && match != null) {
					// Remove the target match by filtering it out of the array
					let fMatchList = matchList.filter(function (e) { return e !== match });
					matchMap[k] = fMatchList;
					//console.log("returning...." + match.getMatchDescription());
					return match;
				}
			}
		}
		// No match at all can be found for these players! - Would need to increase the MAX_RDiff filter value?
		console.log("getFairestMatchForTargetPlayers: No fair match! (after " + checkCount + " checks)");
		console.log(players);
		return null;
	}

	// helper to make sure keys for match map are created correctly everywhere
	function makeMapKey(rdiff: number) {
		return "rdiff:" + Math.abs(rdiff);
	}

	// confirms no player the same on both sides - combinations loop giving players playing against themselves....?
	// Quick and dirty fix is check & ignore...
	function noPlayersInCommon(pair1: Pair, pair2: Pair) {
		return (pair1.getPlayer1Name() != pair2.getPlayer1Name()
			&& pair1.getPlayer1Name() != pair2.getPlayer2Name()
			&& pair1.getPlayer2Name() != pair2.getPlayer1Name()
			&& pair1.getPlayer2Name() != pair2.getPlayer2Name());
	}

	// Sort function for the playerList
	function sortEntries(arr: Player[]) {
		// sort ascending on player.games
		arr.sort(function (o1, o2) {
			if (o1.gameCount != o2.gameCount) {
				return o1.gameCount - o2.gameCount;
			}
			else {
				// if equal games, sort descending on byes
				return o2.byeCount - o1.byeCount;
			}
		});
	}

	function pickNext4(srcArr: Player[], startPos: number) {
		var picked = pickNextGroup(srcArr, startPos, 4);
		return picked;
	}

	function pickNextGroup(srcArr: Player[], startFrom: number, groupSize: number) {
		// we will return this when it's got groupSize entries in it
		let ret = [];
		for (let i = startFrom; i < (groupSize + startFrom); i++) {
			ret.push(srcArr[i]);
		}
		return ret;
	}

	function generatePairings(players: Player[]) {
		// generating ALL possible pairings now from the playerList
		var pairList = [];
		for (var i = 0; i < players.length; i++) {
			for (var j = i + 1; j < players.length; j++) {
				pairList.push(new Pair(playerList[i], playerList[j]));
			}
		}
		return pairList;
	}

}

