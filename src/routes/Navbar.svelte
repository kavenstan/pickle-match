<script lang="ts">
	import { page } from '$app/stores';
	import { PERMISSION_SYNC, PERMISSION_SESSION_WRITE, hasPermission, userSession } from '$lib/user';
	import 'iconify-icon';
	import Icon from './Icon.svelte';
</script>

<nav>
	<div class="nav-inner">
		<a href="/" class="logo-container">
			<div class="logo"><Icon /></div>
			<span class="link-text logo-text">Pickt</span>
		</a>
		<ul>
			<li
				class={$page.url.pathname.startsWith('/ratings') ? 'active' : undefined}
				aria-current={$page.url.pathname === '/ratings' ? 'page' : undefined}
			>
				<a href="/ratings"><iconify-icon class="icon" icon="ph:user-list" /> </a>
			</li>
			<li
				class={$page.url.pathname.startsWith('/results') ? 'active' : undefined}
				aria-current={$page.url.pathname === '/results' ? 'page' : undefined}
			>
				<a href="/results"><iconify-icon class="icon" icon="carbon:result" /> </a>
			</li>
			{#if hasPermission($userSession, PERMISSION_SESSION_WRITE)}
				<li
					class={$page.url.pathname.startsWith('/matchmaking') ? 'active' : undefined}
					aria-current={$page.url.pathname.startsWith('/matchmaking') ? 'page' : undefined}
				>
					<a href="/matchmaking"><iconify-icon class="icon" icon="ph:magic-wand" /> </a>
				</li>
			{/if}
			{#if hasPermission($userSession, PERMISSION_SYNC)}
				<li
					class={$page.url.pathname.startsWith('/sync') ? 'active' : undefined}
					aria-current={$page.url.pathname.startsWith('/sync') ? 'page' : undefined}
				>
					<a href="/sync"><iconify-icon class="icon" icon="iconamoon:synchronize-light" /> </a>
				</li>
			{/if}
			<li
				class={$page.url.pathname.startsWith('/settings') ? 'active' : undefined}
				aria-current={$page.url.pathname.startsWith('/settings') ? 'page' : undefined}
			>
				<a href="/settings"><iconify-icon class="icon" icon="iconamoon:settings-light" /> </a>
			</li>
		</ul>
	</div>
</nav>

<style>
	nav {
		background-color: var(--primary-color);
	}

	.nav-inner {
		display: flex;
		justify-content: space-between;
		max-width: 1200px;
		margin: auto;
		width: 100%;
		padding: 0 1rem;
	}

	ul {
		padding: 0;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: end;
		width: 100%;
	}

	li a {
		display: flex;
		align-items: center;
		height: 3rem;
		color: var(--secondary-color);
		text-decoration: none;
		transition: var(--transition-speed);
	}
	li a:hover {
		filter: grayscale(0%) opacity(1);
		color: var(--secondary-color);
	}

	li.active a {
		color: var(--accent-color);
	}

	.icon {
		font-size: 2rem;
	}

	.logo-text {
		color: var(--accent-color);
		font-size: 2rem;
	}

	.logo-container {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		text-decoration: none;
	}

	@media only screen and (max-width: 400px) {
		.logo {
			display: none;
		}
		nav ul {
			justify-content: space-between;
		}
	}
	@media only screen and (max-width: 576px) {
		.logo-text {
			display: none;
		}
	}
	@media only screen and (min-width: 576px) {
	}
</style>
