<script>
	import Header from './Header.svelte';
	import './styles.css';
</script>

<div class="app">
	<Header />

	<main class="content">
		<slot />
	</main>
</div>

<style>
	.content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1rem;
	}
</style>
