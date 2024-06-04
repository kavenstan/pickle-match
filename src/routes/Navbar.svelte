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
		<li aria-current={$page.url.pathname === '/ratings' ? 'page' : undefined}>
			<a href="/ratings"
				><iconify-icon class="icon" icon="ph:user-list" />
				<span class="link-text">Ratings</span></a
			>
		</li>
		<li aria-current={$page.url.pathname === '/results' ? 'page' : undefined}>
			<a href="/results"
				><iconify-icon class="icon" icon="carbon:result" />
				<span class="link-text">Results</span></a
			>
		</li>
		{#if hasPermission($userSession, PERMISSION_SESSION_WRITE)}
			<li aria-current={$page.url.pathname.startsWith('/matchmaking') ? 'page' : undefined}>
				<a href="/matchmaking"
					><iconify-icon class="icon" icon="ph:magic-wand" />
					<span class="link-text">Session</span></a
				>
			</li>
		{/if}
		{#if hasPermission($userSession, PERMISSION_UPLOAD)}
			<li aria-current={$page.url.pathname.startsWith('/upload') ? 'page' : undefined}>
				<a href="/upload"
					><iconify-icon class="icon" icon="iconamoon:cloud-upload-light" />
					<span class="link-text">Upload</span></a
				>
			</li>
		{/if}
		<li aria-current={$page.url.pathname.startsWith('/settings') ? 'page' : undefined}>
			<a href="/settings"
				><iconify-icon class="icon" icon="iconamoon:settings-light" />
				<span class="link-text">Settings</span></a
			>
		</li>
	</ul>
</nav>

<style>
	nav {
		position: fixed;
		background-color: var(--primary-color);
		transition: width 600ms ease;
		/* overflow: scroll; */
	}
	nav ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		height: 100%;
	}
	nav li {
		width: 100%;
	}
	nav li a {
		display: flex;
		align-items: center;
		height: 5rem;
		color: var(--secondary-color);
		text-decoration: none;
		/* filter: grayscale(100%) opacity(0.7); */
		transition: var(--transition-speed);
	}
	nav li a:hover {
		filter: grayscale(0%) opacity(1);
		background: var(--bg-secondary);
		color: var(--text-secondary);
	}

	.link-text {
		display: none;
		margin-left: 1rem;
		font-weight: bold;
	}

	.icon {
		/* font-weight: bold; */
		/* text-transform: uppercase; */
		/* background: var(--bg-secondary); */
		/* text-align: center; */
		font-size: 3rem;
	}

	nav .logo-text {
		display: inline;
		position: absolute;
		left: -999px;
		transition: var(--transition-speed);
		color: var(--accent-color);
		font-size: 2rem;
	}

	@media only screen and (max-width: 600px) {
		nav {
			bottom: 0;
			width: 100vw;
			height: 5rem;
		}
		.li-logo {
			display: none;
		}
		nav ul {
			width: 100%;
			flex-direction: row;
		}
		nav a {
			justify-content: center;
		}
	}
	@media only screen and (min-width: 600px) {
		nav {
			top: 0;
			width: 5rem;
			height: 100vh;
		}

		nav li {
			padding: 0 1rem;
			margin-bottom: 1rem;
		}

		nav li:first-child {
			margin-top: 1rem;
		}

		nav li:last-child {
			margin-top: auto;
		}

		nav:hover {
			width: 16rem;
		}

		nav:hover .link-text {
			display: inline;
		}

		nav:hover .logo-text {
			left: 0px;
		}
	}
</style>
