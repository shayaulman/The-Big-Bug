<script>
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
    export let isChecked;
</script>

<div class="bug d-flex justify-content-between p-2">
  <label class="switch m-2">
    <input type="checkbox" on:change={ () => dispatch('switched') } checked={ isChecked } />
    <span class="slider round" />
  </label>
  <h4 class="text-secondary m-2">Bug #{Math.round(Math.random() * 999)}</h4>
</div>

<style>
  .bug {
    border: 1px solid white;
    width: 420px;
  }

  /* source: https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_switch */
  /* The switch - the box around the slider */
  .switch {
    position: relative;
    display: inline-block;
    width: 60px;
    height: 34px;
  } /*HidedefaultHTMLcheckbox*/
  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  } /*Theslider*/
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: lightgreen;
    -webkit-transition: 0.4s;
    transition: 0.4s;
  }
  .slider:before {
    position: absolute;
    content: "";
    height: 26px;
    width: 26px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    -webkit-transition: 0.4s;
    transition: 0.4s;
  }
  input:checked + .slider {
    background-color: rgb(250, 65, 127);
  }
  input:focus + .slider {
    box-shadow: 001pxlightgreen;
  }
  input:checked + .slider:before {
    -webkit-transform: translateX(26px);
    -ms-transform: translateX(26px);
    transform: translateX(26px);
  } /*Roundedsliders*/
  .slider.round {
    border-radius: 34px;
  }
  .slider.round:before {
    border-radius: 50%;
  }
</style>
