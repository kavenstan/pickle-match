<script>
	export let width = '48';
	export let height = '48';
</script>

<svg {width} {height} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
	<line class="line" x1="20" y1="20" x2="20" y2="80" />
	<line class="line" x1="50" y1="20" x2="50" y2="80" />
	<line class="line" x1="80" y1="20" x2="80" y2="80" />

	<line class="cross" x1="20" y1="35" x2="80" y2="35" />
	<line class="cross" x1="20" y1="65" x2="80" y2="65" />
</svg>

<style>
	line {
		stroke-linecap: round;
		stroke: var(--secondary-color);
	}
	.line {
		stroke-width: 16;
	}
	.cross {
		stroke-width: 8;
	}
</style>
