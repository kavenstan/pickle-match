<script lang="ts">
	import { userSession, signInPopUp, signOut } from '$lib/user';
	import 'iconify-icon';
	import Icon from './Icon.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
</script>

<header>
	<div class="nav-inner">
		<a href="/" class="logo-container">
			<div class="logo"><Icon /></div>
			<span class="link-text logo-text">Pickt</span>
		</a>
		<div class="user-actions">
			{#if $userSession?.loggedIn}
				<Avatar on:click={signOut} name={$userSession?.user?.displayName ?? ''} />
			{:else}
				<button on:click={signInPopUp}>Login</button>
			{/if}
			<ThemeToggle />
		</div>
	</div>
</header>

<style>
	header {
		/* background-color: var(--primary-color); */
		border-bottom: 1px solid rgba(32, 38, 50, 0.9);
		backdrop-filter: blur(1rem);
		position: sticky;
		top: 0;
		transition:
			border-top-color 0.4s ease-in-out,
			box-shadow 0.4s ease-in-out;
		z-index: 2;
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

	.user-actions {
		display: flex;
		align-items: center;
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
