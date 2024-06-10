<script lang="ts">
	export let value: number | undefined;
</script>

{#if value}
	<div class={(value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral') + ' rating-change'}>
		{Math.abs(value)}
	</div>
	<!-- {#if value > 0}
		<iconify-icon icon="carbon:caret-up" />
	{/if} -->
{/if}

<style>
	.rating-change {
		font-size: 0.75rem;
		border: 1px solid white;
		border-radius: 1rem;
		width: 1.5rem;
		height: 1rem;
		text-align: center;
		line-height: 0.9rem;
	}

	.positive {
		border-color: green;
		background-color: green;
	}
	.negative {
		border-color: red;
		background-color: red;
	}
	.neutral {
		border-color: yellow;
		background-color: yellow;
	}
</style>
