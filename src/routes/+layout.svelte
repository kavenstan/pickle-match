<script>
	import Header from './Header.svelte';
	import Login from './Login.svelte';
	import './styles.css';

	let showModal = false;
	const toggleModal = () => (showModal = !showModal);
</script>

<div class="app">
	<Header {toggleModal} />

	<main>
		<slot />
	</main>
</div>

<Login {showModal} />
