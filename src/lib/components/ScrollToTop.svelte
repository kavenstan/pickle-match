<script>
	export let showHeight = 250;
	let isHidden = true;

	function scrollToTop() {
		// document.body.scrollIntoView();
		window.scrollTo({ top: 0, behavior: 'smooth' });
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

<button on:click={scrollToTop} class:isHidden><iconify-icon icon="iconamoon:arrow-up-1" /></button>

<style>
	button {
		opacity: 1;
		transition:
			opacity 0.5s,
			visibility 0.5s;

		position: fixed;
		z-index: 99;
		right: 20px;
		bottom: 20px;

		height: 2.5rem;
		width: 2.5rem;

		user-select: none;
		background-color: rgb(0 0 0 / 1);
		color: #666666;
		border-radius: 1.25rem;
		border: 0;

		display: flex;
		justify-content: center;
		align-items: center;
	}

	button:focus {
		--pico-box-shadow: 0;
	}

	button iconify-icon {
		font-size: 2rem;
	}
	button iconify-icon:hover {
		color: var(--accent-color);
	}

	button.isHidden {
		opacity: 0;
		visibility: hidden;
	}
</style>
