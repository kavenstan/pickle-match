<script lang="ts">
	import { simulate } from '$lib/rating';
	import { signInPopUp, signOut } from '$lib/user';
	import { userSession } from '$lib/user';

	let theme = 'dark';
	function toggleTheme() {
		theme = theme === 'dark' ? 'light' : 'dark';
		document.documentElement.setAttribute('data-theme', theme);
	}
</script>

<h1>Settings</h1>

<div class="setting-section">
	<h2>Profile</h2>
	{#if $userSession?.loggedIn}
		<div>Signed in as: {$userSession.user?.displayName} ({$userSession.user?.email})</div>
		<div>Role: {$userSession.role}</div>
		<button on:click={signOut}>Sign Out</button>
	{:else}
		<div>
			<button on:click={signInPopUp}>Sign In</button>
		</div>
	{/if}
</div>

<div class="setting-section">
	<h2>UI</h2>
	<button on:click={toggleTheme}>Toggle Theme</button>
</div>

<button on:click={() => simulate()}>Simulate</button>

<style>
	.setting-section {
		margin-bottom: 2rem;
		padding-left: 0.5rem;
		border-left: 2px solid var(--primary-color);
	}
</style>
