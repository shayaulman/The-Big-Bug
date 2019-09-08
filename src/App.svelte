<script>
	const initBugs = [true, false, true, true, false];	 // true = there is a bug...
	let bugs = [...initBugs], solved, clickCounter = 0;
	let bugChance = 0.35;

	const updateChance = () => bugChance = +document.querySelector('.chance').value / 100;

	const debug = (index) => {
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
			<div class="bug d-flex justify-content-between p-2">
				<label class="switch m-2">
					<input type="checkbox" on:change={ () => debug(i) } bind:checked={ bug }>
					<span class="slider round"></span>
				</label>
				<h4 class="text-secondary m-2">Bug #{ Math.round(Math.random() * 999) }</h4>
			</div>	
		{/each}
	</div>
	{:else}
		<h1 text-success>Hooray 🎉</h1>
		<button class="btn btn-success" on:click={ () => newGame() }>Play Again!</button>
	{/if}
	<p class="m-2"> Times Clicked: <span class="badge badge-danger">{ clickCounter }</span></p>
	<p>Chance: <span class="m-2 badge badge-warning">{ (bugChance * 100).toFixed(0) } %</span></p>
	<p class="alert">See <a href="https://github.com/shayaulman/The-Big-Bug">the code</a>...</p>

</div>
	

<style>
.container {
	display: flex;
	justify-content: center;
	align-items: center;
	flex-direction: column;
}
.bug {
	border: 1px solid white;
	width: 420px
}

input {
	width: 42px;
	height: 18px;
	outline: none;
	border: none;
}

/* source: https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_switch */
/* The switch - the box around the slider */
.switch{position:relative;display:inline-block;width:60px;height:34px;}/*HidedefaultHTMLcheckbox*/.switch input{opacity:0;width:0;height:0;}/*Theslider*/.slider{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background-color:lightgreen;-webkit-transition:.4s;transition:.4s;}.slider:before{position:absolute;content:"";height:26px;width:26px;left:4px;bottom:4px;background-color:white;-webkit-transition:.4s;transition:.4s;}input:checked+.slider{background-color:rgb(250,65,127);}input:focus+.slider{box-shadow:001pxlightgreen;}input:checked+.slider:before{-webkit-transform:translateX(26px);-ms-transform:translateX(26px);transform:translateX(26px);}/*Roundedsliders*/.slider.round{border-radius:34px;}.slider.round:before{border-radius:50%;}
</style>