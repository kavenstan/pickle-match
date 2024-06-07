<script>
	import { onMount } from 'svelte';
	import Navbar from './Navbar.svelte';
	import { checkAuth } from '$lib/user';
	import { Toasts, ScrollToTop } from '$lib/components';
	import { fetchPlayers } from '$lib/stores/player';
	import './styles.css';

	onMount(async () => {
		// TODO: Only checked on initial render
		checkAuth();
		await fetchPlayers();
	});
</script>

<Toasts />

<Navbar />

<main class="container">
	<slot />
</main>

<ScrollToTop />

<footer>&nbsp;</footer>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
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
