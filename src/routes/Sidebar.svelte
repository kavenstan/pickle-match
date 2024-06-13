<script lang="ts">
	import { page } from '$app/stores';
	import { userSession, hasPermission, PERMISSION_SESSION_WRITE } from '$lib/user';

	export let showSidebar;
	export let closeSidebar;
</script>

{#if showSidebar}
	<div class="backdrop" role="presentation" on:click={closeSidebar}></div>
{/if}

<aside class:open={showSidebar}>
	<nav>
		<a
			href="/ratings"
			on:click={closeSidebar}
			class={$page.url.pathname.startsWith('/ratings') ? 'active' : undefined}>Players</a
		>
		<a
			href="/results"
			on:click={closeSidebar}
			class={$page.url.pathname.startsWith('/results') ? 'active' : undefined}>Sessions</a
		>
		<a
			href="/settings"
			on:click={closeSidebar}
			class={$page.url.pathname.startsWith('/settings') ? 'active' : undefined}>Settings</a
		>
		{#if hasPermission($userSession, PERMISSION_SESSION_WRITE)}
			<a
				href="/matchmaking"
				on:click={closeSidebar}
				class={$page.url.pathname.startsWith('/matchmaking') ? 'active' : undefined}>Matchmaking</a
			>
			<a
				href="/sync"
				on:click={closeSidebar}
				class={$page.url.pathname.startsWith('/sync') ? 'active' : undefined}>Sync</a
			>
		{/if}
	</nav>
</aside>

<style>
	.backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.4);
		z-index: 9;
	}

	aside {
		width: 11rem;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		position: relative;
		transition: transform 0.3s ease-in-out;
		background-color: var(--pico-background-color);
	}
	aside.open {
		transform: translateX(0);
	}
	nav {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	a {
		color: var(--color-text);
	}
	a.active {
		color: var(--secondary-color);
	}
	@media (max-width: 768px) {
		aside {
			position: fixed;
			top: 3rem;
			left: 0;
			height: 100%;
			box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
			z-index: 10;
			transform: translateX(-100%);
		}
	}
</style>
