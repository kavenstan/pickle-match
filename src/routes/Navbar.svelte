<script lang="ts">
	import { userSession, signInPopUp, signOut } from '$lib/user';
	import 'iconify-icon';
	import Icon from '../lib/components/Icon.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import { afterUpdate, onMount } from 'svelte';

	export let toggleSidebar;
	export let showSidebar;

	let dialog: HTMLDialogElement;

	const toggleDialog = () => {
		if (dialog.open) {
			dialog.close();
		} else {
			dialog.showModal();
		}
	};

	const closeDialog = () => {
		dialog?.close();
	};

	const handleSignOut = async () => {
		closeDialog();
		await signOut();
	};

	onMount(() => {
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape' && dialog?.open) {
				closeDialog();
			}
		});
	});

	afterUpdate(() => {
		dialog?.addEventListener('click', (e) => {
			if (e.target === dialog) {
				closeDialog();
			}
		});
	});
</script>

<header>
	<div class="nav-inner">
		<a href="/" class="logo-container">
			<div class="logo"><Icon /></div>
			<span class="link-text logo-text">Pickt</span>
		</a>
		<button on:click={toggleSidebar} class="menu-icon" class:open={showSidebar}
			><iconify-icon icon="carbon:menu" /></button
		>
		<div class="user-actions">
			<ThemeToggle />
			{#if !$userSession || $userSession?.loading}
				<div>...</div>
			{:else if $userSession?.user}
				<div class="user">
					<Avatar name={$userSession?.user?.displayName ?? ''} on:click={toggleDialog} />
					<dialog bind:this={dialog} class="user-menu">
						<button on:click={async () => handleSignOut()}>Sign Out</button>
					</dialog>
				</div>
			{:else}
				<button on:click={async () => signInPopUp()}>Login</button>
			{/if}
		</div>
	</div>
</header>

<style>
	header {
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

	dialog.user-menu {
		position: fixed;
		inset: 0 0 0 auto;
		height: 100vh;
		width: 10rem;
		min-width: unset;

		padding: 0.5rem;
		margin: 0;

		background-color: black;
		border: 1px solid #383838;

		border-radius: 1rem;
		border-bottom-right-radius: 0;
		border-top-right-radius: 0;
	}

	.menu-icon {
		display: none;
		color: var(--accent-color);
		font-size: 2rem;
		height: 3rem;
		background: none;
		border: 0;
		transition: ease 300ms;
	}
	.menu-icon:focus {
		box-shadow: none;
	}
	.menu-icon.open {
		transform: rotate(90deg);
	}
	.drop-menu {
		transition: ease 300ms;
	}

	@media only screen and (max-width: 400px) {
		.logo {
			display: none;
		}
	}
	@media only screen and (max-width: 576px) {
		.logo-text {
			display: none;
		}
	}
	@media only screen and (max-width: 768px) {
		.logo-container {
			display: none;
		}
		.menu-icon {
			display: block;
		}
	}
</style>
