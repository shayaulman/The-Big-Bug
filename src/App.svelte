<script>
	import Switch from './components/Switch.svelte'

	const initBugs = [true, false, true, true, false];	 // true = there is a bug...
	let bugs = [...initBugs], solved, clickCounter = 0;
	let bugChance = 0.35;

	const updateChance = () => bugChance = +document.querySelector('.chance').value / 100;

	const debug = (index) => {
		bugs[index] = !bugs[index]; // <- this was the solution! (because we can't use "bind" we need to manually update the state...)
		if (bugs[index] === true) { return }   // was "bugged" by user
		bugs = bugs.map((bug, i) => bug === false ? bugChance > Math.random() && index !== i : true);
		solved = !bugs.includes(true);
		clickCounter++;	
	}

	const addBug = () => bugs = [...bugs, Math.random() > 0.5 ? true : false];
	const deleteBug = (last) => bugs.length == 2 ? alert("Minimum...") :
		bugs = bugs.filter((bug, i) => i !== last);

	const newGame = () => {
		solved = !solved, clickCounter = 0, bugs = [...initBugs];
	}
</script>

<div class="container">
	<h1 class="m-3 heading" style="color: indigo">Try to debug...</h1>
	<p class="alert alert-info text-center">On each "debugging", there is a
		<span class="chance-input badge badge-light">
			<input class="chance bg-light" type="number" value="35" min="1" max="100" step="1" on:change={ updateChance } autofocus>
		</span> % chance for each one of the <strong>green</strong> sliders to get buggy (red)...
	</p>		
	{#if !solved }
		<div class="justify-content-center align-items-center m-2">
			<button class="btn btn-outline-warning" on:click={ addBug }>+</button>
			<button class="btn btn-outline-warning" on:click={ () => deleteBug(bugs.length-1) }>-</button>
		</div>
		<div class="bugs bg-light flex-column justify-content-between">
			{#each bugs as bug, i}
				<Switch isChecked={bug} on:switched={() => debug(i)} />
			{/each}
		</div>
	{:else}
		<h1 text-success>Hooray 🎉</h1>
		<button class="btn btn-success" on:click={ () => newGame() }>Play Again!</button>
	{/if}
	<p class="m-2"> Times Clicked: <span class="badge badge-danger">{ clickCounter }</span></p>
	<p>Chance: <span class="m-2 badge badge-warning">{ (bugChance * 100).toFixed(0) } %</span></p>
	<p class="alert alert-warning">Built with <a href="https://svelte.dev">Svelte</a> & <a href="https://getbootstrap.com">Bootsrap 4</a> | <a href="https://www.netlify.com/docs/cli/#continuous-deployment">Automatic deployed </a> with <a href="https://www.netlify.com">Netlify</a> | See <a href="https://github.com/shayaulman/The-Big-Bug" target="_blank">the code on GitHub</a></p>
</div>
	
<style>
.container {
	display: flex;
	justify-content: center;
	align-items: center;
	flex-direction: column;
}

input {
	width: 42px;
	height: 18px;
	outline: none;
	border: none;
}

h1 {
	font-family: serif;
}

</style>