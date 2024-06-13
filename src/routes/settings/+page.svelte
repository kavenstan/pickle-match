<script lang="ts">
	import { signInPopUp, signOut } from '$lib/user';
	import { userSession } from '$lib/user';
</script>

<h1>Settings</h1>

<div class="setting-section">
	<h2>Profile</h2>
	{#if $userSession?.user}
		<div>Name: {$userSession.user?.displayName}</div>
		<div>Email: {$userSession.user?.email}</div>
		<div>Role: {$userSession.role}</div>
		<br />
		<button on:click={signOut}>Sign Out</button>
	{:else}
		<div>
			<button on:click={signInPopUp}>Sign In</button>
		</div>
	{/if}
</div>

<style>
	.setting-section {
		margin-bottom: 2rem;
		padding-left: 0.5rem;
		border-left: 2px solid var(--primary-color);
	}
</style>
