<script>
	import { userSession, hasPermission, PERMISSION_SESSION_WRITE, PERMISSION_SYNC } from '$lib/user';
</script>

<h1>Pickt</h1>

<p>Pickleball ratings, results & matchmaking</p>

<ul>
	<li>
		<a href="/ratings"
			><iconify-icon class="icon" icon="ph:user-list" />
			<span>Ratings</span></a
		>
	</li>
	<li>
		<a href="/results"><iconify-icon class="icon" icon="carbon:result" /><span>Results</span></a>
	</li>
	{#if hasPermission($userSession, PERMISSION_SESSION_WRITE)}
		<li>
			<a href="/matchmaking"
				><iconify-icon class="icon" icon="ph:magic-wand" /><span>Matchmaking</span></a
			>
		</li>
	{/if}
	{#if hasPermission($userSession, PERMISSION_SYNC)}
		<li>
			<a href="/sync"
				><iconify-icon class="icon" icon="iconamoon:synchronize-light" /><span>Sync</span></a
			>
		</li>
	{/if}
	<li>
		<a href="/settings"
			><iconify-icon class="icon" icon="iconamoon:settings-light" /><span>Settings</span></a
		>
	</li>
</ul>

<style>
	ul {
		padding: 0;
		margin: 0 auto;
	}
	li {
		list-style: none;
	}

	li a {
		display: flex;
		align-items: center;
		height: 3rem;
		text-decoration: none;
		gap: 0.5rem;
	}
	li a:hover {
		filter: grayscale(0%) opacity(1);
		color: var(--secondary-color);
	}

	.icon {
		font-size: 2rem;
	}

	@media only screen and (max-width: 400px) {
	}
	@media only screen and (max-width: 600px) {
	}
	@media only screen and (min-width: 600px) {
	}
</style>
