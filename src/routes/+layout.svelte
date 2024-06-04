<script>
	import { onMount } from 'svelte';
	import Navbar from './Navbar.svelte';
	import { checkAuth } from '$lib/user';
	import './styles.css';

	onMount(() => {
		checkAuth();
	});
</script>

<Navbar />

<main class="container">
	<slot />
</main>

<footer>&nbsp;</footer>

<style>
	main {
		margin-left: 5rem;
	}
	.container {
		/* max-width: 1200px; */
		/* margin: 0 auto; */
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
</style>
