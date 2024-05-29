<script lang="ts">
	import { writable } from 'svelte/store';
	import { collection, doc, writeBatch, setDoc } from 'firebase/firestore';
	import { db } from '$lib/firebase';
	import type { Player } from '$lib/types';

	const fileContent = writable<string | null>(null);
	const isLoading = writable(false);
	const error = writable<string | null>(null);

	let fileInput: HTMLInputElement;

	function handleFileUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			const file = target.files[0];
			const reader = new FileReader();
			reader.onload = () => {
				fileContent.set(reader.result as string);
			};
			reader.onerror = () => {
				error.set('Error reading file');
			};
			reader.readAsText(file);
		}
	}

	function parseDuprCSV(content: string) {
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
	}

	async function uploadPlayersToFirestore(players: Player[]) {
		isLoading.set(true);
		error.set(null);

		try {
			const batch = writeBatch(db);

			players.forEach((player) => {
				const docRef = doc(collection(db, 'players'));
				batch.set(docRef, player);
			});

			await batch.commit();
			alert('Data successfully imported to Firestore');
		} catch (err) {
			console.error('Error uploading to Firestore:', err);
			error.set('Error uploading to Firestore');
		} finally {
			isLoading.set(false);
		}
	}

	async function uploadSessionToFirestore(session: any) {
		isLoading.set(true);
		error.set(null);

		try {
			const sessionRef = doc(collection(db, 'sessions'));
			await setDoc(sessionRef, session);

			alert('Data successfully imported to Firestore');
		} catch (err) {
			console.error('Error uploading to Firestore:', err);
			error.set('Error uploading to Firestore');
		} finally {
			isLoading.set(false);
		}
	}

	function parseAndUploadUser() {
		fileContent.subscribe((content) => {
			if (content) {
				try {
					const jsonData = JSON.parse(content);
					const players = Object.entries(jsonData).map(
						([name, rating]) => ({ name, rating }) as Player
					);
					uploadPlayersToFirestore(players);
				} catch (err) {
					console.error('Error parsing JSON:', err);
					error.set('Error parsing JSON');
				}
			}
		});
	}

	async function parseAndUploadSession() {
		fileContent.subscribe(async (content) => {
			if (content) {
				try {
					const csvData = parseDuprCSV(content);

					const playerSet = new Set<string>();
					const matches = csvData.map((row: any) => {
						playerSet.add(row.player1_team1);
						playerSet.add(row.player2_team1);
						playerSet.add(row.player1_team2);
						playerSet.add(row.player2_team2);
						return {
							team1: [row.player1_team1, row.player2_team1],
							team2: [row.player1_team2, row.player2_team2],
							team1Score: row.score_team1,
							team2Score: row.score_team2
						};
					});

					const players = Array.from(playerSet);
					const courtCount = Math.floor(players.length / 4);

					const rounds = [];
					for (let i = 0; i < matches.length; i += courtCount) {
						const roundMatches = matches
							.slice(i, i + courtCount)
							.filter((match) => match.team1Score !== 0 || match.team2Score !== 0);
						rounds.push({ matches: roundMatches });
					}

					const session = {
						date: csvData[0].date,
						location: 'Midleton',
						config: {
							players,
							courtsAvailable: courtCount
						},
						rounds
					};
					console.log(session);
					await uploadSessionToFirestore(session);
				} catch (err) {
					console.error('Error parsing CSV:', err);
					error.set('Error parsing CSV');
				}
			}
		});
	}
</script>

<main>
	{#if $error}
		<p style="color: red;">{$error}</p>
	{/if}

	{#if $isLoading}
		<p>Loading...</p>
	{/if}

	<h1>Upload Player File</h1>
	<input type="file" accept=".json" bind:this={fileInput} on:change={handleFileUpload} />
	<button on:click={parseAndUploadUser} disabled={$isLoading}>Upload</button>

	<h1>Upload DUPR File</h1>
	<input type="file" accept=".csv" bind:this={fileInput} on:change={handleFileUpload} />
	<button on:click={parseAndUploadSession} disabled={$isLoading}>Upload</button>
</main>

<style>
	main {
		padding: 2rem;
	}
</style>
