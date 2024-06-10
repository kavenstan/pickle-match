<script lang="ts">
	import { get } from 'svelte/store';
	import { collection, doc, writeBatch, Timestamp } from 'firebase/firestore';
	import { db } from '$lib/firebase';
	import type { Session, Player, Match, Seeding } from '$lib/types';
	import { addSession, getSessionsByDate } from '$lib/stores/session';
	import { PERMISSION_PLAYER_WRITE, userSession, hasPermission } from '$lib/user';
	import { addMatches } from '$lib/stores/match';
	import { formatDate, newId } from '$lib/utils';
	import { MatchmakingType, SessionStatus } from '$lib/enums';
	import { playersStore, resetAllPlayerStats } from '$lib/stores/player';
	import { onMount } from 'svelte';
	import { setSeedings } from '$lib/stores/seeding';
	import { calculateAllRatings, copySeedings, resetAllRatings, simulate } from '$lib/rating';
	import { resetAllStats, calculateAllStats } from '$lib/stats';
	// import { simulate } from '$lib/elo';

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

	let playerMap: Record<string, Player>;

	onMount(() => {
		playerMap = get(playersStore);
	});

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
			const seedings: Seeding[] = JSON.parse(fileContent);
			addMessage(`Found ${seedings.length} seedings`);
			await setSeedings(seedings);
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
			const playerIdSet = new Set<string>();

			duprMatches.forEach((match) => {
				playerIdSet.add(match.player1_team1);
				playerIdSet.add(match.player2_team1);
				playerIdSet.add(match.player1_team2);
				playerIdSet.add(match.player2_team2);
			});

			const playerIds = [...playerIdSet];

			const courtCount = Math.floor(playerIds.length / 4);

			// console.log(duprMatches[0]);
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
					activePlayerIds: playerIds,
					allPlayerIds: playerIds,
					currentRound: 0,
					sitOutOrderPlayerIds: [],
					sitOutIndex: 0,
					startRatings: {},
					endRatings: {},
					matchStats: {}
				}
			};
			// console.log(session);

			var existingSessions = await getSessionsByDate(session.date);
			if (existingSessions.length > 0) {
				throw Error('Existing session found on date');
			}
			await addSession(session);

			const matches: Match[] = duprMatches.map((row: any, i) => {
				let round = Math.floor(i / courtCount) + 1;
				console.log('Row', row);
				console.log('Session', session);
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

	const downloadJson = (fileName: string, content: any) => {
		const json = JSON.stringify(content, null, 2);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = fileName;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const downloadPlayers = async () => {
		const content = Object.values(playerMap).map((x) => {
			return {
				id: x.id,
				name: x.name,
				rating: x.rating
			};
		});
		downloadJson(`player_ratings_${formatDate(new Date())}.json`, content);
	};

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

{#if playerMap}
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

		<button on:click={() => downloadPlayers()}>Players</button>
		<br /><br />
		<button>[NYI] Matches</button>
	</div>

	<hr />

	<div class="sync-section">
		<h2>Functions</h2>
		{#if hasPermission($userSession, PERMISSION_PLAYER_WRITE)}
			<a href="/sync/seedings"><button>View Seedings</button></a>
			<button on:click={async () => await copySeedings()}>Copy Seedings</button>
			<br />
			<br />
			<button on:click={async () => await resetAllRatings()}>Reset All Ratings</button>
			<button on:click={async () => await calculateAllRatings()}>Calculate All Ratings</button>
			<br />
			<br />
			<button on:click={async () => await resetAllPlayerStats()}>Reset All Player Stats</button>
			<button on:click={async () => await resetAllStats()}>Reset All Stats</button>
			<button on:click={async () => await calculateAllStats()}>Calculate All Stats</button>
		{/if}

		<br />
		<br />
		<button on:click={() => simulate()}>Simulate</button>
	</div>
{/if}

<style>
	.sync-section {
		margin-bottom: 2rem;
		padding-left: 0.5rem;
		border-left: 2px solid var(--primary-color);
	}
</style>
