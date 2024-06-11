<script lang="ts">
	let theme = 'dark';
	function toggleTheme() {
		theme = theme === 'dark' ? 'light' : 'dark';
		document.documentElement.setAttribute('data-theme', theme);
	}
</script>

<button on:click={toggleTheme}>
	{#if theme === 'dark'}
		<iconify-icon icon="carbon:light" />
	{:else}
		<iconify-icon icon="carbon:moon" />
	{/if}
</button>

<style>
	button {
		background: none;
		border: none;
		border-radius: 1rem;
		color: var(--text-color);
		display: flex;
	}
	button:focus {
		box-shadow: none;
	}
</style>
