<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Login from './Login.svelte';
	import { showModal } from '$lib/store';
	import { session } from '$lib/user';
	import { getAuth, signOut, type Auth } from 'firebase/auth';
	import { app } from '$lib/firebase';

	let auth: Auth;

	onMount(() => {
		auth = getAuth(app);
	});

	const openModal = () => {
		showModal.set(true);
	};

	const logOut = async () => {
		const result = await signOut(auth);
		session.update((curr) => {
			return { ...curr, isLoading: false, user: null };
		});
	};

	let theme = 'dark';
	function toggleTheme() {
		theme = theme === 'dark' ? 'light' : 'dark';
		document.documentElement.setAttribute('data-theme', theme);
	}
</script>

<header>
	<nav>
		<a href="/">[Logo?] MatchPickle</a>
		<ul>
			<li aria-current={$page.url.pathname === '/ratings' ? 'page' : undefined}>
				<a href="/ratings">Ratings</a>
			</li>
			<li aria-current={$page.url.pathname.startsWith('/matchmaking') ? 'page' : undefined}>
				<a href="/matchmaking">Matchmaking</a>
			</li>
			{#if $session?.user}
				<li aria-current={$page.url.pathname.startsWith('/upload') ? 'page' : undefined}>
					<a href="/upload">Upload</a>
				</li>
				<li>
					<button on:click={logOut}>Sign Out</button>
				</li>
			{:else}
				<li>
					<button on:click={openModal}>Sign In</button>
				</li>
			{/if}
		</ul>
	</nav>
</header>

<Login />

<style>
	header {
		background-color: var(--primary-color);
	}
	nav {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1rem;
		display: flex;
		justify-content: space-between;
	}
	nav a {
		place-content: center;
	}
</style>
