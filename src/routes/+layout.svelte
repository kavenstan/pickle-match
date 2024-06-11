<script lang="ts">
	import Navbar from './Navbar.svelte';
	import Sidebar from './Sidebar.svelte';
	import { onMount } from 'svelte';
	import { checkAuth } from '$lib/user';
	import { Toasts, ScrollToTop } from '$lib/components';
	import { fetchPlayers } from '$lib/stores/player';
	import './styles.css';
	import '@picocss/pico/css/pico.css';

	onMount(async () => {
		// TODO: Only checked on initial render
		checkAuth();
		await fetchPlayers();
	});
</script>

<Toasts />

<Navbar />

<main class="container">
	<Sidebar />
	<div class="content">
		<slot />
	</div>
</main>

<ScrollToTop />

<footer>&nbsp;</footer>

<style>
	.container {
		display: flex;
		max-width: 1200px;
	}
	.content {
		padding: 1rem;
	}

	@media only screen and (max-width: 600px) {
		main {
			margin: 0;
		}
		.container {
			padding: 0.5rem;
		}
	}

	footer {
		height: 5rem;
	}
</style>
