<script lang="ts">
	import { onMount } from 'svelte';
	import {
		getAuth,
		GoogleAuthProvider,
		onAuthStateChanged,
		signInWithPopup,
		signOut,
		type Auth,
		type User
	} from 'firebase/auth';
	import { app } from '$lib/firebase'; // Adjust the import if necessary

	let auth: Auth;
	let provider: GoogleAuthProvider;
	let user: User | null;

	onMount(() => {
		auth = getAuth(app);
		provider = new GoogleAuthProvider();
		onAuthStateChanged(auth, (newUser) => {
			user = newUser;
		});
	});

	const signInWithGoogle = async () => {
		try {
			const result = await signInWithPopup(auth, provider);
			console.log('User signed in: ', result.user);
		} catch (error) {
			console.error('Error signing in: ', error);
		}
	};

	const logOut = async () => {
		const result = await signOut(auth);
	};

	export let showModal: boolean;
	const closeModal = () => (showModal = false);
</script>

<dialog open={showModal}>
	<article>
		{#if user}
			<h2>Log In</h2>
			<button on:click={signInWithGoogle}>Sign in with Google</button>
			<footer>
				<button on:click={closeModal} class="secondary"> Cancel </button>
			</footer>
		{:else}
			<h2>Log Out</h2>
			<button on:click={logOut}> Log Out </button>
			<footer>
				<button on:click={closeModal} class="secondary"> Cancel </button>
			</footer>
		{/if}
	</article>
</dialog>

<!-- <div class:modal-overlay={showModal} on:click={closeModal}>
	<div class="modal-content" on:click|stopPropagation>
		<button on:click={signInWithGoogle}>Sign in with Google</button>
		<button on:click={closeModal}>Close</button>
	</div>
</div> -->

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.modal-content {
		background: white;
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	}
</style>
