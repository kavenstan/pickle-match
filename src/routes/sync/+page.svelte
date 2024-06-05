<script lang="ts">
	import { writable } from 'svelte/store';
	import { collection, doc, writeBatch, setDoc, Timestamp } from 'firebase/firestore';
	import { db } from '$lib/firebase';
	import type { Session, Player, Match } from '$lib/types';
	import { addSession, getSession, getSessionsByDate } from '$lib/session';
	import { recalculateRatings } from '$lib/elo';
	import { PERMISSION_PLAYER_WRITE, userSession, hasPermission } from '$lib/user';
	import { addMatches } from '$lib/match';
	import { formatDate, newId } from '$lib/utils';
	import { MatchmakingType, SessionStatus } from '$lib/enums';

	let file: File | null = null;
	let fileName = '';
	let fileSize = 0;
	let fileType = '';
	let fileContent = '';

	let isValidCsv = false;
	let isValidJson = false;

	let isSaving = false;
	let error: string | null = null;
	let messageLog = '';

	const addMessage = (newMessage: string) => {
		messageLog = messageLog + `[${formatDate(new Date(), 'HH:mm:ss')}] ${newMessage}\n`;
	};

	addMessage('Waiting...');

	const handleFileChange = (event: Event): void => {
		const input = event.target as HTMLInputElement;
		const selectedFile = input.files ? input.files[0] : null;

		if (selectedFile) {
			file = selectedFile;
			fileName = file.name;
			fileSize = file.size;
			fileType = file.type;

			const reader = new FileReader();
			reader.onload = () => {
				fileContent = reader.result as string;
				validateFileContent();
			};
			reader.readAsText(file);
		} else {
			reset();
		}
	};

	const reset = (): void => {
		file = null;
		fileName = '';
		fileSize = 0;
		fileType = '';
		isValidCsv = false;
		isValidJson = false;
	};

	const validateFileContent = () => {
		addMessage('Validating File Content');
		if (fileType === 'text/csv') {
			isValidCsv = true;
		}
		if (fileType === 'application/json') {
			isValidJson = true;
		}
	};

	const processFile = async () => {
		if (fileType === 'text/csv') {
			await processDuprCsv();
		}
		if (fileType === 'application/json') {
			await processPlayerJson();
		}
	};

	const processDuprCsv = async () => {
		var duprMatches = parseDuprCsv(fileContent);
		addMessage(`Found ${duprMatches.length} matches`);

		await uploadMatches(duprMatches);
	};

	const parseDuprCsv = (content: string) => {
		const rows = content.split('\n');

		return rows.map((row) => {
			const columns = row.split(',');

			return {
				date: columns[5],
				player1_team1: columns[6],
				player2_team1: columns[9],
				player1_team2: columns[12],
				player2_team2: columns[15],
				score_team1: parseInt(columns[19], 10),
				score_team2: parseInt(columns[20], 10)
			};
		});
	};

	const processPlayerJson = async () => {
		try {
			const jsonData = JSON.parse(fileContent);
			const players = Object.entries(jsonData).map(
				([name, rating]) => ({ name, rating }) as Player
			);
			addMessage(`Found ${players.length} players`);
			await uploadPlayers(players);
		} catch (err) {
			error = `Error parsing JSON: ${err}`;
			addMessage(error);
		}
	};

	const uploadPlayers = async (players: Player[]) => {
		isSaving = true;
		error = null;

		try {
			const batch = writeBatch(db);

			players.forEach((player) => {
				const docRef = doc(collection(db, 'players'));
				batch.set(docRef, player);
			});

			await batch.commit();

			addMessage('Player data successfully imported to Firestore');
		} catch (err) {
			error = `Error uploading players: ${err}`;
			addMessage(error);
		} finally {
			isSaving = false;
		}
	};

	async function uploadMatches(duprMatches: DuprMatch[]) {
		try {
			const playerSet = new Set<string>();

			duprMatches.forEach((match) => {
				playerSet.add(match.player1_team1);
				playerSet.add(match.player2_team1);
				playerSet.add(match.player1_team2);
				playerSet.add(match.player2_team2);
			});

			const players = Array.from(playerSet);

			const courtCount = Math.floor(players.length / 4);

			console.log(duprMatches[0]);
			const session: Session = {
				id: newId(),
				date: Timestamp.fromDate(new Date(duprMatches[0].date)),
				location: 'Midleton',
				config: {
					courts: courtCount,
					matchmakingType: MatchmakingType.RoundRobin,
					maxIterations: 0,
					ratingDiffLimit: 0
				},
				state: {
					status: SessionStatus.Completed,
					activePlayers: players,
					allPlayers: players,
					currentRound: 0,
					sitOutOrder: players,
					sitOutIndex: 0,
					startRatings: {},
					endRatings: {},
					matchStats: {}
				}
			};
			console.log(session);

			var existingSessions = await getSessionsByDate(session.date);
			if (existingSessions.length > 0) {
				throw Error('Existing session found on date');
			}
			await addSession(session);

			const matches: Match[] = duprMatches.map((row: any, i) => {
				let round = Math.floor(i / courtCount) + 1;
				return {
					id: newId(),
					sessionId: session.id,
					team1: [row.player1_team1, row.player2_team1],
					team2: [row.player1_team2, row.player2_team2],
					team1Score: row.score_team1,
					team2Score: row.score_team2,
					round
				} as Match;
			});

			var validMatches = matches.filter(
				(match) => match.team1Score !== 0 || match.team2Score !== 0
			);
			addMessage(`Found ${validMatches.length} valid matches`);
			await addMatches(validMatches);
		} catch (err) {
			error = `Error parsing CSV: ${err}`;
			addMessage(error);
		}
	}

	interface DuprMatch {
		date: string;
		player1_team1: string;
		player2_team1: string;
		player1_team2: string;
		player2_team2: string;
		score_team1: number;
		score_team2: number;
	}
</script>

<h1>Data Sync</h1>

<div class="sync-section">
	<h2>Import</h2>
	<p>Upload valid DUPR CSV or Player JSON</p>

	<input type="file" accept=".csv,.json" on:change={handleFileChange} />

	{#if fileName}
		<div class="file-info">
			<p>File Name: {fileName}</p>
			<p>File Size: {fileSize} bytes</p>
			<p>File Type: {fileType}</p>
		</div>
	{/if}

	{#if isValidCsv || isValidJson}
		<p>Valid file found</p>
		<button on:click={async () => await processFile()}>Process File</button>
	{/if}

	{#if error}
		<p style="color: red;">{error}</p>
	{/if}

	{#if isSaving}
		<p>Saving...</p>
	{/if}

	<h3>Upload Log</h3>
	<pre>{messageLog}</pre>
</div>

<hr />

<div class="sync-section">
	<h2>Export</h2>

	<button>[NYI] Players</button>
	<br /><br />
	<button>[NYI] Matches</button>
</div>

<hr />

<div class="sync-section">
	<h2>Functions</h2>
	<!-- <button on:click={async () => await resetRatings()}>Reset Ratings</button> -->
	{#if hasPermission($userSession, PERMISSION_PLAYER_WRITE)}
		<button on:click={async () => await recalculateRatings()}>Recalculate Ratings</button>
	{/if}

	<!-- <button on:click={async () => await removeMatches()}>Remove Matches</button> -->
</div>

<style>
	.sync-section {
		margin-bottom: 2rem;
		padding-left: 0.5rem;
		border-left: 2px solid var(--primary-color);
	}
</style>
