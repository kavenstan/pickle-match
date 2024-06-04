<script lang="ts">
	import { page } from '$app/stores';
	import {
		PERMISSION_UPLOAD,
		PERMISSION_SESSION_WRITE,
		hasPermission,
		userSession
	} from '$lib/user';
	import 'iconify-icon';
	import Icon from './Icon.svelte';
</script>

<nav>
	<ul>
		<li class="li-logo">
			<span class="link-text logo-text">Pickt</span>
			<div class="logo"><Icon /></div>
		</li>
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
		{#if hasPermission($userSession, PERMISSION_UPLOAD)}
			<li
				class={$page.url.pathname.startsWith('/upload') ? 'active' : undefined}
				aria-current={$page.url.pathname.startsWith('/upload') ? 'page' : undefined}
			>
				<a href="/upload"><iconify-icon class="icon" icon="iconamoon:cloud-upload-light" /> </a>
			</li>
		{/if}
		<li
			class={$page.url.pathname.startsWith('/settings') ? 'active' : undefined}
			aria-current={$page.url.pathname.startsWith('/settings') ? 'page' : undefined}
		>
			<a href="/settings"><iconify-icon class="icon" icon="iconamoon:settings-light" /> </a>
		</li>
	</ul>
</nav>

<style>
	nav {
		background-color: var(--primary-color);
	}
	nav ul {
		list-style: none;
		padding: 0;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		max-width: 1200px;
	}

	nav li a {
		display: flex;
		align-items: center;
		height: 3rem;
		color: var(--secondary-color);
		text-decoration: none;
		transition: var(--transition-speed);
	}
	nav li a:hover {
		filter: grayscale(0%) opacity(1);
		color: var(--secondary-color);
	}

	nav li.active a {
		color: var(--accent-color);
	}

	.icon {
		font-size: 2rem;
	}

	nav .logo-text {
		color: var(--accent-color);
		font-size: 2rem;
	}

	.li-logo {
		display: none;
	}

	@media only screen and (max-width: 600px) {
	}
	@media only screen and (min-width: 600px) {
	}
</style>
