<script>
	import { onMount } from 'svelte';
	import Navbar from './Navbar.svelte';
	import { checkAuth } from '$lib/user';
	import './styles.css';
	import ScrollToTop from '$lib/components/ScrollToTop.svelte';

	// TODO: Only checked on initial render
	onMount(() => {
		checkAuth();
	});
</script>

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
