<script>
	import Header from './Header.svelte';
	import './styles.css';
</script>

<Header />

<main class="content">
	<slot />
</main>

<footer>&nbsp;</footer>

<style>
	.content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1rem;
	}
</style>
