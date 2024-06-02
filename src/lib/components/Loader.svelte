<script lang="ts">
	export let message: string | null = null;
	export let name: string | null = null;
	console.log(name);
</script>

<div class="loader" aria-busy={true}>
	{#if message}
		<span>{message}</span>
	{:else if name}
		<span>Loading {name}...</span>
	{:else}
		<span>Loading...</span>
	{/if}
</div>

<style>
	.loader {
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: larger;
	}
</style>
