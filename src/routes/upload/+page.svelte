<script lang="ts">
	import { writable } from 'svelte/store';
	import { collection, doc, writeBatch } from 'firebase/firestore';
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

	async function uploadToFirestore(players: Player[]) {
		isLoading.set(true);
		error.set(null);

		try {
			const batch = writeBatch(db);

			players.forEach((player, index) => {
				const docRef = doc(collection(db, 'players'), `${index}`);
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

	function parseAndUpload() {
		fileContent.subscribe((content) => {
			if (content) {
				try {
					const jsonData = JSON.parse(content);
					const players = Object.entries(jsonData).map(
						([name, rating]) => ({ name, rating }) as Player
					);
					uploadToFirestore(players);
				} catch (err) {
					console.error('Error parsing JSON:', err);
					error.set('Error parsing JSON');
				}
			}
		});
	}
</script>

<main>
	<h1>Upload JSON to Firestore</h1>
	<input type="file" accept=".json" bind:this={fileInput} on:change={handleFileUpload} />
	<button on:click={parseAndUpload} disabled={$isLoading}>Upload</button>

	{#if $error}
		<p style="color: red;">{$error}</p>
	{/if}

	{#if $isLoading}
		<p>Loading...</p>
	{/if}
</main>

<style>
	main {
		padding: 2rem;
	}
</style>
