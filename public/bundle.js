
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
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function createEventDispatcher() {
        const component = current_component;
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
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
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
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

    /* src/components/Switch.svelte generated by Svelte v3.9.2 */

    const file = "src/components/Switch.svelte";

    function create_fragment(ctx) {
    	var div, label, input, t0, span, t1, h4, t2, t3_value = Math.round(Math.random() * 999) + "", t3, dispose;

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
    			attr(input, "type", "checkbox");
    			input.checked = ctx.isChecked;
    			attr(input, "class", "svelte-zyxhix");
    			add_location(input, file, 8, 4, 230);
    			attr(span, "class", "slider round svelte-zyxhix");
    			add_location(span, file, 9, 4, 323);
    			attr(label, "class", "switch m-2 svelte-zyxhix");
    			add_location(label, file, 7, 2, 199);
    			attr(h4, "class", "text-secondary m-2");
    			add_location(h4, file, 11, 2, 366);
    			attr(div, "class", "bug d-flex justify-content-between p-2 svelte-zyxhix");
    			add_location(div, file, 6, 0, 144);
    			dispose = listen(input, "change", ctx.change_handler);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, label);
    			append(label, input);
    			append(label, t0);
    			append(label, span);
    			append(div, t1);
    			append(div, h4);
    			append(h4, t2);
    			append(h4, t3);
    		},

    		p: function update(changed, ctx) {
    			if (changed.isChecked) {
    				input.checked = ctx.isChecked;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			dispose();
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
        let { isChecked } = $$props;

    	const writable_props = ['isChecked'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Switch> was created with unknown prop '${key}'`);
    	});

    	function change_handler() {
    		return dispatch('switched');
    	}

    	$$self.$set = $$props => {
    		if ('isChecked' in $$props) $$invalidate('isChecked', isChecked = $$props.isChecked);
    	};

    	return { dispatch, isChecked, change_handler };
    }

    class Switch extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["isChecked"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.isChecked === undefined && !('isChecked' in props)) {
    			console.warn("<Switch> was created without expected prop 'isChecked'");
    		}
    	}

    	get isChecked() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isChecked(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.9.2 */

    const file$1 = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.bug = list[i];
    	child_ctx.i = i;
    	return child_ctx;
    }

    // (44:1) {:else}
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
    			add_location(h1, file$1, 44, 2, 1851);
    			attr(button, "class", "btn btn-success");
    			add_location(button, file$1, 45, 2, 1885);
    			dispose = listen(button, "click", ctx.click_handler_1);
    		},

    		m: function mount(target, anchor) {
    			insert(target, h1, anchor);
    			insert(target, t_1, anchor);
    			insert(target, button, anchor);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

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

    // (34:1) {#if !solved }
    function create_if_block(ctx) {
    	var div0, button0, t1, button1, t3, div1, current, dispose;

    	var each_value = ctx.bugs;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

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
    			add_location(button0, file$1, 35, 3, 1490);
    			attr(button1, "class", "btn btn-outline-warning");
    			add_location(button1, file$1, 36, 3, 1564);
    			attr(div0, "class", "justify-content-center align-items-center m-2");
    			add_location(div0, file$1, 34, 2, 1427);
    			attr(div1, "class", "bugs bg-light flex-column justify-content-between");
    			add_location(div1, file$1, 38, 2, 1670);

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

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.bugs) {
    				each_value = ctx.bugs;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div1, null);
    					}
    				}

    				group_outros();
    				for (i = each_value.length; i < each_blocks.length; i += 1) out(i);
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (var i = 0; i < each_value.length; i += 1) transition_in(each_blocks[i]);

    			current = true;
    		},

    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) transition_out(each_blocks[i]);

    			current = false;
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

    // (40:3) {#each bugs as bug, i}
    function create_each_block(ctx) {
    	var current;

    	function switched_handler() {
    		return ctx.switched_handler(ctx);
    	}

    	var switch_1 = new Switch({
    		props: { isChecked: ctx.bug },
    		$$inline: true
    	});
    	switch_1.$on("switched", switched_handler);

    	return {
    		c: function create() {
    			switch_1.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(switch_1, target, anchor);
    			current = true;
    		},

    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;
    			var switch_1_changes = {};
    			if (changed.bugs) switch_1_changes.isChecked = ctx.bug;
    			switch_1.$set(switch_1_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(switch_1.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(switch_1.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(switch_1, detaching);
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	var div, h1, t1, p0, t2, span0, input, t3, strong, t5, t6, current_block_type_index, if_block, t7, p1, t8, span1, t9, t10, p2, t11, span2, t12_value = (ctx.bugChance * 100).toFixed(0) + "", t12, t13, t14, p3, t15, a, t17, current, dispose;

    	var if_block_creators = [
    		create_if_block,
    		create_else_block
    	];

    	var if_blocks = [];

    	function select_block_type(changed, ctx) {
    		if (!ctx.solved) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(null, ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "Try to debug...";
    			t1 = space();
    			p0 = element("p");
    			t2 = text("On each \"debugging\", there is a\n\t\t");
    			span0 = element("span");
    			input = element("input");
    			t3 = text(" % chance for each one of the ");
    			strong = element("strong");
    			strong.textContent = "green";
    			t5 = text(" sliders to get buggy (red)...");
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
    			add_location(h1, file$1, 27, 1, 997);
    			attr(input, "class", "chance bg-light svelte-1eci8f8");
    			attr(input, "type", "number");
    			input.value = "35";
    			attr(input, "min", "1");
    			attr(input, "max", "100");
    			attr(input, "step", "1");
    			input.autofocus = true;
    			add_location(input, file$1, 30, 3, 1188);
    			attr(span0, "class", "chance-input badge badge-light");
    			add_location(span0, file$1, 29, 2, 1139);
    			add_location(strong, file$1, 31, 39, 1348);
    			attr(p0, "class", "alert alert-info text-center");
    			add_location(p0, file$1, 28, 1, 1065);
    			attr(span1, "class", "badge badge-danger");
    			add_location(span1, file$1, 47, 32, 2006);
    			attr(p1, "class", "m-2");
    			add_location(p1, file$1, 47, 1, 1975);
    			attr(span2, "class", "m-2 badge badge-warning");
    			add_location(span2, file$1, 48, 12, 2079);
    			add_location(p2, file$1, 48, 1, 2068);
    			attr(a, "href", "https://github.com/shayaulman/The-Big-Bug");
    			attr(a, "target", "_blank");
    			add_location(a, file$1, 49, 22, 2185);
    			attr(p3, "class", "alert");
    			add_location(p3, file$1, 49, 1, 2164);
    			attr(div, "class", "container svelte-1eci8f8");
    			add_location(div, file$1, 26, 0, 972);
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
    			if_blocks[current_block_type_index].m(div, null);
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
    			current = true;
    			input.focus();
    		},

    		p: function update(changed, ctx) {
    			var previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(changed, ctx);
    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(changed, ctx);
    			} else {
    				group_outros();
    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});
    				check_outros();

    				if_block = if_blocks[current_block_type_index];
    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}
    				transition_in(if_block, 1);
    				if_block.m(div, t7);
    			}

    			if (!current || changed.clickCounter) {
    				set_data(t9, ctx.clickCounter);
    			}

    			if ((!current || changed.bugChance) && t12_value !== (t12_value = (ctx.bugChance * 100).toFixed(0) + "")) {
    				set_data(t12, t12_value);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			if_blocks[current_block_type_index].d();
    			dispose();
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	const initBugs = [true, false, true, true, false];	 // true = there is a bug...
    	let bugs = [...initBugs], solved, clickCounter = 0;
    	let bugChance = 0.35;

    	const updateChance = () => { const $$result = bugChance = +document.querySelector('.chance').value / 100; $$invalidate('bugChance', bugChance); return $$result; };

    	const debug = (index) => {
    		bugs[index] = !bugs[index]; $$invalidate('bugs', bugs); // <- this was the solution! (because we can't use "bind" we need to manually update the state...)
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

    	function switched_handler({ i }) {
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
    		click_handler,
    		switched_handler,
    		click_handler_1
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, []);
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
