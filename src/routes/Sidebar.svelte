<script lang="ts">
	import { page } from '$app/stores';
	import { userSession, hasPermission, PERMISSION_SESSION_WRITE } from '$lib/user';
</script>

<aside>
	<nav>
		<a href="/ratings" class={$page.url.pathname.startsWith('/ratings') ? 'active' : undefined}
			>Players</a
		>
		<a href="/results" class={$page.url.pathname.startsWith('/results') ? 'active' : undefined}
			>Sessions</a
		>
		<a href="/settings" class={$page.url.pathname.startsWith('/settings') ? 'active' : undefined}
			>Settings</a
		>
		{#if hasPermission($userSession, PERMISSION_SESSION_WRITE)}
			<a href="/sync" class={$page.url.pathname.startsWith('/sync') ? 'active' : undefined}>Sync</a>
		{/if}
	</nav>
</aside>

<style>
	aside {
		width: 11rem;
		padding: 1rem;
		display: flex;
		flex-direction: column;
	}
	nav {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	a {
		color: white;
	}
	a.active {
		color: var(--secondary-color);
	}

	@media (max-width: 768px) {
		aside {
			display: none;
		}
	}
</style>
