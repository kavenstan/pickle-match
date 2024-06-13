<script lang="ts">
	export let name: string;
</script>

<button on:click>{name.substring(0, 1)}</button>

<style>
	button {
		border-radius: 1rem;
		height: 2rem;
		width: 2rem;
	}
</style>
