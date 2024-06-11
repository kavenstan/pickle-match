<script lang="ts">
	export let name: string;
</script>

<button>{name.substring(0, 1)}</button>

<style>
	button {
		border-radius: 1rem;
		height: 2rem;
		width: 2rem;
	}
</style>
