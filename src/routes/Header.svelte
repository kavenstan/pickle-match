<script>
	import { page } from '$app/stores';
	export let toggleModal;
</script>

<header>
	<nav>
		<ul>
			<li aria-current={$page.url.pathname === '/' ? 'page' : undefined}>
				<a href="/">Home</a>
			</li>
			<li aria-current={$page.url.pathname === '/ratings' ? 'page' : undefined}>
				<a href="/ratings">Ratings</a>
			</li>
			<li aria-current={$page.url.pathname.startsWith('/matchmaking') ? 'page' : undefined}>
				<a href="/matchmaking">Matchmaking</a>
			</li>
			<li>
				<button on:click={toggleModal}>Login</button>
			</li>
		</ul>
	</nav>
</header>

<style>
</style>
