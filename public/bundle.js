
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/App.svelte generated by Svelte v3.9.2 */

    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.bug = list[i];
    	child_ctx.each_value = list;
    	child_ctx.i = i;
    	return child_ctx;
    }

    // (47:1) {:else}
    function create_else_block(ctx) {
    	var h1, t_1, button, dispose;

    	return {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Hooray 🎉";
    			t_1 = space();
    			button = element("button");
    			button.textContent = "Play Again!";
    			attr(h1, "text-success", "");
    			add_location(h1, file, 47, 2, 1924);
    			attr(button, "class", "btn btn-success");
    			add_location(button, file, 48, 2, 1958);
    			dispose = listen(button, "click", ctx.click_handler_1);
    		},

    		m: function mount(target, anchor) {
    			insert(target, h1, anchor);
    			insert(target, t_1, anchor);
    			insert(target, button, anchor);
    		},

    		p: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(h1);
    				detach(t_1);
    				detach(button);
    			}

    			dispose();
    		}
    	};
    }

    // (31:1) {#if !solved }
    function create_if_block(ctx) {
    	var div0, button0, t1, button1, t3, div1, dispose;

    	var each_value = ctx.bugs;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "+";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "-";
    			t3 = space();
    			div1 = element("div");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			attr(button0, "class", "btn btn-outline-warning");
    			add_location(button0, file, 32, 3, 1316);
    			attr(button1, "class", "btn btn-outline-warning");
    			add_location(button1, file, 33, 3, 1390);
    			attr(div0, "class", "justify-content-center align-items-center m-2");
    			add_location(div0, file, 31, 2, 1253);
    			attr(div1, "class", "bugs bg-light flex-column justify-content-between");
    			add_location(div1, file, 35, 1, 1495);

    			dispose = [
    				listen(button0, "click", ctx.addBug),
    				listen(button1, "click", ctx.click_handler)
    			];
    		},

    		m: function mount(target, anchor) {
    			insert(target, div0, anchor);
    			append(div0, button0);
    			append(div0, t1);
    			append(div0, button1);
    			insert(target, t3, anchor);
    			insert(target, div1, anchor);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}
    		},

    		p: function update(changed, ctx) {
    			if (changed.Math || changed.bugs) {
    				each_value = ctx.bugs;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div0);
    				detach(t3);
    				detach(div1);
    			}

    			destroy_each(each_blocks, detaching);

    			run_all(dispose);
    		}
    	};
    }

    // (37:2) {#each bugs as bug, i}
    function create_each_block(ctx) {
    	var div, label, input, t0, span, t1, h4, t2, t3_value = ctx.Math.round(ctx.Math.random() * 999) + "", t3, t4, dispose;

    	function input_change_handler() {
    		ctx.input_change_handler.call(input, ctx);
    	}

    	function change_handler() {
    		return ctx.change_handler(ctx);
    	}

    	return {
    		c: function create() {
    			div = element("div");
    			label = element("label");
    			input = element("input");
    			t0 = space();
    			span = element("span");
    			t1 = space();
    			h4 = element("h4");
    			t2 = text("Bug #");
    			t3 = text(t3_value);
    			t4 = space();
    			attr(input, "type", "checkbox");
    			attr(input, "class", "svelte-18162yz");
    			add_location(input, file, 39, 5, 1676);
    			attr(span, "class", "slider round svelte-18162yz");
    			add_location(span, file, 40, 5, 1755);
    			attr(label, "class", "switch m-2 svelte-18162yz");
    			add_location(label, file, 38, 4, 1644);
    			attr(h4, "class", "text-secondary m-2");
    			add_location(h4, file, 42, 4, 1807);
    			attr(div, "class", "bug d-flex justify-content-between p-2 svelte-18162yz");
    			add_location(div, file, 37, 3, 1587);

    			dispose = [
    				listen(input, "change", input_change_handler),
    				listen(input, "change", change_handler)
    			];
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, label);
    			append(label, input);

    			input.checked = ctx.bug;

    			append(label, t0);
    			append(label, span);
    			append(div, t1);
    			append(div, h4);
    			append(h4, t2);
    			append(h4, t3);
    			append(div, t4);
    		},

    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;
    			if (changed.bugs) input.checked = ctx.bug;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			run_all(dispose);
    		}
    	};
    }

    function create_fragment(ctx) {
    	var div, h1, t1, p0, t2, span0, input, t3, strong, t5, t6, t7, p1, t8, span1, t9, t10, p2, t11, span2, t12_value = (ctx.bugChance * 100).toFixed(0) + "", t12, t13, t14, p3, t15, a, t17, dispose;

    	function select_block_type(changed, ctx) {
    		if (!ctx.solved) return create_if_block;
    		return create_else_block;
    	}

    	var current_block_type = select_block_type(null, ctx);
    	var if_block = current_block_type(ctx);

    	return {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "Try to debug...";
    			t1 = space();
    			p0 = element("p");
    			t2 = text("On each \"debugging\" there is a\n\t\t");
    			span0 = element("span");
    			input = element("input");
    			t3 = text(" % chance for each one of the debugged ");
    			strong = element("strong");
    			strong.textContent = "(green)";
    			t5 = text(" sliders to get buggy...");
    			t6 = space();
    			if_block.c();
    			t7 = space();
    			p1 = element("p");
    			t8 = text("Times Clicked: ");
    			span1 = element("span");
    			t9 = text(ctx.clickCounter);
    			t10 = space();
    			p2 = element("p");
    			t11 = text("Chance: ");
    			span2 = element("span");
    			t12 = text(t12_value);
    			t13 = text(" %");
    			t14 = space();
    			p3 = element("p");
    			t15 = text("See ");
    			a = element("a");
    			a.textContent = "the code";
    			t17 = text("...");
    			attr(h1, "class", "m-3 heading");
    			set_style(h1, "color", "indigo");
    			add_location(h1, file, 24, 2, 819);
    			attr(input, "class", "chance bg-light svelte-18162yz");
    			attr(input, "type", "number");
    			input.value = "25";
    			attr(input, "min", "1");
    			attr(input, "max", "100");
    			attr(input, "step", "1");
    			input.autofocus = true;
    			add_location(input, file, 27, 3, 1009);
    			attr(span0, "class", "chance-input badge badge-light");
    			add_location(span0, file, 26, 2, 960);
    			add_location(strong, file, 28, 48, 1178);
    			attr(p0, "class", "alert alert-info text-center");
    			add_location(p0, file, 25, 1, 887);
    			attr(span1, "class", "badge badge-danger");
    			add_location(span1, file, 50, 32, 2079);
    			attr(p1, "class", "m-2");
    			add_location(p1, file, 50, 1, 2048);
    			attr(span2, "class", "m-2 badge badge-warning");
    			add_location(span2, file, 51, 12, 2152);
    			add_location(p2, file, 51, 1, 2141);
    			attr(a, "href", "https://github.com/shayaulman/The-Big-Bug");
    			add_location(a, file, 52, 22, 2258);
    			attr(p3, "class", "alert");
    			add_location(p3, file, 52, 1, 2237);
    			attr(div, "class", "container svelte-18162yz");
    			add_location(div, file, 23, 0, 793);
    			dispose = listen(input, "change", ctx.updateChance);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, h1);
    			append(div, t1);
    			append(div, p0);
    			append(p0, t2);
    			append(p0, span0);
    			append(span0, input);
    			append(p0, t3);
    			append(p0, strong);
    			append(p0, t5);
    			append(div, t6);
    			if_block.m(div, null);
    			append(div, t7);
    			append(div, p1);
    			append(p1, t8);
    			append(p1, span1);
    			append(span1, t9);
    			append(div, t10);
    			append(div, p2);
    			append(p2, t11);
    			append(p2, span2);
    			append(span2, t12);
    			append(span2, t13);
    			append(div, t14);
    			append(div, p3);
    			append(p3, t15);
    			append(p3, a);
    			append(p3, t17);
    			input.focus();
    		},

    		p: function update(changed, ctx) {
    			if (current_block_type === (current_block_type = select_block_type(changed, ctx)) && if_block) {
    				if_block.p(changed, ctx);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);
    				if (if_block) {
    					if_block.c();
    					if_block.m(div, t7);
    				}
    			}

    			if (changed.clickCounter) {
    				set_data(t9, ctx.clickCounter);
    			}

    			if ((changed.bugChance) && t12_value !== (t12_value = (ctx.bugChance * 100).toFixed(0) + "")) {
    				set_data(t12, t12_value);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			if_block.d();
    			dispose();
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	const initBugs = [true, false, true, true, false];	 // true = there is a bug...
    	let bugs = [...initBugs], solved, clickCounter = 0;
    	let bugChance = 0.25;

    	const updateChance = () => { const $$result = bugChance = +document.querySelector('.chance').value / 100; $$invalidate('bugChance', bugChance); return $$result; };

    	const debug = (index) => {
    		if (bugs[index] === true) { return }   // was "bugged" by user
    		$$invalidate('bugs', bugs = bugs.map((bug, i) => bug === false ? bugChance > Math.random() && index !== i : true));
    		$$invalidate('solved', solved = !bugs.includes(true));
    		clickCounter++; $$invalidate('clickCounter', clickCounter);	
    	};

    	const addBug = () => { const $$result = bugs = [...bugs, Math.random() > 0.5 ? true : false]; $$invalidate('bugs', bugs); return $$result; };
    	const deleteBug = (last) => { const $$result = bugs.length == 2 ? alert("Minimum...") :
    		bugs = bugs.filter((bug, i) => i !== last); $$invalidate('bugs', bugs); return $$result; };

    	const newGame = () => {
    		solved = !solved, clickCounter = 0, bugs = [...initBugs]; $$invalidate('solved', solved); $$invalidate('clickCounter', clickCounter); $$invalidate('bugs', bugs);
    	};

    	function click_handler() {
    		return deleteBug(bugs.length-1);
    	}

    	function input_change_handler({ bug, each_value, i }) {
    		each_value[i] = this.checked;
    		$$invalidate('bugs', bugs);
    	}

    	function change_handler({ i }) {
    		return debug(i);
    	}

    	function click_handler_1() {
    		return newGame();
    	}

    	return {
    		bugs,
    		solved,
    		clickCounter,
    		bugChance,
    		updateChance,
    		debug,
    		addBug,
    		deleteBug,
    		newGame,
    		Math,
    		click_handler,
    		input_change_handler,
    		change_handler,
    		click_handler_1
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, []);
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
