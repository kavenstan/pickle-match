<script lang="ts">
	import { onMount } from 'svelte';
	import {
		getAuth,
		GoogleAuthProvider,
		onAuthStateChanged,
		signInWithPopup,
		type Auth
	} from 'firebase/auth';
	import { app } from '$lib/firebase';
	import { showModal } from '$lib/store';
	import { session } from '$lib/user';

	let auth: Auth;
	let provider: GoogleAuthProvider;
	let modal: HTMLDialogElement | null = null;

	$: showModal.subscribe((value) => {
		if (value) {
			modal?.showModal();
		} else {
			modal?.close();
		}
	});

	onMount(() => {
		auth = getAuth(app);
		provider = new GoogleAuthProvider();
		onAuthStateChanged(auth, (newUser) => {
			// console.log('onAuthStateChanged', auth, newUser);
			session.update((curr) => {
				return { ...curr, isLoading: false, user: newUser };
			});
			modal?.close();
		});

		modal?.addEventListener('click', handleDialogClick);
		window.addEventListener('keydown', handleKeyDown);

		return () => {
			modal?.removeEventListener('click', handleDialogClick);
			window.removeEventListener('keydown', handleKeyDown);
		};
	});

	const signInWithGoogle = async () => {
		try {
			const result = await signInWithPopup(auth, provider);
			console.log('User signed in: ', result.user.email);
		} catch (error) {
			console.error('Error signing in: ', error);
		}
	};

	function handleDialogClick(event: MouseEvent) {
		if (event.target === modal) {
			closeModal();
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeModal();
		}
	}

	const closeModal = () => {
		showModal.set(false);
	};
</script>

<dialog bind:this={modal}>
	<article>
		<h2>Log In</h2>
		<button on:click={signInWithGoogle}>Sign in with Google</button>
		<footer>
			<button on:click={closeModal} class="secondary"> Cancel </button>
		</footer>
	</article>
</dialog>

<style>
</style>
