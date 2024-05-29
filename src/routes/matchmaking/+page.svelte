<script lang="ts">
	import { session } from '$lib/user';
</script>

<h1>Matchmaking</h1>
<p>Previous Sessions</p>

{#if $session?.user}
	<button>Start Session</button>
	<p>Start New Session, Select Players, Settings, Start</p>
{/if}
