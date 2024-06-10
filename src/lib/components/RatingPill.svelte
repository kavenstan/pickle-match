<script lang="ts">
	export let value: number | undefined;
</script>

{#if value !== undefined}
	<div class={(value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral') + ' rating-change'}>
		{#if value > 0}
			<iconify-icon icon="carbon:caret-up" />
		{/if}
		{#if value < 0}
			<iconify-icon icon="carbon:caret-down" />
		{/if}
		{Math.abs(value)}
	</div>
{/if}

<style>
	.rating-change {
		font-size: 0.75rem;
		border: 1px solid white;
		border-radius: 1rem;
		width: 2.2rem;
		height: 1rem;
		text-align: center;
		line-height: 0.9rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.positive {
		border-color: var(--color-status-win);
	}
	.negative {
		border-color: var(--color-status-loss);
	}
	.neutral {
		border-color: var(--color-status-draw);
	}
</style>
