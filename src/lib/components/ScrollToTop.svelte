<script>
	export let showHeight = 250;
	let isHidden = true;

	function scrollToTop() {
		document.body.scrollIntoView();
	}

	function scrollContainer() {
		return document.documentElement || document.body;
	}

	function handleOnScroll() {
		if (!scrollContainer()) {
			return;
		}

		isHidden = scrollContainer().scrollTop <= showHeight;
	}
</script>

<svelte:window on:scroll={handleOnScroll} />

<button on:click={scrollToTop} class:isHidden
	><iconify-icon icon="iconamoon:arrow-up-2-light" /></button
>

<style>
	button {
		opacity: 1;
		transition:
			opacity 0.5s,
			visibility 0.5s;
		position: fixed;
		z-index: 99;
		right: 20px;
		user-select: none;
		bottom: 20px;
		color: var(--accent-color);
		background-color: black;
		line-height: 0.5rem;
		border-radius: 1rem;
	}

	button.isHidden {
		opacity: 0;
		visibility: hidden;
	}
</style>
