
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
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
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
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
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function setContext$1(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
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
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
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

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
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
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
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
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics$1 = function(d, b) {
        extendStatics$1 = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics$1(d, b);
    };

    function __extends$1(d, b) {
        extendStatics$1(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var __assign$2 = function() {
        __assign$2 = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign$2.apply(this, arguments);
    };

    function __rest(s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    }

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    function __generator(thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    }

    function __spreadArrays() {
        for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
        for (var r = Array(s), k = 0, i = 0; i < il; i++)
            for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                r[k] = a[j];
        return r;
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var __assign$1 = function() {
        __assign$1 = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign$1.apply(this, arguments);
    };

    var genericMessage = "Invariant Violation";
    var _a$3 = Object.setPrototypeOf, setPrototypeOf = _a$3 === void 0 ? function (obj, proto) {
        obj.__proto__ = proto;
        return obj;
    } : _a$3;
    var InvariantError = /** @class */ (function (_super) {
        __extends(InvariantError, _super);
        function InvariantError(message) {
            if (message === void 0) { message = genericMessage; }
            var _this = _super.call(this, typeof message === "number"
                ? genericMessage + ": " + message + " (see https://github.com/apollographql/invariant-packages)"
                : message) || this;
            _this.framesToPop = 1;
            _this.name = genericMessage;
            setPrototypeOf(_this, InvariantError.prototype);
            return _this;
        }
        return InvariantError;
    }(Error));
    function invariant$1(condition, message) {
        if (!condition) {
            throw new InvariantError(message);
        }
    }
    var verbosityLevels = ["log", "warn", "error", "silent"];
    var verbosityLevel = verbosityLevels.indexOf("log");
    function wrapConsoleMethod(method) {
        return function () {
            if (verbosityLevels.indexOf(method) >= verbosityLevel) {
                return console[method].apply(console, arguments);
            }
        };
    }
    (function (invariant) {
        invariant.log = wrapConsoleMethod("log");
        invariant.warn = wrapConsoleMethod("warn");
        invariant.error = wrapConsoleMethod("error");
    })(invariant$1 || (invariant$1 = {}));
    // Code that uses ts-invariant with rollup-plugin-invariant may want to
    // import this process stub to avoid errors evaluating "development".
    // However, because most ESM-to-CJS compilers will rewrite the process import
    // as tsInvariant.process, which prevents proper replacement by minifiers, we
    // also export processStub, so you can import { invariant, processStub } from
    // "ts-invariant" and assign processStub to a local variable named process.
    (typeof process === "object" &&
        typeof process.env === "object") ? process : { env: {} };

    function _typeof$2(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof$2 = function _typeof(obj) { return typeof obj; }; } else { _typeof$2 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof$2(obj); }

    /**
     * Return true if `value` is object-like. A value is object-like if it's not
     * `null` and has a `typeof` result of "object".
     */
    function isObjectLike(value) {
      return _typeof$2(value) == 'object' && value !== null;
    }

    // In ES2015 (or a polyfilled) environment, this will be Symbol.iterator

    var SYMBOL_TO_STRING_TAG = typeof Symbol === 'function' && Symbol.toStringTag != null ? Symbol.toStringTag : '@@toStringTag';

    /**
     * Represents a location in a Source.
     */

    /**
     * Takes a Source and a UTF-8 character offset, and returns the corresponding
     * line and column as a SourceLocation.
     */
    function getLocation$1(source, position) {
      var lineRegexp = /\r\n|[\n\r]/g;
      var line = 1;
      var column = position + 1;
      var match;

      while ((match = lineRegexp.exec(source.body)) && match.index < position) {
        line += 1;
        column = position + 1 - (match.index + match[0].length);
      }

      return {
        line: line,
        column: column
      };
    }

    /**
     * Render a helpful description of the location in the GraphQL Source document.
     */

    function printLocation(location) {
      return printSourceLocation(location.source, getLocation$1(location.source, location.start));
    }
    /**
     * Render a helpful description of the location in the GraphQL Source document.
     */

    function printSourceLocation(source, sourceLocation) {
      var firstLineColumnOffset = source.locationOffset.column - 1;
      var body = whitespace(firstLineColumnOffset) + source.body;
      var lineIndex = sourceLocation.line - 1;
      var lineOffset = source.locationOffset.line - 1;
      var lineNum = sourceLocation.line + lineOffset;
      var columnOffset = sourceLocation.line === 1 ? firstLineColumnOffset : 0;
      var columnNum = sourceLocation.column + columnOffset;
      var locationStr = "".concat(source.name, ":").concat(lineNum, ":").concat(columnNum, "\n");
      var lines = body.split(/\r\n|[\n\r]/g);
      var locationLine = lines[lineIndex]; // Special case for minified documents

      if (locationLine.length > 120) {
        var subLineIndex = Math.floor(columnNum / 80);
        var subLineColumnNum = columnNum % 80;
        var subLines = [];

        for (var i = 0; i < locationLine.length; i += 80) {
          subLines.push(locationLine.slice(i, i + 80));
        }

        return locationStr + printPrefixedLines([["".concat(lineNum), subLines[0]]].concat(subLines.slice(1, subLineIndex + 1).map(function (subLine) {
          return ['', subLine];
        }), [[' ', whitespace(subLineColumnNum - 1) + '^'], ['', subLines[subLineIndex + 1]]]));
      }

      return locationStr + printPrefixedLines([// Lines specified like this: ["prefix", "string"],
      ["".concat(lineNum - 1), lines[lineIndex - 1]], ["".concat(lineNum), locationLine], ['', whitespace(columnNum - 1) + '^'], ["".concat(lineNum + 1), lines[lineIndex + 1]]]);
    }

    function printPrefixedLines(lines) {
      var existingLines = lines.filter(function (_ref) {
        _ref[0];
            var line = _ref[1];
        return line !== undefined;
      });
      var padLen = Math.max.apply(Math, existingLines.map(function (_ref2) {
        var prefix = _ref2[0];
        return prefix.length;
      }));
      return existingLines.map(function (_ref3) {
        var prefix = _ref3[0],
            line = _ref3[1];
        return leftPad(padLen, prefix) + (line ? ' | ' + line : ' |');
      }).join('\n');
    }

    function whitespace(len) {
      return Array(len + 1).join(' ');
    }

    function leftPad(len, str) {
      return whitespace(len - str.length) + str;
    }

    function _typeof$1(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof$1 = function _typeof(obj) { return typeof obj; }; } else { _typeof$1 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof$1(obj); }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _defineProperties$1(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

    function _createClass$1(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties$1(Constructor.prototype, protoProps); if (staticProps) _defineProperties$1(Constructor, staticProps); return Constructor; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

    function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

    function _possibleConstructorReturn(self, call) { if (call && (_typeof$1(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

    function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

    function _wrapNativeSuper(Class) { var _cache = typeof Map === "function" ? new Map() : undefined; _wrapNativeSuper = function _wrapNativeSuper(Class) { if (Class === null || !_isNativeFunction(Class)) return Class; if (typeof Class !== "function") { throw new TypeError("Super expression must either be null or a function"); } if (typeof _cache !== "undefined") { if (_cache.has(Class)) return _cache.get(Class); _cache.set(Class, Wrapper); } function Wrapper() { return _construct(Class, arguments, _getPrototypeOf(this).constructor); } Wrapper.prototype = Object.create(Class.prototype, { constructor: { value: Wrapper, enumerable: false, writable: true, configurable: true } }); return _setPrototypeOf(Wrapper, Class); }; return _wrapNativeSuper(Class); }

    function _construct(Parent, args, Class) { if (_isNativeReflectConstruct()) { _construct = Reflect.construct; } else { _construct = function _construct(Parent, args, Class) { var a = [null]; a.push.apply(a, args); var Constructor = Function.bind.apply(Parent, a); var instance = new Constructor(); if (Class) _setPrototypeOf(instance, Class.prototype); return instance; }; } return _construct.apply(null, arguments); }

    function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

    function _isNativeFunction(fn) { return Function.toString.call(fn).indexOf("[native code]") !== -1; }

    function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

    function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }
    /**
     * A GraphQLError describes an Error found during the parse, validate, or
     * execute phases of performing a GraphQL operation. In addition to a message
     * and stack trace, it also includes information about the locations in a
     * GraphQL document and/or execution result that correspond to the Error.
     */

    var GraphQLError = /*#__PURE__*/function (_Error) {
      _inherits(GraphQLError, _Error);

      var _super = _createSuper(GraphQLError);

      /**
       * A message describing the Error for debugging purposes.
       *
       * Enumerable, and appears in the result of JSON.stringify().
       *
       * Note: should be treated as readonly, despite invariant usage.
       */

      /**
       * An array of { line, column } locations within the source GraphQL document
       * which correspond to this error.
       *
       * Errors during validation often contain multiple locations, for example to
       * point out two things with the same name. Errors during execution include a
       * single location, the field which produced the error.
       *
       * Enumerable, and appears in the result of JSON.stringify().
       */

      /**
       * An array describing the JSON-path into the execution response which
       * corresponds to this error. Only included for errors during execution.
       *
       * Enumerable, and appears in the result of JSON.stringify().
       */

      /**
       * An array of GraphQL AST Nodes corresponding to this error.
       */

      /**
       * The source GraphQL document for the first location of this error.
       *
       * Note that if this Error represents more than one node, the source may not
       * represent nodes after the first node.
       */

      /**
       * An array of character offsets within the source GraphQL document
       * which correspond to this error.
       */

      /**
       * The original error thrown from a field resolver during execution.
       */

      /**
       * Extension fields to add to the formatted error.
       */
      function GraphQLError(message, nodes, source, positions, path, originalError, extensions) {
        var _locations2, _source2, _positions2, _extensions2;

        var _this;

        _classCallCheck(this, GraphQLError);

        _this = _super.call(this, message); // Compute list of blame nodes.

        var _nodes = Array.isArray(nodes) ? nodes.length !== 0 ? nodes : undefined : nodes ? [nodes] : undefined; // Compute locations in the source for the given nodes/positions.


        var _source = source;

        if (!_source && _nodes) {
          var _nodes$0$loc;

          _source = (_nodes$0$loc = _nodes[0].loc) === null || _nodes$0$loc === void 0 ? void 0 : _nodes$0$loc.source;
        }

        var _positions = positions;

        if (!_positions && _nodes) {
          _positions = _nodes.reduce(function (list, node) {
            if (node.loc) {
              list.push(node.loc.start);
            }

            return list;
          }, []);
        }

        if (_positions && _positions.length === 0) {
          _positions = undefined;
        }

        var _locations;

        if (positions && source) {
          _locations = positions.map(function (pos) {
            return getLocation$1(source, pos);
          });
        } else if (_nodes) {
          _locations = _nodes.reduce(function (list, node) {
            if (node.loc) {
              list.push(getLocation$1(node.loc.source, node.loc.start));
            }

            return list;
          }, []);
        }

        var _extensions = extensions;

        if (_extensions == null && originalError != null) {
          var originalExtensions = originalError.extensions;

          if (isObjectLike(originalExtensions)) {
            _extensions = originalExtensions;
          }
        }

        Object.defineProperties(_assertThisInitialized(_this), {
          name: {
            value: 'GraphQLError'
          },
          message: {
            value: message,
            // By being enumerable, JSON.stringify will include `message` in the
            // resulting output. This ensures that the simplest possible GraphQL
            // service adheres to the spec.
            enumerable: true,
            writable: true
          },
          locations: {
            // Coercing falsy values to undefined ensures they will not be included
            // in JSON.stringify() when not provided.
            value: (_locations2 = _locations) !== null && _locations2 !== void 0 ? _locations2 : undefined,
            // By being enumerable, JSON.stringify will include `locations` in the
            // resulting output. This ensures that the simplest possible GraphQL
            // service adheres to the spec.
            enumerable: _locations != null
          },
          path: {
            // Coercing falsy values to undefined ensures they will not be included
            // in JSON.stringify() when not provided.
            value: path !== null && path !== void 0 ? path : undefined,
            // By being enumerable, JSON.stringify will include `path` in the
            // resulting output. This ensures that the simplest possible GraphQL
            // service adheres to the spec.
            enumerable: path != null
          },
          nodes: {
            value: _nodes !== null && _nodes !== void 0 ? _nodes : undefined
          },
          source: {
            value: (_source2 = _source) !== null && _source2 !== void 0 ? _source2 : undefined
          },
          positions: {
            value: (_positions2 = _positions) !== null && _positions2 !== void 0 ? _positions2 : undefined
          },
          originalError: {
            value: originalError
          },
          extensions: {
            // Coercing falsy values to undefined ensures they will not be included
            // in JSON.stringify() when not provided.
            value: (_extensions2 = _extensions) !== null && _extensions2 !== void 0 ? _extensions2 : undefined,
            // By being enumerable, JSON.stringify will include `path` in the
            // resulting output. This ensures that the simplest possible GraphQL
            // service adheres to the spec.
            enumerable: _extensions != null
          }
        }); // Include (non-enumerable) stack trace.

        if (originalError !== null && originalError !== void 0 && originalError.stack) {
          Object.defineProperty(_assertThisInitialized(_this), 'stack', {
            value: originalError.stack,
            writable: true,
            configurable: true
          });
          return _possibleConstructorReturn(_this);
        } // istanbul ignore next (See: 'https://github.com/graphql/graphql-js/issues/2317')


        if (Error.captureStackTrace) {
          Error.captureStackTrace(_assertThisInitialized(_this), GraphQLError);
        } else {
          Object.defineProperty(_assertThisInitialized(_this), 'stack', {
            value: Error().stack,
            writable: true,
            configurable: true
          });
        }

        return _this;
      }

      _createClass$1(GraphQLError, [{
        key: "toString",
        value: function toString() {
          return printError(this);
        } // FIXME: workaround to not break chai comparisons, should be remove in v16
        // $FlowFixMe[unsupported-syntax] Flow doesn't support computed properties yet

      }, {
        key: SYMBOL_TO_STRING_TAG,
        get: function get() {
          return 'Object';
        }
      }]);

      return GraphQLError;
    }( /*#__PURE__*/_wrapNativeSuper(Error));
    /**
     * Prints a GraphQLError to a string, representing useful location information
     * about the error's position in the source.
     */

    function printError(error) {
      var output = error.message;

      if (error.nodes) {
        for (var _i2 = 0, _error$nodes2 = error.nodes; _i2 < _error$nodes2.length; _i2++) {
          var node = _error$nodes2[_i2];

          if (node.loc) {
            output += '\n\n' + printLocation(node.loc);
          }
        }
      } else if (error.source && error.locations) {
        for (var _i4 = 0, _error$locations2 = error.locations; _i4 < _error$locations2.length; _i4++) {
          var location = _error$locations2[_i4];
          output += '\n\n' + printSourceLocation(error.source, location);
        }
      }

      return output;
    }

    /**
     * Produces a GraphQLError representing a syntax error, containing useful
     * descriptive information about the syntax error's position in the source.
     */

    function syntaxError(source, position, description) {
      return new GraphQLError("Syntax Error: ".concat(description), undefined, source, [position]);
    }

    /**
     * The set of allowed kind values for AST nodes.
     */
    var Kind = Object.freeze({
      // Name
      NAME: 'Name',
      // Document
      DOCUMENT: 'Document',
      OPERATION_DEFINITION: 'OperationDefinition',
      VARIABLE_DEFINITION: 'VariableDefinition',
      SELECTION_SET: 'SelectionSet',
      FIELD: 'Field',
      ARGUMENT: 'Argument',
      // Fragments
      FRAGMENT_SPREAD: 'FragmentSpread',
      INLINE_FRAGMENT: 'InlineFragment',
      FRAGMENT_DEFINITION: 'FragmentDefinition',
      // Values
      VARIABLE: 'Variable',
      INT: 'IntValue',
      FLOAT: 'FloatValue',
      STRING: 'StringValue',
      BOOLEAN: 'BooleanValue',
      NULL: 'NullValue',
      ENUM: 'EnumValue',
      LIST: 'ListValue',
      OBJECT: 'ObjectValue',
      OBJECT_FIELD: 'ObjectField',
      // Directives
      DIRECTIVE: 'Directive',
      // Types
      NAMED_TYPE: 'NamedType',
      LIST_TYPE: 'ListType',
      NON_NULL_TYPE: 'NonNullType',
      // Type System Definitions
      SCHEMA_DEFINITION: 'SchemaDefinition',
      OPERATION_TYPE_DEFINITION: 'OperationTypeDefinition',
      // Type Definitions
      SCALAR_TYPE_DEFINITION: 'ScalarTypeDefinition',
      OBJECT_TYPE_DEFINITION: 'ObjectTypeDefinition',
      FIELD_DEFINITION: 'FieldDefinition',
      INPUT_VALUE_DEFINITION: 'InputValueDefinition',
      INTERFACE_TYPE_DEFINITION: 'InterfaceTypeDefinition',
      UNION_TYPE_DEFINITION: 'UnionTypeDefinition',
      ENUM_TYPE_DEFINITION: 'EnumTypeDefinition',
      ENUM_VALUE_DEFINITION: 'EnumValueDefinition',
      INPUT_OBJECT_TYPE_DEFINITION: 'InputObjectTypeDefinition',
      // Directive Definitions
      DIRECTIVE_DEFINITION: 'DirectiveDefinition',
      // Type System Extensions
      SCHEMA_EXTENSION: 'SchemaExtension',
      // Type Extensions
      SCALAR_TYPE_EXTENSION: 'ScalarTypeExtension',
      OBJECT_TYPE_EXTENSION: 'ObjectTypeExtension',
      INTERFACE_TYPE_EXTENSION: 'InterfaceTypeExtension',
      UNION_TYPE_EXTENSION: 'UnionTypeExtension',
      ENUM_TYPE_EXTENSION: 'EnumTypeExtension',
      INPUT_OBJECT_TYPE_EXTENSION: 'InputObjectTypeExtension'
    });
    /**
     * The enum type representing the possible kind values of AST nodes.
     */

    function invariant(condition, message) {
      var booleanCondition = Boolean(condition); // istanbul ignore else (See transformation done in './resources/inlineInvariant.js')

      if (!booleanCondition) {
        throw new Error(message != null ? message : 'Unexpected invariant triggered.');
      }
    }

    // istanbul ignore next (See: 'https://github.com/graphql/graphql-js/issues/2317')
    var nodejsCustomInspectSymbol = typeof Symbol === 'function' && typeof Symbol.for === 'function' ? Symbol.for('nodejs.util.inspect.custom') : undefined;

    /**
     * The `defineInspect()` function defines `inspect()` prototype method as alias of `toJSON`
     */

    function defineInspect(classObject) {
      var fn = classObject.prototype.toJSON;
      typeof fn === 'function' || invariant(0);
      classObject.prototype.inspect = fn; // istanbul ignore else (See: 'https://github.com/graphql/graphql-js/issues/2317')

      if (nodejsCustomInspectSymbol) {
        classObject.prototype[nodejsCustomInspectSymbol] = fn;
      }
    }

    /**
     * Contains a range of UTF-8 character offsets and token references that
     * identify the region of the source from which the AST derived.
     */
    var Location = /*#__PURE__*/function () {
      /**
       * The character offset at which this Node begins.
       */

      /**
       * The character offset at which this Node ends.
       */

      /**
       * The Token at which this Node begins.
       */

      /**
       * The Token at which this Node ends.
       */

      /**
       * The Source document the AST represents.
       */
      function Location(startToken, endToken, source) {
        this.start = startToken.start;
        this.end = endToken.end;
        this.startToken = startToken;
        this.endToken = endToken;
        this.source = source;
      }

      var _proto = Location.prototype;

      _proto.toJSON = function toJSON() {
        return {
          start: this.start,
          end: this.end
        };
      };

      return Location;
    }(); // Print a simplified form when appearing in `inspect` and `util.inspect`.

    defineInspect(Location);
    /**
     * Represents a range of characters represented by a lexical token
     * within a Source.
     */

    var Token = /*#__PURE__*/function () {
      /**
       * The kind of Token.
       */

      /**
       * The character offset at which this Node begins.
       */

      /**
       * The character offset at which this Node ends.
       */

      /**
       * The 1-indexed line number on which this Token appears.
       */

      /**
       * The 1-indexed column number at which this Token begins.
       */

      /**
       * For non-punctuation tokens, represents the interpreted value of the token.
       */

      /**
       * Tokens exist as nodes in a double-linked-list amongst all tokens
       * including ignored tokens. <SOF> is always the first node and <EOF>
       * the last.
       */
      function Token(kind, start, end, line, column, prev, value) {
        this.kind = kind;
        this.start = start;
        this.end = end;
        this.line = line;
        this.column = column;
        this.value = value;
        this.prev = prev;
        this.next = null;
      }

      var _proto2 = Token.prototype;

      _proto2.toJSON = function toJSON() {
        return {
          kind: this.kind,
          value: this.value,
          line: this.line,
          column: this.column
        };
      };

      return Token;
    }(); // Print a simplified form when appearing in `inspect` and `util.inspect`.

    defineInspect(Token);
    /**
     * @internal
     */

    function isNode(maybeNode) {
      return maybeNode != null && typeof maybeNode.kind === 'string';
    }
    /**
     * The list of all possible AST node types.
     */

    /**
     * An exported enum describing the different kinds of tokens that the
     * lexer emits.
     */
    var TokenKind = Object.freeze({
      SOF: '<SOF>',
      EOF: '<EOF>',
      BANG: '!',
      DOLLAR: '$',
      AMP: '&',
      PAREN_L: '(',
      PAREN_R: ')',
      SPREAD: '...',
      COLON: ':',
      EQUALS: '=',
      AT: '@',
      BRACKET_L: '[',
      BRACKET_R: ']',
      BRACE_L: '{',
      PIPE: '|',
      BRACE_R: '}',
      NAME: 'Name',
      INT: 'Int',
      FLOAT: 'Float',
      STRING: 'String',
      BLOCK_STRING: 'BlockString',
      COMMENT: 'Comment'
    });
    /**
     * The enum type representing the token kinds values.
     */

    function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }
    var MAX_ARRAY_LENGTH = 10;
    var MAX_RECURSIVE_DEPTH = 2;
    /**
     * Used to print values in error messages.
     */

    function inspect(value) {
      return formatValue(value, []);
    }

    function formatValue(value, seenValues) {
      switch (_typeof(value)) {
        case 'string':
          return JSON.stringify(value);

        case 'function':
          return value.name ? "[function ".concat(value.name, "]") : '[function]';

        case 'object':
          if (value === null) {
            return 'null';
          }

          return formatObjectValue(value, seenValues);

        default:
          return String(value);
      }
    }

    function formatObjectValue(value, previouslySeenValues) {
      if (previouslySeenValues.indexOf(value) !== -1) {
        return '[Circular]';
      }

      var seenValues = [].concat(previouslySeenValues, [value]);
      var customInspectFn = getCustomFn(value);

      if (customInspectFn !== undefined) {
        var customValue = customInspectFn.call(value); // check for infinite recursion

        if (customValue !== value) {
          return typeof customValue === 'string' ? customValue : formatValue(customValue, seenValues);
        }
      } else if (Array.isArray(value)) {
        return formatArray(value, seenValues);
      }

      return formatObject(value, seenValues);
    }

    function formatObject(object, seenValues) {
      var keys = Object.keys(object);

      if (keys.length === 0) {
        return '{}';
      }

      if (seenValues.length > MAX_RECURSIVE_DEPTH) {
        return '[' + getObjectTag(object) + ']';
      }

      var properties = keys.map(function (key) {
        var value = formatValue(object[key], seenValues);
        return key + ': ' + value;
      });
      return '{ ' + properties.join(', ') + ' }';
    }

    function formatArray(array, seenValues) {
      if (array.length === 0) {
        return '[]';
      }

      if (seenValues.length > MAX_RECURSIVE_DEPTH) {
        return '[Array]';
      }

      var len = Math.min(MAX_ARRAY_LENGTH, array.length);
      var remaining = array.length - len;
      var items = [];

      for (var i = 0; i < len; ++i) {
        items.push(formatValue(array[i], seenValues));
      }

      if (remaining === 1) {
        items.push('... 1 more item');
      } else if (remaining > 1) {
        items.push("... ".concat(remaining, " more items"));
      }

      return '[' + items.join(', ') + ']';
    }

    function getCustomFn(object) {
      var customInspectFn = object[String(nodejsCustomInspectSymbol)];

      if (typeof customInspectFn === 'function') {
        return customInspectFn;
      }

      if (typeof object.inspect === 'function') {
        return object.inspect;
      }
    }

    function getObjectTag(object) {
      var tag = Object.prototype.toString.call(object).replace(/^\[object /, '').replace(/]$/, '');

      if (tag === 'Object' && typeof object.constructor === 'function') {
        var name = object.constructor.name;

        if (typeof name === 'string' && name !== '') {
          return name;
        }
      }

      return tag;
    }

    function devAssert(condition, message) {
      var booleanCondition = Boolean(condition); // istanbul ignore else (See transformation done in './resources/inlineInvariant.js')

      if (!booleanCondition) {
        throw new Error(message);
      }
    }

    /**
     * A replacement for instanceof which includes an error warning when multi-realm
     * constructors are detected.
     */
    // See: https://expressjs.com/en/advanced/best-practice-performance.html#set-node_env-to-production
    // See: https://webpack.js.org/guides/production/
    var instanceOf = // eslint-disable-next-line no-shadow
    function instanceOf(value, constructor) {
      if (value instanceof constructor) {
        return true;
      }

      if (value) {
        var valueClass = value.constructor;
        var className = constructor.name;

        if (className && valueClass && valueClass.name === className) {
          throw new Error("Cannot use ".concat(className, " \"").concat(value, "\" from another module or realm.\n\nEnsure that there is only one instance of \"graphql\" in the node_modules\ndirectory. If different versions of \"graphql\" are the dependencies of other\nrelied on modules, use \"resolutions\" to ensure only one version is installed.\n\nhttps://yarnpkg.com/en/docs/selective-version-resolutions\n\nDuplicate \"graphql\" modules cannot be used at the same time since different\nversions may have different capabilities and behavior. The data from one\nversion used in the function from another could produce confusing and\nspurious results."));
        }
      }

      return false;
    };

    function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

    function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

    /**
     * A representation of source input to GraphQL. The `name` and `locationOffset` parameters are
     * optional, but they are useful for clients who store GraphQL documents in source files.
     * For example, if the GraphQL input starts at line 40 in a file named `Foo.graphql`, it might
     * be useful for `name` to be `"Foo.graphql"` and location to be `{ line: 40, column: 1 }`.
     * The `line` and `column` properties in `locationOffset` are 1-indexed.
     */
    var Source = /*#__PURE__*/function () {
      function Source(body) {
        var name = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'GraphQL request';
        var locationOffset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {
          line: 1,
          column: 1
        };
        typeof body === 'string' || devAssert(0, "Body must be a string. Received: ".concat(inspect(body), "."));
        this.body = body;
        this.name = name;
        this.locationOffset = locationOffset;
        this.locationOffset.line > 0 || devAssert(0, 'line in locationOffset is 1-indexed and must be positive.');
        this.locationOffset.column > 0 || devAssert(0, 'column in locationOffset is 1-indexed and must be positive.');
      } // $FlowFixMe[unsupported-syntax] Flow doesn't support computed properties yet


      _createClass(Source, [{
        key: SYMBOL_TO_STRING_TAG,
        get: function get() {
          return 'Source';
        }
      }]);

      return Source;
    }();
    /**
     * Test if the given value is a Source object.
     *
     * @internal
     */

    // eslint-disable-next-line no-redeclare
    function isSource(source) {
      return instanceOf(source, Source);
    }

    /**
     * The set of allowed directive location values.
     */
    var DirectiveLocation = Object.freeze({
      // Request Definitions
      QUERY: 'QUERY',
      MUTATION: 'MUTATION',
      SUBSCRIPTION: 'SUBSCRIPTION',
      FIELD: 'FIELD',
      FRAGMENT_DEFINITION: 'FRAGMENT_DEFINITION',
      FRAGMENT_SPREAD: 'FRAGMENT_SPREAD',
      INLINE_FRAGMENT: 'INLINE_FRAGMENT',
      VARIABLE_DEFINITION: 'VARIABLE_DEFINITION',
      // Type System Definitions
      SCHEMA: 'SCHEMA',
      SCALAR: 'SCALAR',
      OBJECT: 'OBJECT',
      FIELD_DEFINITION: 'FIELD_DEFINITION',
      ARGUMENT_DEFINITION: 'ARGUMENT_DEFINITION',
      INTERFACE: 'INTERFACE',
      UNION: 'UNION',
      ENUM: 'ENUM',
      ENUM_VALUE: 'ENUM_VALUE',
      INPUT_OBJECT: 'INPUT_OBJECT',
      INPUT_FIELD_DEFINITION: 'INPUT_FIELD_DEFINITION'
    });
    /**
     * The enum type representing the directive location values.
     */

    /**
     * Produces the value of a block string from its parsed raw value, similar to
     * CoffeeScript's block string, Python's docstring trim or Ruby's strip_heredoc.
     *
     * This implements the GraphQL spec's BlockStringValue() static algorithm.
     *
     * @internal
     */
    function dedentBlockStringValue(rawString) {
      // Expand a block string's raw value into independent lines.
      var lines = rawString.split(/\r\n|[\n\r]/g); // Remove common indentation from all lines but first.

      var commonIndent = getBlockStringIndentation(rawString);

      if (commonIndent !== 0) {
        for (var i = 1; i < lines.length; i++) {
          lines[i] = lines[i].slice(commonIndent);
        }
      } // Remove leading and trailing blank lines.


      var startLine = 0;

      while (startLine < lines.length && isBlank(lines[startLine])) {
        ++startLine;
      }

      var endLine = lines.length;

      while (endLine > startLine && isBlank(lines[endLine - 1])) {
        --endLine;
      } // Return a string of the lines joined with U+000A.


      return lines.slice(startLine, endLine).join('\n');
    }

    function isBlank(str) {
      for (var i = 0; i < str.length; ++i) {
        if (str[i] !== ' ' && str[i] !== '\t') {
          return false;
        }
      }

      return true;
    }
    /**
     * @internal
     */


    function getBlockStringIndentation(value) {
      var _commonIndent;

      var isFirstLine = true;
      var isEmptyLine = true;
      var indent = 0;
      var commonIndent = null;

      for (var i = 0; i < value.length; ++i) {
        switch (value.charCodeAt(i)) {
          case 13:
            //  \r
            if (value.charCodeAt(i + 1) === 10) {
              ++i; // skip \r\n as one symbol
            }

          // falls through

          case 10:
            //  \n
            isFirstLine = false;
            isEmptyLine = true;
            indent = 0;
            break;

          case 9: //   \t

          case 32:
            //  <space>
            ++indent;
            break;

          default:
            if (isEmptyLine && !isFirstLine && (commonIndent === null || indent < commonIndent)) {
              commonIndent = indent;
            }

            isEmptyLine = false;
        }
      }

      return (_commonIndent = commonIndent) !== null && _commonIndent !== void 0 ? _commonIndent : 0;
    }
    /**
     * Print a block string in the indented block form by adding a leading and
     * trailing blank line. However, if a block string starts with whitespace and is
     * a single-line, adding a leading blank line would strip that whitespace.
     *
     * @internal
     */

    function printBlockString(value) {
      var indentation = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
      var preferMultipleLines = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      var isSingleLine = value.indexOf('\n') === -1;
      var hasLeadingSpace = value[0] === ' ' || value[0] === '\t';
      var hasTrailingQuote = value[value.length - 1] === '"';
      var hasTrailingSlash = value[value.length - 1] === '\\';
      var printAsMultipleLines = !isSingleLine || hasTrailingQuote || hasTrailingSlash || preferMultipleLines;
      var result = ''; // Format a multi-line block quote to account for leading space.

      if (printAsMultipleLines && !(isSingleLine && hasLeadingSpace)) {
        result += '\n' + indentation;
      }

      result += indentation ? value.replace(/\n/g, '\n' + indentation) : value;

      if (printAsMultipleLines) {
        result += '\n';
      }

      return '"""' + result.replace(/"""/g, '\\"""') + '"""';
    }

    /**
     * Given a Source object, creates a Lexer for that source.
     * A Lexer is a stateful stream generator in that every time
     * it is advanced, it returns the next token in the Source. Assuming the
     * source lexes, the final Token emitted by the lexer will be of kind
     * EOF, after which the lexer will repeatedly return the same EOF token
     * whenever called.
     */

    var Lexer = /*#__PURE__*/function () {
      /**
       * The previously focused non-ignored token.
       */

      /**
       * The currently focused non-ignored token.
       */

      /**
       * The (1-indexed) line containing the current token.
       */

      /**
       * The character offset at which the current line begins.
       */
      function Lexer(source) {
        var startOfFileToken = new Token(TokenKind.SOF, 0, 0, 0, 0, null);
        this.source = source;
        this.lastToken = startOfFileToken;
        this.token = startOfFileToken;
        this.line = 1;
        this.lineStart = 0;
      }
      /**
       * Advances the token stream to the next non-ignored token.
       */


      var _proto = Lexer.prototype;

      _proto.advance = function advance() {
        this.lastToken = this.token;
        var token = this.token = this.lookahead();
        return token;
      }
      /**
       * Looks ahead and returns the next non-ignored token, but does not change
       * the state of Lexer.
       */
      ;

      _proto.lookahead = function lookahead() {
        var token = this.token;

        if (token.kind !== TokenKind.EOF) {
          do {
            var _token$next;

            // Note: next is only mutable during parsing, so we cast to allow this.
            token = (_token$next = token.next) !== null && _token$next !== void 0 ? _token$next : token.next = readToken(this, token);
          } while (token.kind === TokenKind.COMMENT);
        }

        return token;
      };

      return Lexer;
    }();
    /**
     * @internal
     */

    function isPunctuatorTokenKind(kind) {
      return kind === TokenKind.BANG || kind === TokenKind.DOLLAR || kind === TokenKind.AMP || kind === TokenKind.PAREN_L || kind === TokenKind.PAREN_R || kind === TokenKind.SPREAD || kind === TokenKind.COLON || kind === TokenKind.EQUALS || kind === TokenKind.AT || kind === TokenKind.BRACKET_L || kind === TokenKind.BRACKET_R || kind === TokenKind.BRACE_L || kind === TokenKind.PIPE || kind === TokenKind.BRACE_R;
    }

    function printCharCode(code) {
      return (// NaN/undefined represents access beyond the end of the file.
        isNaN(code) ? TokenKind.EOF : // Trust JSON for ASCII.
        code < 0x007f ? JSON.stringify(String.fromCharCode(code)) : // Otherwise print the escaped form.
        "\"\\u".concat(('00' + code.toString(16).toUpperCase()).slice(-4), "\"")
      );
    }
    /**
     * Gets the next token from the source starting at the given position.
     *
     * This skips over whitespace until it finds the next lexable token, then lexes
     * punctuators immediately or calls the appropriate helper function for more
     * complicated tokens.
     */


    function readToken(lexer, prev) {
      var source = lexer.source;
      var body = source.body;
      var bodyLength = body.length;
      var pos = prev.end;

      while (pos < bodyLength) {
        var code = body.charCodeAt(pos);
        var _line = lexer.line;

        var _col = 1 + pos - lexer.lineStart; // SourceCharacter


        switch (code) {
          case 0xfeff: // <BOM>

          case 9: //   \t

          case 32: //  <space>

          case 44:
            //  ,
            ++pos;
            continue;

          case 10:
            //  \n
            ++pos;
            ++lexer.line;
            lexer.lineStart = pos;
            continue;

          case 13:
            //  \r
            if (body.charCodeAt(pos + 1) === 10) {
              pos += 2;
            } else {
              ++pos;
            }

            ++lexer.line;
            lexer.lineStart = pos;
            continue;

          case 33:
            //  !
            return new Token(TokenKind.BANG, pos, pos + 1, _line, _col, prev);

          case 35:
            //  #
            return readComment(source, pos, _line, _col, prev);

          case 36:
            //  $
            return new Token(TokenKind.DOLLAR, pos, pos + 1, _line, _col, prev);

          case 38:
            //  &
            return new Token(TokenKind.AMP, pos, pos + 1, _line, _col, prev);

          case 40:
            //  (
            return new Token(TokenKind.PAREN_L, pos, pos + 1, _line, _col, prev);

          case 41:
            //  )
            return new Token(TokenKind.PAREN_R, pos, pos + 1, _line, _col, prev);

          case 46:
            //  .
            if (body.charCodeAt(pos + 1) === 46 && body.charCodeAt(pos + 2) === 46) {
              return new Token(TokenKind.SPREAD, pos, pos + 3, _line, _col, prev);
            }

            break;

          case 58:
            //  :
            return new Token(TokenKind.COLON, pos, pos + 1, _line, _col, prev);

          case 61:
            //  =
            return new Token(TokenKind.EQUALS, pos, pos + 1, _line, _col, prev);

          case 64:
            //  @
            return new Token(TokenKind.AT, pos, pos + 1, _line, _col, prev);

          case 91:
            //  [
            return new Token(TokenKind.BRACKET_L, pos, pos + 1, _line, _col, prev);

          case 93:
            //  ]
            return new Token(TokenKind.BRACKET_R, pos, pos + 1, _line, _col, prev);

          case 123:
            // {
            return new Token(TokenKind.BRACE_L, pos, pos + 1, _line, _col, prev);

          case 124:
            // |
            return new Token(TokenKind.PIPE, pos, pos + 1, _line, _col, prev);

          case 125:
            // }
            return new Token(TokenKind.BRACE_R, pos, pos + 1, _line, _col, prev);

          case 34:
            //  "
            if (body.charCodeAt(pos + 1) === 34 && body.charCodeAt(pos + 2) === 34) {
              return readBlockString(source, pos, _line, _col, prev, lexer);
            }

            return readString(source, pos, _line, _col, prev);

          case 45: //  -

          case 48: //  0

          case 49: //  1

          case 50: //  2

          case 51: //  3

          case 52: //  4

          case 53: //  5

          case 54: //  6

          case 55: //  7

          case 56: //  8

          case 57:
            //  9
            return readNumber(source, pos, code, _line, _col, prev);

          case 65: //  A

          case 66: //  B

          case 67: //  C

          case 68: //  D

          case 69: //  E

          case 70: //  F

          case 71: //  G

          case 72: //  H

          case 73: //  I

          case 74: //  J

          case 75: //  K

          case 76: //  L

          case 77: //  M

          case 78: //  N

          case 79: //  O

          case 80: //  P

          case 81: //  Q

          case 82: //  R

          case 83: //  S

          case 84: //  T

          case 85: //  U

          case 86: //  V

          case 87: //  W

          case 88: //  X

          case 89: //  Y

          case 90: //  Z

          case 95: //  _

          case 97: //  a

          case 98: //  b

          case 99: //  c

          case 100: // d

          case 101: // e

          case 102: // f

          case 103: // g

          case 104: // h

          case 105: // i

          case 106: // j

          case 107: // k

          case 108: // l

          case 109: // m

          case 110: // n

          case 111: // o

          case 112: // p

          case 113: // q

          case 114: // r

          case 115: // s

          case 116: // t

          case 117: // u

          case 118: // v

          case 119: // w

          case 120: // x

          case 121: // y

          case 122:
            // z
            return readName(source, pos, _line, _col, prev);
        }

        throw syntaxError(source, pos, unexpectedCharacterMessage(code));
      }

      var line = lexer.line;
      var col = 1 + pos - lexer.lineStart;
      return new Token(TokenKind.EOF, bodyLength, bodyLength, line, col, prev);
    }
    /**
     * Report a message that an unexpected character was encountered.
     */


    function unexpectedCharacterMessage(code) {
      if (code < 0x0020 && code !== 0x0009 && code !== 0x000a && code !== 0x000d) {
        return "Cannot contain the invalid character ".concat(printCharCode(code), ".");
      }

      if (code === 39) {
        // '
        return 'Unexpected single quote character (\'), did you mean to use a double quote (")?';
      }

      return "Cannot parse the unexpected character ".concat(printCharCode(code), ".");
    }
    /**
     * Reads a comment token from the source file.
     *
     * #[\u0009\u0020-\uFFFF]*
     */


    function readComment(source, start, line, col, prev) {
      var body = source.body;
      var code;
      var position = start;

      do {
        code = body.charCodeAt(++position);
      } while (!isNaN(code) && ( // SourceCharacter but not LineTerminator
      code > 0x001f || code === 0x0009));

      return new Token(TokenKind.COMMENT, start, position, line, col, prev, body.slice(start + 1, position));
    }
    /**
     * Reads a number token from the source file, either a float
     * or an int depending on whether a decimal point appears.
     *
     * Int:   -?(0|[1-9][0-9]*)
     * Float: -?(0|[1-9][0-9]*)(\.[0-9]+)?((E|e)(+|-)?[0-9]+)?
     */


    function readNumber(source, start, firstCode, line, col, prev) {
      var body = source.body;
      var code = firstCode;
      var position = start;
      var isFloat = false;

      if (code === 45) {
        // -
        code = body.charCodeAt(++position);
      }

      if (code === 48) {
        // 0
        code = body.charCodeAt(++position);

        if (code >= 48 && code <= 57) {
          throw syntaxError(source, position, "Invalid number, unexpected digit after 0: ".concat(printCharCode(code), "."));
        }
      } else {
        position = readDigits(source, position, code);
        code = body.charCodeAt(position);
      }

      if (code === 46) {
        // .
        isFloat = true;
        code = body.charCodeAt(++position);
        position = readDigits(source, position, code);
        code = body.charCodeAt(position);
      }

      if (code === 69 || code === 101) {
        // E e
        isFloat = true;
        code = body.charCodeAt(++position);

        if (code === 43 || code === 45) {
          // + -
          code = body.charCodeAt(++position);
        }

        position = readDigits(source, position, code);
        code = body.charCodeAt(position);
      } // Numbers cannot be followed by . or NameStart


      if (code === 46 || isNameStart(code)) {
        throw syntaxError(source, position, "Invalid number, expected digit but got: ".concat(printCharCode(code), "."));
      }

      return new Token(isFloat ? TokenKind.FLOAT : TokenKind.INT, start, position, line, col, prev, body.slice(start, position));
    }
    /**
     * Returns the new position in the source after reading digits.
     */


    function readDigits(source, start, firstCode) {
      var body = source.body;
      var position = start;
      var code = firstCode;

      if (code >= 48 && code <= 57) {
        // 0 - 9
        do {
          code = body.charCodeAt(++position);
        } while (code >= 48 && code <= 57); // 0 - 9


        return position;
      }

      throw syntaxError(source, position, "Invalid number, expected digit but got: ".concat(printCharCode(code), "."));
    }
    /**
     * Reads a string token from the source file.
     *
     * "([^"\\\u000A\u000D]|(\\(u[0-9a-fA-F]{4}|["\\/bfnrt])))*"
     */


    function readString(source, start, line, col, prev) {
      var body = source.body;
      var position = start + 1;
      var chunkStart = position;
      var code = 0;
      var value = '';

      while (position < body.length && !isNaN(code = body.charCodeAt(position)) && // not LineTerminator
      code !== 0x000a && code !== 0x000d) {
        // Closing Quote (")
        if (code === 34) {
          value += body.slice(chunkStart, position);
          return new Token(TokenKind.STRING, start, position + 1, line, col, prev, value);
        } // SourceCharacter


        if (code < 0x0020 && code !== 0x0009) {
          throw syntaxError(source, position, "Invalid character within String: ".concat(printCharCode(code), "."));
        }

        ++position;

        if (code === 92) {
          // \
          value += body.slice(chunkStart, position - 1);
          code = body.charCodeAt(position);

          switch (code) {
            case 34:
              value += '"';
              break;

            case 47:
              value += '/';
              break;

            case 92:
              value += '\\';
              break;

            case 98:
              value += '\b';
              break;

            case 102:
              value += '\f';
              break;

            case 110:
              value += '\n';
              break;

            case 114:
              value += '\r';
              break;

            case 116:
              value += '\t';
              break;

            case 117:
              {
                // uXXXX
                var charCode = uniCharCode(body.charCodeAt(position + 1), body.charCodeAt(position + 2), body.charCodeAt(position + 3), body.charCodeAt(position + 4));

                if (charCode < 0) {
                  var invalidSequence = body.slice(position + 1, position + 5);
                  throw syntaxError(source, position, "Invalid character escape sequence: \\u".concat(invalidSequence, "."));
                }

                value += String.fromCharCode(charCode);
                position += 4;
                break;
              }

            default:
              throw syntaxError(source, position, "Invalid character escape sequence: \\".concat(String.fromCharCode(code), "."));
          }

          ++position;
          chunkStart = position;
        }
      }

      throw syntaxError(source, position, 'Unterminated string.');
    }
    /**
     * Reads a block string token from the source file.
     *
     * """("?"?(\\"""|\\(?!=""")|[^"\\]))*"""
     */


    function readBlockString(source, start, line, col, prev, lexer) {
      var body = source.body;
      var position = start + 3;
      var chunkStart = position;
      var code = 0;
      var rawValue = '';

      while (position < body.length && !isNaN(code = body.charCodeAt(position))) {
        // Closing Triple-Quote (""")
        if (code === 34 && body.charCodeAt(position + 1) === 34 && body.charCodeAt(position + 2) === 34) {
          rawValue += body.slice(chunkStart, position);
          return new Token(TokenKind.BLOCK_STRING, start, position + 3, line, col, prev, dedentBlockStringValue(rawValue));
        } // SourceCharacter


        if (code < 0x0020 && code !== 0x0009 && code !== 0x000a && code !== 0x000d) {
          throw syntaxError(source, position, "Invalid character within String: ".concat(printCharCode(code), "."));
        }

        if (code === 10) {
          // new line
          ++position;
          ++lexer.line;
          lexer.lineStart = position;
        } else if (code === 13) {
          // carriage return
          if (body.charCodeAt(position + 1) === 10) {
            position += 2;
          } else {
            ++position;
          }

          ++lexer.line;
          lexer.lineStart = position;
        } else if ( // Escape Triple-Quote (\""")
        code === 92 && body.charCodeAt(position + 1) === 34 && body.charCodeAt(position + 2) === 34 && body.charCodeAt(position + 3) === 34) {
          rawValue += body.slice(chunkStart, position) + '"""';
          position += 4;
          chunkStart = position;
        } else {
          ++position;
        }
      }

      throw syntaxError(source, position, 'Unterminated string.');
    }
    /**
     * Converts four hexadecimal chars to the integer that the
     * string represents. For example, uniCharCode('0','0','0','f')
     * will return 15, and uniCharCode('0','0','f','f') returns 255.
     *
     * Returns a negative number on error, if a char was invalid.
     *
     * This is implemented by noting that char2hex() returns -1 on error,
     * which means the result of ORing the char2hex() will also be negative.
     */


    function uniCharCode(a, b, c, d) {
      return char2hex(a) << 12 | char2hex(b) << 8 | char2hex(c) << 4 | char2hex(d);
    }
    /**
     * Converts a hex character to its integer value.
     * '0' becomes 0, '9' becomes 9
     * 'A' becomes 10, 'F' becomes 15
     * 'a' becomes 10, 'f' becomes 15
     *
     * Returns -1 on error.
     */


    function char2hex(a) {
      return a >= 48 && a <= 57 ? a - 48 // 0-9
      : a >= 65 && a <= 70 ? a - 55 // A-F
      : a >= 97 && a <= 102 ? a - 87 // a-f
      : -1;
    }
    /**
     * Reads an alphanumeric + underscore name from the source.
     *
     * [_A-Za-z][_0-9A-Za-z]*
     */


    function readName(source, start, line, col, prev) {
      var body = source.body;
      var bodyLength = body.length;
      var position = start + 1;
      var code = 0;

      while (position !== bodyLength && !isNaN(code = body.charCodeAt(position)) && (code === 95 || // _
      code >= 48 && code <= 57 || // 0-9
      code >= 65 && code <= 90 || // A-Z
      code >= 97 && code <= 122) // a-z
      ) {
        ++position;
      }

      return new Token(TokenKind.NAME, start, position, line, col, prev, body.slice(start, position));
    } // _ A-Z a-z


    function isNameStart(code) {
      return code === 95 || code >= 65 && code <= 90 || code >= 97 && code <= 122;
    }

    /**
     * Configuration options to control parser behavior
     */

    /**
     * Given a GraphQL source, parses it into a Document.
     * Throws GraphQLError if a syntax error is encountered.
     */
    function parse(source, options) {
      var parser = new Parser(source, options);
      return parser.parseDocument();
    }
    /**
     * This class is exported only to assist people in implementing their own parsers
     * without duplicating too much code and should be used only as last resort for cases
     * such as experimental syntax or if certain features could not be contributed upstream.
     *
     * It is still part of the internal API and is versioned, so any changes to it are never
     * considered breaking changes. If you still need to support multiple versions of the
     * library, please use the `versionInfo` variable for version detection.
     *
     * @internal
     */

    var Parser = /*#__PURE__*/function () {
      function Parser(source, options) {
        var sourceObj = isSource(source) ? source : new Source(source);
        this._lexer = new Lexer(sourceObj);
        this._options = options;
      }
      /**
       * Converts a name lex token into a name parse node.
       */


      var _proto = Parser.prototype;

      _proto.parseName = function parseName() {
        var token = this.expectToken(TokenKind.NAME);
        return {
          kind: Kind.NAME,
          value: token.value,
          loc: this.loc(token)
        };
      } // Implements the parsing rules in the Document section.

      /**
       * Document : Definition+
       */
      ;

      _proto.parseDocument = function parseDocument() {
        var start = this._lexer.token;
        return {
          kind: Kind.DOCUMENT,
          definitions: this.many(TokenKind.SOF, this.parseDefinition, TokenKind.EOF),
          loc: this.loc(start)
        };
      }
      /**
       * Definition :
       *   - ExecutableDefinition
       *   - TypeSystemDefinition
       *   - TypeSystemExtension
       *
       * ExecutableDefinition :
       *   - OperationDefinition
       *   - FragmentDefinition
       */
      ;

      _proto.parseDefinition = function parseDefinition() {
        if (this.peek(TokenKind.NAME)) {
          switch (this._lexer.token.value) {
            case 'query':
            case 'mutation':
            case 'subscription':
              return this.parseOperationDefinition();

            case 'fragment':
              return this.parseFragmentDefinition();

            case 'schema':
            case 'scalar':
            case 'type':
            case 'interface':
            case 'union':
            case 'enum':
            case 'input':
            case 'directive':
              return this.parseTypeSystemDefinition();

            case 'extend':
              return this.parseTypeSystemExtension();
          }
        } else if (this.peek(TokenKind.BRACE_L)) {
          return this.parseOperationDefinition();
        } else if (this.peekDescription()) {
          return this.parseTypeSystemDefinition();
        }

        throw this.unexpected();
      } // Implements the parsing rules in the Operations section.

      /**
       * OperationDefinition :
       *  - SelectionSet
       *  - OperationType Name? VariableDefinitions? Directives? SelectionSet
       */
      ;

      _proto.parseOperationDefinition = function parseOperationDefinition() {
        var start = this._lexer.token;

        if (this.peek(TokenKind.BRACE_L)) {
          return {
            kind: Kind.OPERATION_DEFINITION,
            operation: 'query',
            name: undefined,
            variableDefinitions: [],
            directives: [],
            selectionSet: this.parseSelectionSet(),
            loc: this.loc(start)
          };
        }

        var operation = this.parseOperationType();
        var name;

        if (this.peek(TokenKind.NAME)) {
          name = this.parseName();
        }

        return {
          kind: Kind.OPERATION_DEFINITION,
          operation: operation,
          name: name,
          variableDefinitions: this.parseVariableDefinitions(),
          directives: this.parseDirectives(false),
          selectionSet: this.parseSelectionSet(),
          loc: this.loc(start)
        };
      }
      /**
       * OperationType : one of query mutation subscription
       */
      ;

      _proto.parseOperationType = function parseOperationType() {
        var operationToken = this.expectToken(TokenKind.NAME);

        switch (operationToken.value) {
          case 'query':
            return 'query';

          case 'mutation':
            return 'mutation';

          case 'subscription':
            return 'subscription';
        }

        throw this.unexpected(operationToken);
      }
      /**
       * VariableDefinitions : ( VariableDefinition+ )
       */
      ;

      _proto.parseVariableDefinitions = function parseVariableDefinitions() {
        return this.optionalMany(TokenKind.PAREN_L, this.parseVariableDefinition, TokenKind.PAREN_R);
      }
      /**
       * VariableDefinition : Variable : Type DefaultValue? Directives[Const]?
       */
      ;

      _proto.parseVariableDefinition = function parseVariableDefinition() {
        var start = this._lexer.token;
        return {
          kind: Kind.VARIABLE_DEFINITION,
          variable: this.parseVariable(),
          type: (this.expectToken(TokenKind.COLON), this.parseTypeReference()),
          defaultValue: this.expectOptionalToken(TokenKind.EQUALS) ? this.parseValueLiteral(true) : undefined,
          directives: this.parseDirectives(true),
          loc: this.loc(start)
        };
      }
      /**
       * Variable : $ Name
       */
      ;

      _proto.parseVariable = function parseVariable() {
        var start = this._lexer.token;
        this.expectToken(TokenKind.DOLLAR);
        return {
          kind: Kind.VARIABLE,
          name: this.parseName(),
          loc: this.loc(start)
        };
      }
      /**
       * SelectionSet : { Selection+ }
       */
      ;

      _proto.parseSelectionSet = function parseSelectionSet() {
        var start = this._lexer.token;
        return {
          kind: Kind.SELECTION_SET,
          selections: this.many(TokenKind.BRACE_L, this.parseSelection, TokenKind.BRACE_R),
          loc: this.loc(start)
        };
      }
      /**
       * Selection :
       *   - Field
       *   - FragmentSpread
       *   - InlineFragment
       */
      ;

      _proto.parseSelection = function parseSelection() {
        return this.peek(TokenKind.SPREAD) ? this.parseFragment() : this.parseField();
      }
      /**
       * Field : Alias? Name Arguments? Directives? SelectionSet?
       *
       * Alias : Name :
       */
      ;

      _proto.parseField = function parseField() {
        var start = this._lexer.token;
        var nameOrAlias = this.parseName();
        var alias;
        var name;

        if (this.expectOptionalToken(TokenKind.COLON)) {
          alias = nameOrAlias;
          name = this.parseName();
        } else {
          name = nameOrAlias;
        }

        return {
          kind: Kind.FIELD,
          alias: alias,
          name: name,
          arguments: this.parseArguments(false),
          directives: this.parseDirectives(false),
          selectionSet: this.peek(TokenKind.BRACE_L) ? this.parseSelectionSet() : undefined,
          loc: this.loc(start)
        };
      }
      /**
       * Arguments[Const] : ( Argument[?Const]+ )
       */
      ;

      _proto.parseArguments = function parseArguments(isConst) {
        var item = isConst ? this.parseConstArgument : this.parseArgument;
        return this.optionalMany(TokenKind.PAREN_L, item, TokenKind.PAREN_R);
      }
      /**
       * Argument[Const] : Name : Value[?Const]
       */
      ;

      _proto.parseArgument = function parseArgument() {
        var start = this._lexer.token;
        var name = this.parseName();
        this.expectToken(TokenKind.COLON);
        return {
          kind: Kind.ARGUMENT,
          name: name,
          value: this.parseValueLiteral(false),
          loc: this.loc(start)
        };
      };

      _proto.parseConstArgument = function parseConstArgument() {
        var start = this._lexer.token;
        return {
          kind: Kind.ARGUMENT,
          name: this.parseName(),
          value: (this.expectToken(TokenKind.COLON), this.parseValueLiteral(true)),
          loc: this.loc(start)
        };
      } // Implements the parsing rules in the Fragments section.

      /**
       * Corresponds to both FragmentSpread and InlineFragment in the spec.
       *
       * FragmentSpread : ... FragmentName Directives?
       *
       * InlineFragment : ... TypeCondition? Directives? SelectionSet
       */
      ;

      _proto.parseFragment = function parseFragment() {
        var start = this._lexer.token;
        this.expectToken(TokenKind.SPREAD);
        var hasTypeCondition = this.expectOptionalKeyword('on');

        if (!hasTypeCondition && this.peek(TokenKind.NAME)) {
          return {
            kind: Kind.FRAGMENT_SPREAD,
            name: this.parseFragmentName(),
            directives: this.parseDirectives(false),
            loc: this.loc(start)
          };
        }

        return {
          kind: Kind.INLINE_FRAGMENT,
          typeCondition: hasTypeCondition ? this.parseNamedType() : undefined,
          directives: this.parseDirectives(false),
          selectionSet: this.parseSelectionSet(),
          loc: this.loc(start)
        };
      }
      /**
       * FragmentDefinition :
       *   - fragment FragmentName on TypeCondition Directives? SelectionSet
       *
       * TypeCondition : NamedType
       */
      ;

      _proto.parseFragmentDefinition = function parseFragmentDefinition() {
        var _this$_options;

        var start = this._lexer.token;
        this.expectKeyword('fragment'); // Experimental support for defining variables within fragments changes
        // the grammar of FragmentDefinition:
        //   - fragment FragmentName VariableDefinitions? on TypeCondition Directives? SelectionSet

        if (((_this$_options = this._options) === null || _this$_options === void 0 ? void 0 : _this$_options.experimentalFragmentVariables) === true) {
          return {
            kind: Kind.FRAGMENT_DEFINITION,
            name: this.parseFragmentName(),
            variableDefinitions: this.parseVariableDefinitions(),
            typeCondition: (this.expectKeyword('on'), this.parseNamedType()),
            directives: this.parseDirectives(false),
            selectionSet: this.parseSelectionSet(),
            loc: this.loc(start)
          };
        }

        return {
          kind: Kind.FRAGMENT_DEFINITION,
          name: this.parseFragmentName(),
          typeCondition: (this.expectKeyword('on'), this.parseNamedType()),
          directives: this.parseDirectives(false),
          selectionSet: this.parseSelectionSet(),
          loc: this.loc(start)
        };
      }
      /**
       * FragmentName : Name but not `on`
       */
      ;

      _proto.parseFragmentName = function parseFragmentName() {
        if (this._lexer.token.value === 'on') {
          throw this.unexpected();
        }

        return this.parseName();
      } // Implements the parsing rules in the Values section.

      /**
       * Value[Const] :
       *   - [~Const] Variable
       *   - IntValue
       *   - FloatValue
       *   - StringValue
       *   - BooleanValue
       *   - NullValue
       *   - EnumValue
       *   - ListValue[?Const]
       *   - ObjectValue[?Const]
       *
       * BooleanValue : one of `true` `false`
       *
       * NullValue : `null`
       *
       * EnumValue : Name but not `true`, `false` or `null`
       */
      ;

      _proto.parseValueLiteral = function parseValueLiteral(isConst) {
        var token = this._lexer.token;

        switch (token.kind) {
          case TokenKind.BRACKET_L:
            return this.parseList(isConst);

          case TokenKind.BRACE_L:
            return this.parseObject(isConst);

          case TokenKind.INT:
            this._lexer.advance();

            return {
              kind: Kind.INT,
              value: token.value,
              loc: this.loc(token)
            };

          case TokenKind.FLOAT:
            this._lexer.advance();

            return {
              kind: Kind.FLOAT,
              value: token.value,
              loc: this.loc(token)
            };

          case TokenKind.STRING:
          case TokenKind.BLOCK_STRING:
            return this.parseStringLiteral();

          case TokenKind.NAME:
            this._lexer.advance();

            switch (token.value) {
              case 'true':
                return {
                  kind: Kind.BOOLEAN,
                  value: true,
                  loc: this.loc(token)
                };

              case 'false':
                return {
                  kind: Kind.BOOLEAN,
                  value: false,
                  loc: this.loc(token)
                };

              case 'null':
                return {
                  kind: Kind.NULL,
                  loc: this.loc(token)
                };

              default:
                return {
                  kind: Kind.ENUM,
                  value: token.value,
                  loc: this.loc(token)
                };
            }

          case TokenKind.DOLLAR:
            if (!isConst) {
              return this.parseVariable();
            }

            break;
        }

        throw this.unexpected();
      };

      _proto.parseStringLiteral = function parseStringLiteral() {
        var token = this._lexer.token;

        this._lexer.advance();

        return {
          kind: Kind.STRING,
          value: token.value,
          block: token.kind === TokenKind.BLOCK_STRING,
          loc: this.loc(token)
        };
      }
      /**
       * ListValue[Const] :
       *   - [ ]
       *   - [ Value[?Const]+ ]
       */
      ;

      _proto.parseList = function parseList(isConst) {
        var _this = this;

        var start = this._lexer.token;

        var item = function item() {
          return _this.parseValueLiteral(isConst);
        };

        return {
          kind: Kind.LIST,
          values: this.any(TokenKind.BRACKET_L, item, TokenKind.BRACKET_R),
          loc: this.loc(start)
        };
      }
      /**
       * ObjectValue[Const] :
       *   - { }
       *   - { ObjectField[?Const]+ }
       */
      ;

      _proto.parseObject = function parseObject(isConst) {
        var _this2 = this;

        var start = this._lexer.token;

        var item = function item() {
          return _this2.parseObjectField(isConst);
        };

        return {
          kind: Kind.OBJECT,
          fields: this.any(TokenKind.BRACE_L, item, TokenKind.BRACE_R),
          loc: this.loc(start)
        };
      }
      /**
       * ObjectField[Const] : Name : Value[?Const]
       */
      ;

      _proto.parseObjectField = function parseObjectField(isConst) {
        var start = this._lexer.token;
        var name = this.parseName();
        this.expectToken(TokenKind.COLON);
        return {
          kind: Kind.OBJECT_FIELD,
          name: name,
          value: this.parseValueLiteral(isConst),
          loc: this.loc(start)
        };
      } // Implements the parsing rules in the Directives section.

      /**
       * Directives[Const] : Directive[?Const]+
       */
      ;

      _proto.parseDirectives = function parseDirectives(isConst) {
        var directives = [];

        while (this.peek(TokenKind.AT)) {
          directives.push(this.parseDirective(isConst));
        }

        return directives;
      }
      /**
       * Directive[Const] : @ Name Arguments[?Const]?
       */
      ;

      _proto.parseDirective = function parseDirective(isConst) {
        var start = this._lexer.token;
        this.expectToken(TokenKind.AT);
        return {
          kind: Kind.DIRECTIVE,
          name: this.parseName(),
          arguments: this.parseArguments(isConst),
          loc: this.loc(start)
        };
      } // Implements the parsing rules in the Types section.

      /**
       * Type :
       *   - NamedType
       *   - ListType
       *   - NonNullType
       */
      ;

      _proto.parseTypeReference = function parseTypeReference() {
        var start = this._lexer.token;
        var type;

        if (this.expectOptionalToken(TokenKind.BRACKET_L)) {
          type = this.parseTypeReference();
          this.expectToken(TokenKind.BRACKET_R);
          type = {
            kind: Kind.LIST_TYPE,
            type: type,
            loc: this.loc(start)
          };
        } else {
          type = this.parseNamedType();
        }

        if (this.expectOptionalToken(TokenKind.BANG)) {
          return {
            kind: Kind.NON_NULL_TYPE,
            type: type,
            loc: this.loc(start)
          };
        }

        return type;
      }
      /**
       * NamedType : Name
       */
      ;

      _proto.parseNamedType = function parseNamedType() {
        var start = this._lexer.token;
        return {
          kind: Kind.NAMED_TYPE,
          name: this.parseName(),
          loc: this.loc(start)
        };
      } // Implements the parsing rules in the Type Definition section.

      /**
       * TypeSystemDefinition :
       *   - SchemaDefinition
       *   - TypeDefinition
       *   - DirectiveDefinition
       *
       * TypeDefinition :
       *   - ScalarTypeDefinition
       *   - ObjectTypeDefinition
       *   - InterfaceTypeDefinition
       *   - UnionTypeDefinition
       *   - EnumTypeDefinition
       *   - InputObjectTypeDefinition
       */
      ;

      _proto.parseTypeSystemDefinition = function parseTypeSystemDefinition() {
        // Many definitions begin with a description and require a lookahead.
        var keywordToken = this.peekDescription() ? this._lexer.lookahead() : this._lexer.token;

        if (keywordToken.kind === TokenKind.NAME) {
          switch (keywordToken.value) {
            case 'schema':
              return this.parseSchemaDefinition();

            case 'scalar':
              return this.parseScalarTypeDefinition();

            case 'type':
              return this.parseObjectTypeDefinition();

            case 'interface':
              return this.parseInterfaceTypeDefinition();

            case 'union':
              return this.parseUnionTypeDefinition();

            case 'enum':
              return this.parseEnumTypeDefinition();

            case 'input':
              return this.parseInputObjectTypeDefinition();

            case 'directive':
              return this.parseDirectiveDefinition();
          }
        }

        throw this.unexpected(keywordToken);
      };

      _proto.peekDescription = function peekDescription() {
        return this.peek(TokenKind.STRING) || this.peek(TokenKind.BLOCK_STRING);
      }
      /**
       * Description : StringValue
       */
      ;

      _proto.parseDescription = function parseDescription() {
        if (this.peekDescription()) {
          return this.parseStringLiteral();
        }
      }
      /**
       * SchemaDefinition : Description? schema Directives[Const]? { OperationTypeDefinition+ }
       */
      ;

      _proto.parseSchemaDefinition = function parseSchemaDefinition() {
        var start = this._lexer.token;
        var description = this.parseDescription();
        this.expectKeyword('schema');
        var directives = this.parseDirectives(true);
        var operationTypes = this.many(TokenKind.BRACE_L, this.parseOperationTypeDefinition, TokenKind.BRACE_R);
        return {
          kind: Kind.SCHEMA_DEFINITION,
          description: description,
          directives: directives,
          operationTypes: operationTypes,
          loc: this.loc(start)
        };
      }
      /**
       * OperationTypeDefinition : OperationType : NamedType
       */
      ;

      _proto.parseOperationTypeDefinition = function parseOperationTypeDefinition() {
        var start = this._lexer.token;
        var operation = this.parseOperationType();
        this.expectToken(TokenKind.COLON);
        var type = this.parseNamedType();
        return {
          kind: Kind.OPERATION_TYPE_DEFINITION,
          operation: operation,
          type: type,
          loc: this.loc(start)
        };
      }
      /**
       * ScalarTypeDefinition : Description? scalar Name Directives[Const]?
       */
      ;

      _proto.parseScalarTypeDefinition = function parseScalarTypeDefinition() {
        var start = this._lexer.token;
        var description = this.parseDescription();
        this.expectKeyword('scalar');
        var name = this.parseName();
        var directives = this.parseDirectives(true);
        return {
          kind: Kind.SCALAR_TYPE_DEFINITION,
          description: description,
          name: name,
          directives: directives,
          loc: this.loc(start)
        };
      }
      /**
       * ObjectTypeDefinition :
       *   Description?
       *   type Name ImplementsInterfaces? Directives[Const]? FieldsDefinition?
       */
      ;

      _proto.parseObjectTypeDefinition = function parseObjectTypeDefinition() {
        var start = this._lexer.token;
        var description = this.parseDescription();
        this.expectKeyword('type');
        var name = this.parseName();
        var interfaces = this.parseImplementsInterfaces();
        var directives = this.parseDirectives(true);
        var fields = this.parseFieldsDefinition();
        return {
          kind: Kind.OBJECT_TYPE_DEFINITION,
          description: description,
          name: name,
          interfaces: interfaces,
          directives: directives,
          fields: fields,
          loc: this.loc(start)
        };
      }
      /**
       * ImplementsInterfaces :
       *   - implements `&`? NamedType
       *   - ImplementsInterfaces & NamedType
       */
      ;

      _proto.parseImplementsInterfaces = function parseImplementsInterfaces() {
        var _this$_options2;

        if (!this.expectOptionalKeyword('implements')) {
          return [];
        }

        if (((_this$_options2 = this._options) === null || _this$_options2 === void 0 ? void 0 : _this$_options2.allowLegacySDLImplementsInterfaces) === true) {
          var types = []; // Optional leading ampersand

          this.expectOptionalToken(TokenKind.AMP);

          do {
            types.push(this.parseNamedType());
          } while (this.expectOptionalToken(TokenKind.AMP) || this.peek(TokenKind.NAME));

          return types;
        }

        return this.delimitedMany(TokenKind.AMP, this.parseNamedType);
      }
      /**
       * FieldsDefinition : { FieldDefinition+ }
       */
      ;

      _proto.parseFieldsDefinition = function parseFieldsDefinition() {
        var _this$_options3;

        // Legacy support for the SDL?
        if (((_this$_options3 = this._options) === null || _this$_options3 === void 0 ? void 0 : _this$_options3.allowLegacySDLEmptyFields) === true && this.peek(TokenKind.BRACE_L) && this._lexer.lookahead().kind === TokenKind.BRACE_R) {
          this._lexer.advance();

          this._lexer.advance();

          return [];
        }

        return this.optionalMany(TokenKind.BRACE_L, this.parseFieldDefinition, TokenKind.BRACE_R);
      }
      /**
       * FieldDefinition :
       *   - Description? Name ArgumentsDefinition? : Type Directives[Const]?
       */
      ;

      _proto.parseFieldDefinition = function parseFieldDefinition() {
        var start = this._lexer.token;
        var description = this.parseDescription();
        var name = this.parseName();
        var args = this.parseArgumentDefs();
        this.expectToken(TokenKind.COLON);
        var type = this.parseTypeReference();
        var directives = this.parseDirectives(true);
        return {
          kind: Kind.FIELD_DEFINITION,
          description: description,
          name: name,
          arguments: args,
          type: type,
          directives: directives,
          loc: this.loc(start)
        };
      }
      /**
       * ArgumentsDefinition : ( InputValueDefinition+ )
       */
      ;

      _proto.parseArgumentDefs = function parseArgumentDefs() {
        return this.optionalMany(TokenKind.PAREN_L, this.parseInputValueDef, TokenKind.PAREN_R);
      }
      /**
       * InputValueDefinition :
       *   - Description? Name : Type DefaultValue? Directives[Const]?
       */
      ;

      _proto.parseInputValueDef = function parseInputValueDef() {
        var start = this._lexer.token;
        var description = this.parseDescription();
        var name = this.parseName();
        this.expectToken(TokenKind.COLON);
        var type = this.parseTypeReference();
        var defaultValue;

        if (this.expectOptionalToken(TokenKind.EQUALS)) {
          defaultValue = this.parseValueLiteral(true);
        }

        var directives = this.parseDirectives(true);
        return {
          kind: Kind.INPUT_VALUE_DEFINITION,
          description: description,
          name: name,
          type: type,
          defaultValue: defaultValue,
          directives: directives,
          loc: this.loc(start)
        };
      }
      /**
       * InterfaceTypeDefinition :
       *   - Description? interface Name Directives[Const]? FieldsDefinition?
       */
      ;

      _proto.parseInterfaceTypeDefinition = function parseInterfaceTypeDefinition() {
        var start = this._lexer.token;
        var description = this.parseDescription();
        this.expectKeyword('interface');
        var name = this.parseName();
        var interfaces = this.parseImplementsInterfaces();
        var directives = this.parseDirectives(true);
        var fields = this.parseFieldsDefinition();
        return {
          kind: Kind.INTERFACE_TYPE_DEFINITION,
          description: description,
          name: name,
          interfaces: interfaces,
          directives: directives,
          fields: fields,
          loc: this.loc(start)
        };
      }
      /**
       * UnionTypeDefinition :
       *   - Description? union Name Directives[Const]? UnionMemberTypes?
       */
      ;

      _proto.parseUnionTypeDefinition = function parseUnionTypeDefinition() {
        var start = this._lexer.token;
        var description = this.parseDescription();
        this.expectKeyword('union');
        var name = this.parseName();
        var directives = this.parseDirectives(true);
        var types = this.parseUnionMemberTypes();
        return {
          kind: Kind.UNION_TYPE_DEFINITION,
          description: description,
          name: name,
          directives: directives,
          types: types,
          loc: this.loc(start)
        };
      }
      /**
       * UnionMemberTypes :
       *   - = `|`? NamedType
       *   - UnionMemberTypes | NamedType
       */
      ;

      _proto.parseUnionMemberTypes = function parseUnionMemberTypes() {
        return this.expectOptionalToken(TokenKind.EQUALS) ? this.delimitedMany(TokenKind.PIPE, this.parseNamedType) : [];
      }
      /**
       * EnumTypeDefinition :
       *   - Description? enum Name Directives[Const]? EnumValuesDefinition?
       */
      ;

      _proto.parseEnumTypeDefinition = function parseEnumTypeDefinition() {
        var start = this._lexer.token;
        var description = this.parseDescription();
        this.expectKeyword('enum');
        var name = this.parseName();
        var directives = this.parseDirectives(true);
        var values = this.parseEnumValuesDefinition();
        return {
          kind: Kind.ENUM_TYPE_DEFINITION,
          description: description,
          name: name,
          directives: directives,
          values: values,
          loc: this.loc(start)
        };
      }
      /**
       * EnumValuesDefinition : { EnumValueDefinition+ }
       */
      ;

      _proto.parseEnumValuesDefinition = function parseEnumValuesDefinition() {
        return this.optionalMany(TokenKind.BRACE_L, this.parseEnumValueDefinition, TokenKind.BRACE_R);
      }
      /**
       * EnumValueDefinition : Description? EnumValue Directives[Const]?
       *
       * EnumValue : Name
       */
      ;

      _proto.parseEnumValueDefinition = function parseEnumValueDefinition() {
        var start = this._lexer.token;
        var description = this.parseDescription();
        var name = this.parseName();
        var directives = this.parseDirectives(true);
        return {
          kind: Kind.ENUM_VALUE_DEFINITION,
          description: description,
          name: name,
          directives: directives,
          loc: this.loc(start)
        };
      }
      /**
       * InputObjectTypeDefinition :
       *   - Description? input Name Directives[Const]? InputFieldsDefinition?
       */
      ;

      _proto.parseInputObjectTypeDefinition = function parseInputObjectTypeDefinition() {
        var start = this._lexer.token;
        var description = this.parseDescription();
        this.expectKeyword('input');
        var name = this.parseName();
        var directives = this.parseDirectives(true);
        var fields = this.parseInputFieldsDefinition();
        return {
          kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
          description: description,
          name: name,
          directives: directives,
          fields: fields,
          loc: this.loc(start)
        };
      }
      /**
       * InputFieldsDefinition : { InputValueDefinition+ }
       */
      ;

      _proto.parseInputFieldsDefinition = function parseInputFieldsDefinition() {
        return this.optionalMany(TokenKind.BRACE_L, this.parseInputValueDef, TokenKind.BRACE_R);
      }
      /**
       * TypeSystemExtension :
       *   - SchemaExtension
       *   - TypeExtension
       *
       * TypeExtension :
       *   - ScalarTypeExtension
       *   - ObjectTypeExtension
       *   - InterfaceTypeExtension
       *   - UnionTypeExtension
       *   - EnumTypeExtension
       *   - InputObjectTypeDefinition
       */
      ;

      _proto.parseTypeSystemExtension = function parseTypeSystemExtension() {
        var keywordToken = this._lexer.lookahead();

        if (keywordToken.kind === TokenKind.NAME) {
          switch (keywordToken.value) {
            case 'schema':
              return this.parseSchemaExtension();

            case 'scalar':
              return this.parseScalarTypeExtension();

            case 'type':
              return this.parseObjectTypeExtension();

            case 'interface':
              return this.parseInterfaceTypeExtension();

            case 'union':
              return this.parseUnionTypeExtension();

            case 'enum':
              return this.parseEnumTypeExtension();

            case 'input':
              return this.parseInputObjectTypeExtension();
          }
        }

        throw this.unexpected(keywordToken);
      }
      /**
       * SchemaExtension :
       *  - extend schema Directives[Const]? { OperationTypeDefinition+ }
       *  - extend schema Directives[Const]
       */
      ;

      _proto.parseSchemaExtension = function parseSchemaExtension() {
        var start = this._lexer.token;
        this.expectKeyword('extend');
        this.expectKeyword('schema');
        var directives = this.parseDirectives(true);
        var operationTypes = this.optionalMany(TokenKind.BRACE_L, this.parseOperationTypeDefinition, TokenKind.BRACE_R);

        if (directives.length === 0 && operationTypes.length === 0) {
          throw this.unexpected();
        }

        return {
          kind: Kind.SCHEMA_EXTENSION,
          directives: directives,
          operationTypes: operationTypes,
          loc: this.loc(start)
        };
      }
      /**
       * ScalarTypeExtension :
       *   - extend scalar Name Directives[Const]
       */
      ;

      _proto.parseScalarTypeExtension = function parseScalarTypeExtension() {
        var start = this._lexer.token;
        this.expectKeyword('extend');
        this.expectKeyword('scalar');
        var name = this.parseName();
        var directives = this.parseDirectives(true);

        if (directives.length === 0) {
          throw this.unexpected();
        }

        return {
          kind: Kind.SCALAR_TYPE_EXTENSION,
          name: name,
          directives: directives,
          loc: this.loc(start)
        };
      }
      /**
       * ObjectTypeExtension :
       *  - extend type Name ImplementsInterfaces? Directives[Const]? FieldsDefinition
       *  - extend type Name ImplementsInterfaces? Directives[Const]
       *  - extend type Name ImplementsInterfaces
       */
      ;

      _proto.parseObjectTypeExtension = function parseObjectTypeExtension() {
        var start = this._lexer.token;
        this.expectKeyword('extend');
        this.expectKeyword('type');
        var name = this.parseName();
        var interfaces = this.parseImplementsInterfaces();
        var directives = this.parseDirectives(true);
        var fields = this.parseFieldsDefinition();

        if (interfaces.length === 0 && directives.length === 0 && fields.length === 0) {
          throw this.unexpected();
        }

        return {
          kind: Kind.OBJECT_TYPE_EXTENSION,
          name: name,
          interfaces: interfaces,
          directives: directives,
          fields: fields,
          loc: this.loc(start)
        };
      }
      /**
       * InterfaceTypeExtension :
       *  - extend interface Name ImplementsInterfaces? Directives[Const]? FieldsDefinition
       *  - extend interface Name ImplementsInterfaces? Directives[Const]
       *  - extend interface Name ImplementsInterfaces
       */
      ;

      _proto.parseInterfaceTypeExtension = function parseInterfaceTypeExtension() {
        var start = this._lexer.token;
        this.expectKeyword('extend');
        this.expectKeyword('interface');
        var name = this.parseName();
        var interfaces = this.parseImplementsInterfaces();
        var directives = this.parseDirectives(true);
        var fields = this.parseFieldsDefinition();

        if (interfaces.length === 0 && directives.length === 0 && fields.length === 0) {
          throw this.unexpected();
        }

        return {
          kind: Kind.INTERFACE_TYPE_EXTENSION,
          name: name,
          interfaces: interfaces,
          directives: directives,
          fields: fields,
          loc: this.loc(start)
        };
      }
      /**
       * UnionTypeExtension :
       *   - extend union Name Directives[Const]? UnionMemberTypes
       *   - extend union Name Directives[Const]
       */
      ;

      _proto.parseUnionTypeExtension = function parseUnionTypeExtension() {
        var start = this._lexer.token;
        this.expectKeyword('extend');
        this.expectKeyword('union');
        var name = this.parseName();
        var directives = this.parseDirectives(true);
        var types = this.parseUnionMemberTypes();

        if (directives.length === 0 && types.length === 0) {
          throw this.unexpected();
        }

        return {
          kind: Kind.UNION_TYPE_EXTENSION,
          name: name,
          directives: directives,
          types: types,
          loc: this.loc(start)
        };
      }
      /**
       * EnumTypeExtension :
       *   - extend enum Name Directives[Const]? EnumValuesDefinition
       *   - extend enum Name Directives[Const]
       */
      ;

      _proto.parseEnumTypeExtension = function parseEnumTypeExtension() {
        var start = this._lexer.token;
        this.expectKeyword('extend');
        this.expectKeyword('enum');
        var name = this.parseName();
        var directives = this.parseDirectives(true);
        var values = this.parseEnumValuesDefinition();

        if (directives.length === 0 && values.length === 0) {
          throw this.unexpected();
        }

        return {
          kind: Kind.ENUM_TYPE_EXTENSION,
          name: name,
          directives: directives,
          values: values,
          loc: this.loc(start)
        };
      }
      /**
       * InputObjectTypeExtension :
       *   - extend input Name Directives[Const]? InputFieldsDefinition
       *   - extend input Name Directives[Const]
       */
      ;

      _proto.parseInputObjectTypeExtension = function parseInputObjectTypeExtension() {
        var start = this._lexer.token;
        this.expectKeyword('extend');
        this.expectKeyword('input');
        var name = this.parseName();
        var directives = this.parseDirectives(true);
        var fields = this.parseInputFieldsDefinition();

        if (directives.length === 0 && fields.length === 0) {
          throw this.unexpected();
        }

        return {
          kind: Kind.INPUT_OBJECT_TYPE_EXTENSION,
          name: name,
          directives: directives,
          fields: fields,
          loc: this.loc(start)
        };
      }
      /**
       * DirectiveDefinition :
       *   - Description? directive @ Name ArgumentsDefinition? `repeatable`? on DirectiveLocations
       */
      ;

      _proto.parseDirectiveDefinition = function parseDirectiveDefinition() {
        var start = this._lexer.token;
        var description = this.parseDescription();
        this.expectKeyword('directive');
        this.expectToken(TokenKind.AT);
        var name = this.parseName();
        var args = this.parseArgumentDefs();
        var repeatable = this.expectOptionalKeyword('repeatable');
        this.expectKeyword('on');
        var locations = this.parseDirectiveLocations();
        return {
          kind: Kind.DIRECTIVE_DEFINITION,
          description: description,
          name: name,
          arguments: args,
          repeatable: repeatable,
          locations: locations,
          loc: this.loc(start)
        };
      }
      /**
       * DirectiveLocations :
       *   - `|`? DirectiveLocation
       *   - DirectiveLocations | DirectiveLocation
       */
      ;

      _proto.parseDirectiveLocations = function parseDirectiveLocations() {
        return this.delimitedMany(TokenKind.PIPE, this.parseDirectiveLocation);
      }
      /*
       * DirectiveLocation :
       *   - ExecutableDirectiveLocation
       *   - TypeSystemDirectiveLocation
       *
       * ExecutableDirectiveLocation : one of
       *   `QUERY`
       *   `MUTATION`
       *   `SUBSCRIPTION`
       *   `FIELD`
       *   `FRAGMENT_DEFINITION`
       *   `FRAGMENT_SPREAD`
       *   `INLINE_FRAGMENT`
       *
       * TypeSystemDirectiveLocation : one of
       *   `SCHEMA`
       *   `SCALAR`
       *   `OBJECT`
       *   `FIELD_DEFINITION`
       *   `ARGUMENT_DEFINITION`
       *   `INTERFACE`
       *   `UNION`
       *   `ENUM`
       *   `ENUM_VALUE`
       *   `INPUT_OBJECT`
       *   `INPUT_FIELD_DEFINITION`
       */
      ;

      _proto.parseDirectiveLocation = function parseDirectiveLocation() {
        var start = this._lexer.token;
        var name = this.parseName();

        if (DirectiveLocation[name.value] !== undefined) {
          return name;
        }

        throw this.unexpected(start);
      } // Core parsing utility functions

      /**
       * Returns a location object, used to identify the place in the source that created a given parsed object.
       */
      ;

      _proto.loc = function loc(startToken) {
        var _this$_options4;

        if (((_this$_options4 = this._options) === null || _this$_options4 === void 0 ? void 0 : _this$_options4.noLocation) !== true) {
          return new Location(startToken, this._lexer.lastToken, this._lexer.source);
        }
      }
      /**
       * Determines if the next token is of a given kind
       */
      ;

      _proto.peek = function peek(kind) {
        return this._lexer.token.kind === kind;
      }
      /**
       * If the next token is of the given kind, return that token after advancing the lexer.
       * Otherwise, do not change the parser state and throw an error.
       */
      ;

      _proto.expectToken = function expectToken(kind) {
        var token = this._lexer.token;

        if (token.kind === kind) {
          this._lexer.advance();

          return token;
        }

        throw syntaxError(this._lexer.source, token.start, "Expected ".concat(getTokenKindDesc(kind), ", found ").concat(getTokenDesc(token), "."));
      }
      /**
       * If the next token is of the given kind, return that token after advancing the lexer.
       * Otherwise, do not change the parser state and return undefined.
       */
      ;

      _proto.expectOptionalToken = function expectOptionalToken(kind) {
        var token = this._lexer.token;

        if (token.kind === kind) {
          this._lexer.advance();

          return token;
        }

        return undefined;
      }
      /**
       * If the next token is a given keyword, advance the lexer.
       * Otherwise, do not change the parser state and throw an error.
       */
      ;

      _proto.expectKeyword = function expectKeyword(value) {
        var token = this._lexer.token;

        if (token.kind === TokenKind.NAME && token.value === value) {
          this._lexer.advance();
        } else {
          throw syntaxError(this._lexer.source, token.start, "Expected \"".concat(value, "\", found ").concat(getTokenDesc(token), "."));
        }
      }
      /**
       * If the next token is a given keyword, return "true" after advancing the lexer.
       * Otherwise, do not change the parser state and return "false".
       */
      ;

      _proto.expectOptionalKeyword = function expectOptionalKeyword(value) {
        var token = this._lexer.token;

        if (token.kind === TokenKind.NAME && token.value === value) {
          this._lexer.advance();

          return true;
        }

        return false;
      }
      /**
       * Helper function for creating an error when an unexpected lexed token is encountered.
       */
      ;

      _proto.unexpected = function unexpected(atToken) {
        var token = atToken !== null && atToken !== void 0 ? atToken : this._lexer.token;
        return syntaxError(this._lexer.source, token.start, "Unexpected ".concat(getTokenDesc(token), "."));
      }
      /**
       * Returns a possibly empty list of parse nodes, determined by the parseFn.
       * This list begins with a lex token of openKind and ends with a lex token of closeKind.
       * Advances the parser to the next lex token after the closing token.
       */
      ;

      _proto.any = function any(openKind, parseFn, closeKind) {
        this.expectToken(openKind);
        var nodes = [];

        while (!this.expectOptionalToken(closeKind)) {
          nodes.push(parseFn.call(this));
        }

        return nodes;
      }
      /**
       * Returns a list of parse nodes, determined by the parseFn.
       * It can be empty only if open token is missing otherwise it will always return non-empty list
       * that begins with a lex token of openKind and ends with a lex token of closeKind.
       * Advances the parser to the next lex token after the closing token.
       */
      ;

      _proto.optionalMany = function optionalMany(openKind, parseFn, closeKind) {
        if (this.expectOptionalToken(openKind)) {
          var nodes = [];

          do {
            nodes.push(parseFn.call(this));
          } while (!this.expectOptionalToken(closeKind));

          return nodes;
        }

        return [];
      }
      /**
       * Returns a non-empty list of parse nodes, determined by the parseFn.
       * This list begins with a lex token of openKind and ends with a lex token of closeKind.
       * Advances the parser to the next lex token after the closing token.
       */
      ;

      _proto.many = function many(openKind, parseFn, closeKind) {
        this.expectToken(openKind);
        var nodes = [];

        do {
          nodes.push(parseFn.call(this));
        } while (!this.expectOptionalToken(closeKind));

        return nodes;
      }
      /**
       * Returns a non-empty list of parse nodes, determined by the parseFn.
       * This list may begin with a lex token of delimiterKind followed by items separated by lex tokens of tokenKind.
       * Advances the parser to the next lex token after last item in the list.
       */
      ;

      _proto.delimitedMany = function delimitedMany(delimiterKind, parseFn) {
        this.expectOptionalToken(delimiterKind);
        var nodes = [];

        do {
          nodes.push(parseFn.call(this));
        } while (this.expectOptionalToken(delimiterKind));

        return nodes;
      };

      return Parser;
    }();
    /**
     * A helper function to describe a token as a string for debugging.
     */

    function getTokenDesc(token) {
      var value = token.value;
      return getTokenKindDesc(token.kind) + (value != null ? " \"".concat(value, "\"") : '');
    }
    /**
     * A helper function to describe a token kind as a string for debugging.
     */


    function getTokenKindDesc(kind) {
      return isPunctuatorTokenKind(kind) ? "\"".concat(kind, "\"") : kind;
    }

    /**
     * A visitor is provided to visit, it contains the collection of
     * relevant functions to be called during the visitor's traversal.
     */

    var QueryDocumentKeys = {
      Name: [],
      Document: ['definitions'],
      OperationDefinition: ['name', 'variableDefinitions', 'directives', 'selectionSet'],
      VariableDefinition: ['variable', 'type', 'defaultValue', 'directives'],
      Variable: ['name'],
      SelectionSet: ['selections'],
      Field: ['alias', 'name', 'arguments', 'directives', 'selectionSet'],
      Argument: ['name', 'value'],
      FragmentSpread: ['name', 'directives'],
      InlineFragment: ['typeCondition', 'directives', 'selectionSet'],
      FragmentDefinition: ['name', // Note: fragment variable definitions are experimental and may be changed
      // or removed in the future.
      'variableDefinitions', 'typeCondition', 'directives', 'selectionSet'],
      IntValue: [],
      FloatValue: [],
      StringValue: [],
      BooleanValue: [],
      NullValue: [],
      EnumValue: [],
      ListValue: ['values'],
      ObjectValue: ['fields'],
      ObjectField: ['name', 'value'],
      Directive: ['name', 'arguments'],
      NamedType: ['name'],
      ListType: ['type'],
      NonNullType: ['type'],
      SchemaDefinition: ['description', 'directives', 'operationTypes'],
      OperationTypeDefinition: ['type'],
      ScalarTypeDefinition: ['description', 'name', 'directives'],
      ObjectTypeDefinition: ['description', 'name', 'interfaces', 'directives', 'fields'],
      FieldDefinition: ['description', 'name', 'arguments', 'type', 'directives'],
      InputValueDefinition: ['description', 'name', 'type', 'defaultValue', 'directives'],
      InterfaceTypeDefinition: ['description', 'name', 'interfaces', 'directives', 'fields'],
      UnionTypeDefinition: ['description', 'name', 'directives', 'types'],
      EnumTypeDefinition: ['description', 'name', 'directives', 'values'],
      EnumValueDefinition: ['description', 'name', 'directives'],
      InputObjectTypeDefinition: ['description', 'name', 'directives', 'fields'],
      DirectiveDefinition: ['description', 'name', 'arguments', 'locations'],
      SchemaExtension: ['directives', 'operationTypes'],
      ScalarTypeExtension: ['name', 'directives'],
      ObjectTypeExtension: ['name', 'interfaces', 'directives', 'fields'],
      InterfaceTypeExtension: ['name', 'interfaces', 'directives', 'fields'],
      UnionTypeExtension: ['name', 'directives', 'types'],
      EnumTypeExtension: ['name', 'directives', 'values'],
      InputObjectTypeExtension: ['name', 'directives', 'fields']
    };
    var BREAK = Object.freeze({});
    /**
     * visit() will walk through an AST using a depth-first traversal, calling
     * the visitor's enter function at each node in the traversal, and calling the
     * leave function after visiting that node and all of its child nodes.
     *
     * By returning different values from the enter and leave functions, the
     * behavior of the visitor can be altered, including skipping over a sub-tree of
     * the AST (by returning false), editing the AST by returning a value or null
     * to remove the value, or to stop the whole traversal by returning BREAK.
     *
     * When using visit() to edit an AST, the original AST will not be modified, and
     * a new version of the AST with the changes applied will be returned from the
     * visit function.
     *
     *     const editedAST = visit(ast, {
     *       enter(node, key, parent, path, ancestors) {
     *         // @return
     *         //   undefined: no action
     *         //   false: skip visiting this node
     *         //   visitor.BREAK: stop visiting altogether
     *         //   null: delete this node
     *         //   any value: replace this node with the returned value
     *       },
     *       leave(node, key, parent, path, ancestors) {
     *         // @return
     *         //   undefined: no action
     *         //   false: no action
     *         //   visitor.BREAK: stop visiting altogether
     *         //   null: delete this node
     *         //   any value: replace this node with the returned value
     *       }
     *     });
     *
     * Alternatively to providing enter() and leave() functions, a visitor can
     * instead provide functions named the same as the kinds of AST nodes, or
     * enter/leave visitors at a named key, leading to four permutations of the
     * visitor API:
     *
     * 1) Named visitors triggered when entering a node of a specific kind.
     *
     *     visit(ast, {
     *       Kind(node) {
     *         // enter the "Kind" node
     *       }
     *     })
     *
     * 2) Named visitors that trigger upon entering and leaving a node of
     *    a specific kind.
     *
     *     visit(ast, {
     *       Kind: {
     *         enter(node) {
     *           // enter the "Kind" node
     *         }
     *         leave(node) {
     *           // leave the "Kind" node
     *         }
     *       }
     *     })
     *
     * 3) Generic visitors that trigger upon entering and leaving any node.
     *
     *     visit(ast, {
     *       enter(node) {
     *         // enter any node
     *       },
     *       leave(node) {
     *         // leave any node
     *       }
     *     })
     *
     * 4) Parallel visitors for entering and leaving nodes of a specific kind.
     *
     *     visit(ast, {
     *       enter: {
     *         Kind(node) {
     *           // enter the "Kind" node
     *         }
     *       },
     *       leave: {
     *         Kind(node) {
     *           // leave the "Kind" node
     *         }
     *       }
     *     })
     */

    function visit(root, visitor) {
      var visitorKeys = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : QueryDocumentKeys;

      /* eslint-disable no-undef-init */
      var stack = undefined;
      var inArray = Array.isArray(root);
      var keys = [root];
      var index = -1;
      var edits = [];
      var node = undefined;
      var key = undefined;
      var parent = undefined;
      var path = [];
      var ancestors = [];
      var newRoot = root;
      /* eslint-enable no-undef-init */

      do {
        index++;
        var isLeaving = index === keys.length;
        var isEdited = isLeaving && edits.length !== 0;

        if (isLeaving) {
          key = ancestors.length === 0 ? undefined : path[path.length - 1];
          node = parent;
          parent = ancestors.pop();

          if (isEdited) {
            if (inArray) {
              node = node.slice();
            } else {
              var clone = {};

              for (var _i2 = 0, _Object$keys2 = Object.keys(node); _i2 < _Object$keys2.length; _i2++) {
                var k = _Object$keys2[_i2];
                clone[k] = node[k];
              }

              node = clone;
            }

            var editOffset = 0;

            for (var ii = 0; ii < edits.length; ii++) {
              var editKey = edits[ii][0];
              var editValue = edits[ii][1];

              if (inArray) {
                editKey -= editOffset;
              }

              if (inArray && editValue === null) {
                node.splice(editKey, 1);
                editOffset++;
              } else {
                node[editKey] = editValue;
              }
            }
          }

          index = stack.index;
          keys = stack.keys;
          edits = stack.edits;
          inArray = stack.inArray;
          stack = stack.prev;
        } else {
          key = parent ? inArray ? index : keys[index] : undefined;
          node = parent ? parent[key] : newRoot;

          if (node === null || node === undefined) {
            continue;
          }

          if (parent) {
            path.push(key);
          }
        }

        var result = void 0;

        if (!Array.isArray(node)) {
          if (!isNode(node)) {
            throw new Error("Invalid AST Node: ".concat(inspect(node), "."));
          }

          var visitFn = getVisitFn(visitor, node.kind, isLeaving);

          if (visitFn) {
            result = visitFn.call(visitor, node, key, parent, path, ancestors);

            if (result === BREAK) {
              break;
            }

            if (result === false) {
              if (!isLeaving) {
                path.pop();
                continue;
              }
            } else if (result !== undefined) {
              edits.push([key, result]);

              if (!isLeaving) {
                if (isNode(result)) {
                  node = result;
                } else {
                  path.pop();
                  continue;
                }
              }
            }
          }
        }

        if (result === undefined && isEdited) {
          edits.push([key, node]);
        }

        if (isLeaving) {
          path.pop();
        } else {
          var _visitorKeys$node$kin;

          stack = {
            inArray: inArray,
            index: index,
            keys: keys,
            edits: edits,
            prev: stack
          };
          inArray = Array.isArray(node);
          keys = inArray ? node : (_visitorKeys$node$kin = visitorKeys[node.kind]) !== null && _visitorKeys$node$kin !== void 0 ? _visitorKeys$node$kin : [];
          index = -1;
          edits = [];

          if (parent) {
            ancestors.push(parent);
          }

          parent = node;
        }
      } while (stack !== undefined);

      if (edits.length !== 0) {
        newRoot = edits[edits.length - 1][1];
      }

      return newRoot;
    }
    /**
     * Given a visitor instance, if it is leaving or not, and a node kind, return
     * the function the visitor runtime should call.
     */

    function getVisitFn(visitor, kind, isLeaving) {
      var kindVisitor = visitor[kind];

      if (kindVisitor) {
        if (!isLeaving && typeof kindVisitor === 'function') {
          // { Kind() {} }
          return kindVisitor;
        }

        var kindSpecificVisitor = isLeaving ? kindVisitor.leave : kindVisitor.enter;

        if (typeof kindSpecificVisitor === 'function') {
          // { Kind: { enter() {}, leave() {} } }
          return kindSpecificVisitor;
        }
      } else {
        var specificVisitor = isLeaving ? visitor.leave : visitor.enter;

        if (specificVisitor) {
          if (typeof specificVisitor === 'function') {
            // { enter() {}, leave() {} }
            return specificVisitor;
          }

          var specificKindVisitor = specificVisitor[kind];

          if (typeof specificKindVisitor === 'function') {
            // { enter: { Kind() {} }, leave: { Kind() {} } }
            return specificKindVisitor;
          }
        }
      }
    }

    /**
     * Converts an AST into a string, using one set of reasonable
     * formatting rules.
     */

    function print(ast) {
      return visit(ast, {
        leave: printDocASTReducer
      });
    }
    var MAX_LINE_LENGTH = 80; // TODO: provide better type coverage in future

    var printDocASTReducer = {
      Name: function Name(node) {
        return node.value;
      },
      Variable: function Variable(node) {
        return '$' + node.name;
      },
      // Document
      Document: function Document(node) {
        return join(node.definitions, '\n\n') + '\n';
      },
      OperationDefinition: function OperationDefinition(node) {
        var op = node.operation;
        var name = node.name;
        var varDefs = wrap$1('(', join(node.variableDefinitions, ', '), ')');
        var directives = join(node.directives, ' ');
        var selectionSet = node.selectionSet; // Anonymous queries with no directives or variable definitions can use
        // the query short form.

        return !name && !directives && !varDefs && op === 'query' ? selectionSet : join([op, join([name, varDefs]), directives, selectionSet], ' ');
      },
      VariableDefinition: function VariableDefinition(_ref) {
        var variable = _ref.variable,
            type = _ref.type,
            defaultValue = _ref.defaultValue,
            directives = _ref.directives;
        return variable + ': ' + type + wrap$1(' = ', defaultValue) + wrap$1(' ', join(directives, ' '));
      },
      SelectionSet: function SelectionSet(_ref2) {
        var selections = _ref2.selections;
        return block(selections);
      },
      Field: function Field(_ref3) {
        var alias = _ref3.alias,
            name = _ref3.name,
            args = _ref3.arguments,
            directives = _ref3.directives,
            selectionSet = _ref3.selectionSet;
        var prefix = wrap$1('', alias, ': ') + name;
        var argsLine = prefix + wrap$1('(', join(args, ', '), ')');

        if (argsLine.length > MAX_LINE_LENGTH) {
          argsLine = prefix + wrap$1('(\n', indent(join(args, '\n')), '\n)');
        }

        return join([argsLine, join(directives, ' '), selectionSet], ' ');
      },
      Argument: function Argument(_ref4) {
        var name = _ref4.name,
            value = _ref4.value;
        return name + ': ' + value;
      },
      // Fragments
      FragmentSpread: function FragmentSpread(_ref5) {
        var name = _ref5.name,
            directives = _ref5.directives;
        return '...' + name + wrap$1(' ', join(directives, ' '));
      },
      InlineFragment: function InlineFragment(_ref6) {
        var typeCondition = _ref6.typeCondition,
            directives = _ref6.directives,
            selectionSet = _ref6.selectionSet;
        return join(['...', wrap$1('on ', typeCondition), join(directives, ' '), selectionSet], ' ');
      },
      FragmentDefinition: function FragmentDefinition(_ref7) {
        var name = _ref7.name,
            typeCondition = _ref7.typeCondition,
            variableDefinitions = _ref7.variableDefinitions,
            directives = _ref7.directives,
            selectionSet = _ref7.selectionSet;
        return (// Note: fragment variable definitions are experimental and may be changed
          // or removed in the future.
          "fragment ".concat(name).concat(wrap$1('(', join(variableDefinitions, ', '), ')'), " ") + "on ".concat(typeCondition, " ").concat(wrap$1('', join(directives, ' '), ' ')) + selectionSet
        );
      },
      // Value
      IntValue: function IntValue(_ref8) {
        var value = _ref8.value;
        return value;
      },
      FloatValue: function FloatValue(_ref9) {
        var value = _ref9.value;
        return value;
      },
      StringValue: function StringValue(_ref10, key) {
        var value = _ref10.value,
            isBlockString = _ref10.block;
        return isBlockString ? printBlockString(value, key === 'description' ? '' : '  ') : JSON.stringify(value);
      },
      BooleanValue: function BooleanValue(_ref11) {
        var value = _ref11.value;
        return value ? 'true' : 'false';
      },
      NullValue: function NullValue() {
        return 'null';
      },
      EnumValue: function EnumValue(_ref12) {
        var value = _ref12.value;
        return value;
      },
      ListValue: function ListValue(_ref13) {
        var values = _ref13.values;
        return '[' + join(values, ', ') + ']';
      },
      ObjectValue: function ObjectValue(_ref14) {
        var fields = _ref14.fields;
        return '{' + join(fields, ', ') + '}';
      },
      ObjectField: function ObjectField(_ref15) {
        var name = _ref15.name,
            value = _ref15.value;
        return name + ': ' + value;
      },
      // Directive
      Directive: function Directive(_ref16) {
        var name = _ref16.name,
            args = _ref16.arguments;
        return '@' + name + wrap$1('(', join(args, ', '), ')');
      },
      // Type
      NamedType: function NamedType(_ref17) {
        var name = _ref17.name;
        return name;
      },
      ListType: function ListType(_ref18) {
        var type = _ref18.type;
        return '[' + type + ']';
      },
      NonNullType: function NonNullType(_ref19) {
        var type = _ref19.type;
        return type + '!';
      },
      // Type System Definitions
      SchemaDefinition: addDescription(function (_ref20) {
        var directives = _ref20.directives,
            operationTypes = _ref20.operationTypes;
        return join(['schema', join(directives, ' '), block(operationTypes)], ' ');
      }),
      OperationTypeDefinition: function OperationTypeDefinition(_ref21) {
        var operation = _ref21.operation,
            type = _ref21.type;
        return operation + ': ' + type;
      },
      ScalarTypeDefinition: addDescription(function (_ref22) {
        var name = _ref22.name,
            directives = _ref22.directives;
        return join(['scalar', name, join(directives, ' ')], ' ');
      }),
      ObjectTypeDefinition: addDescription(function (_ref23) {
        var name = _ref23.name,
            interfaces = _ref23.interfaces,
            directives = _ref23.directives,
            fields = _ref23.fields;
        return join(['type', name, wrap$1('implements ', join(interfaces, ' & ')), join(directives, ' '), block(fields)], ' ');
      }),
      FieldDefinition: addDescription(function (_ref24) {
        var name = _ref24.name,
            args = _ref24.arguments,
            type = _ref24.type,
            directives = _ref24.directives;
        return name + (hasMultilineItems(args) ? wrap$1('(\n', indent(join(args, '\n')), '\n)') : wrap$1('(', join(args, ', '), ')')) + ': ' + type + wrap$1(' ', join(directives, ' '));
      }),
      InputValueDefinition: addDescription(function (_ref25) {
        var name = _ref25.name,
            type = _ref25.type,
            defaultValue = _ref25.defaultValue,
            directives = _ref25.directives;
        return join([name + ': ' + type, wrap$1('= ', defaultValue), join(directives, ' ')], ' ');
      }),
      InterfaceTypeDefinition: addDescription(function (_ref26) {
        var name = _ref26.name,
            interfaces = _ref26.interfaces,
            directives = _ref26.directives,
            fields = _ref26.fields;
        return join(['interface', name, wrap$1('implements ', join(interfaces, ' & ')), join(directives, ' '), block(fields)], ' ');
      }),
      UnionTypeDefinition: addDescription(function (_ref27) {
        var name = _ref27.name,
            directives = _ref27.directives,
            types = _ref27.types;
        return join(['union', name, join(directives, ' '), types && types.length !== 0 ? '= ' + join(types, ' | ') : ''], ' ');
      }),
      EnumTypeDefinition: addDescription(function (_ref28) {
        var name = _ref28.name,
            directives = _ref28.directives,
            values = _ref28.values;
        return join(['enum', name, join(directives, ' '), block(values)], ' ');
      }),
      EnumValueDefinition: addDescription(function (_ref29) {
        var name = _ref29.name,
            directives = _ref29.directives;
        return join([name, join(directives, ' ')], ' ');
      }),
      InputObjectTypeDefinition: addDescription(function (_ref30) {
        var name = _ref30.name,
            directives = _ref30.directives,
            fields = _ref30.fields;
        return join(['input', name, join(directives, ' '), block(fields)], ' ');
      }),
      DirectiveDefinition: addDescription(function (_ref31) {
        var name = _ref31.name,
            args = _ref31.arguments,
            repeatable = _ref31.repeatable,
            locations = _ref31.locations;
        return 'directive @' + name + (hasMultilineItems(args) ? wrap$1('(\n', indent(join(args, '\n')), '\n)') : wrap$1('(', join(args, ', '), ')')) + (repeatable ? ' repeatable' : '') + ' on ' + join(locations, ' | ');
      }),
      SchemaExtension: function SchemaExtension(_ref32) {
        var directives = _ref32.directives,
            operationTypes = _ref32.operationTypes;
        return join(['extend schema', join(directives, ' '), block(operationTypes)], ' ');
      },
      ScalarTypeExtension: function ScalarTypeExtension(_ref33) {
        var name = _ref33.name,
            directives = _ref33.directives;
        return join(['extend scalar', name, join(directives, ' ')], ' ');
      },
      ObjectTypeExtension: function ObjectTypeExtension(_ref34) {
        var name = _ref34.name,
            interfaces = _ref34.interfaces,
            directives = _ref34.directives,
            fields = _ref34.fields;
        return join(['extend type', name, wrap$1('implements ', join(interfaces, ' & ')), join(directives, ' '), block(fields)], ' ');
      },
      InterfaceTypeExtension: function InterfaceTypeExtension(_ref35) {
        var name = _ref35.name,
            interfaces = _ref35.interfaces,
            directives = _ref35.directives,
            fields = _ref35.fields;
        return join(['extend interface', name, wrap$1('implements ', join(interfaces, ' & ')), join(directives, ' '), block(fields)], ' ');
      },
      UnionTypeExtension: function UnionTypeExtension(_ref36) {
        var name = _ref36.name,
            directives = _ref36.directives,
            types = _ref36.types;
        return join(['extend union', name, join(directives, ' '), types && types.length !== 0 ? '= ' + join(types, ' | ') : ''], ' ');
      },
      EnumTypeExtension: function EnumTypeExtension(_ref37) {
        var name = _ref37.name,
            directives = _ref37.directives,
            values = _ref37.values;
        return join(['extend enum', name, join(directives, ' '), block(values)], ' ');
      },
      InputObjectTypeExtension: function InputObjectTypeExtension(_ref38) {
        var name = _ref38.name,
            directives = _ref38.directives,
            fields = _ref38.fields;
        return join(['extend input', name, join(directives, ' '), block(fields)], ' ');
      }
    };

    function addDescription(cb) {
      return function (node) {
        return join([node.description, cb(node)], '\n');
      };
    }
    /**
     * Given maybeArray, print an empty string if it is null or empty, otherwise
     * print all items together separated by separator if provided
     */


    function join(maybeArray) {
      var _maybeArray$filter$jo;

      var separator = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
      return (_maybeArray$filter$jo = maybeArray === null || maybeArray === void 0 ? void 0 : maybeArray.filter(function (x) {
        return x;
      }).join(separator)) !== null && _maybeArray$filter$jo !== void 0 ? _maybeArray$filter$jo : '';
    }
    /**
     * Given array, print each item on its own line, wrapped in an
     * indented "{ }" block.
     */


    function block(array) {
      return wrap$1('{\n', indent(join(array, '\n')), '\n}');
    }
    /**
     * If maybeString is not null or empty, then wrap with start and end, otherwise print an empty string.
     */


    function wrap$1(start, maybeString) {
      var end = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
      return maybeString != null && maybeString !== '' ? start + maybeString + end : '';
    }

    function indent(str) {
      return wrap$1('  ', str.replace(/\n/g, '\n  '));
    }

    function isMultiline(str) {
      return str.indexOf('\n') !== -1;
    }

    function hasMultilineItems(maybeArray) {
      return maybeArray != null && maybeArray.some(isMultiline);
    }

    function shouldInclude(_a, variables) {
        var directives = _a.directives;
        if (!directives || !directives.length) {
            return true;
        }
        return getInclusionDirectives(directives).every(function (_a) {
            var directive = _a.directive, ifArgument = _a.ifArgument;
            var evaledValue = false;
            if (ifArgument.value.kind === 'Variable') {
                evaledValue = variables && variables[ifArgument.value.name.value];
                invariant$1(evaledValue !== void 0, "Invalid variable referenced in @" + directive.name.value + " directive.");
            }
            else {
                evaledValue = ifArgument.value.value;
            }
            return directive.name.value === 'skip' ? !evaledValue : evaledValue;
        });
    }
    function getDirectiveNames(root) {
        var names = [];
        visit(root, {
            Directive: function (node) {
                names.push(node.name.value);
            },
        });
        return names;
    }
    function hasDirectives(names, root) {
        return getDirectiveNames(root).some(function (name) { return names.indexOf(name) > -1; });
    }
    function hasClientExports(document) {
        return (document &&
            hasDirectives(['client'], document) &&
            hasDirectives(['export'], document));
    }
    function isInclusionDirective(_a) {
        var value = _a.name.value;
        return value === 'skip' || value === 'include';
    }
    function getInclusionDirectives(directives) {
        var result = [];
        if (directives && directives.length) {
            directives.forEach(function (directive) {
                if (!isInclusionDirective(directive))
                    return;
                var directiveArguments = directive.arguments;
                var directiveName = directive.name.value;
                invariant$1(directiveArguments && directiveArguments.length === 1, "Incorrect number of arguments for the @" + directiveName + " directive.");
                var ifArgument = directiveArguments[0];
                invariant$1(ifArgument.name && ifArgument.name.value === 'if', "Invalid argument for the @" + directiveName + " directive.");
                var ifValue = ifArgument.value;
                invariant$1(ifValue &&
                    (ifValue.kind === 'Variable' || ifValue.kind === 'BooleanValue'), "Argument for the @" + directiveName + " directive must be a variable or a boolean value.");
                result.push({ directive: directive, ifArgument: ifArgument });
            });
        }
        return result;
    }

    function getFragmentQueryDocument(document, fragmentName) {
        var actualFragmentName = fragmentName;
        var fragments = [];
        document.definitions.forEach(function (definition) {
            if (definition.kind === 'OperationDefinition') {
                throw new InvariantError("Found a " + definition.operation + " operation" + (definition.name ? " named '" + definition.name.value + "'" : '') + ". " +
                    'No operations are allowed when using a fragment as a query. Only fragments are allowed.');
            }
            if (definition.kind === 'FragmentDefinition') {
                fragments.push(definition);
            }
        });
        if (typeof actualFragmentName === 'undefined') {
            invariant$1(fragments.length === 1, "Found " + fragments.length + " fragments. `fragmentName` must be provided when there is not exactly 1 fragment.");
            actualFragmentName = fragments[0].name.value;
        }
        var query = __assign$2(__assign$2({}, document), { definitions: __spreadArrays([
                {
                    kind: 'OperationDefinition',
                    operation: 'query',
                    selectionSet: {
                        kind: 'SelectionSet',
                        selections: [
                            {
                                kind: 'FragmentSpread',
                                name: {
                                    kind: 'Name',
                                    value: actualFragmentName,
                                },
                            },
                        ],
                    },
                }
            ], document.definitions) });
        return query;
    }
    function createFragmentMap(fragments) {
        if (fragments === void 0) { fragments = []; }
        var symTable = {};
        fragments.forEach(function (fragment) {
            symTable[fragment.name.value] = fragment;
        });
        return symTable;
    }
    function getFragmentFromSelection(selection, fragmentMap) {
        switch (selection.kind) {
            case 'InlineFragment':
                return selection;
            case 'FragmentSpread': {
                var fragment = fragmentMap && fragmentMap[selection.name.value];
                invariant$1(fragment, "No fragment named " + selection.name.value + ".");
                return fragment;
            }
            default:
                return null;
        }
    }

    var fastJsonStableStringify = function (data, opts) {
        if (!opts) opts = {};
        if (typeof opts === 'function') opts = { cmp: opts };
        var cycles = (typeof opts.cycles === 'boolean') ? opts.cycles : false;

        var cmp = opts.cmp && (function (f) {
            return function (node) {
                return function (a, b) {
                    var aobj = { key: a, value: node[a] };
                    var bobj = { key: b, value: node[b] };
                    return f(aobj, bobj);
                };
            };
        })(opts.cmp);

        var seen = [];
        return (function stringify (node) {
            if (node && node.toJSON && typeof node.toJSON === 'function') {
                node = node.toJSON();
            }

            if (node === undefined) return;
            if (typeof node == 'number') return isFinite(node) ? '' + node : 'null';
            if (typeof node !== 'object') return JSON.stringify(node);

            var i, out;
            if (Array.isArray(node)) {
                out = '[';
                for (i = 0; i < node.length; i++) {
                    if (i) out += ',';
                    out += stringify(node[i]) || 'null';
                }
                return out + ']';
            }

            if (node === null) return 'null';

            if (seen.indexOf(node) !== -1) {
                if (cycles) return JSON.stringify('__cycle__');
                throw new TypeError('Converting circular structure to JSON');
            }

            var seenIndex = seen.push(node) - 1;
            var keys = Object.keys(node).sort(cmp && cmp(node));
            out = '';
            for (i = 0; i < keys.length; i++) {
                var key = keys[i];
                var value = stringify(node[key]);

                if (!value) continue;
                if (out) out += ',';
                out += JSON.stringify(key) + ':' + value;
            }
            seen.splice(seenIndex, 1);
            return '{' + out + '}';
        })(data);
    };

    function makeReference(id) {
        return { __ref: String(id) };
    }
    function isReference(obj) {
        return Boolean(obj && typeof obj === 'object' && typeof obj.__ref === 'string');
    }
    function isStringValue(value) {
        return value.kind === 'StringValue';
    }
    function isBooleanValue(value) {
        return value.kind === 'BooleanValue';
    }
    function isIntValue(value) {
        return value.kind === 'IntValue';
    }
    function isFloatValue(value) {
        return value.kind === 'FloatValue';
    }
    function isVariable(value) {
        return value.kind === 'Variable';
    }
    function isObjectValue(value) {
        return value.kind === 'ObjectValue';
    }
    function isListValue(value) {
        return value.kind === 'ListValue';
    }
    function isEnumValue(value) {
        return value.kind === 'EnumValue';
    }
    function isNullValue(value) {
        return value.kind === 'NullValue';
    }
    function valueToObjectRepresentation(argObj, name, value, variables) {
        if (isIntValue(value) || isFloatValue(value)) {
            argObj[name.value] = Number(value.value);
        }
        else if (isBooleanValue(value) || isStringValue(value)) {
            argObj[name.value] = value.value;
        }
        else if (isObjectValue(value)) {
            var nestedArgObj_1 = {};
            value.fields.map(function (obj) {
                return valueToObjectRepresentation(nestedArgObj_1, obj.name, obj.value, variables);
            });
            argObj[name.value] = nestedArgObj_1;
        }
        else if (isVariable(value)) {
            var variableValue = (variables || {})[value.name.value];
            argObj[name.value] = variableValue;
        }
        else if (isListValue(value)) {
            argObj[name.value] = value.values.map(function (listValue) {
                var nestedArgArrayObj = {};
                valueToObjectRepresentation(nestedArgArrayObj, name, listValue, variables);
                return nestedArgArrayObj[name.value];
            });
        }
        else if (isEnumValue(value)) {
            argObj[name.value] = value.value;
        }
        else if (isNullValue(value)) {
            argObj[name.value] = null;
        }
        else {
            throw new InvariantError("The inline argument \"" + name.value + "\" of kind \"" + value.kind + "\"" +
                'is not supported. Use variables instead of inline arguments to ' +
                'overcome this limitation.');
        }
    }
    function storeKeyNameFromField(field, variables) {
        var directivesObj = null;
        if (field.directives) {
            directivesObj = {};
            field.directives.forEach(function (directive) {
                directivesObj[directive.name.value] = {};
                if (directive.arguments) {
                    directive.arguments.forEach(function (_a) {
                        var name = _a.name, value = _a.value;
                        return valueToObjectRepresentation(directivesObj[directive.name.value], name, value, variables);
                    });
                }
            });
        }
        var argObj = null;
        if (field.arguments && field.arguments.length) {
            argObj = {};
            field.arguments.forEach(function (_a) {
                var name = _a.name, value = _a.value;
                return valueToObjectRepresentation(argObj, name, value, variables);
            });
        }
        return getStoreKeyName(field.name.value, argObj, directivesObj);
    }
    var KNOWN_DIRECTIVES = [
        'connection',
        'include',
        'skip',
        'client',
        'rest',
        'export',
    ];
    function getStoreKeyName(fieldName, args, directives) {
        if (args &&
            directives &&
            directives['connection'] &&
            directives['connection']['key']) {
            if (directives['connection']['filter'] &&
                directives['connection']['filter'].length > 0) {
                var filterKeys = directives['connection']['filter']
                    ? directives['connection']['filter']
                    : [];
                filterKeys.sort();
                var filteredArgs_1 = {};
                filterKeys.forEach(function (key) {
                    filteredArgs_1[key] = args[key];
                });
                return directives['connection']['key'] + "(" + JSON.stringify(filteredArgs_1) + ")";
            }
            else {
                return directives['connection']['key'];
            }
        }
        var completeFieldName = fieldName;
        if (args) {
            var stringifiedArgs = fastJsonStableStringify(args);
            completeFieldName += "(" + stringifiedArgs + ")";
        }
        if (directives) {
            Object.keys(directives).forEach(function (key) {
                if (KNOWN_DIRECTIVES.indexOf(key) !== -1)
                    return;
                if (directives[key] && Object.keys(directives[key]).length) {
                    completeFieldName += "@" + key + "(" + JSON.stringify(directives[key]) + ")";
                }
                else {
                    completeFieldName += "@" + key;
                }
            });
        }
        return completeFieldName;
    }
    function argumentsObjectFromField(field, variables) {
        if (field.arguments && field.arguments.length) {
            var argObj_1 = {};
            field.arguments.forEach(function (_a) {
                var name = _a.name, value = _a.value;
                return valueToObjectRepresentation(argObj_1, name, value, variables);
            });
            return argObj_1;
        }
        return null;
    }
    function resultKeyNameFromField(field) {
        return field.alias ? field.alias.value : field.name.value;
    }
    function getTypenameFromResult(result, selectionSet, fragmentMap) {
        if (typeof result.__typename === 'string') {
            return result.__typename;
        }
        for (var _i = 0, _a = selectionSet.selections; _i < _a.length; _i++) {
            var selection = _a[_i];
            if (isField(selection)) {
                if (selection.name.value === '__typename') {
                    return result[resultKeyNameFromField(selection)];
                }
            }
            else {
                var typename = getTypenameFromResult(result, getFragmentFromSelection(selection, fragmentMap).selectionSet, fragmentMap);
                if (typeof typename === 'string') {
                    return typename;
                }
            }
        }
    }
    function isField(selection) {
        return selection.kind === 'Field';
    }
    function isInlineFragment(selection) {
        return selection.kind === 'InlineFragment';
    }

    function checkDocument(doc) {
        invariant$1(doc && doc.kind === 'Document', "Expecting a parsed GraphQL document. Perhaps you need to wrap the query string in a \"gql\" tag? http://docs.apollostack.com/apollo-client/core.html#gql");
        var operations = doc.definitions
            .filter(function (d) { return d.kind !== 'FragmentDefinition'; })
            .map(function (definition) {
            if (definition.kind !== 'OperationDefinition') {
                throw new InvariantError("Schema type definitions not allowed in queries. Found: \"" + definition.kind + "\"");
            }
            return definition;
        });
        invariant$1(operations.length <= 1, "Ambiguous GraphQL document: contains " + operations.length + " operations");
        return doc;
    }
    function getOperationDefinition(doc) {
        checkDocument(doc);
        return doc.definitions.filter(function (definition) { return definition.kind === 'OperationDefinition'; })[0];
    }
    function getOperationName(doc) {
        return (doc.definitions
            .filter(function (definition) {
            return definition.kind === 'OperationDefinition' && definition.name;
        })
            .map(function (x) { return x.name.value; })[0] || null);
    }
    function getFragmentDefinitions(doc) {
        return doc.definitions.filter(function (definition) { return definition.kind === 'FragmentDefinition'; });
    }
    function getQueryDefinition(doc) {
        var queryDef = getOperationDefinition(doc);
        invariant$1(queryDef && queryDef.operation === 'query', 'Must contain a query definition.');
        return queryDef;
    }
    function getFragmentDefinition(doc) {
        invariant$1(doc.kind === 'Document', "Expecting a parsed GraphQL document. Perhaps you need to wrap the query string in a \"gql\" tag? http://docs.apollostack.com/apollo-client/core.html#gql");
        invariant$1(doc.definitions.length <= 1, 'Fragment must have exactly one definition.');
        var fragmentDef = doc.definitions[0];
        invariant$1(fragmentDef.kind === 'FragmentDefinition', 'Must be a fragment definition.');
        return fragmentDef;
    }
    function getMainDefinition(queryDoc) {
        checkDocument(queryDoc);
        var fragmentDefinition;
        for (var _i = 0, _a = queryDoc.definitions; _i < _a.length; _i++) {
            var definition = _a[_i];
            if (definition.kind === 'OperationDefinition') {
                var operation = definition.operation;
                if (operation === 'query' ||
                    operation === 'mutation' ||
                    operation === 'subscription') {
                    return definition;
                }
            }
            if (definition.kind === 'FragmentDefinition' && !fragmentDefinition) {
                fragmentDefinition = definition;
            }
        }
        if (fragmentDefinition) {
            return fragmentDefinition;
        }
        throw new InvariantError('Expected a parsed GraphQL query with a query, mutation, subscription, or a fragment.');
    }
    function getDefaultValues(definition) {
        var defaultValues = Object.create(null);
        var defs = definition && definition.variableDefinitions;
        if (defs && defs.length) {
            defs.forEach(function (def) {
                if (def.defaultValue) {
                    valueToObjectRepresentation(defaultValues, def.variable.name, def.defaultValue);
                }
            });
        }
        return defaultValues;
    }

    function filterInPlace(array, test, context) {
        var target = 0;
        array.forEach(function (elem, i) {
            if (test.call(this, elem, i, array)) {
                array[target++] = elem;
            }
        }, context);
        array.length = target;
        return array;
    }

    var TYPENAME_FIELD = {
        kind: 'Field',
        name: {
            kind: 'Name',
            value: '__typename',
        },
    };
    function isEmpty(op, fragments) {
        return op.selectionSet.selections.every(function (selection) {
            return selection.kind === 'FragmentSpread' &&
                isEmpty(fragments[selection.name.value], fragments);
        });
    }
    function nullIfDocIsEmpty(doc) {
        return isEmpty(getOperationDefinition(doc) || getFragmentDefinition(doc), createFragmentMap(getFragmentDefinitions(doc)))
            ? null
            : doc;
    }
    function getDirectiveMatcher(directives) {
        return function directiveMatcher(directive) {
            return directives.some(function (dir) {
                return (dir.name && dir.name === directive.name.value) ||
                    (dir.test && dir.test(directive));
            });
        };
    }
    function removeDirectivesFromDocument(directives, doc) {
        var variablesInUse = Object.create(null);
        var variablesToRemove = [];
        var fragmentSpreadsInUse = Object.create(null);
        var fragmentSpreadsToRemove = [];
        var modifiedDoc = nullIfDocIsEmpty(visit(doc, {
            Variable: {
                enter: function (node, _key, parent) {
                    if (parent.kind !== 'VariableDefinition') {
                        variablesInUse[node.name.value] = true;
                    }
                },
            },
            Field: {
                enter: function (node) {
                    if (directives && node.directives) {
                        var shouldRemoveField = directives.some(function (directive) { return directive.remove; });
                        if (shouldRemoveField &&
                            node.directives &&
                            node.directives.some(getDirectiveMatcher(directives))) {
                            if (node.arguments) {
                                node.arguments.forEach(function (arg) {
                                    if (arg.value.kind === 'Variable') {
                                        variablesToRemove.push({
                                            name: arg.value.name.value,
                                        });
                                    }
                                });
                            }
                            if (node.selectionSet) {
                                getAllFragmentSpreadsFromSelectionSet(node.selectionSet).forEach(function (frag) {
                                    fragmentSpreadsToRemove.push({
                                        name: frag.name.value,
                                    });
                                });
                            }
                            return null;
                        }
                    }
                },
            },
            FragmentSpread: {
                enter: function (node) {
                    fragmentSpreadsInUse[node.name.value] = true;
                },
            },
            Directive: {
                enter: function (node) {
                    if (getDirectiveMatcher(directives)(node)) {
                        return null;
                    }
                },
            },
        }));
        if (modifiedDoc &&
            filterInPlace(variablesToRemove, function (v) { return !!v.name && !variablesInUse[v.name]; }).length) {
            modifiedDoc = removeArgumentsFromDocument(variablesToRemove, modifiedDoc);
        }
        if (modifiedDoc &&
            filterInPlace(fragmentSpreadsToRemove, function (fs) { return !!fs.name && !fragmentSpreadsInUse[fs.name]; })
                .length) {
            modifiedDoc = removeFragmentSpreadFromDocument(fragmentSpreadsToRemove, modifiedDoc);
        }
        return modifiedDoc;
    }
    function addTypenameToDocument(doc) {
        return visit(checkDocument(doc), {
            SelectionSet: {
                enter: function (node, _key, parent) {
                    if (parent &&
                        parent.kind === 'OperationDefinition') {
                        return;
                    }
                    var selections = node.selections;
                    if (!selections) {
                        return;
                    }
                    var skip = selections.some(function (selection) {
                        return (isField(selection) &&
                            (selection.name.value === '__typename' ||
                                selection.name.value.lastIndexOf('__', 0) === 0));
                    });
                    if (skip) {
                        return;
                    }
                    var field = parent;
                    if (isField(field) &&
                        field.directives &&
                        field.directives.some(function (d) { return d.name.value === 'export'; })) {
                        return;
                    }
                    return __assign$2(__assign$2({}, node), { selections: __spreadArrays(selections, [TYPENAME_FIELD]) });
                },
            },
        });
    }
    addTypenameToDocument.added = function (field) {
        return field === TYPENAME_FIELD;
    };
    var connectionRemoveConfig = {
        test: function (directive) {
            var willRemove = directive.name.value === 'connection';
            if (willRemove) {
                if (!directive.arguments ||
                    !directive.arguments.some(function (arg) { return arg.name.value === 'key'; })) {
                    invariant$1.warn('Removing an @connection directive even though it does not have a key. ' +
                        'You may want to use the key parameter to specify a store key.');
                }
            }
            return willRemove;
        },
    };
    function removeConnectionDirectiveFromDocument(doc) {
        return removeDirectivesFromDocument([connectionRemoveConfig], checkDocument(doc));
    }
    function getArgumentMatcher(config) {
        return function argumentMatcher(argument) {
            return config.some(function (aConfig) {
                return argument.value &&
                    argument.value.kind === 'Variable' &&
                    argument.value.name &&
                    (aConfig.name === argument.value.name.value ||
                        (aConfig.test && aConfig.test(argument)));
            });
        };
    }
    function removeArgumentsFromDocument(config, doc) {
        var argMatcher = getArgumentMatcher(config);
        return nullIfDocIsEmpty(visit(doc, {
            OperationDefinition: {
                enter: function (node) {
                    return __assign$2(__assign$2({}, node), { variableDefinitions: node.variableDefinitions ? node.variableDefinitions.filter(function (varDef) {
                            return !config.some(function (arg) { return arg.name === varDef.variable.name.value; });
                        }) : [] });
                },
            },
            Field: {
                enter: function (node) {
                    var shouldRemoveField = config.some(function (argConfig) { return argConfig.remove; });
                    if (shouldRemoveField) {
                        var argMatchCount_1 = 0;
                        if (node.arguments) {
                            node.arguments.forEach(function (arg) {
                                if (argMatcher(arg)) {
                                    argMatchCount_1 += 1;
                                }
                            });
                        }
                        if (argMatchCount_1 === 1) {
                            return null;
                        }
                    }
                },
            },
            Argument: {
                enter: function (node) {
                    if (argMatcher(node)) {
                        return null;
                    }
                },
            },
        }));
    }
    function removeFragmentSpreadFromDocument(config, doc) {
        function enter(node) {
            if (config.some(function (def) { return def.name === node.name.value; })) {
                return null;
            }
        }
        return nullIfDocIsEmpty(visit(doc, {
            FragmentSpread: { enter: enter },
            FragmentDefinition: { enter: enter },
        }));
    }
    function getAllFragmentSpreadsFromSelectionSet(selectionSet) {
        var allFragments = [];
        selectionSet.selections.forEach(function (selection) {
            if ((isField(selection) || isInlineFragment(selection)) &&
                selection.selectionSet) {
                getAllFragmentSpreadsFromSelectionSet(selection.selectionSet).forEach(function (frag) { return allFragments.push(frag); });
            }
            else if (selection.kind === 'FragmentSpread') {
                allFragments.push(selection);
            }
        });
        return allFragments;
    }
    function buildQueryFromSelectionSet(document) {
        var definition = getMainDefinition(document);
        var definitionOperation = definition.operation;
        if (definitionOperation === 'query') {
            return document;
        }
        var modifiedDoc = visit(document, {
            OperationDefinition: {
                enter: function (node) {
                    return __assign$2(__assign$2({}, node), { operation: 'query' });
                },
            },
        });
        return modifiedDoc;
    }
    function removeClientSetsFromDocument(document) {
        checkDocument(document);
        var modifiedDoc = removeDirectivesFromDocument([
            {
                test: function (directive) { return directive.name.value === 'client'; },
                remove: true,
            },
        ], document);
        if (modifiedDoc) {
            modifiedDoc = visit(modifiedDoc, {
                FragmentDefinition: {
                    enter: function (node) {
                        if (node.selectionSet) {
                            var isTypenameOnly = node.selectionSet.selections.every(function (selection) {
                                return isField(selection) && selection.name.value === '__typename';
                            });
                            if (isTypenameOnly) {
                                return null;
                            }
                        }
                    },
                },
            });
        }
        return modifiedDoc;
    }

    var hasOwnProperty$4 = Object.prototype.hasOwnProperty;
    function mergeDeep() {
        var sources = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            sources[_i] = arguments[_i];
        }
        return mergeDeepArray(sources);
    }
    function mergeDeepArray(sources) {
        var target = sources[0] || {};
        var count = sources.length;
        if (count > 1) {
            var merger = new DeepMerger();
            for (var i = 1; i < count; ++i) {
                target = merger.merge(target, sources[i]);
            }
        }
        return target;
    }
    function isObject$1(obj) {
        return obj !== null && typeof obj === 'object';
    }
    var defaultReconciler = function (target, source, property) {
        return this.merge(target[property], source[property]);
    };
    var DeepMerger = (function () {
        function DeepMerger(reconciler) {
            if (reconciler === void 0) { reconciler = defaultReconciler; }
            this.reconciler = reconciler;
            this.isObject = isObject$1;
            this.pastCopies = new Set();
        }
        DeepMerger.prototype.merge = function (target, source) {
            var _this = this;
            var context = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                context[_i - 2] = arguments[_i];
            }
            if (isObject$1(source) && isObject$1(target)) {
                Object.keys(source).forEach(function (sourceKey) {
                    if (hasOwnProperty$4.call(target, sourceKey)) {
                        var targetValue = target[sourceKey];
                        if (source[sourceKey] !== targetValue) {
                            var result = _this.reconciler.apply(_this, __spreadArrays([target, source, sourceKey], context));
                            if (result !== targetValue) {
                                target = _this.shallowCopyForMerge(target);
                                target[sourceKey] = result;
                            }
                        }
                    }
                    else {
                        target = _this.shallowCopyForMerge(target);
                        target[sourceKey] = source[sourceKey];
                    }
                });
                return target;
            }
            return source;
        };
        DeepMerger.prototype.shallowCopyForMerge = function (value) {
            if (isObject$1(value) && !this.pastCopies.has(value)) {
                if (Array.isArray(value)) {
                    value = value.slice(0);
                }
                else {
                    value = __assign$2({ __proto__: Object.getPrototypeOf(value) }, value);
                }
                this.pastCopies.add(value);
            }
            return value;
        };
        return DeepMerger;
    }());

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function getDefaultExportFromCjs (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    var Observable_1 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.Observable = void 0;

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

    function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

    // === Symbol Support ===
    var hasSymbols = function () {
      return typeof Symbol === 'function';
    };

    var hasSymbol = function (name) {
      return hasSymbols() && Boolean(Symbol[name]);
    };

    var getSymbol = function (name) {
      return hasSymbol(name) ? Symbol[name] : '@@' + name;
    };

    if (hasSymbols() && !hasSymbol('observable')) {
      Symbol.observable = Symbol('observable');
    }

    var SymbolIterator = getSymbol('iterator');
    var SymbolObservable = getSymbol('observable');
    var SymbolSpecies = getSymbol('species'); // === Abstract Operations ===

    function getMethod(obj, key) {
      var value = obj[key];
      if (value == null) return undefined;
      if (typeof value !== 'function') throw new TypeError(value + ' is not a function');
      return value;
    }

    function getSpecies(obj) {
      var ctor = obj.constructor;

      if (ctor !== undefined) {
        ctor = ctor[SymbolSpecies];

        if (ctor === null) {
          ctor = undefined;
        }
      }

      return ctor !== undefined ? ctor : Observable;
    }

    function isObservable(x) {
      return x instanceof Observable; // SPEC: Brand check
    }

    function hostReportError(e) {
      if (hostReportError.log) {
        hostReportError.log(e);
      } else {
        setTimeout(function () {
          throw e;
        });
      }
    }

    function enqueue(fn) {
      Promise.resolve().then(function () {
        try {
          fn();
        } catch (e) {
          hostReportError(e);
        }
      });
    }

    function cleanupSubscription(subscription) {
      var cleanup = subscription._cleanup;
      if (cleanup === undefined) return;
      subscription._cleanup = undefined;

      if (!cleanup) {
        return;
      }

      try {
        if (typeof cleanup === 'function') {
          cleanup();
        } else {
          var unsubscribe = getMethod(cleanup, 'unsubscribe');

          if (unsubscribe) {
            unsubscribe.call(cleanup);
          }
        }
      } catch (e) {
        hostReportError(e);
      }
    }

    function closeSubscription(subscription) {
      subscription._observer = undefined;
      subscription._queue = undefined;
      subscription._state = 'closed';
    }

    function flushSubscription(subscription) {
      var queue = subscription._queue;

      if (!queue) {
        return;
      }

      subscription._queue = undefined;
      subscription._state = 'ready';

      for (var i = 0; i < queue.length; ++i) {
        notifySubscription(subscription, queue[i].type, queue[i].value);
        if (subscription._state === 'closed') break;
      }
    }

    function notifySubscription(subscription, type, value) {
      subscription._state = 'running';
      var observer = subscription._observer;

      try {
        var m = getMethod(observer, type);

        switch (type) {
          case 'next':
            if (m) m.call(observer, value);
            break;

          case 'error':
            closeSubscription(subscription);
            if (m) m.call(observer, value);else throw value;
            break;

          case 'complete':
            closeSubscription(subscription);
            if (m) m.call(observer);
            break;
        }
      } catch (e) {
        hostReportError(e);
      }

      if (subscription._state === 'closed') cleanupSubscription(subscription);else if (subscription._state === 'running') subscription._state = 'ready';
    }

    function onNotify(subscription, type, value) {
      if (subscription._state === 'closed') return;

      if (subscription._state === 'buffering') {
        subscription._queue.push({
          type: type,
          value: value
        });

        return;
      }

      if (subscription._state !== 'ready') {
        subscription._state = 'buffering';
        subscription._queue = [{
          type: type,
          value: value
        }];
        enqueue(function () {
          return flushSubscription(subscription);
        });
        return;
      }

      notifySubscription(subscription, type, value);
    }

    var Subscription =
    /*#__PURE__*/
    function () {
      function Subscription(observer, subscriber) {
        _classCallCheck(this, Subscription);

        // ASSERT: observer is an object
        // ASSERT: subscriber is callable
        this._cleanup = undefined;
        this._observer = observer;
        this._queue = undefined;
        this._state = 'initializing';
        var subscriptionObserver = new SubscriptionObserver(this);

        try {
          this._cleanup = subscriber.call(undefined, subscriptionObserver);
        } catch (e) {
          subscriptionObserver.error(e);
        }

        if (this._state === 'initializing') this._state = 'ready';
      }

      _createClass(Subscription, [{
        key: "unsubscribe",
        value: function unsubscribe() {
          if (this._state !== 'closed') {
            closeSubscription(this);
            cleanupSubscription(this);
          }
        }
      }, {
        key: "closed",
        get: function () {
          return this._state === 'closed';
        }
      }]);

      return Subscription;
    }();

    var SubscriptionObserver =
    /*#__PURE__*/
    function () {
      function SubscriptionObserver(subscription) {
        _classCallCheck(this, SubscriptionObserver);

        this._subscription = subscription;
      }

      _createClass(SubscriptionObserver, [{
        key: "next",
        value: function next(value) {
          onNotify(this._subscription, 'next', value);
        }
      }, {
        key: "error",
        value: function error(value) {
          onNotify(this._subscription, 'error', value);
        }
      }, {
        key: "complete",
        value: function complete() {
          onNotify(this._subscription, 'complete');
        }
      }, {
        key: "closed",
        get: function () {
          return this._subscription._state === 'closed';
        }
      }]);

      return SubscriptionObserver;
    }();

    var Observable =
    /*#__PURE__*/
    function () {
      function Observable(subscriber) {
        _classCallCheck(this, Observable);

        if (!(this instanceof Observable)) throw new TypeError('Observable cannot be called as a function');
        if (typeof subscriber !== 'function') throw new TypeError('Observable initializer must be a function');
        this._subscriber = subscriber;
      }

      _createClass(Observable, [{
        key: "subscribe",
        value: function subscribe(observer) {
          if (typeof observer !== 'object' || observer === null) {
            observer = {
              next: observer,
              error: arguments[1],
              complete: arguments[2]
            };
          }

          return new Subscription(observer, this._subscriber);
        }
      }, {
        key: "forEach",
        value: function forEach(fn) {
          var _this = this;

          return new Promise(function (resolve, reject) {
            if (typeof fn !== 'function') {
              reject(new TypeError(fn + ' is not a function'));
              return;
            }

            function done() {
              subscription.unsubscribe();
              resolve();
            }

            var subscription = _this.subscribe({
              next: function (value) {
                try {
                  fn(value, done);
                } catch (e) {
                  reject(e);
                  subscription.unsubscribe();
                }
              },
              error: reject,
              complete: resolve
            });
          });
        }
      }, {
        key: "map",
        value: function map(fn) {
          var _this2 = this;

          if (typeof fn !== 'function') throw new TypeError(fn + ' is not a function');
          var C = getSpecies(this);
          return new C(function (observer) {
            return _this2.subscribe({
              next: function (value) {
                try {
                  value = fn(value);
                } catch (e) {
                  return observer.error(e);
                }

                observer.next(value);
              },
              error: function (e) {
                observer.error(e);
              },
              complete: function () {
                observer.complete();
              }
            });
          });
        }
      }, {
        key: "filter",
        value: function filter(fn) {
          var _this3 = this;

          if (typeof fn !== 'function') throw new TypeError(fn + ' is not a function');
          var C = getSpecies(this);
          return new C(function (observer) {
            return _this3.subscribe({
              next: function (value) {
                try {
                  if (!fn(value)) return;
                } catch (e) {
                  return observer.error(e);
                }

                observer.next(value);
              },
              error: function (e) {
                observer.error(e);
              },
              complete: function () {
                observer.complete();
              }
            });
          });
        }
      }, {
        key: "reduce",
        value: function reduce(fn) {
          var _this4 = this;

          if (typeof fn !== 'function') throw new TypeError(fn + ' is not a function');
          var C = getSpecies(this);
          var hasSeed = arguments.length > 1;
          var hasValue = false;
          var seed = arguments[1];
          var acc = seed;
          return new C(function (observer) {
            return _this4.subscribe({
              next: function (value) {
                var first = !hasValue;
                hasValue = true;

                if (!first || hasSeed) {
                  try {
                    acc = fn(acc, value);
                  } catch (e) {
                    return observer.error(e);
                  }
                } else {
                  acc = value;
                }
              },
              error: function (e) {
                observer.error(e);
              },
              complete: function () {
                if (!hasValue && !hasSeed) return observer.error(new TypeError('Cannot reduce an empty sequence'));
                observer.next(acc);
                observer.complete();
              }
            });
          });
        }
      }, {
        key: "concat",
        value: function concat() {
          var _this5 = this;

          for (var _len = arguments.length, sources = new Array(_len), _key = 0; _key < _len; _key++) {
            sources[_key] = arguments[_key];
          }

          var C = getSpecies(this);
          return new C(function (observer) {
            var subscription;
            var index = 0;

            function startNext(next) {
              subscription = next.subscribe({
                next: function (v) {
                  observer.next(v);
                },
                error: function (e) {
                  observer.error(e);
                },
                complete: function () {
                  if (index === sources.length) {
                    subscription = undefined;
                    observer.complete();
                  } else {
                    startNext(C.from(sources[index++]));
                  }
                }
              });
            }

            startNext(_this5);
            return function () {
              if (subscription) {
                subscription.unsubscribe();
                subscription = undefined;
              }
            };
          });
        }
      }, {
        key: "flatMap",
        value: function flatMap(fn) {
          var _this6 = this;

          if (typeof fn !== 'function') throw new TypeError(fn + ' is not a function');
          var C = getSpecies(this);
          return new C(function (observer) {
            var subscriptions = [];

            var outer = _this6.subscribe({
              next: function (value) {
                if (fn) {
                  try {
                    value = fn(value);
                  } catch (e) {
                    return observer.error(e);
                  }
                }

                var inner = C.from(value).subscribe({
                  next: function (value) {
                    observer.next(value);
                  },
                  error: function (e) {
                    observer.error(e);
                  },
                  complete: function () {
                    var i = subscriptions.indexOf(inner);
                    if (i >= 0) subscriptions.splice(i, 1);
                    completeIfDone();
                  }
                });
                subscriptions.push(inner);
              },
              error: function (e) {
                observer.error(e);
              },
              complete: function () {
                completeIfDone();
              }
            });

            function completeIfDone() {
              if (outer.closed && subscriptions.length === 0) observer.complete();
            }

            return function () {
              subscriptions.forEach(function (s) {
                return s.unsubscribe();
              });
              outer.unsubscribe();
            };
          });
        }
      }, {
        key: SymbolObservable,
        value: function () {
          return this;
        }
      }], [{
        key: "from",
        value: function from(x) {
          var C = typeof this === 'function' ? this : Observable;
          if (x == null) throw new TypeError(x + ' is not an object');
          var method = getMethod(x, SymbolObservable);

          if (method) {
            var observable = method.call(x);
            if (Object(observable) !== observable) throw new TypeError(observable + ' is not an object');
            if (isObservable(observable) && observable.constructor === C) return observable;
            return new C(function (observer) {
              return observable.subscribe(observer);
            });
          }

          if (hasSymbol('iterator')) {
            method = getMethod(x, SymbolIterator);

            if (method) {
              return new C(function (observer) {
                enqueue(function () {
                  if (observer.closed) return;
                  var _iteratorNormalCompletion = true;
                  var _didIteratorError = false;
                  var _iteratorError = undefined;

                  try {
                    for (var _iterator = method.call(x)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                      var _item = _step.value;
                      observer.next(_item);
                      if (observer.closed) return;
                    }
                  } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                  } finally {
                    try {
                      if (!_iteratorNormalCompletion && _iterator.return != null) {
                        _iterator.return();
                      }
                    } finally {
                      if (_didIteratorError) {
                        throw _iteratorError;
                      }
                    }
                  }

                  observer.complete();
                });
              });
            }
          }

          if (Array.isArray(x)) {
            return new C(function (observer) {
              enqueue(function () {
                if (observer.closed) return;

                for (var i = 0; i < x.length; ++i) {
                  observer.next(x[i]);
                  if (observer.closed) return;
                }

                observer.complete();
              });
            });
          }

          throw new TypeError(x + ' is not observable');
        }
      }, {
        key: "of",
        value: function of() {
          for (var _len2 = arguments.length, items = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            items[_key2] = arguments[_key2];
          }

          var C = typeof this === 'function' ? this : Observable;
          return new C(function (observer) {
            enqueue(function () {
              if (observer.closed) return;

              for (var i = 0; i < items.length; ++i) {
                observer.next(items[i]);
                if (observer.closed) return;
              }

              observer.complete();
            });
          });
        }
      }, {
        key: SymbolSpecies,
        get: function () {
          return this;
        }
      }]);

      return Observable;
    }();

    exports.Observable = Observable;

    if (hasSymbols()) {
      Object.defineProperty(Observable, Symbol('extensions'), {
        value: {
          symbol: SymbolObservable,
          hostReportError: hostReportError
        },
        configurable: true
      });
    }
    });

    var zenObservable = Observable_1.Observable;

    function symbolObservablePonyfill(root) {
    	var result;
    	var Symbol = root.Symbol;

    	if (typeof Symbol === 'function') {
    		if (Symbol.observable) {
    			result = Symbol.observable;
    		} else {

    			// This just needs to be something that won't trample other user's Symbol.for use
    			// It also will guide people to the source of their issues, if this is problematic.
    			// META: It's a resource locator!
    			result = Symbol.for('https://github.com/benlesh/symbol-observable');
    			try {
    				Symbol.observable = result;
    			} catch (err) {
    				// Do nothing. In some environments, users have frozen `Symbol` for security reasons,
    				// if it is frozen assigning to it will throw. In this case, we don't care, because
    				// they will need to use the returned value from the ponyfill.
    			}
    		}
    	} else {
    		result = '@@observable';
    	}

    	return result;
    }

    /* global window */

    var root;

    if (typeof self !== 'undefined') {
      root = self;
    } else if (typeof window !== 'undefined') {
      root = window;
    } else if (typeof global !== 'undefined') {
      root = global;
    } else if (typeof module !== 'undefined') {
      root = module;
    } else {
      root = Function('return this')();
    }

    symbolObservablePonyfill(root);

    var prototype = zenObservable.prototype;
    var fakeObsSymbol = '@@observable';
    if (!prototype[fakeObsSymbol]) {
        prototype[fakeObsSymbol] = function () { return this; };
    }

    var toString$1 = Object.prototype.toString;
    function cloneDeep(value) {
        return cloneDeepHelper(value);
    }
    function cloneDeepHelper(val, seen) {
        switch (toString$1.call(val)) {
            case "[object Array]": {
                seen = seen || new Map;
                if (seen.has(val))
                    return seen.get(val);
                var copy_1 = val.slice(0);
                seen.set(val, copy_1);
                copy_1.forEach(function (child, i) {
                    copy_1[i] = cloneDeepHelper(child, seen);
                });
                return copy_1;
            }
            case "[object Object]": {
                seen = seen || new Map;
                if (seen.has(val))
                    return seen.get(val);
                var copy_2 = Object.create(Object.getPrototypeOf(val));
                seen.set(val, copy_2);
                Object.keys(val).forEach(function (key) {
                    copy_2[key] = cloneDeepHelper(val[key], seen);
                });
                return copy_2;
            }
            default:
                return val;
        }
    }

    function getEnv() {
        if (typeof process !== 'undefined' && "development") {
            return "development";
        }
        return 'development';
    }
    function isEnv(env) {
        return getEnv() === env;
    }
    function isDevelopment() {
        return isEnv('development') === true;
    }
    function isTest() {
        return isEnv('test') === true;
    }

    function isObject(value) {
        return value !== null && typeof value === "object";
    }
    function deepFreeze(value) {
        var workSet = new Set([value]);
        workSet.forEach(function (obj) {
            if (isObject(obj)) {
                if (!Object.isFrozen(obj))
                    Object.freeze(obj);
                Object.getOwnPropertyNames(obj).forEach(function (name) {
                    if (isObject(obj[name]))
                        workSet.add(obj[name]);
                });
            }
        });
        return value;
    }
    function maybeDeepFreeze(obj) {
        if ((isDevelopment() || isTest())) {
            deepFreeze(obj);
        }
        return obj;
    }

    function iterateObserversSafely(observers, method, argument) {
        var observersWithMethod = [];
        observers.forEach(function (obs) { return obs[method] && observersWithMethod.push(obs); });
        observersWithMethod.forEach(function (obs) { return obs[method](argument); });
    }

    function asyncMap(observable, mapFn, catchFn) {
        return new zenObservable(function (observer) {
            var next = observer.next, error = observer.error, complete = observer.complete;
            var activeCallbackCount = 0;
            var completed = false;
            var promiseQueue = {
                then: function (callback) {
                    return new Promise(function (resolve) { return resolve(callback()); });
                },
            };
            function makeCallback(examiner, delegate) {
                if (examiner) {
                    return function (arg) {
                        ++activeCallbackCount;
                        var both = function () { return examiner(arg); };
                        promiseQueue = promiseQueue.then(both, both).then(function (result) {
                            --activeCallbackCount;
                            next && next.call(observer, result);
                            if (completed) {
                                handler.complete();
                            }
                        }, function (error) {
                            --activeCallbackCount;
                            throw error;
                        }).catch(function (caught) {
                            error && error.call(observer, caught);
                        });
                    };
                }
                else {
                    return function (arg) { return delegate && delegate.call(observer, arg); };
                }
            }
            var handler = {
                next: makeCallback(mapFn, next),
                error: makeCallback(catchFn, error),
                complete: function () {
                    completed = true;
                    if (!activeCallbackCount) {
                        complete && complete.call(observer);
                    }
                },
            };
            var sub = observable.subscribe(handler);
            return function () { return sub.unsubscribe(); };
        });
    }

    function fixObservableSubclass(subclass) {
        function set(key) {
            Object.defineProperty(subclass, key, { value: zenObservable });
        }
        if (typeof Symbol === "function" && Symbol.species) {
            set(Symbol.species);
        }
        set("@@species");
        return subclass;
    }

    function isPromiseLike(value) {
        return value && typeof value.then === "function";
    }
    var Concast = (function (_super) {
        __extends$1(Concast, _super);
        function Concast(sources) {
            var _this = _super.call(this, function (observer) {
                _this.addObserver(observer);
                return function () { return _this.removeObserver(observer); };
            }) || this;
            _this.observers = new Set();
            _this.addCount = 0;
            _this.promise = new Promise(function (resolve, reject) {
                _this.resolve = resolve;
                _this.reject = reject;
            });
            _this.handlers = {
                next: function (result) {
                    if (_this.sub !== null) {
                        _this.latest = ["next", result];
                        iterateObserversSafely(_this.observers, "next", result);
                    }
                },
                error: function (error) {
                    var sub = _this.sub;
                    if (sub !== null) {
                        if (sub)
                            Promise.resolve().then(function () { return sub.unsubscribe(); });
                        _this.sub = null;
                        _this.latest = ["error", error];
                        _this.reject(error);
                        iterateObserversSafely(_this.observers, "error", error);
                    }
                },
                complete: function () {
                    if (_this.sub !== null) {
                        var value = _this.sources.shift();
                        if (!value) {
                            _this.sub = null;
                            if (_this.latest &&
                                _this.latest[0] === "next") {
                                _this.resolve(_this.latest[1]);
                            }
                            else {
                                _this.resolve();
                            }
                            iterateObserversSafely(_this.observers, "complete");
                        }
                        else if (isPromiseLike(value)) {
                            value.then(function (obs) { return _this.sub = obs.subscribe(_this.handlers); });
                        }
                        else {
                            _this.sub = value.subscribe(_this.handlers);
                        }
                    }
                },
            };
            _this.cancel = function (reason) {
                _this.reject(reason);
                _this.sources = [];
                _this.handlers.complete();
            };
            _this.promise.catch(function (_) { });
            if (typeof sources === "function") {
                sources = [new zenObservable(sources)];
            }
            if (isPromiseLike(sources)) {
                sources.then(function (iterable) { return _this.start(iterable); }, _this.handlers.error);
            }
            else {
                _this.start(sources);
            }
            return _this;
        }
        Concast.prototype.start = function (sources) {
            if (this.sub !== void 0)
                return;
            this.sources = Array.from(sources);
            this.handlers.complete();
        };
        Concast.prototype.deliverLastMessage = function (observer) {
            if (this.latest) {
                var nextOrError = this.latest[0];
                var method = observer[nextOrError];
                if (method) {
                    method.call(observer, this.latest[1]);
                }
                if (this.sub === null &&
                    nextOrError === "next" &&
                    observer.complete) {
                    observer.complete();
                }
            }
        };
        Concast.prototype.addObserver = function (observer) {
            if (!this.observers.has(observer)) {
                this.deliverLastMessage(observer);
                this.observers.add(observer);
                ++this.addCount;
            }
        };
        Concast.prototype.removeObserver = function (observer, quietly) {
            if (this.observers.delete(observer) &&
                --this.addCount < 1 &&
                !quietly) {
                this.handlers.error(new Error("Observable cancelled prematurely"));
            }
        };
        Concast.prototype.cleanup = function (callback) {
            var _this = this;
            var called = false;
            var once = function () {
                if (!called) {
                    called = true;
                    _this.observers.delete(observer);
                    callback();
                }
            };
            var observer = {
                next: once,
                error: once,
                complete: once,
            };
            var count = this.addCount;
            this.addObserver(observer);
            this.addCount = count;
        };
        return Concast;
    }(zenObservable));
    fixObservableSubclass(Concast);

    function isNonEmptyArray(value) {
        return Array.isArray(value) && value.length > 0;
    }

    function graphQLResultHasError(result) {
        return (result.errors && result.errors.length > 0) || false;
    }

    var canUseWeakMap = typeof WeakMap === 'function' && !(typeof navigator === 'object' &&
        navigator.product === 'ReactNative');

    function compact() {
        var objects = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            objects[_i] = arguments[_i];
        }
        var result = Object.create(null);
        objects.forEach(function (obj) {
            if (!obj)
                return;
            Object.keys(obj).forEach(function (key) {
                var value = obj[key];
                if (value !== void 0) {
                    result[key] = value;
                }
            });
        });
        return result;
    }

    function fromError(errorValue) {
        return new zenObservable(function (observer) {
            observer.error(errorValue);
        });
    }

    var throwServerError = function (response, result, message) {
        var error = new Error(message);
        error.name = 'ServerError';
        error.response = response;
        error.statusCode = response.status;
        error.result = result;
        throw error;
    };

    function validateOperation(operation) {
        var OPERATION_FIELDS = [
            'query',
            'operationName',
            'variables',
            'extensions',
            'context',
        ];
        for (var _i = 0, _a = Object.keys(operation); _i < _a.length; _i++) {
            var key = _a[_i];
            if (OPERATION_FIELDS.indexOf(key) < 0) {
                throw new InvariantError("illegal argument: " + key);
            }
        }
        return operation;
    }

    function createOperation(starting, operation) {
        var context = __assign$2({}, starting);
        var setContext = function (next) {
            if (typeof next === 'function') {
                context = __assign$2(__assign$2({}, context), next(context));
            }
            else {
                context = __assign$2(__assign$2({}, context), next);
            }
        };
        var getContext = function () { return (__assign$2({}, context)); };
        Object.defineProperty(operation, 'setContext', {
            enumerable: false,
            value: setContext,
        });
        Object.defineProperty(operation, 'getContext', {
            enumerable: false,
            value: getContext,
        });
        return operation;
    }

    function transformOperation(operation) {
        var transformedOperation = {
            variables: operation.variables || {},
            extensions: operation.extensions || {},
            operationName: operation.operationName,
            query: operation.query,
        };
        if (!transformedOperation.operationName) {
            transformedOperation.operationName =
                typeof transformedOperation.query !== 'string'
                    ? getOperationName(transformedOperation.query) || undefined
                    : '';
        }
        return transformedOperation;
    }

    function passthrough(op, forward) {
        return (forward ? forward(op) : zenObservable.of());
    }
    function toLink(handler) {
        return typeof handler === 'function' ? new ApolloLink(handler) : handler;
    }
    function isTerminating(link) {
        return link.request.length <= 1;
    }
    var LinkError = (function (_super) {
        __extends$1(LinkError, _super);
        function LinkError(message, link) {
            var _this = _super.call(this, message) || this;
            _this.link = link;
            return _this;
        }
        return LinkError;
    }(Error));
    var ApolloLink = (function () {
        function ApolloLink(request) {
            if (request)
                this.request = request;
        }
        ApolloLink.empty = function () {
            return new ApolloLink(function () { return zenObservable.of(); });
        };
        ApolloLink.from = function (links) {
            if (links.length === 0)
                return ApolloLink.empty();
            return links.map(toLink).reduce(function (x, y) { return x.concat(y); });
        };
        ApolloLink.split = function (test, left, right) {
            var leftLink = toLink(left);
            var rightLink = toLink(right || new ApolloLink(passthrough));
            if (isTerminating(leftLink) && isTerminating(rightLink)) {
                return new ApolloLink(function (operation) {
                    return test(operation)
                        ? leftLink.request(operation) || zenObservable.of()
                        : rightLink.request(operation) || zenObservable.of();
                });
            }
            else {
                return new ApolloLink(function (operation, forward) {
                    return test(operation)
                        ? leftLink.request(operation, forward) || zenObservable.of()
                        : rightLink.request(operation, forward) || zenObservable.of();
                });
            }
        };
        ApolloLink.execute = function (link, operation) {
            return (link.request(createOperation(operation.context, transformOperation(validateOperation(operation)))) || zenObservable.of());
        };
        ApolloLink.concat = function (first, second) {
            var firstLink = toLink(first);
            if (isTerminating(firstLink)) {
                invariant$1.warn(new LinkError("You are calling concat on a terminating link, which will have no effect", firstLink));
                return firstLink;
            }
            var nextLink = toLink(second);
            if (isTerminating(nextLink)) {
                return new ApolloLink(function (operation) {
                    return firstLink.request(operation, function (op) { return nextLink.request(op) || zenObservable.of(); }) || zenObservable.of();
                });
            }
            else {
                return new ApolloLink(function (operation, forward) {
                    return (firstLink.request(operation, function (op) {
                        return nextLink.request(op, forward) || zenObservable.of();
                    }) || zenObservable.of());
                });
            }
        };
        ApolloLink.prototype.split = function (test, left, right) {
            return this.concat(ApolloLink.split(test, left, right || new ApolloLink(passthrough)));
        };
        ApolloLink.prototype.concat = function (next) {
            return ApolloLink.concat(this, next);
        };
        ApolloLink.prototype.request = function (operation, forward) {
            throw new InvariantError('request is not implemented');
        };
        ApolloLink.prototype.onError = function (error, observer) {
            if (observer && observer.error) {
                observer.error(error);
                return false;
            }
            throw error;
        };
        ApolloLink.prototype.setOnError = function (fn) {
            this.onError = fn;
            return this;
        };
        return ApolloLink;
    }());

    var execute = ApolloLink.execute;

    var version = '3.3.19';

    var hasOwnProperty$3 = Object.prototype.hasOwnProperty;
    function parseAndCheckHttpResponse(operations) {
        return function (response) { return response
            .text()
            .then(function (bodyText) {
            try {
                return JSON.parse(bodyText);
            }
            catch (err) {
                var parseError = err;
                parseError.name = 'ServerParseError';
                parseError.response = response;
                parseError.statusCode = response.status;
                parseError.bodyText = bodyText;
                throw parseError;
            }
        })
            .then(function (result) {
            if (response.status >= 300) {
                throwServerError(response, result, "Response not successful: Received status code " + response.status);
            }
            if (!Array.isArray(result) &&
                !hasOwnProperty$3.call(result, 'data') &&
                !hasOwnProperty$3.call(result, 'errors')) {
                throwServerError(response, result, "Server response was missing for query '" + (Array.isArray(operations)
                    ? operations.map(function (op) { return op.operationName; })
                    : operations.operationName) + "'.");
            }
            return result;
        }); };
    }

    var serializeFetchParameter = function (p, label) {
        var serialized;
        try {
            serialized = JSON.stringify(p);
        }
        catch (e) {
            var parseError = new InvariantError("Network request failed. " + label + " is not serializable: " + e.message);
            parseError.parseError = e;
            throw parseError;
        }
        return serialized;
    };

    var defaultHttpOptions = {
        includeQuery: true,
        includeExtensions: false,
    };
    var defaultHeaders = {
        accept: '*/*',
        'content-type': 'application/json',
    };
    var defaultOptions = {
        method: 'POST',
    };
    var fallbackHttpConfig = {
        http: defaultHttpOptions,
        headers: defaultHeaders,
        options: defaultOptions,
    };
    var selectHttpOptionsAndBody = function (operation, fallbackConfig) {
        var configs = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            configs[_i - 2] = arguments[_i];
        }
        var options = __assign$2(__assign$2({}, fallbackConfig.options), { headers: fallbackConfig.headers, credentials: fallbackConfig.credentials });
        var http = fallbackConfig.http || {};
        configs.forEach(function (config) {
            options = __assign$2(__assign$2(__assign$2({}, options), config.options), { headers: __assign$2(__assign$2({}, options.headers), config.headers) });
            if (config.credentials)
                options.credentials = config.credentials;
            http = __assign$2(__assign$2({}, http), config.http);
        });
        var operationName = operation.operationName, extensions = operation.extensions, variables = operation.variables, query = operation.query;
        var body = { operationName: operationName, variables: variables };
        if (http.includeExtensions)
            body.extensions = extensions;
        if (http.includeQuery)
            body.query = print(query);
        return {
            options: options,
            body: body,
        };
    };

    var checkFetcher = function (fetcher) {
        if (!fetcher && typeof fetch === 'undefined') {
            throw new InvariantError("\n\"fetch\" has not been found globally and no fetcher has been configured. To fix this, install a fetch package (like https://www.npmjs.com/package/cross-fetch), instantiate the fetcher, and pass it into your HttpLink constructor. For example:\n\nimport fetch from 'cross-fetch';\nimport { ApolloClient, HttpLink } from '@apollo/client';\nconst client = new ApolloClient({\n  link: new HttpLink({ uri: '/graphql', fetch })\n});\n    ");
        }
    };

    var createSignalIfSupported = function () {
        if (typeof AbortController === 'undefined')
            return { controller: false, signal: false };
        var controller = new AbortController();
        var signal = controller.signal;
        return { controller: controller, signal: signal };
    };

    var selectURI = function (operation, fallbackURI) {
        var context = operation.getContext();
        var contextURI = context.uri;
        if (contextURI) {
            return contextURI;
        }
        else if (typeof fallbackURI === 'function') {
            return fallbackURI(operation);
        }
        else {
            return fallbackURI || '/graphql';
        }
    };

    function rewriteURIForGET(chosenURI, body) {
        var queryParams = [];
        var addQueryParam = function (key, value) {
            queryParams.push(key + "=" + encodeURIComponent(value));
        };
        if ('query' in body) {
            addQueryParam('query', body.query);
        }
        if (body.operationName) {
            addQueryParam('operationName', body.operationName);
        }
        if (body.variables) {
            var serializedVariables = void 0;
            try {
                serializedVariables = serializeFetchParameter(body.variables, 'Variables map');
            }
            catch (parseError) {
                return { parseError: parseError };
            }
            addQueryParam('variables', serializedVariables);
        }
        if (body.extensions) {
            var serializedExtensions = void 0;
            try {
                serializedExtensions = serializeFetchParameter(body.extensions, 'Extensions map');
            }
            catch (parseError) {
                return { parseError: parseError };
            }
            addQueryParam('extensions', serializedExtensions);
        }
        var fragment = '', preFragment = chosenURI;
        var fragmentStart = chosenURI.indexOf('#');
        if (fragmentStart !== -1) {
            fragment = chosenURI.substr(fragmentStart);
            preFragment = chosenURI.substr(0, fragmentStart);
        }
        var queryParamsPrefix = preFragment.indexOf('?') === -1 ? '?' : '&';
        var newURI = preFragment + queryParamsPrefix + queryParams.join('&') + fragment;
        return { newURI: newURI };
    }

    var createHttpLink = function (linkOptions) {
        if (linkOptions === void 0) { linkOptions = {}; }
        var _a = linkOptions.uri, uri = _a === void 0 ? '/graphql' : _a, fetcher = linkOptions.fetch, includeExtensions = linkOptions.includeExtensions, useGETForQueries = linkOptions.useGETForQueries, _b = linkOptions.includeUnusedVariables, includeUnusedVariables = _b === void 0 ? false : _b, requestOptions = __rest(linkOptions, ["uri", "fetch", "includeExtensions", "useGETForQueries", "includeUnusedVariables"]);
        checkFetcher(fetcher);
        if (!fetcher) {
            fetcher = fetch;
        }
        var linkConfig = {
            http: { includeExtensions: includeExtensions },
            options: requestOptions.fetchOptions,
            credentials: requestOptions.credentials,
            headers: requestOptions.headers,
        };
        return new ApolloLink(function (operation) {
            var chosenURI = selectURI(operation, uri);
            var context = operation.getContext();
            var clientAwarenessHeaders = {};
            if (context.clientAwareness) {
                var _a = context.clientAwareness, name_1 = _a.name, version = _a.version;
                if (name_1) {
                    clientAwarenessHeaders['apollographql-client-name'] = name_1;
                }
                if (version) {
                    clientAwarenessHeaders['apollographql-client-version'] = version;
                }
            }
            var contextHeaders = __assign$2(__assign$2({}, clientAwarenessHeaders), context.headers);
            var contextConfig = {
                http: context.http,
                options: context.fetchOptions,
                credentials: context.credentials,
                headers: contextHeaders,
            };
            var _b = selectHttpOptionsAndBody(operation, fallbackHttpConfig, linkConfig, contextConfig), options = _b.options, body = _b.body;
            if (body.variables && !includeUnusedVariables) {
                var unusedNames_1 = new Set(Object.keys(body.variables));
                visit(operation.query, {
                    Variable: function (node, _key, parent) {
                        if (parent && parent.kind !== 'VariableDefinition') {
                            unusedNames_1.delete(node.name.value);
                        }
                    },
                });
                if (unusedNames_1.size) {
                    body.variables = __assign$2({}, body.variables);
                    unusedNames_1.forEach(function (name) {
                        delete body.variables[name];
                    });
                }
            }
            var controller;
            if (!options.signal) {
                var _c = createSignalIfSupported(), _controller = _c.controller, signal = _c.signal;
                controller = _controller;
                if (controller)
                    options.signal = signal;
            }
            var definitionIsMutation = function (d) {
                return d.kind === 'OperationDefinition' && d.operation === 'mutation';
            };
            if (useGETForQueries &&
                !operation.query.definitions.some(definitionIsMutation)) {
                options.method = 'GET';
            }
            if (options.method === 'GET') {
                var _d = rewriteURIForGET(chosenURI, body), newURI = _d.newURI, parseError = _d.parseError;
                if (parseError) {
                    return fromError(parseError);
                }
                chosenURI = newURI;
            }
            else {
                try {
                    options.body = serializeFetchParameter(body, 'Payload');
                }
                catch (parseError) {
                    return fromError(parseError);
                }
            }
            return new zenObservable(function (observer) {
                fetcher(chosenURI, options)
                    .then(function (response) {
                    operation.setContext({ response: response });
                    return response;
                })
                    .then(parseAndCheckHttpResponse(operation))
                    .then(function (result) {
                    observer.next(result);
                    observer.complete();
                    return result;
                })
                    .catch(function (err) {
                    if (err.name === 'AbortError')
                        return;
                    if (err.result && err.result.errors && err.result.data) {
                        observer.next(err.result);
                    }
                    observer.error(err);
                });
                return function () {
                    if (controller)
                        controller.abort();
                };
            });
        });
    };

    var HttpLink = (function (_super) {
        __extends$1(HttpLink, _super);
        function HttpLink(options) {
            if (options === void 0) { options = {}; }
            var _this = _super.call(this, createHttpLink(options).request) || this;
            _this.options = options;
            return _this;
        }
        return HttpLink;
    }(ApolloLink));

    var _a$2 = Object.prototype, toString = _a$2.toString, hasOwnProperty$2 = _a$2.hasOwnProperty;
    var fnToStr = Function.prototype.toString;
    var previousComparisons = new Map();
    /**
     * Performs a deep equality check on two JavaScript values, tolerating cycles.
     */
    function equal(a, b) {
        try {
            return check(a, b);
        }
        finally {
            previousComparisons.clear();
        }
    }
    function check(a, b) {
        // If the two values are strictly equal, our job is easy.
        if (a === b) {
            return true;
        }
        // Object.prototype.toString returns a representation of the runtime type of
        // the given value that is considerably more precise than typeof.
        var aTag = toString.call(a);
        var bTag = toString.call(b);
        // If the runtime types of a and b are different, they could maybe be equal
        // under some interpretation of equality, but for simplicity and performance
        // we just return false instead.
        if (aTag !== bTag) {
            return false;
        }
        switch (aTag) {
            case '[object Array]':
                // Arrays are a lot like other objects, but we can cheaply compare their
                // lengths as a short-cut before comparing their elements.
                if (a.length !== b.length)
                    return false;
            // Fall through to object case...
            case '[object Object]': {
                if (previouslyCompared(a, b))
                    return true;
                var aKeys = definedKeys(a);
                var bKeys = definedKeys(b);
                // If `a` and `b` have a different number of enumerable keys, they
                // must be different.
                var keyCount = aKeys.length;
                if (keyCount !== bKeys.length)
                    return false;
                // Now make sure they have the same keys.
                for (var k = 0; k < keyCount; ++k) {
                    if (!hasOwnProperty$2.call(b, aKeys[k])) {
                        return false;
                    }
                }
                // Finally, check deep equality of all child properties.
                for (var k = 0; k < keyCount; ++k) {
                    var key = aKeys[k];
                    if (!check(a[key], b[key])) {
                        return false;
                    }
                }
                return true;
            }
            case '[object Error]':
                return a.name === b.name && a.message === b.message;
            case '[object Number]':
                // Handle NaN, which is !== itself.
                if (a !== a)
                    return b !== b;
            // Fall through to shared +a === +b case...
            case '[object Boolean]':
            case '[object Date]':
                return +a === +b;
            case '[object RegExp]':
            case '[object String]':
                return a == "" + b;
            case '[object Map]':
            case '[object Set]': {
                if (a.size !== b.size)
                    return false;
                if (previouslyCompared(a, b))
                    return true;
                var aIterator = a.entries();
                var isMap = aTag === '[object Map]';
                while (true) {
                    var info = aIterator.next();
                    if (info.done)
                        break;
                    // If a instanceof Set, aValue === aKey.
                    var _a = info.value, aKey = _a[0], aValue = _a[1];
                    // So this works the same way for both Set and Map.
                    if (!b.has(aKey)) {
                        return false;
                    }
                    // However, we care about deep equality of values only when dealing
                    // with Map structures.
                    if (isMap && !check(aValue, b.get(aKey))) {
                        return false;
                    }
                }
                return true;
            }
            case '[object AsyncFunction]':
            case '[object GeneratorFunction]':
            case '[object AsyncGeneratorFunction]':
            case '[object Function]': {
                var aCode = fnToStr.call(a);
                if (aCode !== fnToStr.call(b)) {
                    return false;
                }
                // We consider non-native functions equal if they have the same code
                // (native functions require === because their code is censored).
                // Note that this behavior is not entirely sound, since !== function
                // objects with the same code can behave differently depending on
                // their closure scope. However, any function can behave differently
                // depending on the values of its input arguments (including this)
                // and its calling context (including its closure scope), even
                // though the function object is === to itself; and it is entirely
                // possible for functions that are not === to behave exactly the
                // same under all conceivable circumstances. Because none of these
                // factors are statically decidable in JavaScript, JS function
                // equality is not well-defined. This ambiguity allows us to
                // consider the best possible heuristic among various imperfect
                // options, and equating non-native functions that have the same
                // code has enormous practical benefits, such as when comparing
                // functions that are repeatedly passed as fresh function
                // expressions within objects that are otherwise deeply equal. Since
                // any function created from the same syntactic expression (in the
                // same code location) will always stringify to the same code
                // according to fnToStr.call, we can reasonably expect these
                // repeatedly passed function expressions to have the same code, and
                // thus behave "the same" (with all the caveats mentioned above),
                // even though the runtime function objects are !== to one another.
                return !endsWith(aCode, nativeCodeSuffix);
            }
        }
        // Otherwise the values are not equal.
        return false;
    }
    function definedKeys(obj) {
        // Remember that the second argument to Array.prototype.filter will be
        // used as `this` within the callback function.
        return Object.keys(obj).filter(isDefinedKey, obj);
    }
    function isDefinedKey(key) {
        return this[key] !== void 0;
    }
    var nativeCodeSuffix = "{ [native code] }";
    function endsWith(full, suffix) {
        var fromIndex = full.length - suffix.length;
        return fromIndex >= 0 &&
            full.indexOf(suffix, fromIndex) === fromIndex;
    }
    function previouslyCompared(a, b) {
        // Though cyclic references can make an object graph appear infinite from the
        // perspective of a depth-first traversal, the graph still contains a finite
        // number of distinct object references. We use the previousComparisons cache
        // to avoid comparing the same pair of object references more than once, which
        // guarantees termination (even if we end up comparing every object in one
        // graph to every object in the other graph, which is extremely unlikely),
        // while still allowing weird isomorphic structures (like rings with different
        // lengths) a chance to pass the equality test.
        var bSet = previousComparisons.get(a);
        if (bSet) {
            // Return true here because we can be sure false will be returned somewhere
            // else if the objects are not equivalent.
            if (bSet.has(b))
                return true;
        }
        else {
            previousComparisons.set(a, bSet = new Set);
        }
        bSet.add(b);
        return false;
    }

    function isApolloError(err) {
        return err.hasOwnProperty('graphQLErrors');
    }
    var generateErrorMessage = function (err) {
        var message = '';
        if (isNonEmptyArray(err.graphQLErrors)) {
            err.graphQLErrors.forEach(function (graphQLError) {
                var errorMessage = graphQLError
                    ? graphQLError.message
                    : 'Error message not found.';
                message += errorMessage + "\n";
            });
        }
        if (err.networkError) {
            message += err.networkError.message + "\n";
        }
        message = message.replace(/\n$/, '');
        return message;
    };
    var ApolloError = (function (_super) {
        __extends$1(ApolloError, _super);
        function ApolloError(_a) {
            var graphQLErrors = _a.graphQLErrors, networkError = _a.networkError, errorMessage = _a.errorMessage, extraInfo = _a.extraInfo;
            var _this = _super.call(this, errorMessage) || this;
            _this.graphQLErrors = graphQLErrors || [];
            _this.networkError = networkError || null;
            _this.message = errorMessage || generateErrorMessage(_this);
            _this.extraInfo = extraInfo;
            _this.__proto__ = ApolloError.prototype;
            return _this;
        }
        return ApolloError;
    }(Error));

    var NetworkStatus;
    (function (NetworkStatus) {
        NetworkStatus[NetworkStatus["loading"] = 1] = "loading";
        NetworkStatus[NetworkStatus["setVariables"] = 2] = "setVariables";
        NetworkStatus[NetworkStatus["fetchMore"] = 3] = "fetchMore";
        NetworkStatus[NetworkStatus["refetch"] = 4] = "refetch";
        NetworkStatus[NetworkStatus["poll"] = 6] = "poll";
        NetworkStatus[NetworkStatus["ready"] = 7] = "ready";
        NetworkStatus[NetworkStatus["error"] = 8] = "error";
    })(NetworkStatus || (NetworkStatus = {}));
    function isNetworkRequestInFlight(networkStatus) {
        return networkStatus ? networkStatus < 7 : false;
    }

    var Reobserver = (function () {
        function Reobserver(observer, options, fetch, shouldFetch) {
            this.observer = observer;
            this.options = options;
            this.fetch = fetch;
            this.shouldFetch = shouldFetch;
        }
        Reobserver.prototype.reobserve = function (newOptions, newNetworkStatus) {
            if (newOptions) {
                this.updateOptions(newOptions);
            }
            else {
                this.updatePolling();
            }
            var concast = this.fetch(this.options, newNetworkStatus);
            if (this.concast) {
                this.concast.removeObserver(this.observer, true);
            }
            concast.addObserver(this.observer);
            return (this.concast = concast).promise;
        };
        Reobserver.prototype.updateOptions = function (newOptions) {
            Object.assign(this.options, compact(newOptions));
            this.updatePolling();
            return this;
        };
        Reobserver.prototype.stop = function () {
            if (this.concast) {
                this.concast.removeObserver(this.observer);
                delete this.concast;
            }
            if (this.pollingInfo) {
                clearTimeout(this.pollingInfo.timeout);
                this.options.pollInterval = 0;
                this.updatePolling();
            }
        };
        Reobserver.prototype.updatePolling = function () {
            var _this = this;
            var _a = this, pollingInfo = _a.pollingInfo, pollInterval = _a.options.pollInterval;
            if (!pollInterval) {
                if (pollingInfo) {
                    clearTimeout(pollingInfo.timeout);
                    delete this.pollingInfo;
                }
                return;
            }
            if (pollingInfo &&
                pollingInfo.interval === pollInterval) {
                return;
            }
            invariant$1(pollInterval, 'Attempted to start a polling query without a polling interval.');
            if (this.shouldFetch === false) {
                return;
            }
            var info = pollingInfo || (this.pollingInfo = {});
            info.interval = pollInterval;
            var maybeFetch = function () {
                if (_this.pollingInfo) {
                    if (_this.shouldFetch && _this.shouldFetch()) {
                        _this.reobserve({
                            fetchPolicy: "network-only",
                            nextFetchPolicy: _this.options.fetchPolicy || "cache-first",
                        }, NetworkStatus.poll).then(poll, poll);
                    }
                    else {
                        poll();
                    }
                }
            };
            var poll = function () {
                var info = _this.pollingInfo;
                if (info) {
                    clearTimeout(info.timeout);
                    info.timeout = setTimeout(maybeFetch, info.interval);
                }
            };
            poll();
        };
        return Reobserver;
    }());

    var warnedAboutUpdateQuery = false;
    var ObservableQuery = (function (_super) {
        __extends$1(ObservableQuery, _super);
        function ObservableQuery(_a) {
            var queryManager = _a.queryManager, queryInfo = _a.queryInfo, options = _a.options;
            var _this = _super.call(this, function (observer) {
                return _this.onSubscribe(observer);
            }) || this;
            _this.observers = new Set();
            _this.subscriptions = new Set();
            _this.observer = {
                next: function (result) {
                    if (_this.lastError || _this.isDifferentFromLastResult(result)) {
                        _this.updateLastResult(result);
                        iterateObserversSafely(_this.observers, 'next', result);
                    }
                },
                error: function (error) {
                    _this.updateLastResult(__assign$2(__assign$2({}, _this.lastResult), { error: error, errors: error.graphQLErrors, networkStatus: NetworkStatus.error, loading: false }));
                    iterateObserversSafely(_this.observers, 'error', _this.lastError = error);
                },
            };
            _this.isTornDown = false;
            _this.options = options;
            _this.queryId = queryManager.generateQueryId();
            var opDef = getOperationDefinition(options.query);
            _this.queryName = opDef && opDef.name && opDef.name.value;
            _this.queryManager = queryManager;
            _this.queryInfo = queryInfo;
            return _this;
        }
        Object.defineProperty(ObservableQuery.prototype, "variables", {
            get: function () {
                return this.options.variables;
            },
            enumerable: false,
            configurable: true
        });
        ObservableQuery.prototype.result = function () {
            var _this = this;
            return new Promise(function (resolve, reject) {
                var observer = {
                    next: function (result) {
                        resolve(result);
                        _this.observers.delete(observer);
                        if (!_this.observers.size) {
                            _this.queryManager.removeQuery(_this.queryId);
                        }
                        setTimeout(function () {
                            subscription.unsubscribe();
                        }, 0);
                    },
                    error: reject,
                };
                var subscription = _this.subscribe(observer);
            });
        };
        ObservableQuery.prototype.getCurrentResult = function (saveAsLastResult) {
            if (saveAsLastResult === void 0) { saveAsLastResult = true; }
            var lastResult = this.lastResult;
            var networkStatus = this.queryInfo.networkStatus ||
                (lastResult && lastResult.networkStatus) ||
                NetworkStatus.ready;
            var result = __assign$2(__assign$2({}, lastResult), { loading: isNetworkRequestInFlight(networkStatus), networkStatus: networkStatus });
            if (this.isTornDown) {
                return result;
            }
            var _a = this.options.fetchPolicy, fetchPolicy = _a === void 0 ? 'cache-first' : _a;
            if (fetchPolicy === 'no-cache' ||
                fetchPolicy === 'network-only') {
                delete result.partial;
            }
            else if (!result.data ||
                !this.queryManager.transform(this.options.query).hasForcedResolvers) {
                var diff = this.queryInfo.getDiff();
                result.data = (diff.complete ||
                    this.options.returnPartialData) ? diff.result : void 0;
                if (diff.complete) {
                    if (result.networkStatus === NetworkStatus.loading &&
                        (fetchPolicy === 'cache-first' ||
                            fetchPolicy === 'cache-only')) {
                        result.networkStatus = NetworkStatus.ready;
                        result.loading = false;
                    }
                    delete result.partial;
                }
                else {
                    result.partial = true;
                }
            }
            if (saveAsLastResult) {
                this.updateLastResult(result);
            }
            return result;
        };
        ObservableQuery.prototype.isDifferentFromLastResult = function (newResult) {
            return !equal(this.lastResultSnapshot, newResult);
        };
        ObservableQuery.prototype.getLastResult = function () {
            return this.lastResult;
        };
        ObservableQuery.prototype.getLastError = function () {
            return this.lastError;
        };
        ObservableQuery.prototype.resetLastResults = function () {
            delete this.lastResult;
            delete this.lastResultSnapshot;
            delete this.lastError;
            this.isTornDown = false;
        };
        ObservableQuery.prototype.resetQueryStoreErrors = function () {
            this.queryManager.resetErrors(this.queryId);
        };
        ObservableQuery.prototype.refetch = function (variables) {
            var reobserveOptions = {
                pollInterval: 0,
            };
            var fetchPolicy = this.options.fetchPolicy;
            if (fetchPolicy !== 'no-cache' &&
                fetchPolicy !== 'cache-and-network') {
                reobserveOptions.fetchPolicy = 'network-only';
                reobserveOptions.nextFetchPolicy = fetchPolicy || "cache-first";
            }
            if (variables && !equal(this.options.variables, variables)) {
                reobserveOptions.variables = this.options.variables = __assign$2(__assign$2({}, this.options.variables), variables);
            }
            return this.newReobserver(false).reobserve(reobserveOptions, NetworkStatus.refetch);
        };
        ObservableQuery.prototype.fetchMore = function (fetchMoreOptions) {
            var _this = this;
            var combinedOptions = __assign$2(__assign$2({}, (fetchMoreOptions.query ? fetchMoreOptions : __assign$2(__assign$2(__assign$2({}, this.options), fetchMoreOptions), { variables: __assign$2(__assign$2({}, this.options.variables), fetchMoreOptions.variables) }))), { fetchPolicy: "no-cache" });
            var qid = this.queryManager.generateQueryId();
            if (combinedOptions.notifyOnNetworkStatusChange) {
                this.queryInfo.networkStatus = NetworkStatus.fetchMore;
                this.observe();
            }
            return this.queryManager.fetchQuery(qid, combinedOptions, NetworkStatus.fetchMore).then(function (fetchMoreResult) {
                var data = fetchMoreResult.data;
                var updateQuery = fetchMoreOptions.updateQuery;
                if (updateQuery) {
                    if (!warnedAboutUpdateQuery) {
                        invariant$1.warn("The updateQuery callback for fetchMore is deprecated, and will be removed\nin the next major version of Apollo Client.\n\nPlease convert updateQuery functions to field policies with appropriate\nread and merge functions, or use/adapt a helper function (such as\nconcatPagination, offsetLimitPagination, or relayStylePagination) from\n@apollo/client/utilities.\n\nThe field policy system handles pagination more effectively than a\nhand-written updateQuery function, and you only need to define the policy\nonce, rather than every time you call fetchMore.");
                        warnedAboutUpdateQuery = true;
                    }
                    _this.updateQuery(function (previous) { return updateQuery(previous, {
                        fetchMoreResult: data,
                        variables: combinedOptions.variables,
                    }); });
                }
                else {
                    _this.queryManager.cache.writeQuery({
                        query: combinedOptions.query,
                        variables: combinedOptions.variables,
                        data: data,
                    });
                }
                return fetchMoreResult;
            }).finally(function () {
                _this.queryManager.stopQuery(qid);
                _this.reobserve();
            });
        };
        ObservableQuery.prototype.subscribeToMore = function (options) {
            var _this = this;
            var subscription = this.queryManager
                .startGraphQLSubscription({
                query: options.document,
                variables: options.variables,
                context: options.context,
            })
                .subscribe({
                next: function (subscriptionData) {
                    var updateQuery = options.updateQuery;
                    if (updateQuery) {
                        _this.updateQuery(function (previous, _a) {
                            var variables = _a.variables;
                            return updateQuery(previous, {
                                subscriptionData: subscriptionData,
                                variables: variables,
                            });
                        });
                    }
                },
                error: function (err) {
                    if (options.onError) {
                        options.onError(err);
                        return;
                    }
                    invariant$1.error('Unhandled GraphQL subscription error', err);
                },
            });
            this.subscriptions.add(subscription);
            return function () {
                if (_this.subscriptions.delete(subscription)) {
                    subscription.unsubscribe();
                }
            };
        };
        ObservableQuery.prototype.setOptions = function (newOptions) {
            return this.reobserve(newOptions);
        };
        ObservableQuery.prototype.setVariables = function (variables) {
            if (equal(this.variables, variables)) {
                return this.observers.size
                    ? this.result()
                    : Promise.resolve();
            }
            this.options.variables = variables;
            if (!this.observers.size) {
                return Promise.resolve();
            }
            var _a = this.options.fetchPolicy, fetchPolicy = _a === void 0 ? 'cache-first' : _a;
            var reobserveOptions = {
                fetchPolicy: fetchPolicy,
                variables: variables,
            };
            if (fetchPolicy !== 'cache-first' &&
                fetchPolicy !== 'no-cache' &&
                fetchPolicy !== 'network-only') {
                reobserveOptions.fetchPolicy = 'cache-and-network';
                reobserveOptions.nextFetchPolicy = fetchPolicy;
            }
            return this.reobserve(reobserveOptions, NetworkStatus.setVariables);
        };
        ObservableQuery.prototype.updateQuery = function (mapFn) {
            var _a;
            var queryManager = this.queryManager;
            var result = queryManager.cache.diff({
                query: this.options.query,
                variables: this.variables,
                previousResult: (_a = this.lastResult) === null || _a === void 0 ? void 0 : _a.data,
                returnPartialData: true,
                optimistic: false,
            }).result;
            var newResult = mapFn(result, {
                variables: this.variables,
            });
            if (newResult) {
                queryManager.cache.writeQuery({
                    query: this.options.query,
                    data: newResult,
                    variables: this.variables,
                });
                queryManager.broadcastQueries();
            }
        };
        ObservableQuery.prototype.startPolling = function (pollInterval) {
            this.getReobserver().updateOptions({ pollInterval: pollInterval });
        };
        ObservableQuery.prototype.stopPolling = function () {
            if (this.reobserver) {
                this.reobserver.updateOptions({ pollInterval: 0 });
            }
        };
        ObservableQuery.prototype.updateLastResult = function (newResult) {
            var previousResult = this.lastResult;
            this.lastResult = newResult;
            this.lastResultSnapshot = this.queryManager.assumeImmutableResults
                ? newResult
                : cloneDeep(newResult);
            if (!isNonEmptyArray(newResult.errors)) {
                delete this.lastError;
            }
            return previousResult;
        };
        ObservableQuery.prototype.onSubscribe = function (observer) {
            var _this = this;
            if (observer === this.observer) {
                return function () { };
            }
            try {
                var subObserver = observer._subscription._observer;
                if (subObserver && !subObserver.error) {
                    subObserver.error = defaultSubscriptionObserverErrorCallback;
                }
            }
            catch (_a) { }
            var first = !this.observers.size;
            this.observers.add(observer);
            if (this.lastError) {
                observer.error && observer.error(this.lastError);
            }
            else if (this.lastResult) {
                observer.next && observer.next(this.lastResult);
            }
            if (first) {
                this.reobserve().catch(function (_) {
                });
            }
            return function () {
                if (_this.observers.delete(observer) && !_this.observers.size) {
                    _this.tearDownQuery();
                }
            };
        };
        ObservableQuery.prototype.getReobserver = function () {
            return this.reobserver || (this.reobserver = this.newReobserver(true));
        };
        ObservableQuery.prototype.newReobserver = function (shareOptions) {
            var _this = this;
            var _a = this, queryManager = _a.queryManager, queryId = _a.queryId;
            queryManager.setObservableQuery(this);
            return new Reobserver(this.observer, shareOptions ? this.options : __assign$2({}, this.options), function (currentOptions, newNetworkStatus) {
                queryManager.setObservableQuery(_this);
                return queryManager.fetchQueryObservable(queryId, currentOptions, newNetworkStatus);
            }, !queryManager.ssrMode && (function () { return !isNetworkRequestInFlight(_this.queryInfo.networkStatus); }));
        };
        ObservableQuery.prototype.reobserve = function (newOptions, newNetworkStatus) {
            this.isTornDown = false;
            return this.getReobserver().reobserve(newOptions, newNetworkStatus);
        };
        ObservableQuery.prototype.observe = function () {
            this.observer.next(this.getCurrentResult(false));
        };
        ObservableQuery.prototype.hasObservers = function () {
            return this.observers.size > 0;
        };
        ObservableQuery.prototype.tearDownQuery = function () {
            if (this.isTornDown)
                return;
            if (this.reobserver) {
                this.reobserver.stop();
                delete this.reobserver;
            }
            this.subscriptions.forEach(function (sub) { return sub.unsubscribe(); });
            this.subscriptions.clear();
            this.queryManager.stopQuery(this.queryId);
            this.observers.clear();
            this.isTornDown = true;
        };
        return ObservableQuery;
    }(zenObservable));
    fixObservableSubclass(ObservableQuery);
    function defaultSubscriptionObserverErrorCallback(error) {
        invariant$1.error('Unhandled error', error.message, error.stack);
    }

    // A [trie](https://en.wikipedia.org/wiki/Trie) data structure that holds
    // object keys weakly, yet can also hold non-object keys, unlike the
    // native `WeakMap`.
    // If no makeData function is supplied, the looked-up data will be an empty,
    // null-prototype Object.
    var defaultMakeData = function () { return Object.create(null); };
    // Useful for processing arguments objects as well as arrays.
    var _a$1 = Array.prototype, forEach = _a$1.forEach, slice = _a$1.slice;
    var Trie = /** @class */ (function () {
        function Trie(weakness, makeData) {
            if (weakness === void 0) { weakness = true; }
            if (makeData === void 0) { makeData = defaultMakeData; }
            this.weakness = weakness;
            this.makeData = makeData;
        }
        Trie.prototype.lookup = function () {
            var array = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                array[_i] = arguments[_i];
            }
            return this.lookupArray(array);
        };
        Trie.prototype.lookupArray = function (array) {
            var node = this;
            forEach.call(array, function (key) { return node = node.getChildTrie(key); });
            return node.data || (node.data = this.makeData(slice.call(array)));
        };
        Trie.prototype.getChildTrie = function (key) {
            var map = this.weakness && isObjRef(key)
                ? this.weak || (this.weak = new WeakMap())
                : this.strong || (this.strong = new Map());
            var child = map.get(key);
            if (!child)
                map.set(key, child = new Trie(this.weakness, this.makeData));
            return child;
        };
        return Trie;
    }());
    function isObjRef(value) {
        switch (typeof value) {
            case "object":
                if (value === null)
                    break;
            // Fall through to return true...
            case "function":
                return true;
        }
        return false;
    }

    // This currentContext variable will only be used if the makeSlotClass
    // function is called, which happens only if this is the first copy of the
    // @wry/context package to be imported.
    var currentContext = null;
    // This unique internal object is used to denote the absence of a value
    // for a given Slot, and is never exposed to outside code.
    var MISSING_VALUE = {};
    var idCounter = 1;
    // Although we can't do anything about the cost of duplicated code from
    // accidentally bundling multiple copies of the @wry/context package, we can
    // avoid creating the Slot class more than once using makeSlotClass.
    var makeSlotClass = function () { return /** @class */ (function () {
        function Slot() {
            // If you have a Slot object, you can find out its slot.id, but you cannot
            // guess the slot.id of a Slot you don't have access to, thanks to the
            // randomized suffix.
            this.id = [
                "slot",
                idCounter++,
                Date.now(),
                Math.random().toString(36).slice(2),
            ].join(":");
        }
        Slot.prototype.hasValue = function () {
            for (var context_1 = currentContext; context_1; context_1 = context_1.parent) {
                // We use the Slot object iself as a key to its value, which means the
                // value cannot be obtained without a reference to the Slot object.
                if (this.id in context_1.slots) {
                    var value = context_1.slots[this.id];
                    if (value === MISSING_VALUE)
                        break;
                    if (context_1 !== currentContext) {
                        // Cache the value in currentContext.slots so the next lookup will
                        // be faster. This caching is safe because the tree of contexts and
                        // the values of the slots are logically immutable.
                        currentContext.slots[this.id] = value;
                    }
                    return true;
                }
            }
            if (currentContext) {
                // If a value was not found for this Slot, it's never going to be found
                // no matter how many times we look it up, so we might as well cache
                // the absence of the value, too.
                currentContext.slots[this.id] = MISSING_VALUE;
            }
            return false;
        };
        Slot.prototype.getValue = function () {
            if (this.hasValue()) {
                return currentContext.slots[this.id];
            }
        };
        Slot.prototype.withValue = function (value, callback, 
        // Given the prevalence of arrow functions, specifying arguments is likely
        // to be much more common than specifying `this`, hence this ordering:
        args, thisArg) {
            var _a;
            var slots = (_a = {
                    __proto__: null
                },
                _a[this.id] = value,
                _a);
            var parent = currentContext;
            currentContext = { parent: parent, slots: slots };
            try {
                // Function.prototype.apply allows the arguments array argument to be
                // omitted or undefined, so args! is fine here.
                return callback.apply(thisArg, args);
            }
            finally {
                currentContext = parent;
            }
        };
        // Capture the current context and wrap a callback function so that it
        // reestablishes the captured context when called.
        Slot.bind = function (callback) {
            var context = currentContext;
            return function () {
                var saved = currentContext;
                try {
                    currentContext = context;
                    return callback.apply(this, arguments);
                }
                finally {
                    currentContext = saved;
                }
            };
        };
        // Immediately run a callback function without any captured context.
        Slot.noContext = function (callback, 
        // Given the prevalence of arrow functions, specifying arguments is likely
        // to be much more common than specifying `this`, hence this ordering:
        args, thisArg) {
            if (currentContext) {
                var saved = currentContext;
                try {
                    currentContext = null;
                    // Function.prototype.apply allows the arguments array argument to be
                    // omitted or undefined, so args! is fine here.
                    return callback.apply(thisArg, args);
                }
                finally {
                    currentContext = saved;
                }
            }
            else {
                return callback.apply(thisArg, args);
            }
        };
        return Slot;
    }()); };
    // We store a single global implementation of the Slot class as a permanent
    // non-enumerable symbol property of the Array constructor. This obfuscation
    // does nothing to prevent access to the Slot class, but at least it ensures
    // the implementation (i.e. currentContext) cannot be tampered with, and all
    // copies of the @wry/context package (hopefully just one) will share the
    // same Slot implementation. Since the first copy of the @wry/context package
    // to be imported wins, this technique imposes a very high cost for any
    // future breaking changes to the Slot class.
    var globalKey = "@wry/context:Slot";
    var host = Array;
    var Slot = host[globalKey] || function () {
        var Slot = makeSlotClass();
        try {
            Object.defineProperty(host, globalKey, {
                value: host[globalKey] = Slot,
                enumerable: false,
                writable: false,
                configurable: false,
            });
        }
        finally {
            return Slot;
        }
    }();

    Slot.bind; Slot.noContext;

    function defaultDispose() { }
    var Cache = /** @class */ (function () {
        function Cache(max, dispose) {
            if (max === void 0) { max = Infinity; }
            if (dispose === void 0) { dispose = defaultDispose; }
            this.max = max;
            this.dispose = dispose;
            this.map = new Map();
            this.newest = null;
            this.oldest = null;
        }
        Cache.prototype.has = function (key) {
            return this.map.has(key);
        };
        Cache.prototype.get = function (key) {
            var node = this.getNode(key);
            return node && node.value;
        };
        Cache.prototype.getNode = function (key) {
            var node = this.map.get(key);
            if (node && node !== this.newest) {
                var older = node.older, newer = node.newer;
                if (newer) {
                    newer.older = older;
                }
                if (older) {
                    older.newer = newer;
                }
                node.older = this.newest;
                node.older.newer = node;
                node.newer = null;
                this.newest = node;
                if (node === this.oldest) {
                    this.oldest = newer;
                }
            }
            return node;
        };
        Cache.prototype.set = function (key, value) {
            var node = this.getNode(key);
            if (node) {
                return node.value = value;
            }
            node = {
                key: key,
                value: value,
                newer: null,
                older: this.newest
            };
            if (this.newest) {
                this.newest.newer = node;
            }
            this.newest = node;
            this.oldest = this.oldest || node;
            this.map.set(key, node);
            return node.value;
        };
        Cache.prototype.clean = function () {
            while (this.oldest && this.map.size > this.max) {
                this.delete(this.oldest.key);
            }
        };
        Cache.prototype.delete = function (key) {
            var node = this.map.get(key);
            if (node) {
                if (node === this.newest) {
                    this.newest = node.older;
                }
                if (node === this.oldest) {
                    this.oldest = node.newer;
                }
                if (node.newer) {
                    node.newer.older = node.older;
                }
                if (node.older) {
                    node.older.newer = node.newer;
                }
                this.map.delete(key);
                this.dispose(node.value, key);
                return true;
            }
            return false;
        };
        return Cache;
    }());

    var parentEntrySlot = new Slot();

    var _a;
    var hasOwnProperty$1 = Object.prototype.hasOwnProperty;
    var 
    // This Array.from polyfill is restricted to working with Set<any> for now,
    // but we can improve the polyfill and add other input types, as needed. Note
    // that this fallback implementation will only be used if the host environment
    // does not support a native Array.from function. In most modern JS runtimes,
    // the toArray function exported here will be === Array.from.
    toArray = (_a = Array.from, _a === void 0 ? function (collection) {
        var array = [];
        collection.forEach(function (item) { return array.push(item); });
        return array;
    } : _a);
    function maybeUnsubscribe(entryOrDep) {
        var unsubscribe = entryOrDep.unsubscribe;
        if (typeof unsubscribe === "function") {
            entryOrDep.unsubscribe = void 0;
            unsubscribe();
        }
    }

    var emptySetPool = [];
    var POOL_TARGET_SIZE = 100;
    // Since this package might be used browsers, we should avoid using the
    // Node built-in assert module.
    function assert(condition, optionalMessage) {
        if (!condition) {
            throw new Error(optionalMessage || "assertion failure");
        }
    }
    function valueIs(a, b) {
        var len = a.length;
        return (
        // Unknown values are not equal to each other.
        len > 0 &&
            // Both values must be ordinary (or both exceptional) to be equal.
            len === b.length &&
            // The underlying value or exception must be the same.
            a[len - 1] === b[len - 1]);
    }
    function valueGet(value) {
        switch (value.length) {
            case 0: throw new Error("unknown value");
            case 1: return value[0];
            case 2: throw value[1];
        }
    }
    function valueCopy(value) {
        return value.slice(0);
    }
    var Entry = /** @class */ (function () {
        function Entry(fn) {
            this.fn = fn;
            this.parents = new Set();
            this.childValues = new Map();
            // When this Entry has children that are dirty, this property becomes
            // a Set containing other Entry objects, borrowed from emptySetPool.
            // When the set becomes empty, it gets recycled back to emptySetPool.
            this.dirtyChildren = null;
            this.dirty = true;
            this.recomputing = false;
            this.value = [];
            this.deps = null;
            ++Entry.count;
        }
        Entry.prototype.peek = function () {
            if (this.value.length === 1 && !mightBeDirty(this)) {
                rememberParent(this);
                return this.value[0];
            }
        };
        // This is the most important method of the Entry API, because it
        // determines whether the cached this.value can be returned immediately,
        // or must be recomputed. The overall performance of the caching system
        // depends on the truth of the following observations: (1) this.dirty is
        // usually false, (2) this.dirtyChildren is usually null/empty, and thus
        // (3) valueGet(this.value) is usually returned without recomputation.
        Entry.prototype.recompute = function (args) {
            assert(!this.recomputing, "already recomputing");
            rememberParent(this);
            return mightBeDirty(this)
                ? reallyRecompute(this, args)
                : valueGet(this.value);
        };
        Entry.prototype.setDirty = function () {
            if (this.dirty)
                return;
            this.dirty = true;
            this.value.length = 0;
            reportDirty(this);
            // We can go ahead and unsubscribe here, since any further dirty
            // notifications we receive will be redundant, and unsubscribing may
            // free up some resources, e.g. file watchers.
            maybeUnsubscribe(this);
        };
        Entry.prototype.dispose = function () {
            var _this = this;
            this.setDirty();
            // Sever any dependency relationships with our own children, so those
            // children don't retain this parent Entry in their child.parents sets,
            // thereby preventing it from being fully garbage collected.
            forgetChildren(this);
            // Because this entry has been kicked out of the cache (in index.js),
            // we've lost the ability to find out if/when this entry becomes dirty,
            // whether that happens through a subscription, because of a direct call
            // to entry.setDirty(), or because one of its children becomes dirty.
            // Because of this loss of future information, we have to assume the
            // worst (that this entry might have become dirty very soon), so we must
            // immediately mark this entry's parents as dirty. Normally we could
            // just call entry.setDirty() rather than calling parent.setDirty() for
            // each parent, but that would leave this entry in parent.childValues
            // and parent.dirtyChildren, which would prevent the child from being
            // truly forgotten.
            eachParent(this, function (parent, child) {
                parent.setDirty();
                forgetChild(parent, _this);
            });
        };
        Entry.prototype.forget = function () {
            // The code that creates Entry objects in index.ts will replace this method
            // with one that actually removes the Entry from the cache, which will also
            // trigger the entry.dispose method.
            this.dispose();
        };
        Entry.prototype.dependOn = function (dep) {
            dep.add(this);
            if (!this.deps) {
                this.deps = emptySetPool.pop() || new Set();
            }
            this.deps.add(dep);
        };
        Entry.prototype.forgetDeps = function () {
            var _this = this;
            if (this.deps) {
                toArray(this.deps).forEach(function (dep) { return dep.delete(_this); });
                this.deps.clear();
                emptySetPool.push(this.deps);
                this.deps = null;
            }
        };
        Entry.count = 0;
        return Entry;
    }());
    function rememberParent(child) {
        var parent = parentEntrySlot.getValue();
        if (parent) {
            child.parents.add(parent);
            if (!parent.childValues.has(child)) {
                parent.childValues.set(child, []);
            }
            if (mightBeDirty(child)) {
                reportDirtyChild(parent, child);
            }
            else {
                reportCleanChild(parent, child);
            }
            return parent;
        }
    }
    function reallyRecompute(entry, args) {
        forgetChildren(entry);
        // Set entry as the parent entry while calling recomputeNewValue(entry).
        parentEntrySlot.withValue(entry, recomputeNewValue, [entry, args]);
        if (maybeSubscribe(entry, args)) {
            // If we successfully recomputed entry.value and did not fail to
            // (re)subscribe, then this Entry is no longer explicitly dirty.
            setClean(entry);
        }
        return valueGet(entry.value);
    }
    function recomputeNewValue(entry, args) {
        entry.recomputing = true;
        // Set entry.value as unknown.
        entry.value.length = 0;
        try {
            // If entry.fn succeeds, entry.value will become a normal Value.
            entry.value[0] = entry.fn.apply(null, args);
        }
        catch (e) {
            // If entry.fn throws, entry.value will become exceptional.
            entry.value[1] = e;
        }
        // Either way, this line is always reached.
        entry.recomputing = false;
    }
    function mightBeDirty(entry) {
        return entry.dirty || !!(entry.dirtyChildren && entry.dirtyChildren.size);
    }
    function setClean(entry) {
        entry.dirty = false;
        if (mightBeDirty(entry)) {
            // This Entry may still have dirty children, in which case we can't
            // let our parents know we're clean just yet.
            return;
        }
        reportClean(entry);
    }
    function reportDirty(child) {
        eachParent(child, reportDirtyChild);
    }
    function reportClean(child) {
        eachParent(child, reportCleanChild);
    }
    function eachParent(child, callback) {
        var parentCount = child.parents.size;
        if (parentCount) {
            var parents = toArray(child.parents);
            for (var i = 0; i < parentCount; ++i) {
                callback(parents[i], child);
            }
        }
    }
    // Let a parent Entry know that one of its children may be dirty.
    function reportDirtyChild(parent, child) {
        // Must have called rememberParent(child) before calling
        // reportDirtyChild(parent, child).
        assert(parent.childValues.has(child));
        assert(mightBeDirty(child));
        var parentWasClean = !mightBeDirty(parent);
        if (!parent.dirtyChildren) {
            parent.dirtyChildren = emptySetPool.pop() || new Set;
        }
        else if (parent.dirtyChildren.has(child)) {
            // If we already know this child is dirty, then we must have already
            // informed our own parents that we are dirty, so we can terminate
            // the recursion early.
            return;
        }
        parent.dirtyChildren.add(child);
        // If parent was clean before, it just became (possibly) dirty (according to
        // mightBeDirty), since we just added child to parent.dirtyChildren.
        if (parentWasClean) {
            reportDirty(parent);
        }
    }
    // Let a parent Entry know that one of its children is no longer dirty.
    function reportCleanChild(parent, child) {
        // Must have called rememberChild(child) before calling
        // reportCleanChild(parent, child).
        assert(parent.childValues.has(child));
        assert(!mightBeDirty(child));
        var childValue = parent.childValues.get(child);
        if (childValue.length === 0) {
            parent.childValues.set(child, valueCopy(child.value));
        }
        else if (!valueIs(childValue, child.value)) {
            parent.setDirty();
        }
        removeDirtyChild(parent, child);
        if (mightBeDirty(parent)) {
            return;
        }
        reportClean(parent);
    }
    function removeDirtyChild(parent, child) {
        var dc = parent.dirtyChildren;
        if (dc) {
            dc.delete(child);
            if (dc.size === 0) {
                if (emptySetPool.length < POOL_TARGET_SIZE) {
                    emptySetPool.push(dc);
                }
                parent.dirtyChildren = null;
            }
        }
    }
    // Removes all children from this entry and returns an array of the
    // removed children.
    function forgetChildren(parent) {
        if (parent.childValues.size > 0) {
            parent.childValues.forEach(function (_value, child) {
                forgetChild(parent, child);
            });
        }
        // Remove this parent Entry from any sets to which it was added by the
        // addToSet method.
        parent.forgetDeps();
        // After we forget all our children, this.dirtyChildren must be empty
        // and therefore must have been reset to null.
        assert(parent.dirtyChildren === null);
    }
    function forgetChild(parent, child) {
        child.parents.delete(parent);
        parent.childValues.delete(child);
        removeDirtyChild(parent, child);
    }
    function maybeSubscribe(entry, args) {
        if (typeof entry.subscribe === "function") {
            try {
                maybeUnsubscribe(entry); // Prevent double subscriptions.
                entry.unsubscribe = entry.subscribe.apply(null, args);
            }
            catch (e) {
                // If this Entry has a subscribe function and it threw an exception
                // (or an unsubscribe function it previously returned now throws),
                // return false to indicate that we were not able to subscribe (or
                // unsubscribe), and this Entry should remain dirty.
                entry.setDirty();
                return false;
            }
        }
        // Returning true indicates either that there was no entry.subscribe
        // function or that it succeeded.
        return true;
    }

    var EntryMethods = {
        setDirty: true,
        dispose: true,
        forget: true,
    };
    function dep(options) {
        var depsByKey = new Map();
        var subscribe = options && options.subscribe;
        function depend(key) {
            var parent = parentEntrySlot.getValue();
            if (parent) {
                var dep_1 = depsByKey.get(key);
                if (!dep_1) {
                    depsByKey.set(key, dep_1 = new Set);
                }
                parent.dependOn(dep_1);
                if (typeof subscribe === "function") {
                    maybeUnsubscribe(dep_1);
                    dep_1.unsubscribe = subscribe(key);
                }
            }
        }
        depend.dirty = function dirty(key, entryMethodName) {
            var dep = depsByKey.get(key);
            if (dep) {
                var m_1 = (entryMethodName &&
                    hasOwnProperty$1.call(EntryMethods, entryMethodName)) ? entryMethodName : "setDirty";
                // We have to use toArray(dep).forEach instead of dep.forEach, because
                // modifying a Set while iterating over it can cause elements in the Set
                // to be removed from the Set before they've been iterated over.
                toArray(dep).forEach(function (entry) { return entry[m_1](); });
                depsByKey.delete(key);
                maybeUnsubscribe(dep);
            }
        };
        return depend;
    }

    function makeDefaultMakeCacheKeyFunction() {
        var keyTrie = new Trie(typeof WeakMap === "function");
        return function () {
            return keyTrie.lookupArray(arguments);
        };
    }
    // The defaultMakeCacheKey function is remarkably powerful, because it gives
    // a unique object for any shallow-identical list of arguments. If you need
    // to implement a custom makeCacheKey function, you may find it helpful to
    // delegate the final work to defaultMakeCacheKey, which is why we export it
    // here. However, you may want to avoid defaultMakeCacheKey if your runtime
    // does not support WeakMap, or you have the ability to return a string key.
    // In those cases, just write your own custom makeCacheKey functions.
    makeDefaultMakeCacheKeyFunction();
    var caches = new Set();
    function wrap(originalFunction, options) {
        if (options === void 0) { options = Object.create(null); }
        var cache = new Cache(options.max || Math.pow(2, 16), function (entry) { return entry.dispose(); });
        var keyArgs = options.keyArgs;
        var makeCacheKey = options.makeCacheKey ||
            makeDefaultMakeCacheKeyFunction();
        var optimistic = function () {
            var key = makeCacheKey.apply(null, keyArgs ? keyArgs.apply(null, arguments) : arguments);
            if (key === void 0) {
                return originalFunction.apply(null, arguments);
            }
            var entry = cache.get(key);
            if (!entry) {
                cache.set(key, entry = new Entry(originalFunction));
                entry.subscribe = options.subscribe;
                // Give the Entry the ability to trigger cache.delete(key), even though
                // the Entry itself does not know about key or cache.
                entry.forget = function () { return cache.delete(key); };
            }
            var value = entry.recompute(Array.prototype.slice.call(arguments));
            // Move this entry to the front of the least-recently used queue,
            // since we just finished computing its value.
            cache.set(key, entry);
            caches.add(cache);
            // Clean up any excess entries in the cache, but only if there is no
            // active parent entry, meaning we're not in the middle of a larger
            // computation that might be flummoxed by the cleaning.
            if (!parentEntrySlot.hasValue()) {
                caches.forEach(function (cache) { return cache.clean(); });
                caches.clear();
            }
            return value;
        };
        Object.defineProperty(optimistic, "size", {
            get: function () {
                return cache["map"].size;
            },
            configurable: false,
            enumerable: false,
        });
        function dirtyKey(key) {
            var entry = cache.get(key);
            if (entry) {
                entry.setDirty();
            }
        }
        optimistic.dirtyKey = dirtyKey;
        optimistic.dirty = function dirty() {
            dirtyKey(makeCacheKey.apply(null, arguments));
        };
        function peekKey(key) {
            var entry = cache.get(key);
            if (entry) {
                return entry.peek();
            }
        }
        optimistic.peekKey = peekKey;
        optimistic.peek = function peek() {
            return peekKey(makeCacheKey.apply(null, arguments));
        };
        function forgetKey(key) {
            return cache.delete(key);
        }
        optimistic.forgetKey = forgetKey;
        optimistic.forget = function forget() {
            return forgetKey(makeCacheKey.apply(null, arguments));
        };
        optimistic.makeCacheKey = makeCacheKey;
        optimistic.getKey = keyArgs ? function getKey() {
            return makeCacheKey.apply(null, keyArgs.apply(null, arguments));
        } : makeCacheKey;
        return Object.freeze(optimistic);
    }

    var ApolloCache = (function () {
        function ApolloCache() {
            this.getFragmentDoc = wrap(getFragmentQueryDocument);
        }
        ApolloCache.prototype.recordOptimisticTransaction = function (transaction, optimisticId) {
            this.performTransaction(transaction, optimisticId);
        };
        ApolloCache.prototype.transformDocument = function (document) {
            return document;
        };
        ApolloCache.prototype.identify = function (object) {
            return;
        };
        ApolloCache.prototype.gc = function () {
            return [];
        };
        ApolloCache.prototype.modify = function (options) {
            return false;
        };
        ApolloCache.prototype.transformForLink = function (document) {
            return document;
        };
        ApolloCache.prototype.readQuery = function (options, optimistic) {
            if (optimistic === void 0) { optimistic = !!options.optimistic; }
            return this.read({
                rootId: options.id || 'ROOT_QUERY',
                query: options.query,
                variables: options.variables,
                returnPartialData: options.returnPartialData,
                optimistic: optimistic,
            });
        };
        ApolloCache.prototype.readFragment = function (options, optimistic) {
            if (optimistic === void 0) { optimistic = !!options.optimistic; }
            return this.read({
                query: this.getFragmentDoc(options.fragment, options.fragmentName),
                variables: options.variables,
                rootId: options.id,
                returnPartialData: options.returnPartialData,
                optimistic: optimistic,
            });
        };
        ApolloCache.prototype.writeQuery = function (options) {
            return this.write({
                dataId: options.id || 'ROOT_QUERY',
                result: options.data,
                query: options.query,
                variables: options.variables,
                broadcast: options.broadcast,
            });
        };
        ApolloCache.prototype.writeFragment = function (options) {
            return this.write({
                dataId: options.id,
                result: options.data,
                variables: options.variables,
                query: this.getFragmentDoc(options.fragment, options.fragmentName),
                broadcast: options.broadcast,
            });
        };
        return ApolloCache;
    }());

    var MissingFieldError = (function () {
        function MissingFieldError(message, path, query, clientOnly, variables) {
            this.message = message;
            this.path = path;
            this.query = query;
            this.clientOnly = clientOnly;
            this.variables = variables;
        }
        return MissingFieldError;
    }());

    var hasOwn = Object.prototype.hasOwnProperty;
    function getTypenameFromStoreObject(store, objectOrReference) {
        return isReference(objectOrReference)
            ? store.get(objectOrReference.__ref, "__typename")
            : objectOrReference && objectOrReference.__typename;
    }
    var TypeOrFieldNameRegExp = /^[_a-z][_0-9a-z]*/i;
    function fieldNameFromStoreName(storeFieldName) {
        var match = storeFieldName.match(TypeOrFieldNameRegExp);
        return match ? match[0] : storeFieldName;
    }
    function selectionSetMatchesResult(selectionSet, result, variables) {
        if (result && typeof result === "object") {
            return Array.isArray(result)
                ? result.every(function (item) { return selectionSetMatchesResult(selectionSet, item, variables); })
                : selectionSet.selections.every(function (field) {
                    if (isField(field) && shouldInclude(field, variables)) {
                        var key = resultKeyNameFromField(field);
                        return hasOwn.call(result, key) &&
                            (!field.selectionSet ||
                                selectionSetMatchesResult(field.selectionSet, result[key], variables));
                    }
                    return true;
                });
        }
        return false;
    }
    function storeValueIsStoreObject(value) {
        return value !== null &&
            typeof value === "object" &&
            !isReference(value) &&
            !Array.isArray(value);
    }
    function makeProcessedFieldsMerger() {
        return new DeepMerger;
    }

    var DELETE = Object.create(null);
    var delModifier = function () { return DELETE; };
    var INVALIDATE = Object.create(null);
    var EntityStore = (function () {
        function EntityStore(policies, group) {
            var _this = this;
            this.policies = policies;
            this.group = group;
            this.data = Object.create(null);
            this.rootIds = Object.create(null);
            this.refs = Object.create(null);
            this.getFieldValue = function (objectOrReference, storeFieldName) { return maybeDeepFreeze(isReference(objectOrReference)
                ? _this.get(objectOrReference.__ref, storeFieldName)
                : objectOrReference && objectOrReference[storeFieldName]); };
            this.canRead = function (objOrRef) {
                return isReference(objOrRef)
                    ? _this.has(objOrRef.__ref)
                    : typeof objOrRef === "object";
            };
            this.toReference = function (objOrIdOrRef, mergeIntoStore) {
                if (typeof objOrIdOrRef === "string") {
                    return makeReference(objOrIdOrRef);
                }
                if (isReference(objOrIdOrRef)) {
                    return objOrIdOrRef;
                }
                var id = _this.policies.identify(objOrIdOrRef)[0];
                if (id) {
                    var ref = makeReference(id);
                    if (mergeIntoStore) {
                        _this.merge(id, objOrIdOrRef);
                    }
                    return ref;
                }
            };
        }
        EntityStore.prototype.toObject = function () {
            return __assign$2({}, this.data);
        };
        EntityStore.prototype.has = function (dataId) {
            return this.lookup(dataId, true) !== void 0;
        };
        EntityStore.prototype.get = function (dataId, fieldName) {
            this.group.depend(dataId, fieldName);
            if (hasOwn.call(this.data, dataId)) {
                var storeObject = this.data[dataId];
                if (storeObject && hasOwn.call(storeObject, fieldName)) {
                    return storeObject[fieldName];
                }
            }
            if (fieldName === "__typename" &&
                hasOwn.call(this.policies.rootTypenamesById, dataId)) {
                return this.policies.rootTypenamesById[dataId];
            }
            if (this instanceof Layer) {
                return this.parent.get(dataId, fieldName);
            }
        };
        EntityStore.prototype.lookup = function (dataId, dependOnExistence) {
            if (dependOnExistence)
                this.group.depend(dataId, "__exists");
            if (hasOwn.call(this.data, dataId)) {
                return this.data[dataId];
            }
            if (this instanceof Layer) {
                return this.parent.lookup(dataId, dependOnExistence);
            }
            if (this.policies.rootTypenamesById[dataId]) {
                return Object.create(null);
            }
        };
        EntityStore.prototype.merge = function (dataId, incoming) {
            var _this = this;
            var existing = this.lookup(dataId);
            var merged = new DeepMerger(storeObjectReconciler).merge(existing, incoming);
            this.data[dataId] = merged;
            if (merged !== existing) {
                delete this.refs[dataId];
                if (this.group.caching) {
                    var fieldsToDirty_1 = Object.create(null);
                    if (!existing)
                        fieldsToDirty_1.__exists = 1;
                    Object.keys(incoming).forEach(function (storeFieldName) {
                        if (!existing || existing[storeFieldName] !== merged[storeFieldName]) {
                            fieldsToDirty_1[storeFieldName] = 1;
                            var fieldName = fieldNameFromStoreName(storeFieldName);
                            if (fieldName !== storeFieldName &&
                                !_this.policies.hasKeyArgs(merged.__typename, fieldName)) {
                                fieldsToDirty_1[fieldName] = 1;
                            }
                            if (merged[storeFieldName] === void 0 && !(_this instanceof Layer)) {
                                delete merged[storeFieldName];
                            }
                        }
                    });
                    Object.keys(fieldsToDirty_1).forEach(function (fieldName) { return _this.group.dirty(dataId, fieldName); });
                }
            }
        };
        EntityStore.prototype.modify = function (dataId, fields) {
            var _this = this;
            var storeObject = this.lookup(dataId);
            if (storeObject) {
                var changedFields_1 = Object.create(null);
                var needToMerge_1 = false;
                var allDeleted_1 = true;
                var sharedDetails_1 = {
                    DELETE: DELETE,
                    INVALIDATE: INVALIDATE,
                    isReference: isReference,
                    toReference: this.toReference,
                    canRead: this.canRead,
                    readField: function (fieldNameOrOptions, from) { return _this.policies.readField(typeof fieldNameOrOptions === "string" ? {
                        fieldName: fieldNameOrOptions,
                        from: from || makeReference(dataId),
                    } : fieldNameOrOptions, { store: _this }); },
                };
                Object.keys(storeObject).forEach(function (storeFieldName) {
                    var fieldName = fieldNameFromStoreName(storeFieldName);
                    var fieldValue = storeObject[storeFieldName];
                    if (fieldValue === void 0)
                        return;
                    var modify = typeof fields === "function"
                        ? fields
                        : fields[storeFieldName] || fields[fieldName];
                    if (modify) {
                        var newValue = modify === delModifier ? DELETE :
                            modify(maybeDeepFreeze(fieldValue), __assign$2(__assign$2({}, sharedDetails_1), { fieldName: fieldName,
                                storeFieldName: storeFieldName, storage: _this.getStorage(dataId, storeFieldName) }));
                        if (newValue === INVALIDATE) {
                            _this.group.dirty(dataId, storeFieldName);
                        }
                        else {
                            if (newValue === DELETE)
                                newValue = void 0;
                            if (newValue !== fieldValue) {
                                changedFields_1[storeFieldName] = newValue;
                                needToMerge_1 = true;
                                fieldValue = newValue;
                            }
                        }
                    }
                    if (fieldValue !== void 0) {
                        allDeleted_1 = false;
                    }
                });
                if (needToMerge_1) {
                    this.merge(dataId, changedFields_1);
                    if (allDeleted_1) {
                        if (this instanceof Layer) {
                            this.data[dataId] = void 0;
                        }
                        else {
                            delete this.data[dataId];
                        }
                        this.group.dirty(dataId, "__exists");
                    }
                    return true;
                }
            }
            return false;
        };
        EntityStore.prototype.delete = function (dataId, fieldName, args) {
            var _a;
            var storeObject = this.lookup(dataId);
            if (storeObject) {
                var typename = this.getFieldValue(storeObject, "__typename");
                var storeFieldName = fieldName && args
                    ? this.policies.getStoreFieldName({ typename: typename, fieldName: fieldName, args: args })
                    : fieldName;
                return this.modify(dataId, storeFieldName ? (_a = {},
                    _a[storeFieldName] = delModifier,
                    _a) : delModifier);
            }
            return false;
        };
        EntityStore.prototype.evict = function (options) {
            var evicted = false;
            if (options.id) {
                if (hasOwn.call(this.data, options.id)) {
                    evicted = this.delete(options.id, options.fieldName, options.args);
                }
                if (this instanceof Layer) {
                    evicted = this.parent.evict(options) || evicted;
                }
                if (options.fieldName || evicted) {
                    this.group.dirty(options.id, options.fieldName || "__exists");
                }
            }
            return evicted;
        };
        EntityStore.prototype.clear = function () {
            this.replace(null);
        };
        EntityStore.prototype.extract = function () {
            var _this = this;
            var obj = this.toObject();
            var extraRootIds = [];
            this.getRootIdSet().forEach(function (id) {
                if (!hasOwn.call(_this.policies.rootTypenamesById, id)) {
                    extraRootIds.push(id);
                }
            });
            if (extraRootIds.length) {
                obj.__META = { extraRootIds: extraRootIds.sort() };
            }
            return obj;
        };
        EntityStore.prototype.replace = function (newData) {
            var _this = this;
            Object.keys(this.data).forEach(function (dataId) {
                if (!(newData && hasOwn.call(newData, dataId))) {
                    _this.delete(dataId);
                }
            });
            if (newData) {
                var __META = newData.__META, rest_1 = __rest(newData, ["__META"]);
                Object.keys(rest_1).forEach(function (dataId) {
                    _this.merge(dataId, rest_1[dataId]);
                });
                if (__META) {
                    __META.extraRootIds.forEach(this.retain, this);
                }
            }
        };
        EntityStore.prototype.retain = function (rootId) {
            return this.rootIds[rootId] = (this.rootIds[rootId] || 0) + 1;
        };
        EntityStore.prototype.release = function (rootId) {
            if (this.rootIds[rootId] > 0) {
                var count = --this.rootIds[rootId];
                if (!count)
                    delete this.rootIds[rootId];
                return count;
            }
            return 0;
        };
        EntityStore.prototype.getRootIdSet = function (ids) {
            if (ids === void 0) { ids = new Set(); }
            Object.keys(this.rootIds).forEach(ids.add, ids);
            if (this instanceof Layer) {
                this.parent.getRootIdSet(ids);
            }
            else {
                Object.keys(this.policies.rootTypenamesById).forEach(ids.add, ids);
            }
            return ids;
        };
        EntityStore.prototype.gc = function () {
            var _this = this;
            var ids = this.getRootIdSet();
            var snapshot = this.toObject();
            ids.forEach(function (id) {
                if (hasOwn.call(snapshot, id)) {
                    Object.keys(_this.findChildRefIds(id)).forEach(ids.add, ids);
                    delete snapshot[id];
                }
            });
            var idsToRemove = Object.keys(snapshot);
            if (idsToRemove.length) {
                var root_1 = this;
                while (root_1 instanceof Layer)
                    root_1 = root_1.parent;
                idsToRemove.forEach(function (id) { return root_1.delete(id); });
            }
            return idsToRemove;
        };
        EntityStore.prototype.findChildRefIds = function (dataId) {
            if (!hasOwn.call(this.refs, dataId)) {
                var found_1 = this.refs[dataId] = Object.create(null);
                var workSet_1 = new Set([this.data[dataId]]);
                var canTraverse_1 = function (obj) { return obj !== null && typeof obj === 'object'; };
                workSet_1.forEach(function (obj) {
                    if (isReference(obj)) {
                        found_1[obj.__ref] = true;
                    }
                    else if (canTraverse_1(obj)) {
                        Object.values(obj)
                            .filter(canTraverse_1)
                            .forEach(workSet_1.add, workSet_1);
                    }
                });
            }
            return this.refs[dataId];
        };
        EntityStore.prototype.makeCacheKey = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return this.group.keyMaker.lookupArray(args);
        };
        return EntityStore;
    }());
    var CacheGroup = (function () {
        function CacheGroup(caching) {
            this.caching = caching;
            this.d = null;
            this.keyMaker = new Trie(canUseWeakMap);
            this.d = caching ? dep() : null;
        }
        CacheGroup.prototype.depend = function (dataId, storeFieldName) {
            if (this.d) {
                this.d(makeDepKey(dataId, storeFieldName));
                var fieldName = fieldNameFromStoreName(storeFieldName);
                if (fieldName !== storeFieldName) {
                    this.d(makeDepKey(dataId, fieldName));
                }
            }
        };
        CacheGroup.prototype.dirty = function (dataId, storeFieldName) {
            if (this.d) {
                this.d.dirty(makeDepKey(dataId, storeFieldName));
            }
        };
        return CacheGroup;
    }());
    function makeDepKey(dataId, storeFieldName) {
        return storeFieldName + '#' + dataId;
    }
    (function (EntityStore) {
        var Root = (function (_super) {
            __extends$1(Root, _super);
            function Root(_a) {
                var policies = _a.policies, _b = _a.resultCaching, resultCaching = _b === void 0 ? true : _b, seed = _a.seed;
                var _this = _super.call(this, policies, new CacheGroup(resultCaching)) || this;
                _this.storageTrie = new Trie(canUseWeakMap);
                _this.sharedLayerGroup = new CacheGroup(resultCaching);
                if (seed)
                    _this.replace(seed);
                return _this;
            }
            Root.prototype.addLayer = function (layerId, replay) {
                return new Layer(layerId, this, replay, this.sharedLayerGroup);
            };
            Root.prototype.removeLayer = function () {
                return this;
            };
            Root.prototype.getStorage = function () {
                return this.storageTrie.lookupArray(arguments);
            };
            return Root;
        }(EntityStore));
        EntityStore.Root = Root;
    })(EntityStore || (EntityStore = {}));
    var Layer = (function (_super) {
        __extends$1(Layer, _super);
        function Layer(id, parent, replay, group) {
            var _this = _super.call(this, parent.policies, group) || this;
            _this.id = id;
            _this.parent = parent;
            _this.replay = replay;
            _this.group = group;
            replay(_this);
            return _this;
        }
        Layer.prototype.addLayer = function (layerId, replay) {
            return new Layer(layerId, this, replay, this.group);
        };
        Layer.prototype.removeLayer = function (layerId) {
            var _this = this;
            var parent = this.parent.removeLayer(layerId);
            if (layerId === this.id) {
                if (this.group.caching) {
                    Object.keys(this.data).forEach(function (dataId) {
                        if (_this.data[dataId] !== parent.lookup(dataId)) {
                            _this.delete(dataId);
                        }
                    });
                }
                return parent;
            }
            if (parent === this.parent)
                return this;
            return parent.addLayer(this.id, this.replay);
        };
        Layer.prototype.toObject = function () {
            return __assign$2(__assign$2({}, this.parent.toObject()), this.data);
        };
        Layer.prototype.findChildRefIds = function (dataId) {
            var fromParent = this.parent.findChildRefIds(dataId);
            return hasOwn.call(this.data, dataId) ? __assign$2(__assign$2({}, fromParent), _super.prototype.findChildRefIds.call(this, dataId)) : fromParent;
        };
        Layer.prototype.getStorage = function () {
            var p = this.parent;
            while (p.parent)
                p = p.parent;
            return p.getStorage.apply(p, arguments);
        };
        return Layer;
    }(EntityStore));
    function storeObjectReconciler(existingObject, incomingObject, property) {
        var existingValue = existingObject[property];
        var incomingValue = incomingObject[property];
        return equal(existingValue, incomingValue) ? existingValue : incomingValue;
    }
    function supportsResultCaching(store) {
        return !!(store instanceof EntityStore && store.group.caching);
    }

    function missingFromInvariant(err, context) {
        return new MissingFieldError(err.message, context.path.slice(), context.query, context.clientOnly, context.variables);
    }
    var StoreReader = (function () {
        function StoreReader(config) {
            var _this = this;
            this.config = config;
            this.executeSelectionSet = wrap(function (options) { return _this.execSelectionSetImpl(options); }, {
                keyArgs: function (options) {
                    return [
                        options.selectionSet,
                        options.objectOrReference,
                        options.context,
                    ];
                },
                makeCacheKey: function (selectionSet, parent, context) {
                    if (supportsResultCaching(context.store)) {
                        return context.store.makeCacheKey(selectionSet, isReference(parent) ? parent.__ref : parent, context.varString);
                    }
                }
            });
            this.knownResults = new WeakMap();
            this.executeSubSelectedArray = wrap(function (options) {
                return _this.execSubSelectedArrayImpl(options);
            }, {
                makeCacheKey: function (_a) {
                    var field = _a.field, array = _a.array, context = _a.context;
                    if (supportsResultCaching(context.store)) {
                        return context.store.makeCacheKey(field, array, context.varString);
                    }
                }
            });
            this.config = __assign$2({ addTypename: true }, config);
        }
        StoreReader.prototype.diffQueryAgainstStore = function (_a) {
            var store = _a.store, query = _a.query, _b = _a.rootId, rootId = _b === void 0 ? 'ROOT_QUERY' : _b, variables = _a.variables, _c = _a.returnPartialData, returnPartialData = _c === void 0 ? true : _c;
            var policies = this.config.cache.policies;
            variables = __assign$2(__assign$2({}, getDefaultValues(getQueryDefinition(query))), variables);
            var execResult = this.executeSelectionSet({
                selectionSet: getMainDefinition(query).selectionSet,
                objectOrReference: makeReference(rootId),
                context: {
                    store: store,
                    query: query,
                    policies: policies,
                    variables: variables,
                    varString: JSON.stringify(variables),
                    fragmentMap: createFragmentMap(getFragmentDefinitions(query)),
                    path: [],
                    clientOnly: false,
                },
            });
            var hasMissingFields = execResult.missing && execResult.missing.length > 0;
            if (hasMissingFields && !returnPartialData) {
                throw execResult.missing[0];
            }
            return {
                result: execResult.result,
                missing: execResult.missing,
                complete: !hasMissingFields,
            };
        };
        StoreReader.prototype.isFresh = function (result, parent, selectionSet, context) {
            if (supportsResultCaching(context.store) &&
                this.knownResults.get(result) === selectionSet) {
                var latest = this.executeSelectionSet.peek(selectionSet, parent, context);
                if (latest && result === latest.result) {
                    return true;
                }
            }
            return false;
        };
        StoreReader.prototype.execSelectionSetImpl = function (_a) {
            var _this = this;
            var selectionSet = _a.selectionSet, objectOrReference = _a.objectOrReference, context = _a.context;
            if (isReference(objectOrReference) &&
                !context.policies.rootTypenamesById[objectOrReference.__ref] &&
                !context.store.has(objectOrReference.__ref)) {
                return {
                    result: {},
                    missing: [missingFromInvariant(new InvariantError("Dangling reference to missing " + objectOrReference.__ref + " object"), context)],
                };
            }
            var variables = context.variables, policies = context.policies, store = context.store;
            var objectsToMerge = [];
            var finalResult = { result: null };
            var typename = store.getFieldValue(objectOrReference, "__typename");
            if (this.config.addTypename &&
                typeof typename === "string" &&
                !policies.rootIdsByTypename[typename]) {
                objectsToMerge.push({ __typename: typename });
            }
            function getMissing() {
                return finalResult.missing || (finalResult.missing = []);
            }
            function handleMissing(result) {
                var _a;
                if (result.missing)
                    (_a = getMissing()).push.apply(_a, result.missing);
                return result.result;
            }
            var workSet = new Set(selectionSet.selections);
            workSet.forEach(function (selection) {
                var _a;
                if (!shouldInclude(selection, variables))
                    return;
                if (isField(selection)) {
                    var fieldValue = policies.readField({
                        fieldName: selection.name.value,
                        field: selection,
                        variables: context.variables,
                        from: objectOrReference,
                    }, context);
                    var resultName = resultKeyNameFromField(selection);
                    context.path.push(resultName);
                    var wasClientOnly = context.clientOnly;
                    context.clientOnly = wasClientOnly || !!(selection.directives &&
                        selection.directives.some(function (d) { return d.name.value === "client"; }));
                    if (fieldValue === void 0) {
                        if (!addTypenameToDocument.added(selection)) {
                            getMissing().push(missingFromInvariant(new InvariantError("Can't find field '" + selection.name.value + "' on " + (isReference(objectOrReference)
                                ? objectOrReference.__ref + " object"
                                : "object " + JSON.stringify(objectOrReference, null, 2))), context));
                        }
                    }
                    else if (Array.isArray(fieldValue)) {
                        fieldValue = handleMissing(_this.executeSubSelectedArray({
                            field: selection,
                            array: fieldValue,
                            context: context,
                        }));
                    }
                    else if (!selection.selectionSet) {
                        {
                            assertSelectionSetForIdValue(context.store, selection, fieldValue);
                            maybeDeepFreeze(fieldValue);
                        }
                    }
                    else if (fieldValue != null) {
                        fieldValue = handleMissing(_this.executeSelectionSet({
                            selectionSet: selection.selectionSet,
                            objectOrReference: fieldValue,
                            context: context,
                        }));
                    }
                    if (fieldValue !== void 0) {
                        objectsToMerge.push((_a = {}, _a[resultName] = fieldValue, _a));
                    }
                    context.clientOnly = wasClientOnly;
                    invariant$1(context.path.pop() === resultName);
                }
                else {
                    var fragment = getFragmentFromSelection(selection, context.fragmentMap);
                    if (fragment && policies.fragmentMatches(fragment, typename)) {
                        fragment.selectionSet.selections.forEach(workSet.add, workSet);
                    }
                }
            });
            finalResult.result = mergeDeepArray(objectsToMerge);
            {
                Object.freeze(finalResult.result);
            }
            this.knownResults.set(finalResult.result, selectionSet);
            return finalResult;
        };
        StoreReader.prototype.execSubSelectedArrayImpl = function (_a) {
            var _this = this;
            var field = _a.field, array = _a.array, context = _a.context;
            var missing;
            function handleMissing(childResult, i) {
                if (childResult.missing) {
                    missing = missing || [];
                    missing.push.apply(missing, childResult.missing);
                }
                invariant$1(context.path.pop() === i);
                return childResult.result;
            }
            if (field.selectionSet) {
                array = array.filter(context.store.canRead);
            }
            array = array.map(function (item, i) {
                if (item === null) {
                    return null;
                }
                context.path.push(i);
                if (Array.isArray(item)) {
                    return handleMissing(_this.executeSubSelectedArray({
                        field: field,
                        array: item,
                        context: context,
                    }), i);
                }
                if (field.selectionSet) {
                    return handleMissing(_this.executeSelectionSet({
                        selectionSet: field.selectionSet,
                        objectOrReference: item,
                        context: context,
                    }), i);
                }
                {
                    assertSelectionSetForIdValue(context.store, field, item);
                }
                invariant$1(context.path.pop() === i);
                return item;
            });
            {
                Object.freeze(array);
            }
            return { result: array, missing: missing };
        };
        return StoreReader;
    }());
    function assertSelectionSetForIdValue(store, field, fieldValue) {
        if (!field.selectionSet) {
            var workSet_1 = new Set([fieldValue]);
            workSet_1.forEach(function (value) {
                if (value && typeof value === "object") {
                    invariant$1(!isReference(value), "Missing selection set for object of type " + getTypenameFromStoreObject(store, value) + " returned for query field " + field.name.value);
                    Object.values(value).forEach(workSet_1.add, workSet_1);
                }
            });
        }
    }

    var StoreWriter = (function () {
        function StoreWriter(cache, reader) {
            this.cache = cache;
            this.reader = reader;
        }
        StoreWriter.prototype.writeToStore = function (_a) {
            var query = _a.query, result = _a.result, dataId = _a.dataId, store = _a.store, variables = _a.variables;
            var operationDefinition = getOperationDefinition(query);
            var merger = makeProcessedFieldsMerger();
            variables = __assign$2(__assign$2({}, getDefaultValues(operationDefinition)), variables);
            var ref = this.processSelectionSet({
                result: result || Object.create(null),
                dataId: dataId,
                selectionSet: operationDefinition.selectionSet,
                mergeTree: { map: new Map },
                context: {
                    store: store,
                    written: Object.create(null),
                    merge: function (existing, incoming) {
                        return merger.merge(existing, incoming);
                    },
                    variables: variables,
                    varString: JSON.stringify(variables),
                    fragmentMap: createFragmentMap(getFragmentDefinitions(query)),
                },
            });
            if (!isReference(ref)) {
                throw new InvariantError("Could not identify object " + JSON.stringify(result));
            }
            store.retain(ref.__ref);
            return ref;
        };
        StoreWriter.prototype.processSelectionSet = function (_a) {
            var _this = this;
            var dataId = _a.dataId, result = _a.result, selectionSet = _a.selectionSet, context = _a.context, mergeTree = _a.mergeTree;
            var policies = this.cache.policies;
            var _b = policies.identify(result, selectionSet, context.fragmentMap), id = _b[0], keyObject = _b[1];
            dataId = dataId || id;
            if ("string" === typeof dataId) {
                var sets = context.written[dataId] || (context.written[dataId] = []);
                var ref = makeReference(dataId);
                if (sets.indexOf(selectionSet) >= 0)
                    return ref;
                sets.push(selectionSet);
                if (this.reader && this.reader.isFresh(result, ref, selectionSet, context)) {
                    return ref;
                }
            }
            var incomingFields = Object.create(null);
            if (keyObject) {
                incomingFields = context.merge(incomingFields, keyObject);
            }
            var typename = (dataId && policies.rootTypenamesById[dataId]) ||
                getTypenameFromResult(result, selectionSet, context.fragmentMap) ||
                (dataId && context.store.get(dataId, "__typename"));
            if ("string" === typeof typename) {
                incomingFields.__typename = typename;
            }
            var workSet = new Set(selectionSet.selections);
            workSet.forEach(function (selection) {
                var _a;
                if (!shouldInclude(selection, context.variables))
                    return;
                if (isField(selection)) {
                    var resultFieldKey = resultKeyNameFromField(selection);
                    var value = result[resultFieldKey];
                    if (typeof value !== 'undefined') {
                        var storeFieldName = policies.getStoreFieldName({
                            typename: typename,
                            fieldName: selection.name.value,
                            field: selection,
                            variables: context.variables,
                        });
                        var childTree = getChildMergeTree(mergeTree, storeFieldName);
                        var incomingValue = _this.processFieldValue(value, selection, context, childTree);
                        var childTypename = selection.selectionSet
                            && context.store.getFieldValue(incomingValue, "__typename")
                            || void 0;
                        var merge = policies.getMergeFunction(typename, selection.name.value, childTypename);
                        if (merge) {
                            childTree.info = {
                                field: selection,
                                typename: typename,
                                merge: merge,
                            };
                        }
                        else {
                            maybeRecycleChildMergeTree(mergeTree, storeFieldName);
                        }
                        incomingFields = context.merge(incomingFields, (_a = {},
                            _a[storeFieldName] = incomingValue,
                            _a));
                    }
                    else if (policies.usingPossibleTypes &&
                        !hasDirectives(["defer", "client"], selection)) {
                        throw new InvariantError("Missing field '" + resultFieldKey + "' in " + JSON.stringify(result, null, 2).substring(0, 100));
                    }
                }
                else {
                    var fragment = getFragmentFromSelection(selection, context.fragmentMap);
                    if (fragment &&
                        policies.fragmentMatches(fragment, typename, result, context.variables)) {
                        fragment.selectionSet.selections.forEach(workSet.add, workSet);
                    }
                }
            });
            if ("string" === typeof dataId) {
                var entityRef_1 = makeReference(dataId);
                if (mergeTree.map.size) {
                    incomingFields = this.applyMerges(mergeTree, entityRef_1, incomingFields, context);
                }
                {
                    var hasSelectionSet_1 = function (storeFieldName) {
                        return fieldsWithSelectionSets_1.has(fieldNameFromStoreName(storeFieldName));
                    };
                    var fieldsWithSelectionSets_1 = new Set();
                    workSet.forEach(function (selection) {
                        if (isField(selection) && selection.selectionSet) {
                            fieldsWithSelectionSets_1.add(selection.name.value);
                        }
                    });
                    var hasMergeFunction_1 = function (storeFieldName) {
                        var childTree = mergeTree.map.get(storeFieldName);
                        return Boolean(childTree && childTree.info && childTree.info.merge);
                    };
                    Object.keys(incomingFields).forEach(function (storeFieldName) {
                        if (hasSelectionSet_1(storeFieldName) &&
                            !hasMergeFunction_1(storeFieldName)) {
                            warnAboutDataLoss(entityRef_1, incomingFields, storeFieldName, context.store);
                        }
                    });
                }
                context.store.merge(dataId, incomingFields);
                return entityRef_1;
            }
            return incomingFields;
        };
        StoreWriter.prototype.processFieldValue = function (value, field, context, mergeTree) {
            var _this = this;
            if (!field.selectionSet || value === null) {
                return cloneDeep(value);
            }
            if (Array.isArray(value)) {
                return value.map(function (item, i) {
                    var value = _this.processFieldValue(item, field, context, getChildMergeTree(mergeTree, i));
                    maybeRecycleChildMergeTree(mergeTree, i);
                    return value;
                });
            }
            return this.processSelectionSet({
                result: value,
                selectionSet: field.selectionSet,
                context: context,
                mergeTree: mergeTree,
            });
        };
        StoreWriter.prototype.applyMerges = function (mergeTree, existing, incoming, context, getStorageArgs) {
            var _a;
            var _this = this;
            if (mergeTree.map.size && !isReference(incoming)) {
                var e_1 = (!Array.isArray(incoming) &&
                    (isReference(existing) || storeValueIsStoreObject(existing))) ? existing : void 0;
                var i_1 = incoming;
                if (e_1 && !getStorageArgs) {
                    getStorageArgs = [isReference(e_1) ? e_1.__ref : e_1];
                }
                var changedFields_1;
                var getValue_1 = function (from, name) {
                    return Array.isArray(from)
                        ? (typeof name === "number" ? from[name] : void 0)
                        : context.store.getFieldValue(from, String(name));
                };
                mergeTree.map.forEach(function (childTree, storeFieldName) {
                    if (getStorageArgs) {
                        getStorageArgs.push(storeFieldName);
                    }
                    var eVal = getValue_1(e_1, storeFieldName);
                    var iVal = getValue_1(i_1, storeFieldName);
                    var aVal = _this.applyMerges(childTree, eVal, iVal, context, getStorageArgs);
                    if (aVal !== iVal) {
                        changedFields_1 = changedFields_1 || new Map;
                        changedFields_1.set(storeFieldName, aVal);
                    }
                    if (getStorageArgs) {
                        invariant$1(getStorageArgs.pop() === storeFieldName);
                    }
                });
                if (changedFields_1) {
                    incoming = (Array.isArray(i_1) ? i_1.slice(0) : __assign$2({}, i_1));
                    changedFields_1.forEach(function (value, name) {
                        incoming[name] = value;
                    });
                }
            }
            if (mergeTree.info) {
                return this.cache.policies.runMergeFunction(existing, incoming, mergeTree.info, context, getStorageArgs && (_a = context.store).getStorage.apply(_a, getStorageArgs));
            }
            return incoming;
        };
        return StoreWriter;
    }());
    var emptyMergeTreePool = [];
    function getChildMergeTree(_a, name) {
        var map = _a.map;
        if (!map.has(name)) {
            map.set(name, emptyMergeTreePool.pop() || { map: new Map });
        }
        return map.get(name);
    }
    function maybeRecycleChildMergeTree(_a, name) {
        var map = _a.map;
        var childTree = map.get(name);
        if (childTree &&
            !childTree.info &&
            !childTree.map.size) {
            emptyMergeTreePool.push(childTree);
            map.delete(name);
        }
    }
    var warnings = new Set();
    function warnAboutDataLoss(existingRef, incomingObj, storeFieldName, store) {
        var getChild = function (objOrRef) {
            var child = store.getFieldValue(objOrRef, storeFieldName);
            return typeof child === "object" && child;
        };
        var existing = getChild(existingRef);
        if (!existing)
            return;
        var incoming = getChild(incomingObj);
        if (!incoming)
            return;
        if (isReference(existing))
            return;
        if (equal(existing, incoming))
            return;
        if (Object.keys(existing).every(function (key) { return store.getFieldValue(incoming, key) !== void 0; })) {
            return;
        }
        var parentType = store.getFieldValue(existingRef, "__typename") ||
            store.getFieldValue(incomingObj, "__typename");
        var fieldName = fieldNameFromStoreName(storeFieldName);
        var typeDotName = parentType + "." + fieldName;
        if (warnings.has(typeDotName))
            return;
        warnings.add(typeDotName);
        var childTypenames = [];
        if (!Array.isArray(existing) &&
            !Array.isArray(incoming)) {
            [existing, incoming].forEach(function (child) {
                var typename = store.getFieldValue(child, "__typename");
                if (typeof typename === "string" &&
                    !childTypenames.includes(typename)) {
                    childTypenames.push(typename);
                }
            });
        }
        invariant$1.warn("Cache data may be lost when replacing the " + fieldName + " field of a " + parentType + " object.\n\nTo address this problem (which is not a bug in Apollo Client), " + (childTypenames.length
            ? "either ensure all objects of type " +
                childTypenames.join(" and ") + " have an ID or a custom merge function, or "
            : "") + "define a custom merge function for the " + typeDotName + " field, so InMemoryCache can safely merge these objects:\n\n  existing: " + JSON.stringify(existing).slice(0, 1000) + "\n  incoming: " + JSON.stringify(incoming).slice(0, 1000) + "\n\nFor more information about these options, please refer to the documentation:\n\n  * Ensuring entity objects have IDs: https://go.apollo.dev/c/generating-unique-identifiers\n  * Defining custom merge functions: https://go.apollo.dev/c/merging-non-normalized-objects\n");
    }

    var cacheSlot = new Slot();
    var cacheInfoMap = new WeakMap();
    function getCacheInfo(cache) {
        var info = cacheInfoMap.get(cache);
        if (!info) {
            cacheInfoMap.set(cache, info = {
                vars: new Set,
                dep: dep(),
            });
        }
        return info;
    }
    function forgetCache(cache) {
        getCacheInfo(cache).vars.forEach(function (rv) { return rv.forgetCache(cache); });
    }
    function recallCache(cache) {
        getCacheInfo(cache).vars.forEach(function (rv) { return rv.attachCache(cache); });
    }
    function makeVar(value) {
        var caches = new Set();
        var listeners = new Set();
        var rv = function (newValue) {
            if (arguments.length > 0) {
                if (value !== newValue) {
                    value = newValue;
                    caches.forEach(function (cache) {
                        getCacheInfo(cache).dep.dirty(rv);
                        broadcast(cache);
                    });
                    var oldListeners = Array.from(listeners);
                    listeners.clear();
                    oldListeners.forEach(function (listener) { return listener(value); });
                }
            }
            else {
                var cache = cacheSlot.getValue();
                if (cache) {
                    attach(cache);
                    getCacheInfo(cache).dep(rv);
                }
            }
            return value;
        };
        rv.onNextChange = function (listener) {
            listeners.add(listener);
            return function () {
                listeners.delete(listener);
            };
        };
        var attach = rv.attachCache = function (cache) {
            caches.add(cache);
            getCacheInfo(cache).vars.add(rv);
            return rv;
        };
        rv.forgetCache = function (cache) { return caches.delete(cache); };
        return rv;
    }
    function broadcast(cache) {
        if (cache.broadcastWatches) {
            cache.broadcastWatches();
        }
    }

    function argsFromFieldSpecifier(spec) {
        return spec.args !== void 0 ? spec.args :
            spec.field ? argumentsObjectFromField(spec.field, spec.variables) : null;
    }
    var defaultDataIdFromObject = function (_a, context) {
        var __typename = _a.__typename, id = _a.id, _id = _a._id;
        if (typeof __typename === "string") {
            if (context) {
                context.keyObject =
                    id !== void 0 ? { id: id } :
                        _id !== void 0 ? { _id: _id } :
                            void 0;
            }
            if (id === void 0)
                id = _id;
            if (id !== void 0) {
                return __typename + ":" + ((typeof id === "number" ||
                    typeof id === "string") ? id : JSON.stringify(id));
            }
        }
    };
    var nullKeyFieldsFn = function () { return void 0; };
    var simpleKeyArgsFn = function (_args, context) { return context.fieldName; };
    var mergeTrueFn = function (existing, incoming, _a) {
        var mergeObjects = _a.mergeObjects;
        return mergeObjects(existing, incoming);
    };
    var mergeFalseFn = function (_, incoming) { return incoming; };
    var Policies = (function () {
        function Policies(config) {
            this.config = config;
            this.typePolicies = Object.create(null);
            this.toBeAdded = Object.create(null);
            this.supertypeMap = new Map();
            this.fuzzySubtypes = new Map();
            this.rootIdsByTypename = Object.create(null);
            this.rootTypenamesById = Object.create(null);
            this.usingPossibleTypes = false;
            this.config = __assign$2({ dataIdFromObject: defaultDataIdFromObject }, config);
            this.cache = this.config.cache;
            this.setRootTypename("Query");
            this.setRootTypename("Mutation");
            this.setRootTypename("Subscription");
            if (config.possibleTypes) {
                this.addPossibleTypes(config.possibleTypes);
            }
            if (config.typePolicies) {
                this.addTypePolicies(config.typePolicies);
            }
        }
        Policies.prototype.identify = function (object, selectionSet, fragmentMap) {
            var typename = selectionSet && fragmentMap
                ? getTypenameFromResult(object, selectionSet, fragmentMap)
                : object.__typename;
            if (typename === this.rootTypenamesById.ROOT_QUERY) {
                return ["ROOT_QUERY"];
            }
            var context = {
                typename: typename,
                selectionSet: selectionSet,
                fragmentMap: fragmentMap,
            };
            var id;
            var policy = typename && this.getTypePolicy(typename);
            var keyFn = policy && policy.keyFn || this.config.dataIdFromObject;
            while (keyFn) {
                var specifierOrId = keyFn(object, context);
                if (Array.isArray(specifierOrId)) {
                    keyFn = keyFieldsFnFromSpecifier(specifierOrId);
                }
                else {
                    id = specifierOrId;
                    break;
                }
            }
            id = id ? String(id) : void 0;
            return context.keyObject ? [id, context.keyObject] : [id];
        };
        Policies.prototype.addTypePolicies = function (typePolicies) {
            var _this = this;
            Object.keys(typePolicies).forEach(function (typename) {
                var _a = typePolicies[typename], queryType = _a.queryType, mutationType = _a.mutationType, subscriptionType = _a.subscriptionType, incoming = __rest(_a, ["queryType", "mutationType", "subscriptionType"]);
                if (queryType)
                    _this.setRootTypename("Query", typename);
                if (mutationType)
                    _this.setRootTypename("Mutation", typename);
                if (subscriptionType)
                    _this.setRootTypename("Subscription", typename);
                if (hasOwn.call(_this.toBeAdded, typename)) {
                    _this.toBeAdded[typename].push(incoming);
                }
                else {
                    _this.toBeAdded[typename] = [incoming];
                }
            });
        };
        Policies.prototype.updateTypePolicy = function (typename, incoming) {
            var _this = this;
            var existing = this.getTypePolicy(typename);
            var keyFields = incoming.keyFields, fields = incoming.fields;
            function setMerge(existing, merge) {
                existing.merge =
                    typeof merge === "function" ? merge :
                        merge === true ? mergeTrueFn :
                            merge === false ? mergeFalseFn :
                                existing.merge;
            }
            setMerge(existing, incoming.merge);
            existing.keyFn =
                keyFields === false ? nullKeyFieldsFn :
                    Array.isArray(keyFields) ? keyFieldsFnFromSpecifier(keyFields) :
                        typeof keyFields === "function" ? keyFields :
                            existing.keyFn;
            if (fields) {
                Object.keys(fields).forEach(function (fieldName) {
                    var existing = _this.getFieldPolicy(typename, fieldName, true);
                    var incoming = fields[fieldName];
                    if (typeof incoming === "function") {
                        existing.read = incoming;
                    }
                    else {
                        var keyArgs = incoming.keyArgs, read = incoming.read, merge = incoming.merge;
                        existing.keyFn =
                            keyArgs === false ? simpleKeyArgsFn :
                                Array.isArray(keyArgs) ? keyArgsFnFromSpecifier(keyArgs) :
                                    typeof keyArgs === "function" ? keyArgs :
                                        existing.keyFn;
                        if (typeof read === "function") {
                            existing.read = read;
                        }
                        setMerge(existing, merge);
                    }
                    if (existing.read && existing.merge) {
                        existing.keyFn = existing.keyFn || simpleKeyArgsFn;
                    }
                });
            }
        };
        Policies.prototype.setRootTypename = function (which, typename) {
            if (typename === void 0) { typename = which; }
            var rootId = "ROOT_" + which.toUpperCase();
            var old = this.rootTypenamesById[rootId];
            if (typename !== old) {
                invariant$1(!old || old === which, "Cannot change root " + which + " __typename more than once");
                if (old)
                    delete this.rootIdsByTypename[old];
                this.rootIdsByTypename[typename] = rootId;
                this.rootTypenamesById[rootId] = typename;
            }
        };
        Policies.prototype.addPossibleTypes = function (possibleTypes) {
            var _this = this;
            this.usingPossibleTypes = true;
            Object.keys(possibleTypes).forEach(function (supertype) {
                _this.getSupertypeSet(supertype, true);
                possibleTypes[supertype].forEach(function (subtype) {
                    _this.getSupertypeSet(subtype, true).add(supertype);
                    var match = subtype.match(TypeOrFieldNameRegExp);
                    if (!match || match[0] !== subtype) {
                        _this.fuzzySubtypes.set(subtype, new RegExp(subtype));
                    }
                });
            });
        };
        Policies.prototype.getTypePolicy = function (typename) {
            var _this = this;
            if (!hasOwn.call(this.typePolicies, typename)) {
                var policy_1 = this.typePolicies[typename] = Object.create(null);
                policy_1.fields = Object.create(null);
                var supertypes = this.supertypeMap.get(typename);
                if (supertypes && supertypes.size) {
                    supertypes.forEach(function (supertype) {
                        var _a = _this.getTypePolicy(supertype), fields = _a.fields, rest = __rest(_a, ["fields"]);
                        Object.assign(policy_1, rest);
                        Object.assign(policy_1.fields, fields);
                    });
                }
            }
            var inbox = this.toBeAdded[typename];
            if (inbox && inbox.length) {
                this.updateTypePolicy(typename, compact.apply(void 0, inbox.splice(0)));
            }
            return this.typePolicies[typename];
        };
        Policies.prototype.getFieldPolicy = function (typename, fieldName, createIfMissing) {
            if (typename) {
                var fieldPolicies = this.getTypePolicy(typename).fields;
                return fieldPolicies[fieldName] || (createIfMissing && (fieldPolicies[fieldName] = Object.create(null)));
            }
        };
        Policies.prototype.getSupertypeSet = function (subtype, createIfMissing) {
            var supertypeSet = this.supertypeMap.get(subtype);
            if (!supertypeSet && createIfMissing) {
                this.supertypeMap.set(subtype, supertypeSet = new Set());
            }
            return supertypeSet;
        };
        Policies.prototype.fragmentMatches = function (fragment, typename, result, variables) {
            var _this = this;
            if (!fragment.typeCondition)
                return true;
            if (!typename)
                return false;
            var supertype = fragment.typeCondition.name.value;
            if (typename === supertype)
                return true;
            if (this.usingPossibleTypes &&
                this.supertypeMap.has(supertype)) {
                var typenameSupertypeSet = this.getSupertypeSet(typename, true);
                var workQueue_1 = [typenameSupertypeSet];
                var maybeEnqueue_1 = function (subtype) {
                    var supertypeSet = _this.getSupertypeSet(subtype, false);
                    if (supertypeSet &&
                        supertypeSet.size &&
                        workQueue_1.indexOf(supertypeSet) < 0) {
                        workQueue_1.push(supertypeSet);
                    }
                };
                var needToCheckFuzzySubtypes = !!(result && this.fuzzySubtypes.size);
                var checkingFuzzySubtypes = false;
                for (var i = 0; i < workQueue_1.length; ++i) {
                    var supertypeSet = workQueue_1[i];
                    if (supertypeSet.has(supertype)) {
                        if (!typenameSupertypeSet.has(supertype)) {
                            if (checkingFuzzySubtypes) {
                                invariant$1.warn("Inferring subtype " + typename + " of supertype " + supertype);
                            }
                            typenameSupertypeSet.add(supertype);
                        }
                        return true;
                    }
                    supertypeSet.forEach(maybeEnqueue_1);
                    if (needToCheckFuzzySubtypes &&
                        i === workQueue_1.length - 1 &&
                        selectionSetMatchesResult(fragment.selectionSet, result, variables)) {
                        needToCheckFuzzySubtypes = false;
                        checkingFuzzySubtypes = true;
                        this.fuzzySubtypes.forEach(function (regExp, fuzzyString) {
                            var match = typename.match(regExp);
                            if (match && match[0] === typename) {
                                maybeEnqueue_1(fuzzyString);
                            }
                        });
                    }
                }
            }
            return false;
        };
        Policies.prototype.hasKeyArgs = function (typename, fieldName) {
            var policy = this.getFieldPolicy(typename, fieldName, false);
            return !!(policy && policy.keyFn);
        };
        Policies.prototype.getStoreFieldName = function (fieldSpec) {
            var typename = fieldSpec.typename, fieldName = fieldSpec.fieldName;
            var policy = this.getFieldPolicy(typename, fieldName, false);
            var storeFieldName;
            var keyFn = policy && policy.keyFn;
            if (keyFn && typename) {
                var context = {
                    typename: typename,
                    fieldName: fieldName,
                    field: fieldSpec.field || null,
                    variables: fieldSpec.variables,
                };
                var args = argsFromFieldSpecifier(fieldSpec);
                while (keyFn) {
                    var specifierOrString = keyFn(args, context);
                    if (Array.isArray(specifierOrString)) {
                        keyFn = keyArgsFnFromSpecifier(specifierOrString);
                    }
                    else {
                        storeFieldName = specifierOrString || fieldName;
                        break;
                    }
                }
            }
            if (storeFieldName === void 0) {
                storeFieldName = fieldSpec.field
                    ? storeKeyNameFromField(fieldSpec.field, fieldSpec.variables)
                    : getStoreKeyName(fieldName, argsFromFieldSpecifier(fieldSpec));
            }
            if (storeFieldName === false) {
                return fieldName;
            }
            return fieldName === fieldNameFromStoreName(storeFieldName)
                ? storeFieldName
                : fieldName + ":" + storeFieldName;
        };
        Policies.prototype.readField = function (options, context) {
            var objectOrReference = options.from;
            if (!objectOrReference)
                return;
            var nameOrField = options.field || options.fieldName;
            if (!nameOrField)
                return;
            if (options.typename === void 0) {
                var typename = context.store.getFieldValue(objectOrReference, "__typename");
                if (typename)
                    options.typename = typename;
            }
            var storeFieldName = this.getStoreFieldName(options);
            var fieldName = fieldNameFromStoreName(storeFieldName);
            var existing = context.store.getFieldValue(objectOrReference, storeFieldName);
            var policy = this.getFieldPolicy(options.typename, fieldName, false);
            var read = policy && policy.read;
            if (read) {
                var readOptions = makeFieldFunctionOptions(this, objectOrReference, options, context, context.store.getStorage(isReference(objectOrReference)
                    ? objectOrReference.__ref
                    : objectOrReference, storeFieldName));
                return cacheSlot.withValue(this.cache, read, [existing, readOptions]);
            }
            return existing;
        };
        Policies.prototype.getMergeFunction = function (parentTypename, fieldName, childTypename) {
            var policy = this.getFieldPolicy(parentTypename, fieldName, false);
            var merge = policy && policy.merge;
            if (!merge && childTypename) {
                policy = this.getTypePolicy(childTypename);
                merge = policy && policy.merge;
            }
            return merge;
        };
        Policies.prototype.runMergeFunction = function (existing, incoming, _a, context, storage) {
            var field = _a.field, typename = _a.typename, merge = _a.merge;
            if (merge === mergeTrueFn) {
                return makeMergeObjectsFunction(context.store.getFieldValue)(existing, incoming);
            }
            if (merge === mergeFalseFn) {
                return incoming;
            }
            return merge(existing, incoming, makeFieldFunctionOptions(this, void 0, { typename: typename, fieldName: field.name.value, field: field, variables: context.variables }, context, storage || Object.create(null)));
        };
        return Policies;
    }());
    function makeFieldFunctionOptions(policies, objectOrReference, fieldSpec, context, storage) {
        var storeFieldName = policies.getStoreFieldName(fieldSpec);
        var fieldName = fieldNameFromStoreName(storeFieldName);
        var variables = fieldSpec.variables || context.variables;
        var _a = context.store, getFieldValue = _a.getFieldValue, toReference = _a.toReference, canRead = _a.canRead;
        return {
            args: argsFromFieldSpecifier(fieldSpec),
            field: fieldSpec.field || null,
            fieldName: fieldName,
            storeFieldName: storeFieldName,
            variables: variables,
            isReference: isReference,
            toReference: toReference,
            storage: storage,
            cache: policies.cache,
            canRead: canRead,
            readField: function (fieldNameOrOptions, from) {
                var options = typeof fieldNameOrOptions === "string" ? {
                    fieldName: fieldNameOrOptions,
                    from: from,
                } : __assign$2({}, fieldNameOrOptions);
                if (void 0 === options.from) {
                    options.from = objectOrReference;
                }
                if (void 0 === options.variables) {
                    options.variables = variables;
                }
                return policies.readField(options, context);
            },
            mergeObjects: makeMergeObjectsFunction(getFieldValue),
        };
    }
    function makeMergeObjectsFunction(getFieldValue) {
        return function mergeObjects(existing, incoming) {
            if (Array.isArray(existing) || Array.isArray(incoming)) {
                throw new InvariantError("Cannot automatically merge arrays");
            }
            if (existing && typeof existing === "object" &&
                incoming && typeof incoming === "object") {
                var eType = getFieldValue(existing, "__typename");
                var iType = getFieldValue(incoming, "__typename");
                var typesDiffer = eType && iType && eType !== iType;
                if (typesDiffer ||
                    !storeValueIsStoreObject(existing) ||
                    !storeValueIsStoreObject(incoming)) {
                    return incoming;
                }
                return __assign$2(__assign$2({}, existing), incoming);
            }
            return incoming;
        };
    }
    function keyArgsFnFromSpecifier(specifier) {
        return function (args, context) {
            return args ? context.fieldName + ":" + JSON.stringify(computeKeyObject(args, specifier, false)) : context.fieldName;
        };
    }
    function keyFieldsFnFromSpecifier(specifier) {
        var trie = new Trie(canUseWeakMap);
        return function (object, context) {
            var aliasMap;
            if (context.selectionSet && context.fragmentMap) {
                var info = trie.lookupArray([
                    context.selectionSet,
                    context.fragmentMap,
                ]);
                aliasMap = info.aliasMap || (info.aliasMap = makeAliasMap(context.selectionSet, context.fragmentMap));
            }
            var keyObject = context.keyObject =
                computeKeyObject(object, specifier, true, aliasMap);
            return context.typename + ":" + JSON.stringify(keyObject);
        };
    }
    function makeAliasMap(selectionSet, fragmentMap) {
        var map = Object.create(null);
        var workQueue = new Set([selectionSet]);
        workQueue.forEach(function (selectionSet) {
            selectionSet.selections.forEach(function (selection) {
                if (isField(selection)) {
                    if (selection.alias) {
                        var responseKey = selection.alias.value;
                        var storeKey = selection.name.value;
                        if (storeKey !== responseKey) {
                            var aliases = map.aliases || (map.aliases = Object.create(null));
                            aliases[storeKey] = responseKey;
                        }
                    }
                    if (selection.selectionSet) {
                        var subsets = map.subsets || (map.subsets = Object.create(null));
                        subsets[selection.name.value] =
                            makeAliasMap(selection.selectionSet, fragmentMap);
                    }
                }
                else {
                    var fragment = getFragmentFromSelection(selection, fragmentMap);
                    if (fragment) {
                        workQueue.add(fragment.selectionSet);
                    }
                }
            });
        });
        return map;
    }
    function computeKeyObject(response, specifier, strict, aliasMap) {
        var keyObj = Object.create(null);
        var prevKey;
        specifier.forEach(function (s) {
            if (Array.isArray(s)) {
                if (typeof prevKey === "string") {
                    var subsets = aliasMap && aliasMap.subsets;
                    var subset = subsets && subsets[prevKey];
                    keyObj[prevKey] = computeKeyObject(response[prevKey], s, strict, subset);
                }
            }
            else {
                var aliases = aliasMap && aliasMap.aliases;
                var responseName = aliases && aliases[s] || s;
                if (hasOwn.call(response, responseName)) {
                    keyObj[prevKey = s] = response[responseName];
                }
                else {
                    invariant$1(!strict, "Missing field '" + responseName + "' while computing key fields");
                    prevKey = void 0;
                }
            }
        });
        return keyObj;
    }

    var defaultConfig = {
        dataIdFromObject: defaultDataIdFromObject,
        addTypename: true,
        resultCaching: true,
        typePolicies: {},
    };
    var InMemoryCache = (function (_super) {
        __extends$1(InMemoryCache, _super);
        function InMemoryCache(config) {
            if (config === void 0) { config = {}; }
            var _this = _super.call(this) || this;
            _this.watches = new Set();
            _this.typenameDocumentCache = new Map();
            _this.makeVar = makeVar;
            _this.txCount = 0;
            _this.maybeBroadcastWatch = wrap(function (c, fromOptimisticTransaction) {
                return _this.broadcastWatch.call(_this, c, !!fromOptimisticTransaction);
            }, {
                makeCacheKey: function (c) {
                    var store = c.optimistic ? _this.optimisticData : _this.data;
                    if (supportsResultCaching(store)) {
                        var optimistic = c.optimistic, rootId = c.rootId, variables = c.variables;
                        return store.makeCacheKey(c.query, c.callback, JSON.stringify({ optimistic: optimistic, rootId: rootId, variables: variables }));
                    }
                }
            });
            _this.watchDep = dep();
            _this.config = __assign$2(__assign$2({}, defaultConfig), config);
            _this.addTypename = !!_this.config.addTypename;
            _this.policies = new Policies({
                cache: _this,
                dataIdFromObject: _this.config.dataIdFromObject,
                possibleTypes: _this.config.possibleTypes,
                typePolicies: _this.config.typePolicies,
            });
            _this.data = new EntityStore.Root({
                policies: _this.policies,
                resultCaching: _this.config.resultCaching,
            });
            _this.optimisticData = _this.data;
            _this.storeWriter = new StoreWriter(_this, _this.storeReader = new StoreReader({
                cache: _this,
                addTypename: _this.addTypename,
            }));
            return _this;
        }
        InMemoryCache.prototype.restore = function (data) {
            if (data)
                this.data.replace(data);
            return this;
        };
        InMemoryCache.prototype.extract = function (optimistic) {
            if (optimistic === void 0) { optimistic = false; }
            return (optimistic ? this.optimisticData : this.data).extract();
        };
        InMemoryCache.prototype.read = function (options) {
            var _a = options.returnPartialData, returnPartialData = _a === void 0 ? false : _a;
            try {
                return this.storeReader.diffQueryAgainstStore({
                    store: options.optimistic ? this.optimisticData : this.data,
                    query: options.query,
                    variables: options.variables,
                    rootId: options.rootId,
                    config: this.config,
                    returnPartialData: returnPartialData,
                }).result || null;
            }
            catch (e) {
                if (e instanceof MissingFieldError) {
                    return null;
                }
                throw e;
            }
        };
        InMemoryCache.prototype.write = function (options) {
            try {
                ++this.txCount;
                return this.storeWriter.writeToStore({
                    store: this.data,
                    query: options.query,
                    result: options.result,
                    dataId: options.dataId,
                    variables: options.variables,
                });
            }
            finally {
                if (!--this.txCount && options.broadcast !== false) {
                    this.broadcastWatches();
                }
            }
        };
        InMemoryCache.prototype.modify = function (options) {
            if (hasOwn.call(options, "id") && !options.id) {
                return false;
            }
            var store = options.optimistic
                ? this.optimisticData
                : this.data;
            try {
                ++this.txCount;
                return store.modify(options.id || "ROOT_QUERY", options.fields);
            }
            finally {
                if (!--this.txCount && options.broadcast !== false) {
                    this.broadcastWatches();
                }
            }
        };
        InMemoryCache.prototype.diff = function (options) {
            return this.storeReader.diffQueryAgainstStore({
                store: options.optimistic ? this.optimisticData : this.data,
                rootId: options.id || "ROOT_QUERY",
                query: options.query,
                variables: options.variables,
                returnPartialData: options.returnPartialData,
                config: this.config,
            });
        };
        InMemoryCache.prototype.watch = function (watch) {
            var _this = this;
            if (!this.watches.size) {
                recallCache(this);
            }
            this.watches.add(watch);
            if (watch.immediate) {
                this.maybeBroadcastWatch(watch);
            }
            return function () {
                if (_this.watches.delete(watch) && !_this.watches.size) {
                    forgetCache(_this);
                }
                _this.watchDep.dirty(watch);
                _this.maybeBroadcastWatch.forget(watch);
            };
        };
        InMemoryCache.prototype.gc = function () {
            return this.optimisticData.gc();
        };
        InMemoryCache.prototype.retain = function (rootId, optimistic) {
            return (optimistic ? this.optimisticData : this.data).retain(rootId);
        };
        InMemoryCache.prototype.release = function (rootId, optimistic) {
            return (optimistic ? this.optimisticData : this.data).release(rootId);
        };
        InMemoryCache.prototype.identify = function (object) {
            return isReference(object) ? object.__ref :
                this.policies.identify(object)[0];
        };
        InMemoryCache.prototype.evict = function (options) {
            if (!options.id) {
                if (hasOwn.call(options, "id")) {
                    return false;
                }
                options = __assign$2(__assign$2({}, options), { id: "ROOT_QUERY" });
            }
            try {
                ++this.txCount;
                return this.optimisticData.evict(options);
            }
            finally {
                if (!--this.txCount && options.broadcast !== false) {
                    this.broadcastWatches();
                }
            }
        };
        InMemoryCache.prototype.reset = function () {
            this.data.clear();
            this.optimisticData = this.data;
            this.broadcastWatches();
            return Promise.resolve();
        };
        InMemoryCache.prototype.removeOptimistic = function (idToRemove) {
            var newOptimisticData = this.optimisticData.removeLayer(idToRemove);
            if (newOptimisticData !== this.optimisticData) {
                this.optimisticData = newOptimisticData;
                this.broadcastWatches();
            }
        };
        InMemoryCache.prototype.performTransaction = function (transaction, optimisticId) {
            var _this = this;
            var perform = function (layer) {
                var _a = _this, data = _a.data, optimisticData = _a.optimisticData;
                ++_this.txCount;
                if (layer) {
                    _this.data = _this.optimisticData = layer;
                }
                try {
                    transaction(_this);
                }
                finally {
                    --_this.txCount;
                    _this.data = data;
                    _this.optimisticData = optimisticData;
                }
            };
            var fromOptimisticTransaction = false;
            if (typeof optimisticId === 'string') {
                this.optimisticData = this.optimisticData.addLayer(optimisticId, perform);
                fromOptimisticTransaction = true;
            }
            else if (optimisticId === null) {
                perform(this.data);
            }
            else {
                perform();
            }
            this.broadcastWatches(fromOptimisticTransaction);
        };
        InMemoryCache.prototype.transformDocument = function (document) {
            if (this.addTypename) {
                var result = this.typenameDocumentCache.get(document);
                if (!result) {
                    result = addTypenameToDocument(document);
                    this.typenameDocumentCache.set(document, result);
                    this.typenameDocumentCache.set(result, result);
                }
                return result;
            }
            return document;
        };
        InMemoryCache.prototype.broadcastWatches = function (fromOptimisticTransaction) {
            var _this = this;
            if (!this.txCount) {
                this.watches.forEach(function (c) { return _this.maybeBroadcastWatch(c, fromOptimisticTransaction); });
            }
        };
        InMemoryCache.prototype.broadcastWatch = function (c, fromOptimisticTransaction) {
            this.watchDep.dirty(c);
            this.watchDep(c);
            var diff = this.diff({
                query: c.query,
                variables: c.variables,
                optimistic: c.optimistic,
            });
            if (c.optimistic && fromOptimisticTransaction) {
                diff.fromOptimisticTransaction = true;
            }
            c.callback(diff);
        };
        return InMemoryCache;
    }(ApolloCache));

    var LocalState = (function () {
        function LocalState(_a) {
            var cache = _a.cache, client = _a.client, resolvers = _a.resolvers, fragmentMatcher = _a.fragmentMatcher;
            this.cache = cache;
            if (client) {
                this.client = client;
            }
            if (resolvers) {
                this.addResolvers(resolvers);
            }
            if (fragmentMatcher) {
                this.setFragmentMatcher(fragmentMatcher);
            }
        }
        LocalState.prototype.addResolvers = function (resolvers) {
            var _this = this;
            this.resolvers = this.resolvers || {};
            if (Array.isArray(resolvers)) {
                resolvers.forEach(function (resolverGroup) {
                    _this.resolvers = mergeDeep(_this.resolvers, resolverGroup);
                });
            }
            else {
                this.resolvers = mergeDeep(this.resolvers, resolvers);
            }
        };
        LocalState.prototype.setResolvers = function (resolvers) {
            this.resolvers = {};
            this.addResolvers(resolvers);
        };
        LocalState.prototype.getResolvers = function () {
            return this.resolvers || {};
        };
        LocalState.prototype.runResolvers = function (_a) {
            var document = _a.document, remoteResult = _a.remoteResult, context = _a.context, variables = _a.variables, _b = _a.onlyRunForcedResolvers, onlyRunForcedResolvers = _b === void 0 ? false : _b;
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_c) {
                    if (document) {
                        return [2, this.resolveDocument(document, remoteResult.data, context, variables, this.fragmentMatcher, onlyRunForcedResolvers).then(function (localResult) { return (__assign$2(__assign$2({}, remoteResult), { data: localResult.result })); })];
                    }
                    return [2, remoteResult];
                });
            });
        };
        LocalState.prototype.setFragmentMatcher = function (fragmentMatcher) {
            this.fragmentMatcher = fragmentMatcher;
        };
        LocalState.prototype.getFragmentMatcher = function () {
            return this.fragmentMatcher;
        };
        LocalState.prototype.clientQuery = function (document) {
            if (hasDirectives(['client'], document)) {
                if (this.resolvers) {
                    return document;
                }
            }
            return null;
        };
        LocalState.prototype.serverQuery = function (document) {
            return removeClientSetsFromDocument(document);
        };
        LocalState.prototype.prepareContext = function (context) {
            var cache = this.cache;
            return __assign$2(__assign$2({}, context), { cache: cache,
                getCacheKey: function (obj) {
                    return cache.identify(obj);
                } });
        };
        LocalState.prototype.addExportedVariables = function (document, variables, context) {
            if (variables === void 0) { variables = {}; }
            if (context === void 0) { context = {}; }
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    if (document) {
                        return [2, this.resolveDocument(document, this.buildRootValueFromCache(document, variables) || {}, this.prepareContext(context), variables).then(function (data) { return (__assign$2(__assign$2({}, variables), data.exportedVariables)); })];
                    }
                    return [2, __assign$2({}, variables)];
                });
            });
        };
        LocalState.prototype.shouldForceResolvers = function (document) {
            var forceResolvers = false;
            visit(document, {
                Directive: {
                    enter: function (node) {
                        if (node.name.value === 'client' && node.arguments) {
                            forceResolvers = node.arguments.some(function (arg) {
                                return arg.name.value === 'always' &&
                                    arg.value.kind === 'BooleanValue' &&
                                    arg.value.value === true;
                            });
                            if (forceResolvers) {
                                return BREAK;
                            }
                        }
                    },
                },
            });
            return forceResolvers;
        };
        LocalState.prototype.buildRootValueFromCache = function (document, variables) {
            return this.cache.diff({
                query: buildQueryFromSelectionSet(document),
                variables: variables,
                returnPartialData: true,
                optimistic: false,
            }).result;
        };
        LocalState.prototype.resolveDocument = function (document, rootValue, context, variables, fragmentMatcher, onlyRunForcedResolvers) {
            if (context === void 0) { context = {}; }
            if (variables === void 0) { variables = {}; }
            if (fragmentMatcher === void 0) { fragmentMatcher = function () { return true; }; }
            if (onlyRunForcedResolvers === void 0) { onlyRunForcedResolvers = false; }
            return __awaiter(this, void 0, void 0, function () {
                var mainDefinition, fragments, fragmentMap, definitionOperation, defaultOperationType, _a, cache, client, execContext;
                return __generator(this, function (_b) {
                    mainDefinition = getMainDefinition(document);
                    fragments = getFragmentDefinitions(document);
                    fragmentMap = createFragmentMap(fragments);
                    definitionOperation = mainDefinition
                        .operation;
                    defaultOperationType = definitionOperation
                        ? definitionOperation.charAt(0).toUpperCase() +
                            definitionOperation.slice(1)
                        : 'Query';
                    _a = this, cache = _a.cache, client = _a.client;
                    execContext = {
                        fragmentMap: fragmentMap,
                        context: __assign$2(__assign$2({}, context), { cache: cache,
                            client: client }),
                        variables: variables,
                        fragmentMatcher: fragmentMatcher,
                        defaultOperationType: defaultOperationType,
                        exportedVariables: {},
                        onlyRunForcedResolvers: onlyRunForcedResolvers,
                    };
                    return [2, this.resolveSelectionSet(mainDefinition.selectionSet, rootValue, execContext).then(function (result) { return ({
                            result: result,
                            exportedVariables: execContext.exportedVariables,
                        }); })];
                });
            });
        };
        LocalState.prototype.resolveSelectionSet = function (selectionSet, rootValue, execContext) {
            return __awaiter(this, void 0, void 0, function () {
                var fragmentMap, context, variables, resultsToMerge, execute;
                var _this = this;
                return __generator(this, function (_a) {
                    fragmentMap = execContext.fragmentMap, context = execContext.context, variables = execContext.variables;
                    resultsToMerge = [rootValue];
                    execute = function (selection) { return __awaiter(_this, void 0, void 0, function () {
                        var fragment, typeCondition;
                        return __generator(this, function (_a) {
                            if (!shouldInclude(selection, variables)) {
                                return [2];
                            }
                            if (isField(selection)) {
                                return [2, this.resolveField(selection, rootValue, execContext).then(function (fieldResult) {
                                        var _a;
                                        if (typeof fieldResult !== 'undefined') {
                                            resultsToMerge.push((_a = {},
                                                _a[resultKeyNameFromField(selection)] = fieldResult,
                                                _a));
                                        }
                                    })];
                            }
                            if (isInlineFragment(selection)) {
                                fragment = selection;
                            }
                            else {
                                fragment = fragmentMap[selection.name.value];
                                invariant$1(fragment, "No fragment named " + selection.name.value);
                            }
                            if (fragment && fragment.typeCondition) {
                                typeCondition = fragment.typeCondition.name.value;
                                if (execContext.fragmentMatcher(rootValue, typeCondition, context)) {
                                    return [2, this.resolveSelectionSet(fragment.selectionSet, rootValue, execContext).then(function (fragmentResult) {
                                            resultsToMerge.push(fragmentResult);
                                        })];
                                }
                            }
                            return [2];
                        });
                    }); };
                    return [2, Promise.all(selectionSet.selections.map(execute)).then(function () {
                            return mergeDeepArray(resultsToMerge);
                        })];
                });
            });
        };
        LocalState.prototype.resolveField = function (field, rootValue, execContext) {
            return __awaiter(this, void 0, void 0, function () {
                var variables, fieldName, aliasedFieldName, aliasUsed, defaultResult, resultPromise, resolverType, resolverMap, resolve;
                var _this = this;
                return __generator(this, function (_a) {
                    variables = execContext.variables;
                    fieldName = field.name.value;
                    aliasedFieldName = resultKeyNameFromField(field);
                    aliasUsed = fieldName !== aliasedFieldName;
                    defaultResult = rootValue[aliasedFieldName] || rootValue[fieldName];
                    resultPromise = Promise.resolve(defaultResult);
                    if (!execContext.onlyRunForcedResolvers ||
                        this.shouldForceResolvers(field)) {
                        resolverType = rootValue.__typename || execContext.defaultOperationType;
                        resolverMap = this.resolvers && this.resolvers[resolverType];
                        if (resolverMap) {
                            resolve = resolverMap[aliasUsed ? fieldName : aliasedFieldName];
                            if (resolve) {
                                resultPromise = Promise.resolve(cacheSlot.withValue(this.cache, resolve, [
                                    rootValue,
                                    argumentsObjectFromField(field, variables),
                                    execContext.context,
                                    { field: field, fragmentMap: execContext.fragmentMap },
                                ]));
                            }
                        }
                    }
                    return [2, resultPromise.then(function (result) {
                            if (result === void 0) { result = defaultResult; }
                            if (field.directives) {
                                field.directives.forEach(function (directive) {
                                    if (directive.name.value === 'export' && directive.arguments) {
                                        directive.arguments.forEach(function (arg) {
                                            if (arg.name.value === 'as' && arg.value.kind === 'StringValue') {
                                                execContext.exportedVariables[arg.value.value] = result;
                                            }
                                        });
                                    }
                                });
                            }
                            if (!field.selectionSet) {
                                return result;
                            }
                            if (result == null) {
                                return result;
                            }
                            if (Array.isArray(result)) {
                                return _this.resolveSubSelectedArray(field, result, execContext);
                            }
                            if (field.selectionSet) {
                                return _this.resolveSelectionSet(field.selectionSet, result, execContext);
                            }
                        })];
                });
            });
        };
        LocalState.prototype.resolveSubSelectedArray = function (field, result, execContext) {
            var _this = this;
            return Promise.all(result.map(function (item) {
                if (item === null) {
                    return null;
                }
                if (Array.isArray(item)) {
                    return _this.resolveSubSelectedArray(field, item, execContext);
                }
                if (field.selectionSet) {
                    return _this.resolveSelectionSet(field.selectionSet, item, execContext);
                }
            }));
        };
        return LocalState;
    }());

    var destructiveMethodCounts = new (canUseWeakMap ? WeakMap : Map)();
    function wrapDestructiveCacheMethod(cache, methodName) {
        var original = cache[methodName];
        if (typeof original === "function") {
            cache[methodName] = function () {
                destructiveMethodCounts.set(cache, (destructiveMethodCounts.get(cache) + 1) % 1e15);
                return original.apply(this, arguments);
            };
        }
    }
    function cancelNotifyTimeout(info) {
        if (info["notifyTimeout"]) {
            clearTimeout(info["notifyTimeout"]);
            info["notifyTimeout"] = void 0;
        }
    }
    var QueryInfo = (function () {
        function QueryInfo(cache) {
            this.cache = cache;
            this.listeners = new Set();
            this.document = null;
            this.lastRequestId = 1;
            this.subscriptions = new Set();
            this.stopped = false;
            this.dirty = false;
            this.diff = null;
            this.observableQuery = null;
            if (!destructiveMethodCounts.has(cache)) {
                destructiveMethodCounts.set(cache, 0);
                wrapDestructiveCacheMethod(cache, "evict");
                wrapDestructiveCacheMethod(cache, "modify");
                wrapDestructiveCacheMethod(cache, "reset");
            }
        }
        QueryInfo.prototype.init = function (query) {
            var networkStatus = query.networkStatus || NetworkStatus.loading;
            if (this.variables &&
                this.networkStatus !== NetworkStatus.loading &&
                !equal(this.variables, query.variables)) {
                networkStatus = NetworkStatus.setVariables;
            }
            if (!equal(query.variables, this.variables)) {
                this.diff = null;
            }
            Object.assign(this, {
                document: query.document,
                variables: query.variables,
                networkError: null,
                graphQLErrors: this.graphQLErrors || [],
                networkStatus: networkStatus,
            });
            if (query.observableQuery) {
                this.setObservableQuery(query.observableQuery);
            }
            if (query.lastRequestId) {
                this.lastRequestId = query.lastRequestId;
            }
            return this;
        };
        QueryInfo.prototype.reset = function () {
            cancelNotifyTimeout(this);
            this.diff = null;
            this.dirty = false;
        };
        QueryInfo.prototype.getDiff = function (variables) {
            if (variables === void 0) { variables = this.variables; }
            if (this.diff && equal(variables, this.variables)) {
                return this.diff;
            }
            this.updateWatch(this.variables = variables);
            return this.diff = this.cache.diff({
                query: this.document,
                variables: variables,
                returnPartialData: true,
                optimistic: true,
            });
        };
        QueryInfo.prototype.setDiff = function (diff) {
            var _this = this;
            var oldDiff = this.diff;
            this.diff = diff;
            if (!this.dirty &&
                (diff && diff.result) !== (oldDiff && oldDiff.result)) {
                this.dirty = true;
                if (!this.notifyTimeout) {
                    this.notifyTimeout = setTimeout(function () { return _this.notify(); }, 0);
                }
            }
        };
        QueryInfo.prototype.setObservableQuery = function (oq) {
            var _this = this;
            if (oq === this.observableQuery)
                return;
            if (this.oqListener) {
                this.listeners.delete(this.oqListener);
            }
            this.observableQuery = oq;
            if (oq) {
                oq["queryInfo"] = this;
                this.listeners.add(this.oqListener = function () {
                    if (_this.getDiff().fromOptimisticTransaction) {
                        oq["observe"]();
                    }
                    else {
                        oq.reobserve();
                    }
                });
            }
            else {
                delete this.oqListener;
            }
        };
        QueryInfo.prototype.notify = function () {
            var _this = this;
            cancelNotifyTimeout(this);
            if (this.shouldNotify()) {
                this.listeners.forEach(function (listener) { return listener(_this); });
            }
            this.dirty = false;
        };
        QueryInfo.prototype.shouldNotify = function () {
            if (!this.dirty || !this.listeners.size) {
                return false;
            }
            if (isNetworkRequestInFlight(this.networkStatus) &&
                this.observableQuery) {
                var fetchPolicy = this.observableQuery.options.fetchPolicy;
                if (fetchPolicy !== "cache-only" &&
                    fetchPolicy !== "cache-and-network") {
                    return false;
                }
            }
            return true;
        };
        QueryInfo.prototype.stop = function () {
            if (!this.stopped) {
                this.stopped = true;
                this.reset();
                this.cancel();
                delete this.cancel;
                this.subscriptions.forEach(function (sub) { return sub.unsubscribe(); });
                var oq = this.observableQuery;
                if (oq)
                    oq.stopPolling();
            }
        };
        QueryInfo.prototype.cancel = function () { };
        QueryInfo.prototype.updateWatch = function (variables) {
            var _this = this;
            if (variables === void 0) { variables = this.variables; }
            var oq = this.observableQuery;
            if (oq && oq.options.fetchPolicy === "no-cache") {
                return;
            }
            if (!this.lastWatch ||
                this.lastWatch.query !== this.document ||
                !equal(variables, this.lastWatch.variables)) {
                this.cancel();
                this.cancel = this.cache.watch(this.lastWatch = {
                    query: this.document,
                    variables: variables,
                    optimistic: true,
                    callback: function (diff) { return _this.setDiff(diff); },
                });
            }
        };
        QueryInfo.prototype.shouldWrite = function (result, variables) {
            var lastWrite = this.lastWrite;
            return !(lastWrite &&
                lastWrite.dmCount === destructiveMethodCounts.get(this.cache) &&
                equal(variables, lastWrite.variables) &&
                equal(result.data, lastWrite.result.data));
        };
        QueryInfo.prototype.markResult = function (result, options, allowCacheWrite) {
            var _this = this;
            this.graphQLErrors = isNonEmptyArray(result.errors) ? result.errors : [];
            this.reset();
            if (options.fetchPolicy === 'no-cache') {
                this.diff = { result: result.data, complete: true };
            }
            else if (!this.stopped && allowCacheWrite) {
                if (shouldWriteResult(result, options.errorPolicy)) {
                    this.cache.performTransaction(function (cache) {
                        if (_this.shouldWrite(result, options.variables)) {
                            cache.writeQuery({
                                query: _this.document,
                                data: result.data,
                                variables: options.variables,
                            });
                            _this.lastWrite = {
                                result: result,
                                variables: options.variables,
                                dmCount: destructiveMethodCounts.get(_this.cache),
                            };
                        }
                        else {
                            if (_this.diff && _this.diff.complete) {
                                result.data = _this.diff.result;
                                return;
                            }
                        }
                        var diff = cache.diff({
                            query: _this.document,
                            variables: options.variables,
                            returnPartialData: true,
                            optimistic: true,
                        });
                        if (!_this.stopped) {
                            _this.updateWatch(options.variables);
                        }
                        _this.diff = diff;
                        if (diff.complete) {
                            result.data = diff.result;
                        }
                    });
                }
                else {
                    this.lastWrite = void 0;
                }
            }
        };
        QueryInfo.prototype.markReady = function () {
            this.networkError = null;
            return this.networkStatus = NetworkStatus.ready;
        };
        QueryInfo.prototype.markError = function (error) {
            this.networkStatus = NetworkStatus.error;
            this.lastWrite = void 0;
            this.reset();
            if (error.graphQLErrors) {
                this.graphQLErrors = error.graphQLErrors;
            }
            if (error.networkError) {
                this.networkError = error.networkError;
            }
            return error;
        };
        return QueryInfo;
    }());
    function shouldWriteResult(result, errorPolicy) {
        if (errorPolicy === void 0) { errorPolicy = "none"; }
        var ignoreErrors = errorPolicy === "ignore" ||
            errorPolicy === "all";
        var writeWithErrors = !graphQLResultHasError(result);
        if (!writeWithErrors && ignoreErrors && result.data) {
            writeWithErrors = true;
        }
        return writeWithErrors;
    }

    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var QueryManager = (function () {
        function QueryManager(_a) {
            var cache = _a.cache, link = _a.link, _b = _a.queryDeduplication, queryDeduplication = _b === void 0 ? false : _b, onBroadcast = _a.onBroadcast, _c = _a.ssrMode, ssrMode = _c === void 0 ? false : _c, _d = _a.clientAwareness, clientAwareness = _d === void 0 ? {} : _d, localState = _a.localState, assumeImmutableResults = _a.assumeImmutableResults;
            this.clientAwareness = {};
            this.queries = new Map();
            this.fetchCancelFns = new Map();
            this.transformCache = new (canUseWeakMap ? WeakMap : Map)();
            this.queryIdCounter = 1;
            this.requestIdCounter = 1;
            this.mutationIdCounter = 1;
            this.inFlightLinkObservables = new Map();
            this.cache = cache;
            this.link = link;
            this.queryDeduplication = queryDeduplication;
            this.clientAwareness = clientAwareness;
            this.localState = localState || new LocalState({ cache: cache });
            this.ssrMode = ssrMode;
            this.assumeImmutableResults = !!assumeImmutableResults;
            if ((this.onBroadcast = onBroadcast)) {
                this.mutationStore = Object.create(null);
            }
        }
        QueryManager.prototype.stop = function () {
            var _this = this;
            this.queries.forEach(function (_info, queryId) {
                _this.stopQueryNoBroadcast(queryId);
            });
            this.cancelPendingFetches(new InvariantError('QueryManager stopped while query was in flight'));
        };
        QueryManager.prototype.cancelPendingFetches = function (error) {
            this.fetchCancelFns.forEach(function (cancel) { return cancel(error); });
            this.fetchCancelFns.clear();
        };
        QueryManager.prototype.mutate = function (_a) {
            var mutation = _a.mutation, variables = _a.variables, optimisticResponse = _a.optimisticResponse, updateQueries = _a.updateQueries, _b = _a.refetchQueries, refetchQueries = _b === void 0 ? [] : _b, _c = _a.awaitRefetchQueries, awaitRefetchQueries = _c === void 0 ? false : _c, updateWithProxyFn = _a.update, _d = _a.errorPolicy, errorPolicy = _d === void 0 ? 'none' : _d, fetchPolicy = _a.fetchPolicy, _e = _a.context, context = _e === void 0 ? {} : _e;
            return __awaiter(this, void 0, void 0, function () {
                var mutationId, mutationStoreValue, self;
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0:
                            invariant$1(mutation, 'mutation option is required. You must specify your GraphQL document in the mutation option.');
                            invariant$1(!fetchPolicy || fetchPolicy === 'no-cache', "Mutations only support a 'no-cache' fetchPolicy. If you don't want to disable the cache, remove your fetchPolicy setting to proceed with the default mutation behavior.");
                            mutationId = this.generateMutationId();
                            mutation = this.transform(mutation).document;
                            variables = this.getVariables(mutation, variables);
                            if (!this.transform(mutation).hasClientExports) return [3, 2];
                            return [4, this.localState.addExportedVariables(mutation, variables, context)];
                        case 1:
                            variables = _f.sent();
                            _f.label = 2;
                        case 2:
                            mutationStoreValue = this.mutationStore &&
                                (this.mutationStore[mutationId] = {
                                    mutation: mutation,
                                    variables: variables,
                                    loading: true,
                                    error: null,
                                });
                            if (optimisticResponse) {
                                this.markMutationOptimistic(optimisticResponse, {
                                    mutationId: mutationId,
                                    document: mutation,
                                    variables: variables,
                                    errorPolicy: errorPolicy,
                                    updateQueries: updateQueries,
                                    update: updateWithProxyFn,
                                });
                            }
                            this.broadcastQueries();
                            self = this;
                            return [2, new Promise(function (resolve, reject) {
                                    var storeResult;
                                    var error;
                                    self.getObservableFromLink(mutation, __assign$2(__assign$2({}, context), { optimisticResponse: optimisticResponse }), variables, false).subscribe({
                                        next: function (result) {
                                            if (graphQLResultHasError(result) && errorPolicy === 'none') {
                                                error = new ApolloError({
                                                    graphQLErrors: result.errors,
                                                });
                                                return;
                                            }
                                            if (mutationStoreValue) {
                                                mutationStoreValue.loading = false;
                                                mutationStoreValue.error = null;
                                            }
                                            if (fetchPolicy !== 'no-cache') {
                                                try {
                                                    self.markMutationResult({
                                                        mutationId: mutationId,
                                                        result: result,
                                                        document: mutation,
                                                        variables: variables,
                                                        errorPolicy: errorPolicy,
                                                        updateQueries: updateQueries,
                                                        update: updateWithProxyFn,
                                                    });
                                                }
                                                catch (e) {
                                                    error = new ApolloError({
                                                        networkError: e,
                                                    });
                                                    return;
                                                }
                                            }
                                            storeResult = result;
                                        },
                                        error: function (err) {
                                            if (mutationStoreValue) {
                                                mutationStoreValue.loading = false;
                                                mutationStoreValue.error = err;
                                            }
                                            if (optimisticResponse) {
                                                self.cache.removeOptimistic(mutationId);
                                            }
                                            self.broadcastQueries();
                                            reject(new ApolloError({
                                                networkError: err,
                                            }));
                                        },
                                        complete: function () {
                                            if (error && mutationStoreValue) {
                                                mutationStoreValue.loading = false;
                                                mutationStoreValue.error = error;
                                            }
                                            if (optimisticResponse) {
                                                self.cache.removeOptimistic(mutationId);
                                            }
                                            self.broadcastQueries();
                                            if (error) {
                                                reject(error);
                                                return;
                                            }
                                            if (typeof refetchQueries === 'function') {
                                                refetchQueries = refetchQueries(storeResult);
                                            }
                                            var refetchQueryPromises = [];
                                            if (isNonEmptyArray(refetchQueries)) {
                                                refetchQueries.forEach(function (refetchQuery) {
                                                    if (typeof refetchQuery === 'string') {
                                                        self.queries.forEach(function (_a) {
                                                            var observableQuery = _a.observableQuery;
                                                            if (observableQuery &&
                                                                observableQuery.hasObservers() &&
                                                                observableQuery.queryName === refetchQuery) {
                                                                refetchQueryPromises.push(observableQuery.refetch());
                                                            }
                                                        });
                                                    }
                                                    else {
                                                        var queryOptions = {
                                                            query: refetchQuery.query,
                                                            variables: refetchQuery.variables,
                                                            fetchPolicy: 'network-only',
                                                        };
                                                        if (refetchQuery.context) {
                                                            queryOptions.context = refetchQuery.context;
                                                        }
                                                        refetchQueryPromises.push(self.query(queryOptions));
                                                    }
                                                });
                                            }
                                            Promise.all(awaitRefetchQueries ? refetchQueryPromises : []).then(function () {
                                                if (errorPolicy === 'ignore' &&
                                                    storeResult &&
                                                    graphQLResultHasError(storeResult)) {
                                                    delete storeResult.errors;
                                                }
                                                resolve(storeResult);
                                            }, reject);
                                        },
                                    });
                                })];
                    }
                });
            });
        };
        QueryManager.prototype.markMutationResult = function (mutation, cache) {
            var _this = this;
            if (cache === void 0) { cache = this.cache; }
            if (shouldWriteResult(mutation.result, mutation.errorPolicy)) {
                var cacheWrites_1 = [{
                        result: mutation.result.data,
                        dataId: 'ROOT_MUTATION',
                        query: mutation.document,
                        variables: mutation.variables,
                    }];
                var updateQueries_1 = mutation.updateQueries;
                if (updateQueries_1) {
                    this.queries.forEach(function (_a, queryId) {
                        var observableQuery = _a.observableQuery;
                        var queryName = observableQuery && observableQuery.queryName;
                        if (!queryName || !hasOwnProperty.call(updateQueries_1, queryName)) {
                            return;
                        }
                        var updater = updateQueries_1[queryName];
                        var _b = _this.queries.get(queryId), document = _b.document, variables = _b.variables;
                        var _c = cache.diff({
                            query: document,
                            variables: variables,
                            returnPartialData: true,
                            optimistic: false,
                        }), currentQueryResult = _c.result, complete = _c.complete;
                        if (complete && currentQueryResult) {
                            var nextQueryResult = updater(currentQueryResult, {
                                mutationResult: mutation.result,
                                queryName: document && getOperationName(document) || void 0,
                                queryVariables: variables,
                            });
                            if (nextQueryResult) {
                                cacheWrites_1.push({
                                    result: nextQueryResult,
                                    dataId: 'ROOT_QUERY',
                                    query: document,
                                    variables: variables,
                                });
                            }
                        }
                    });
                }
                cache.performTransaction(function (c) {
                    cacheWrites_1.forEach(function (write) { return c.write(write); });
                    var update = mutation.update;
                    if (update) {
                        update(c, mutation.result);
                    }
                }, null);
            }
        };
        QueryManager.prototype.markMutationOptimistic = function (optimisticResponse, mutation) {
            var _this = this;
            var data = typeof optimisticResponse === "function"
                ? optimisticResponse(mutation.variables)
                : optimisticResponse;
            return this.cache.recordOptimisticTransaction(function (cache) {
                try {
                    _this.markMutationResult(__assign$2(__assign$2({}, mutation), { result: { data: data } }), cache);
                }
                catch (error) {
                    invariant$1.error(error);
                }
            }, mutation.mutationId);
        };
        QueryManager.prototype.fetchQuery = function (queryId, options, networkStatus) {
            return this.fetchQueryObservable(queryId, options, networkStatus).promise;
        };
        QueryManager.prototype.getQueryStore = function () {
            var store = Object.create(null);
            this.queries.forEach(function (info, queryId) {
                store[queryId] = {
                    variables: info.variables,
                    networkStatus: info.networkStatus,
                    networkError: info.networkError,
                    graphQLErrors: info.graphQLErrors,
                };
            });
            return store;
        };
        QueryManager.prototype.resetErrors = function (queryId) {
            var queryInfo = this.queries.get(queryId);
            if (queryInfo) {
                queryInfo.networkError = undefined;
                queryInfo.graphQLErrors = [];
            }
        };
        QueryManager.prototype.transform = function (document) {
            var transformCache = this.transformCache;
            if (!transformCache.has(document)) {
                var transformed = this.cache.transformDocument(document);
                var forLink = removeConnectionDirectiveFromDocument(this.cache.transformForLink(transformed));
                var clientQuery = this.localState.clientQuery(transformed);
                var serverQuery = forLink && this.localState.serverQuery(forLink);
                var cacheEntry_1 = {
                    document: transformed,
                    hasClientExports: hasClientExports(transformed),
                    hasForcedResolvers: this.localState.shouldForceResolvers(transformed),
                    clientQuery: clientQuery,
                    serverQuery: serverQuery,
                    defaultVars: getDefaultValues(getOperationDefinition(transformed)),
                };
                var add = function (doc) {
                    if (doc && !transformCache.has(doc)) {
                        transformCache.set(doc, cacheEntry_1);
                    }
                };
                add(document);
                add(transformed);
                add(clientQuery);
                add(serverQuery);
            }
            return transformCache.get(document);
        };
        QueryManager.prototype.getVariables = function (document, variables) {
            return __assign$2(__assign$2({}, this.transform(document).defaultVars), variables);
        };
        QueryManager.prototype.watchQuery = function (options) {
            options = __assign$2(__assign$2({}, options), { variables: this.getVariables(options.query, options.variables) });
            if (typeof options.notifyOnNetworkStatusChange === 'undefined') {
                options.notifyOnNetworkStatusChange = false;
            }
            var queryInfo = new QueryInfo(this.cache);
            var observable = new ObservableQuery({
                queryManager: this,
                queryInfo: queryInfo,
                options: options,
            });
            this.queries.set(observable.queryId, queryInfo);
            queryInfo.init({
                document: options.query,
                observableQuery: observable,
                variables: options.variables,
            });
            return observable;
        };
        QueryManager.prototype.query = function (options) {
            var _this = this;
            invariant$1(options.query, 'query option is required. You must specify your GraphQL document ' +
                'in the query option.');
            invariant$1(options.query.kind === 'Document', 'You must wrap the query string in a "gql" tag.');
            invariant$1(!options.returnPartialData, 'returnPartialData option only supported on watchQuery.');
            invariant$1(!options.pollInterval, 'pollInterval option only supported on watchQuery.');
            var queryId = this.generateQueryId();
            return this.fetchQuery(queryId, options).finally(function () { return _this.stopQuery(queryId); });
        };
        QueryManager.prototype.generateQueryId = function () {
            return String(this.queryIdCounter++);
        };
        QueryManager.prototype.generateRequestId = function () {
            return this.requestIdCounter++;
        };
        QueryManager.prototype.generateMutationId = function () {
            return String(this.mutationIdCounter++);
        };
        QueryManager.prototype.stopQueryInStore = function (queryId) {
            this.stopQueryInStoreNoBroadcast(queryId);
            this.broadcastQueries();
        };
        QueryManager.prototype.stopQueryInStoreNoBroadcast = function (queryId) {
            var queryInfo = this.queries.get(queryId);
            if (queryInfo)
                queryInfo.stop();
        };
        QueryManager.prototype.clearStore = function () {
            this.cancelPendingFetches(new InvariantError('Store reset while query was in flight (not completed in link chain)'));
            this.queries.forEach(function (queryInfo) {
                if (queryInfo.observableQuery) {
                    queryInfo.networkStatus = NetworkStatus.loading;
                }
                else {
                    queryInfo.stop();
                }
            });
            if (this.mutationStore) {
                this.mutationStore = Object.create(null);
            }
            return this.cache.reset();
        };
        QueryManager.prototype.resetStore = function () {
            var _this = this;
            return this.clearStore().then(function () {
                return _this.reFetchObservableQueries();
            });
        };
        QueryManager.prototype.reFetchObservableQueries = function (includeStandby) {
            var _this = this;
            if (includeStandby === void 0) { includeStandby = false; }
            var observableQueryPromises = [];
            this.queries.forEach(function (_a, queryId) {
                var observableQuery = _a.observableQuery;
                if (observableQuery && observableQuery.hasObservers()) {
                    var fetchPolicy = observableQuery.options.fetchPolicy;
                    observableQuery.resetLastResults();
                    if (fetchPolicy !== 'cache-only' &&
                        (includeStandby || fetchPolicy !== 'standby')) {
                        observableQueryPromises.push(observableQuery.refetch());
                    }
                    _this.getQuery(queryId).setDiff(null);
                }
            });
            this.broadcastQueries();
            return Promise.all(observableQueryPromises);
        };
        QueryManager.prototype.setObservableQuery = function (observableQuery) {
            this.getQuery(observableQuery.queryId).setObservableQuery(observableQuery);
        };
        QueryManager.prototype.startGraphQLSubscription = function (_a) {
            var _this = this;
            var query = _a.query, fetchPolicy = _a.fetchPolicy, errorPolicy = _a.errorPolicy, variables = _a.variables, _b = _a.context, context = _b === void 0 ? {} : _b;
            query = this.transform(query).document;
            variables = this.getVariables(query, variables);
            var makeObservable = function (variables) {
                return _this.getObservableFromLink(query, context, variables, false).map(function (result) {
                    if (fetchPolicy !== 'no-cache') {
                        if (shouldWriteResult(result, errorPolicy)) {
                            _this.cache.write({
                                query: query,
                                result: result.data,
                                dataId: 'ROOT_SUBSCRIPTION',
                                variables: variables,
                            });
                        }
                        _this.broadcastQueries();
                    }
                    if (graphQLResultHasError(result)) {
                        throw new ApolloError({
                            graphQLErrors: result.errors,
                        });
                    }
                    return result;
                });
            };
            if (this.transform(query).hasClientExports) {
                var observablePromise_1 = this.localState.addExportedVariables(query, variables, context).then(makeObservable);
                return new zenObservable(function (observer) {
                    var sub = null;
                    observablePromise_1.then(function (observable) { return sub = observable.subscribe(observer); }, observer.error);
                    return function () { return sub && sub.unsubscribe(); };
                });
            }
            return makeObservable(variables);
        };
        QueryManager.prototype.stopQuery = function (queryId) {
            this.stopQueryNoBroadcast(queryId);
            this.broadcastQueries();
        };
        QueryManager.prototype.stopQueryNoBroadcast = function (queryId) {
            this.stopQueryInStoreNoBroadcast(queryId);
            this.removeQuery(queryId);
        };
        QueryManager.prototype.removeQuery = function (queryId) {
            this.fetchCancelFns.delete(queryId);
            this.getQuery(queryId).stop();
            this.queries.delete(queryId);
        };
        QueryManager.prototype.broadcastQueries = function () {
            if (this.onBroadcast)
                this.onBroadcast();
            this.queries.forEach(function (info) { return info.notify(); });
        };
        QueryManager.prototype.getLocalState = function () {
            return this.localState;
        };
        QueryManager.prototype.getObservableFromLink = function (query, context, variables, deduplication) {
            var _this = this;
            var _a;
            if (deduplication === void 0) { deduplication = (_a = context === null || context === void 0 ? void 0 : context.queryDeduplication) !== null && _a !== void 0 ? _a : this.queryDeduplication; }
            var observable;
            var serverQuery = this.transform(query).serverQuery;
            if (serverQuery) {
                var _b = this, inFlightLinkObservables_1 = _b.inFlightLinkObservables, link = _b.link;
                var operation = {
                    query: serverQuery,
                    variables: variables,
                    operationName: getOperationName(serverQuery) || void 0,
                    context: this.prepareContext(__assign$2(__assign$2({}, context), { forceFetch: !deduplication })),
                };
                context = operation.context;
                if (deduplication) {
                    var byVariables_1 = inFlightLinkObservables_1.get(serverQuery) || new Map();
                    inFlightLinkObservables_1.set(serverQuery, byVariables_1);
                    var varJson_1 = JSON.stringify(variables);
                    observable = byVariables_1.get(varJson_1);
                    if (!observable) {
                        var concast = new Concast([
                            execute(link, operation)
                        ]);
                        byVariables_1.set(varJson_1, observable = concast);
                        concast.cleanup(function () {
                            if (byVariables_1.delete(varJson_1) &&
                                byVariables_1.size < 1) {
                                inFlightLinkObservables_1.delete(serverQuery);
                            }
                        });
                    }
                }
                else {
                    observable = new Concast([
                        execute(link, operation)
                    ]);
                }
            }
            else {
                observable = new Concast([
                    zenObservable.of({ data: {} })
                ]);
                context = this.prepareContext(context);
            }
            var clientQuery = this.transform(query).clientQuery;
            if (clientQuery) {
                observable = asyncMap(observable, function (result) {
                    return _this.localState.runResolvers({
                        document: clientQuery,
                        remoteResult: result,
                        context: context,
                        variables: variables,
                    });
                });
            }
            return observable;
        };
        QueryManager.prototype.getResultsFromLink = function (queryInfo, allowCacheWrite, options) {
            var requestId = queryInfo.lastRequestId = this.generateRequestId();
            return asyncMap(this.getObservableFromLink(queryInfo.document, options.context, options.variables), function (result) {
                var hasErrors = isNonEmptyArray(result.errors);
                if (requestId >= queryInfo.lastRequestId) {
                    if (hasErrors && options.errorPolicy === "none") {
                        throw queryInfo.markError(new ApolloError({
                            graphQLErrors: result.errors,
                        }));
                    }
                    queryInfo.markResult(result, options, allowCacheWrite);
                    queryInfo.markReady();
                }
                var aqr = {
                    data: result.data,
                    loading: false,
                    networkStatus: queryInfo.networkStatus || NetworkStatus.ready,
                };
                if (hasErrors && options.errorPolicy !== "ignore") {
                    aqr.errors = result.errors;
                }
                return aqr;
            }, function (networkError) {
                var error = isApolloError(networkError)
                    ? networkError
                    : new ApolloError({ networkError: networkError });
                if (requestId >= queryInfo.lastRequestId) {
                    queryInfo.markError(error);
                }
                throw error;
            });
        };
        QueryManager.prototype.fetchQueryObservable = function (queryId, options, networkStatus) {
            var _this = this;
            if (networkStatus === void 0) { networkStatus = NetworkStatus.loading; }
            var query = this.transform(options.query).document;
            var variables = this.getVariables(query, options.variables);
            var queryInfo = this.getQuery(queryId);
            var oldNetworkStatus = queryInfo.networkStatus;
            var _a = options.fetchPolicy, fetchPolicy = _a === void 0 ? "cache-first" : _a, _b = options.errorPolicy, errorPolicy = _b === void 0 ? "none" : _b, _c = options.returnPartialData, returnPartialData = _c === void 0 ? false : _c, _d = options.notifyOnNetworkStatusChange, notifyOnNetworkStatusChange = _d === void 0 ? false : _d, _e = options.context, context = _e === void 0 ? {} : _e;
            var mightUseNetwork = fetchPolicy === "cache-first" ||
                fetchPolicy === "cache-and-network" ||
                fetchPolicy === "network-only" ||
                fetchPolicy === "no-cache";
            if (mightUseNetwork &&
                notifyOnNetworkStatusChange &&
                typeof oldNetworkStatus === "number" &&
                oldNetworkStatus !== networkStatus &&
                isNetworkRequestInFlight(networkStatus)) {
                if (fetchPolicy !== "cache-first") {
                    fetchPolicy = "cache-and-network";
                }
                returnPartialData = true;
            }
            var normalized = Object.assign({}, options, {
                query: query,
                variables: variables,
                fetchPolicy: fetchPolicy,
                errorPolicy: errorPolicy,
                returnPartialData: returnPartialData,
                notifyOnNetworkStatusChange: notifyOnNetworkStatusChange,
                context: context,
            });
            var fromVariables = function (variables) {
                normalized.variables = variables;
                return _this.fetchQueryByPolicy(queryInfo, normalized, networkStatus);
            };
            this.fetchCancelFns.set(queryId, function (reason) {
                Promise.resolve().then(function () { return concast.cancel(reason); });
            });
            var concast = new Concast(this.transform(normalized.query).hasClientExports
                ? this.localState.addExportedVariables(normalized.query, normalized.variables, normalized.context).then(fromVariables)
                : fromVariables(normalized.variables));
            concast.cleanup(function () {
                _this.fetchCancelFns.delete(queryId);
                var nextFetchPolicy = options.nextFetchPolicy;
                if (nextFetchPolicy) {
                    options.nextFetchPolicy = void 0;
                    options.fetchPolicy = typeof nextFetchPolicy === "function"
                        ? nextFetchPolicy.call(options, options.fetchPolicy || "cache-first")
                        : nextFetchPolicy;
                }
            });
            return concast;
        };
        QueryManager.prototype.fetchQueryByPolicy = function (queryInfo, options, networkStatus) {
            var _this = this;
            var query = options.query, variables = options.variables, fetchPolicy = options.fetchPolicy, errorPolicy = options.errorPolicy, returnPartialData = options.returnPartialData, context = options.context;
            queryInfo.init({
                document: query,
                variables: variables,
                networkStatus: networkStatus,
            });
            var readCache = function () { return queryInfo.getDiff(variables); };
            var resultsFromCache = function (diff, networkStatus) {
                if (networkStatus === void 0) { networkStatus = queryInfo.networkStatus || NetworkStatus.loading; }
                var data = diff.result;
                if (isNonEmptyArray(diff.missing) &&
                    !equal(data, {}) &&
                    !returnPartialData) {
                    invariant$1.warn("Missing cache result fields: " + diff.missing.map(function (m) { return m.path.join('.'); }).join(', '), diff.missing);
                }
                var fromData = function (data) { return zenObservable.of(__assign$2({ data: data, loading: isNetworkRequestInFlight(networkStatus), networkStatus: networkStatus }, (diff.complete ? null : { partial: true }))); };
                if (_this.transform(query).hasForcedResolvers) {
                    return _this.localState.runResolvers({
                        document: query,
                        remoteResult: { data: data },
                        context: context,
                        variables: variables,
                        onlyRunForcedResolvers: true,
                    }).then(function (resolved) { return fromData(resolved.data); });
                }
                return fromData(data);
            };
            var resultsFromLink = function (allowCacheWrite) {
                return _this.getResultsFromLink(queryInfo, allowCacheWrite, {
                    variables: variables,
                    context: context,
                    fetchPolicy: fetchPolicy,
                    errorPolicy: errorPolicy,
                });
            };
            switch (fetchPolicy) {
                default:
                case "cache-first": {
                    var diff = readCache();
                    if (diff.complete) {
                        return [
                            resultsFromCache(diff, queryInfo.markReady()),
                        ];
                    }
                    if (returnPartialData) {
                        return [
                            resultsFromCache(diff),
                            resultsFromLink(true),
                        ];
                    }
                    return [
                        resultsFromLink(true),
                    ];
                }
                case "cache-and-network": {
                    var diff = readCache();
                    if (diff.complete || returnPartialData) {
                        return [
                            resultsFromCache(diff),
                            resultsFromLink(true),
                        ];
                    }
                    return [
                        resultsFromLink(true),
                    ];
                }
                case "cache-only":
                    return [
                        resultsFromCache(readCache(), queryInfo.markReady()),
                    ];
                case "network-only":
                    return [resultsFromLink(true)];
                case "no-cache":
                    return [resultsFromLink(false)];
                case "standby":
                    return [];
            }
        };
        QueryManager.prototype.getQuery = function (queryId) {
            if (queryId && !this.queries.has(queryId)) {
                this.queries.set(queryId, new QueryInfo(this.cache));
            }
            return this.queries.get(queryId);
        };
        QueryManager.prototype.prepareContext = function (context) {
            if (context === void 0) { context = {}; }
            var newContext = this.localState.prepareContext(context);
            return __assign$2(__assign$2({}, newContext), { clientAwareness: this.clientAwareness });
        };
        return QueryManager;
    }());

    var hasSuggestedDevtools = false;
    function mergeOptions(defaults, options) {
        return compact(defaults, options, options.variables && {
            variables: __assign$2(__assign$2({}, defaults.variables), options.variables),
        });
    }
    var ApolloClient = (function () {
        function ApolloClient(options) {
            var _this = this;
            this.defaultOptions = {};
            this.resetStoreCallbacks = [];
            this.clearStoreCallbacks = [];
            var uri = options.uri, credentials = options.credentials, headers = options.headers, cache = options.cache, _a = options.ssrMode, ssrMode = _a === void 0 ? false : _a, _b = options.ssrForceFetchDelay, ssrForceFetchDelay = _b === void 0 ? 0 : _b, _c = options.connectToDevTools, connectToDevTools = _c === void 0 ? typeof window === 'object' &&
                !window.__APOLLO_CLIENT__ &&
                "development" !== 'production' : _c, _d = options.queryDeduplication, queryDeduplication = _d === void 0 ? true : _d, defaultOptions = options.defaultOptions, _e = options.assumeImmutableResults, assumeImmutableResults = _e === void 0 ? false : _e, resolvers = options.resolvers, typeDefs = options.typeDefs, fragmentMatcher = options.fragmentMatcher, clientAwarenessName = options.name, clientAwarenessVersion = options.version;
            var link = options.link;
            if (!link) {
                link = uri
                    ? new HttpLink({ uri: uri, credentials: credentials, headers: headers })
                    : ApolloLink.empty();
            }
            if (!cache) {
                throw new InvariantError("To initialize Apollo Client, you must specify a 'cache' property " +
                    "in the options object. \n" +
                    "For more information, please visit: https://go.apollo.dev/c/docs");
            }
            this.link = link;
            this.cache = cache;
            this.disableNetworkFetches = ssrMode || ssrForceFetchDelay > 0;
            this.queryDeduplication = queryDeduplication;
            this.defaultOptions = defaultOptions || {};
            this.typeDefs = typeDefs;
            if (ssrForceFetchDelay) {
                setTimeout(function () { return (_this.disableNetworkFetches = false); }, ssrForceFetchDelay);
            }
            this.watchQuery = this.watchQuery.bind(this);
            this.query = this.query.bind(this);
            this.mutate = this.mutate.bind(this);
            this.resetStore = this.resetStore.bind(this);
            this.reFetchObservableQueries = this.reFetchObservableQueries.bind(this);
            if (connectToDevTools && typeof window === 'object') {
                window.__APOLLO_CLIENT__ = this;
            }
            if (!hasSuggestedDevtools && "development" !== 'production') {
                hasSuggestedDevtools = true;
                if (typeof window !== 'undefined' &&
                    window.document &&
                    window.top === window.self &&
                    !window.__APOLLO_DEVTOOLS_GLOBAL_HOOK__) {
                    var nav = window.navigator;
                    var ua = nav && nav.userAgent;
                    var url = void 0;
                    if (typeof ua === "string") {
                        if (ua.indexOf("Chrome/") > -1) {
                            url = "https://chrome.google.com/webstore/detail/" +
                                "apollo-client-developer-t/jdkknkkbebbapilgoeccciglkfbmbnfm";
                        }
                        else if (ua.indexOf("Firefox/") > -1) {
                            url = "https://addons.mozilla.org/en-US/firefox/addon/apollo-developer-tools/";
                        }
                    }
                    if (url) {
                        invariant$1.log("Download the Apollo DevTools for a better development " +
                            "experience: " + url);
                    }
                }
            }
            this.version = version;
            this.localState = new LocalState({
                cache: cache,
                client: this,
                resolvers: resolvers,
                fragmentMatcher: fragmentMatcher,
            });
            this.queryManager = new QueryManager({
                cache: this.cache,
                link: this.link,
                queryDeduplication: queryDeduplication,
                ssrMode: ssrMode,
                clientAwareness: {
                    name: clientAwarenessName,
                    version: clientAwarenessVersion,
                },
                localState: this.localState,
                assumeImmutableResults: assumeImmutableResults,
                onBroadcast: connectToDevTools ? function () {
                    if (_this.devToolsHookCb) {
                        _this.devToolsHookCb({
                            action: {},
                            state: {
                                queries: _this.queryManager.getQueryStore(),
                                mutations: _this.queryManager.mutationStore || {},
                            },
                            dataWithOptimisticResults: _this.cache.extract(true),
                        });
                    }
                } : void 0,
            });
        }
        ApolloClient.prototype.stop = function () {
            this.queryManager.stop();
        };
        ApolloClient.prototype.watchQuery = function (options) {
            if (this.defaultOptions.watchQuery) {
                options = mergeOptions(this.defaultOptions.watchQuery, options);
            }
            if (this.disableNetworkFetches &&
                (options.fetchPolicy === 'network-only' ||
                    options.fetchPolicy === 'cache-and-network')) {
                options = __assign$2(__assign$2({}, options), { fetchPolicy: 'cache-first' });
            }
            return this.queryManager.watchQuery(options);
        };
        ApolloClient.prototype.query = function (options) {
            if (this.defaultOptions.query) {
                options = mergeOptions(this.defaultOptions.query, options);
            }
            invariant$1(options.fetchPolicy !== 'cache-and-network', 'The cache-and-network fetchPolicy does not work with client.query, because ' +
                'client.query can only return a single result. Please use client.watchQuery ' +
                'to receive multiple results from the cache and the network, or consider ' +
                'using a different fetchPolicy, such as cache-first or network-only.');
            if (this.disableNetworkFetches && options.fetchPolicy === 'network-only') {
                options = __assign$2(__assign$2({}, options), { fetchPolicy: 'cache-first' });
            }
            return this.queryManager.query(options);
        };
        ApolloClient.prototype.mutate = function (options) {
            if (this.defaultOptions.mutate) {
                options = mergeOptions(this.defaultOptions.mutate, options);
            }
            return this.queryManager.mutate(options);
        };
        ApolloClient.prototype.subscribe = function (options) {
            return this.queryManager.startGraphQLSubscription(options);
        };
        ApolloClient.prototype.readQuery = function (options, optimistic) {
            if (optimistic === void 0) { optimistic = false; }
            return this.cache.readQuery(options, optimistic);
        };
        ApolloClient.prototype.readFragment = function (options, optimistic) {
            if (optimistic === void 0) { optimistic = false; }
            return this.cache.readFragment(options, optimistic);
        };
        ApolloClient.prototype.writeQuery = function (options) {
            this.cache.writeQuery(options);
            this.queryManager.broadcastQueries();
        };
        ApolloClient.prototype.writeFragment = function (options) {
            this.cache.writeFragment(options);
            this.queryManager.broadcastQueries();
        };
        ApolloClient.prototype.__actionHookForDevTools = function (cb) {
            this.devToolsHookCb = cb;
        };
        ApolloClient.prototype.__requestRaw = function (payload) {
            return execute(this.link, payload);
        };
        ApolloClient.prototype.resetStore = function () {
            var _this = this;
            return Promise.resolve()
                .then(function () { return _this.queryManager.clearStore(); })
                .then(function () { return Promise.all(_this.resetStoreCallbacks.map(function (fn) { return fn(); })); })
                .then(function () { return _this.reFetchObservableQueries(); });
        };
        ApolloClient.prototype.clearStore = function () {
            var _this = this;
            return Promise.resolve()
                .then(function () { return _this.queryManager.clearStore(); })
                .then(function () { return Promise.all(_this.clearStoreCallbacks.map(function (fn) { return fn(); })); });
        };
        ApolloClient.prototype.onResetStore = function (cb) {
            var _this = this;
            this.resetStoreCallbacks.push(cb);
            return function () {
                _this.resetStoreCallbacks = _this.resetStoreCallbacks.filter(function (c) { return c !== cb; });
            };
        };
        ApolloClient.prototype.onClearStore = function (cb) {
            var _this = this;
            this.clearStoreCallbacks.push(cb);
            return function () {
                _this.clearStoreCallbacks = _this.clearStoreCallbacks.filter(function (c) { return c !== cb; });
            };
        };
        ApolloClient.prototype.reFetchObservableQueries = function (includeStandby) {
            return this.queryManager.reFetchObservableQueries(includeStandby);
        };
        ApolloClient.prototype.extract = function (optimistic) {
            return this.cache.extract(optimistic);
        };
        ApolloClient.prototype.restore = function (serializedState) {
            return this.cache.restore(serializedState);
        };
        ApolloClient.prototype.addResolvers = function (resolvers) {
            this.localState.addResolvers(resolvers);
        };
        ApolloClient.prototype.setResolvers = function (resolvers) {
            this.localState.setResolvers(resolvers);
        };
        ApolloClient.prototype.getResolvers = function () {
            return this.localState.getResolvers();
        };
        ApolloClient.prototype.setLocalStateFragmentMatcher = function (fragmentMatcher) {
            this.localState.setFragmentMatcher(fragmentMatcher);
        };
        ApolloClient.prototype.setLink = function (newLink) {
            this.link = this.queryManager.link = newLink;
        };
        return ApolloClient;
    }());

    var docCache = new Map();
    var fragmentSourceMap = new Map();
    var printFragmentWarnings = true;
    var experimentalFragmentVariables = false;
    function normalize(string) {
        return string.replace(/[\s,]+/g, ' ').trim();
    }
    function cacheKeyFromLoc(loc) {
        return normalize(loc.source.body.substring(loc.start, loc.end));
    }
    function processFragments(ast) {
        var seenKeys = new Set();
        var definitions = [];
        ast.definitions.forEach(function (fragmentDefinition) {
            if (fragmentDefinition.kind === 'FragmentDefinition') {
                var fragmentName = fragmentDefinition.name.value;
                var sourceKey = cacheKeyFromLoc(fragmentDefinition.loc);
                var sourceKeySet = fragmentSourceMap.get(fragmentName);
                if (sourceKeySet && !sourceKeySet.has(sourceKey)) {
                    if (printFragmentWarnings) {
                        console.warn("Warning: fragment with name " + fragmentName + " already exists.\n"
                            + "graphql-tag enforces all fragment names across your application to be unique; read more about\n"
                            + "this in the docs: http://dev.apollodata.com/core/fragments.html#unique-names");
                    }
                }
                else if (!sourceKeySet) {
                    fragmentSourceMap.set(fragmentName, sourceKeySet = new Set);
                }
                sourceKeySet.add(sourceKey);
                if (!seenKeys.has(sourceKey)) {
                    seenKeys.add(sourceKey);
                    definitions.push(fragmentDefinition);
                }
            }
            else {
                definitions.push(fragmentDefinition);
            }
        });
        return __assign$1(__assign$1({}, ast), { definitions: definitions });
    }
    function stripLoc(doc) {
        var workSet = new Set(doc.definitions);
        workSet.forEach(function (node) {
            if (node.loc)
                delete node.loc;
            Object.keys(node).forEach(function (key) {
                var value = node[key];
                if (value && typeof value === 'object') {
                    workSet.add(value);
                }
            });
        });
        var loc = doc.loc;
        if (loc) {
            delete loc.startToken;
            delete loc.endToken;
        }
        return doc;
    }
    function parseDocument(source) {
        var cacheKey = normalize(source);
        if (!docCache.has(cacheKey)) {
            var parsed = parse(source, {
                experimentalFragmentVariables: experimentalFragmentVariables
            });
            if (!parsed || parsed.kind !== 'Document') {
                throw new Error('Not a valid GraphQL document.');
            }
            docCache.set(cacheKey, stripLoc(processFragments(parsed)));
        }
        return docCache.get(cacheKey);
    }
    function gql(literals) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (typeof literals === 'string') {
            literals = [literals];
        }
        var result = literals[0];
        args.forEach(function (arg, i) {
            if (arg && arg.kind === 'Document') {
                result += arg.loc.source.body;
            }
            else {
                result += arg;
            }
            result += literals[i + 1];
        });
        return parseDocument(result);
    }
    function resetCaches() {
        docCache.clear();
        fragmentSourceMap.clear();
    }
    function disableFragmentWarnings() {
        printFragmentWarnings = false;
    }
    function enableExperimentalFragmentVariables() {
        experimentalFragmentVariables = true;
    }
    function disableExperimentalFragmentVariables() {
        experimentalFragmentVariables = false;
    }
    var extras = {
        gql: gql,
        resetCaches: resetCaches,
        disableFragmentWarnings: disableFragmentWarnings,
        enableExperimentalFragmentVariables: enableExperimentalFragmentVariables,
        disableExperimentalFragmentVariables: disableExperimentalFragmentVariables
    };
    (function (gql_1) {
        gql_1.gql = extras.gql, gql_1.resetCaches = extras.resetCaches, gql_1.disableFragmentWarnings = extras.disableFragmentWarnings, gql_1.enableExperimentalFragmentVariables = extras.enableExperimentalFragmentVariables, gql_1.disableExperimentalFragmentVariables = extras.disableExperimentalFragmentVariables;
    })(gql || (gql = {}));
    gql["default"] = gql;
    var gql$1 = gql;

    function setContext(setter) {
        return new ApolloLink(function (operation, forward) {
            var request = __rest(operation, []);
            return new zenObservable(function (observer) {
                var handle;
                Promise.resolve(request)
                    .then(function (req) { return setter(req, operation.getContext()); })
                    .then(operation.setContext)
                    .then(function () {
                    handle = forward(operation).subscribe({
                        next: observer.next.bind(observer),
                        error: observer.error.bind(observer),
                        complete: observer.complete.bind(observer),
                    });
                })
                    .catch(observer.error.bind(observer));
                return function () {
                    if (handle)
                        handle.unsubscribe();
                };
            });
        });
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    var CLIENT = typeof Symbol !== "undefined" ? Symbol("client") : "@@client";
    function getClient() {
        var client = getContext(CLIENT);
        if (!client) {
            throw new Error("ApolloClient has not been set yet, use setClient(new ApolloClient({ ... })) to define it");
        }
        return client;
    }
    function setClient(client) {
        setContext$1(CLIENT, client);
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function mutation(mutation) {
        var client = getClient();
        return function (options) {
            return client.mutate(__assign({ mutation: mutation }, options));
        };
    }

    function observableToReadable(observable, initialValue) {
        if (initialValue === void 0) { initialValue = {
            loading: true,
            data: undefined,
            error: undefined,
        }; }
        var store = readable(initialValue, function (set) {
            var skipDuplicate = (initialValue === null || initialValue === void 0 ? void 0 : initialValue.data) !== undefined;
            var skipped = false;
            var subscription = observable.subscribe(function (result) {
                if (skipDuplicate && !skipped) {
                    skipped = true;
                    return;
                }
                if (result.errors) {
                    var error = new ApolloError({ graphQLErrors: result.errors });
                    set({ loading: false, data: undefined, error: error });
                }
                else {
                    set({ loading: false, data: result.data, error: undefined });
                }
            }, function (error) { return set({ loading: false, data: undefined, error: error }); });
            return function () { return subscription.unsubscribe(); };
        });
        return store;
    }
    var extensions = [
        "fetchMore",
        "getCurrentResult",
        "getLastError",
        "getLastResult",
        "isDifferentFromLastResult",
        "refetch",
        "resetLastResults",
        "resetQueryStoreErrors",
        "result",
        "setOptions",
        "setVariables",
        "startPolling",
        "stopPolling",
        "subscribeToMore",
        "updateQuery",
    ];
    function observableQueryToReadable(query, initialValue) {
        var store = observableToReadable(query, initialValue);
        for (var _i = 0, extensions_1 = extensions; _i < extensions_1.length; _i++) {
            var extension = extensions_1[_i];
            store[extension] = query[extension].bind(query);
        }
        return store;
    }

    var restoring = typeof WeakSet !== "undefined" ? new WeakSet() : new Set();

    function query(query, options) {
        if (options === void 0) { options = {}; }
        var client = getClient();
        var queryOptions = __assign(__assign({}, options), { query: query });
        // If client is restoring (e.g. from SSR), attempt synchronous readQuery first
        var initialValue;
        if (restoring.has(client)) {
            try {
                // undefined = skip initial value (not in cache)
                initialValue = client.readQuery(queryOptions) || undefined;
            }
            catch (err) {
                // Ignore preload errors
            }
        }
        var observable = client.watchQuery(queryOptions);
        var store = observableQueryToReadable(observable, initialValue !== undefined
            ? {
                data: initialValue,
            }
            : undefined);
        return store;
    }

    const LOCATION = {};
    const ROUTER = {};

    /**
     * Adapted from https://github.com/reach/router/blob/b60e6dd781d5d3a4bdaaf4de665649c0f6a7e78d/src/lib/history.js
     *
     * https://github.com/reach/router/blob/master/LICENSE
     * */

    function getLocation(source) {
      return {
        ...source.location,
        state: source.history.state,
        key: (source.history.state && source.history.state.key) || "initial"
      };
    }

    function createHistory(source, options) {
      const listeners = [];
      let location = getLocation(source);

      return {
        get location() {
          return location;
        },

        listen(listener) {
          listeners.push(listener);

          const popstateListener = () => {
            location = getLocation(source);
            listener({ location, action: "POP" });
          };

          source.addEventListener("popstate", popstateListener);

          return () => {
            source.removeEventListener("popstate", popstateListener);

            const index = listeners.indexOf(listener);
            listeners.splice(index, 1);
          };
        },

        navigate(to, { state, replace = false } = {}) {
          state = { ...state, key: Date.now() + "" };
          // try...catch iOS Safari limits to 100 pushState calls
          try {
            if (replace) {
              source.history.replaceState(state, null, to);
            } else {
              source.history.pushState(state, null, to);
            }
          } catch (e) {
            source.location[replace ? "replace" : "assign"](to);
          }

          location = getLocation(source);
          listeners.forEach(listener => listener({ location, action: "PUSH" }));
        }
      };
    }

    // Stores history entries in memory for testing or other platforms like Native
    function createMemorySource(initialPathname = "/") {
      let index = 0;
      const stack = [{ pathname: initialPathname, search: "" }];
      const states = [];

      return {
        get location() {
          return stack[index];
        },
        addEventListener(name, fn) {},
        removeEventListener(name, fn) {},
        history: {
          get entries() {
            return stack;
          },
          get index() {
            return index;
          },
          get state() {
            return states[index];
          },
          pushState(state, _, uri) {
            const [pathname, search = ""] = uri.split("?");
            index++;
            stack.push({ pathname, search });
            states.push(state);
          },
          replaceState(state, _, uri) {
            const [pathname, search = ""] = uri.split("?");
            stack[index] = { pathname, search };
            states[index] = state;
          }
        }
      };
    }

    // Global history uses window.history as the source if available,
    // otherwise a memory history
    const canUseDOM = Boolean(
      typeof window !== "undefined" &&
        window.document &&
        window.document.createElement
    );
    const globalHistory = createHistory(canUseDOM ? window : createMemorySource());
    const { navigate } = globalHistory;

    /**
     * Adapted from https://github.com/reach/router/blob/b60e6dd781d5d3a4bdaaf4de665649c0f6a7e78d/src/lib/utils.js
     *
     * https://github.com/reach/router/blob/master/LICENSE
     * */

    const paramRe = /^:(.+)/;

    const SEGMENT_POINTS = 4;
    const STATIC_POINTS = 3;
    const DYNAMIC_POINTS = 2;
    const SPLAT_PENALTY = 1;
    const ROOT_POINTS = 1;

    /**
     * Check if `segment` is a root segment
     * @param {string} segment
     * @return {boolean}
     */
    function isRootSegment(segment) {
      return segment === "";
    }

    /**
     * Check if `segment` is a dynamic segment
     * @param {string} segment
     * @return {boolean}
     */
    function isDynamic(segment) {
      return paramRe.test(segment);
    }

    /**
     * Check if `segment` is a splat
     * @param {string} segment
     * @return {boolean}
     */
    function isSplat(segment) {
      return segment[0] === "*";
    }

    /**
     * Split up the URI into segments delimited by `/`
     * @param {string} uri
     * @return {string[]}
     */
    function segmentize(uri) {
      return (
        uri
          // Strip starting/ending `/`
          .replace(/(^\/+|\/+$)/g, "")
          .split("/")
      );
    }

    /**
     * Strip `str` of potential start and end `/`
     * @param {string} str
     * @return {string}
     */
    function stripSlashes(str) {
      return str.replace(/(^\/+|\/+$)/g, "");
    }

    /**
     * Score a route depending on how its individual segments look
     * @param {object} route
     * @param {number} index
     * @return {object}
     */
    function rankRoute(route, index) {
      const score = route.default
        ? 0
        : segmentize(route.path).reduce((score, segment) => {
            score += SEGMENT_POINTS;

            if (isRootSegment(segment)) {
              score += ROOT_POINTS;
            } else if (isDynamic(segment)) {
              score += DYNAMIC_POINTS;
            } else if (isSplat(segment)) {
              score -= SEGMENT_POINTS + SPLAT_PENALTY;
            } else {
              score += STATIC_POINTS;
            }

            return score;
          }, 0);

      return { route, score, index };
    }

    /**
     * Give a score to all routes and sort them on that
     * @param {object[]} routes
     * @return {object[]}
     */
    function rankRoutes(routes) {
      return (
        routes
          .map(rankRoute)
          // If two routes have the exact same score, we go by index instead
          .sort((a, b) =>
            a.score < b.score ? 1 : a.score > b.score ? -1 : a.index - b.index
          )
      );
    }

    /**
     * Ranks and picks the best route to match. Each segment gets the highest
     * amount of points, then the type of segment gets an additional amount of
     * points where
     *
     *  static > dynamic > splat > root
     *
     * This way we don't have to worry about the order of our routes, let the
     * computers do it.
     *
     * A route looks like this
     *
     *  { path, default, value }
     *
     * And a returned match looks like:
     *
     *  { route, params, uri }
     *
     * @param {object[]} routes
     * @param {string} uri
     * @return {?object}
     */
    function pick(routes, uri) {
      let match;
      let default_;

      const [uriPathname] = uri.split("?");
      const uriSegments = segmentize(uriPathname);
      const isRootUri = uriSegments[0] === "";
      const ranked = rankRoutes(routes);

      for (let i = 0, l = ranked.length; i < l; i++) {
        const route = ranked[i].route;
        let missed = false;

        if (route.default) {
          default_ = {
            route,
            params: {},
            uri
          };
          continue;
        }

        const routeSegments = segmentize(route.path);
        const params = {};
        const max = Math.max(uriSegments.length, routeSegments.length);
        let index = 0;

        for (; index < max; index++) {
          const routeSegment = routeSegments[index];
          const uriSegment = uriSegments[index];

          if (routeSegment !== undefined && isSplat(routeSegment)) {
            // Hit a splat, just grab the rest, and return a match
            // uri:   /files/documents/work
            // route: /files/* or /files/*splatname
            const splatName = routeSegment === "*" ? "*" : routeSegment.slice(1);

            params[splatName] = uriSegments
              .slice(index)
              .map(decodeURIComponent)
              .join("/");
            break;
          }

          if (uriSegment === undefined) {
            // URI is shorter than the route, no match
            // uri:   /users
            // route: /users/:userId
            missed = true;
            break;
          }

          let dynamicMatch = paramRe.exec(routeSegment);

          if (dynamicMatch && !isRootUri) {
            const value = decodeURIComponent(uriSegment);
            params[dynamicMatch[1]] = value;
          } else if (routeSegment !== uriSegment) {
            // Current segments don't match, not dynamic, not splat, so no match
            // uri:   /users/123/settings
            // route: /users/:id/profile
            missed = true;
            break;
          }
        }

        if (!missed) {
          match = {
            route,
            params,
            uri: "/" + uriSegments.slice(0, index).join("/")
          };
          break;
        }
      }

      return match || default_ || null;
    }

    /**
     * Check if the `path` matches the `uri`.
     * @param {string} path
     * @param {string} uri
     * @return {?object}
     */
    function match(route, uri) {
      return pick([route], uri);
    }

    /**
     * Combines the `basepath` and the `path` into one path.
     * @param {string} basepath
     * @param {string} path
     */
    function combinePaths(basepath, path) {
      return `${stripSlashes(
    path === "/" ? basepath : `${stripSlashes(basepath)}/${stripSlashes(path)}`
  )}/`;
    }

    /**
     * Decides whether a given `event` should result in a navigation or not.
     * @param {object} event
     */
    function shouldNavigate(event) {
      return (
        !event.defaultPrevented &&
        event.button === 0 &&
        !(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
      );
    }

    function hostMatches(anchor) {
      const host = location.host;
      return (
        anchor.host == host ||
        // svelte seems to kill anchor.host value in ie11, so fall back to checking href
        anchor.href.indexOf(`https://${host}`) === 0 ||
        anchor.href.indexOf(`http://${host}`) === 0
      )
    }

    /* ../../node_modules/svelte-routing/src/Router.svelte generated by Svelte v3.38.2 */

    function create_fragment$6(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[9].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 256)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[8], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $base;
    	let $location;
    	let $routes;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Router", slots, ['default']);
    	let { basepath = "/" } = $$props;
    	let { url = null } = $$props;
    	const locationContext = getContext(LOCATION);
    	const routerContext = getContext(ROUTER);
    	const routes = writable([]);
    	validate_store(routes, "routes");
    	component_subscribe($$self, routes, value => $$invalidate(7, $routes = value));
    	const activeRoute = writable(null);
    	let hasActiveRoute = false; // Used in SSR to synchronously set that a Route is active.

    	// If locationContext is not set, this is the topmost Router in the tree.
    	// If the `url` prop is given we force the location to it.
    	const location = locationContext || writable(url ? { pathname: url } : globalHistory.location);

    	validate_store(location, "location");
    	component_subscribe($$self, location, value => $$invalidate(6, $location = value));

    	// If routerContext is set, the routerBase of the parent Router
    	// will be the base for this Router's descendants.
    	// If routerContext is not set, the path and resolved uri will both
    	// have the value of the basepath prop.
    	const base = routerContext
    	? routerContext.routerBase
    	: writable({ path: basepath, uri: basepath });

    	validate_store(base, "base");
    	component_subscribe($$self, base, value => $$invalidate(5, $base = value));

    	const routerBase = derived([base, activeRoute], ([base, activeRoute]) => {
    		// If there is no activeRoute, the routerBase will be identical to the base.
    		if (activeRoute === null) {
    			return base;
    		}

    		const { path: basepath } = base;
    		const { route, uri } = activeRoute;

    		// Remove the potential /* or /*splatname from
    		// the end of the child Routes relative paths.
    		const path = route.default
    		? basepath
    		: route.path.replace(/\*.*$/, "");

    		return { path, uri };
    	});

    	function registerRoute(route) {
    		const { path: basepath } = $base;
    		let { path } = route;

    		// We store the original path in the _path property so we can reuse
    		// it when the basepath changes. The only thing that matters is that
    		// the route reference is intact, so mutation is fine.
    		route._path = path;

    		route.path = combinePaths(basepath, path);

    		if (typeof window === "undefined") {
    			// In SSR we should set the activeRoute immediately if it is a match.
    			// If there are more Routes being registered after a match is found,
    			// we just skip them.
    			if (hasActiveRoute) {
    				return;
    			}

    			const matchingRoute = match(route, $location.pathname);

    			if (matchingRoute) {
    				activeRoute.set(matchingRoute);
    				hasActiveRoute = true;
    			}
    		} else {
    			routes.update(rs => {
    				rs.push(route);
    				return rs;
    			});
    		}
    	}

    	function unregisterRoute(route) {
    		routes.update(rs => {
    			const index = rs.indexOf(route);
    			rs.splice(index, 1);
    			return rs;
    		});
    	}

    	if (!locationContext) {
    		// The topmost Router in the tree is responsible for updating
    		// the location store and supplying it through context.
    		onMount(() => {
    			const unlisten = globalHistory.listen(history => {
    				location.set(history.location);
    			});

    			return unlisten;
    		});

    		setContext$1(LOCATION, location);
    	}

    	setContext$1(ROUTER, {
    		activeRoute,
    		base,
    		routerBase,
    		registerRoute,
    		unregisterRoute
    	});

    	const writable_props = ["basepath", "url"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("basepath" in $$props) $$invalidate(3, basepath = $$props.basepath);
    		if ("url" in $$props) $$invalidate(4, url = $$props.url);
    		if ("$$scope" in $$props) $$invalidate(8, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		setContext: setContext$1,
    		onMount,
    		writable,
    		derived,
    		LOCATION,
    		ROUTER,
    		globalHistory,
    		pick,
    		match,
    		stripSlashes,
    		combinePaths,
    		basepath,
    		url,
    		locationContext,
    		routerContext,
    		routes,
    		activeRoute,
    		hasActiveRoute,
    		location,
    		base,
    		routerBase,
    		registerRoute,
    		unregisterRoute,
    		$base,
    		$location,
    		$routes
    	});

    	$$self.$inject_state = $$props => {
    		if ("basepath" in $$props) $$invalidate(3, basepath = $$props.basepath);
    		if ("url" in $$props) $$invalidate(4, url = $$props.url);
    		if ("hasActiveRoute" in $$props) hasActiveRoute = $$props.hasActiveRoute;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$base*/ 32) {
    			// This reactive statement will update all the Routes' path when
    			// the basepath changes.
    			{
    				const { path: basepath } = $base;

    				routes.update(rs => {
    					rs.forEach(r => r.path = combinePaths(basepath, r._path));
    					return rs;
    				});
    			}
    		}

    		if ($$self.$$.dirty & /*$routes, $location*/ 192) {
    			// This reactive statement will be run when the Router is created
    			// when there are no Routes and then again the following tick, so it
    			// will not find an active Route in SSR and in the browser it will only
    			// pick an active Route after all Routes have been registered.
    			{
    				const bestMatch = pick($routes, $location.pathname);
    				activeRoute.set(bestMatch);
    			}
    		}
    	};

    	return [
    		routes,
    		location,
    		base,
    		basepath,
    		url,
    		$base,
    		$location,
    		$routes,
    		$$scope,
    		slots
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { basepath: 3, url: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get basepath() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set basepath(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get url() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set url(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ../../node_modules/svelte-routing/src/Route.svelte generated by Svelte v3.38.2 */

    const get_default_slot_changes = dirty => ({
    	params: dirty & /*routeParams*/ 4,
    	location: dirty & /*$location*/ 16
    });

    const get_default_slot_context = ctx => ({
    	params: /*routeParams*/ ctx[2],
    	location: /*$location*/ ctx[4]
    });

    // (40:0) {#if $activeRoute !== null && $activeRoute.route === route}
    function create_if_block$2(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1$2, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*component*/ ctx[0] !== null) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
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
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
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
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(40:0) {#if $activeRoute !== null && $activeRoute.route === route}",
    		ctx
    	});

    	return block;
    }

    // (43:2) {:else}
    function create_else_block$2(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[10].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], get_default_slot_context);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope, routeParams, $location*/ 532)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[9], dirty, get_default_slot_changes, get_default_slot_context);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(43:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (41:2) {#if component !== null}
    function create_if_block_1$2(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;

    	const switch_instance_spread_levels = [
    		{ location: /*$location*/ ctx[4] },
    		/*routeParams*/ ctx[2],
    		/*routeProps*/ ctx[3]
    	];

    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*$location, routeParams, routeProps*/ 28)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*$location*/ 16 && { location: /*$location*/ ctx[4] },
    					dirty & /*routeParams*/ 4 && get_spread_object(/*routeParams*/ ctx[2]),
    					dirty & /*routeProps*/ 8 && get_spread_object(/*routeProps*/ ctx[3])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(41:2) {#if component !== null}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$activeRoute*/ ctx[1] !== null && /*$activeRoute*/ ctx[1].route === /*route*/ ctx[7] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$activeRoute*/ ctx[1] !== null && /*$activeRoute*/ ctx[1].route === /*route*/ ctx[7]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$activeRoute*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
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
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $activeRoute;
    	let $location;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Route", slots, ['default']);
    	let { path = "" } = $$props;
    	let { component = null } = $$props;
    	const { registerRoute, unregisterRoute, activeRoute } = getContext(ROUTER);
    	validate_store(activeRoute, "activeRoute");
    	component_subscribe($$self, activeRoute, value => $$invalidate(1, $activeRoute = value));
    	const location = getContext(LOCATION);
    	validate_store(location, "location");
    	component_subscribe($$self, location, value => $$invalidate(4, $location = value));

    	const route = {
    		path,
    		// If no path prop is given, this Route will act as the default Route
    		// that is rendered if no other Route in the Router is a match.
    		default: path === ""
    	};

    	let routeParams = {};
    	let routeProps = {};
    	registerRoute(route);

    	// There is no need to unregister Routes in SSR since it will all be
    	// thrown away anyway.
    	if (typeof window !== "undefined") {
    		onDestroy(() => {
    			unregisterRoute(route);
    		});
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(13, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("path" in $$new_props) $$invalidate(8, path = $$new_props.path);
    		if ("component" in $$new_props) $$invalidate(0, component = $$new_props.component);
    		if ("$$scope" in $$new_props) $$invalidate(9, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		onDestroy,
    		ROUTER,
    		LOCATION,
    		path,
    		component,
    		registerRoute,
    		unregisterRoute,
    		activeRoute,
    		location,
    		route,
    		routeParams,
    		routeProps,
    		$activeRoute,
    		$location
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(13, $$props = assign(assign({}, $$props), $$new_props));
    		if ("path" in $$props) $$invalidate(8, path = $$new_props.path);
    		if ("component" in $$props) $$invalidate(0, component = $$new_props.component);
    		if ("routeParams" in $$props) $$invalidate(2, routeParams = $$new_props.routeParams);
    		if ("routeProps" in $$props) $$invalidate(3, routeProps = $$new_props.routeProps);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$activeRoute*/ 2) {
    			if ($activeRoute && $activeRoute.route === route) {
    				$$invalidate(2, routeParams = $activeRoute.params);
    			}
    		}

    		{
    			const { path, component, ...rest } = $$props;
    			$$invalidate(3, routeProps = rest);
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		component,
    		$activeRoute,
    		routeParams,
    		routeProps,
    		$location,
    		activeRoute,
    		location,
    		route,
    		path,
    		$$scope,
    		slots
    	];
    }

    class Route extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { path: 8, component: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Route",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get path() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set path(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get component() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set component(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /**
     * A link action that can be added to <a href=""> tags rather
     * than using the <Link> component.
     *
     * Example:
     * ```html
     * <a href="/post/{postId}" use:link>{post.title}</a>
     * ```
     */
    function link(node) {
      function onClick(event) {
        const anchor = event.currentTarget;

        if (
          anchor.target === "" &&
          hostMatches(anchor) &&
          shouldNavigate(event)
        ) {
          event.preventDefault();
          navigate(anchor.pathname + anchor.search, { replace: anchor.hasAttribute("replace") });
        }
      }

      node.addEventListener("click", onClick);

      return {
        destroy() {
          node.removeEventListener("click", onClick);
        }
      };
    }

    var netlifyIdentity = createCommonjsModule(function (module, exports) {
    !function(e,t){module.exports=t();}(commonjsGlobal,(function(){return function(e){var t={};function n(r){if(t[r])return t[r].exports;var o=t[r]={i:r,l:!1,exports:{}};return e[r].call(o.exports,o,o.exports,n),o.l=!0,o.exports}return n.m=e,n.c=t,n.d=function(e,t,r){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:r});},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0});},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)n.d(r,o,function(t){return e[t]}.bind(null,o));return r},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="/",n(n.s=8)}([function(e,t,n){n.r(t),n.d(t,"h",(function(){return a})),n.d(t,"createElement",(function(){return a})),n.d(t,"cloneElement",(function(){return N})),n.d(t,"createRef",(function(){return B})),n.d(t,"Component",(function(){return Y})),n.d(t,"render",(function(){return Q})),n.d(t,"rerender",(function(){return y})),n.d(t,"options",(function(){return o}));var r=function(){},o={},M=[],i=[];function a(e,t){var n,a,u,s,c=i;for(s=arguments.length;s-- >2;)M.push(arguments[s]);for(t&&null!=t.children&&(M.length||M.push(t.children),delete t.children);M.length;)if((a=M.pop())&&void 0!==a.pop)for(s=a.length;s--;)M.push(a[s]);else "boolean"==typeof a&&(a=null),(u="function"!=typeof e)&&(null==a?a="":"number"==typeof a?a=String(a):"string"!=typeof a&&(u=!1)),u&&n?c[c.length-1]+=a:c===i?c=[a]:c.push(a),n=u;var N=new r;return N.nodeName=e,N.children=c,N.attributes=null==t?void 0:t,N.key=null==t?void 0:t.key,void 0!==o.vnode&&o.vnode(N),N}function u(e,t){for(var n in t)e[n]=t[n];return e}function s(e,t){e&&("function"==typeof e?e(t):e.current=t);}var c="function"==typeof Promise?Promise.resolve().then.bind(Promise.resolve()):setTimeout;function N(e,t){return a(e.nodeName,u(u({},e.attributes),t),arguments.length>2?[].slice.call(arguments,2):e.children)}var l=/acit|ex(?:s|g|n|p|$)|rph|ows|mnc|ntw|ine[ch]|zoo|^ord/i,D=[];function g(e){!e._dirty&&(e._dirty=!0)&&1==D.push(e)&&(o.debounceRendering||c)(y);}function y(){for(var e;e=D.pop();)e._dirty&&S(e);}function j(e,t,n){return "string"==typeof t||"number"==typeof t?void 0!==e.splitText:"string"==typeof t.nodeName?!e._componentConstructor&&z(e,t.nodeName):n||e._componentConstructor===t.nodeName}function z(e,t){return e.normalizedNodeName===t||e.nodeName.toLowerCase()===t.toLowerCase()}function T(e){var t=u({},e.attributes);t.children=e.children;var n=e.nodeName.defaultProps;if(void 0!==n)for(var r in n)void 0===t[r]&&(t[r]=n[r]);return t}function A(e){var t=e.parentNode;t&&t.removeChild(e);}function f(e,t,n,r,o){if("className"===t&&(t="class"),"key"===t);else if("ref"===t)s(n,null),s(r,e);else if("class"!==t||o)if("style"===t){if(r&&"string"!=typeof r&&"string"!=typeof n||(e.style.cssText=r||""),r&&"object"==typeof r){if("string"!=typeof n)for(var M in n)M in r||(e.style[M]="");for(var M in r)e.style[M]="number"==typeof r[M]&&!1===l.test(M)?r[M]+"px":r[M];}}else if("dangerouslySetInnerHTML"===t)r&&(e.innerHTML=r.__html||"");else if("o"==t[0]&&"n"==t[1]){var i=t!==(t=t.replace(/Capture$/,""));t=t.toLowerCase().substring(2),r?n||e.addEventListener(t,p,i):e.removeEventListener(t,p,i),(e._listeners||(e._listeners={}))[t]=r;}else if("list"!==t&&"type"!==t&&!o&&t in e){try{e[t]=null==r?"":r;}catch(e){}null!=r&&!1!==r||"spellcheck"==t||e.removeAttribute(t);}else {var a=o&&t!==(t=t.replace(/^xlink:?/,""));null==r||!1===r?a?e.removeAttributeNS("http://www.w3.org/1999/xlink",t.toLowerCase()):e.removeAttribute(t):"function"!=typeof r&&(a?e.setAttributeNS("http://www.w3.org/1999/xlink",t.toLowerCase(),r):e.setAttribute(t,r));}else e.className=r||"";}function p(e){return this._listeners[e.type](o.event&&o.event(e)||e)}var E=[],d=0,I=!1,w=!1;function O(){for(var e;e=E.shift();)o.afterMount&&o.afterMount(e),e.componentDidMount&&e.componentDidMount();}function x(e,t,n,r,o,M){d++||(I=null!=o&&void 0!==o.ownerSVGElement,w=null!=e&&!("__preactattr_"in e));var i=L(e,t,n,r,M);return o&&i.parentNode!==o&&o.appendChild(i),--d||(w=!1,M||O()),i}function L(e,t,n,r,o){var M=e,i=I;if(null!=t&&"boolean"!=typeof t||(t=""),"string"==typeof t||"number"==typeof t)return e&&void 0!==e.splitText&&e.parentNode&&(!e._component||o)?e.nodeValue!=t&&(e.nodeValue=t):(M=document.createTextNode(t),e&&(e.parentNode&&e.parentNode.replaceChild(M,e),h(e,!0))),M.__preactattr_=!0,M;var a,u,s=t.nodeName;if("function"==typeof s)return function(e,t,n,r){var o=e&&e._component,M=o,i=e,a=o&&e._componentConstructor===t.nodeName,u=a,s=T(t);for(;o&&!u&&(o=o._parentComponent);)u=o.constructor===t.nodeName;o&&u&&(!r||o._component)?(C(o,s,3,n,r),e=o.base):(M&&!a&&(U(M),e=i=null),o=k(t.nodeName,s,n),e&&!o.nextBase&&(o.nextBase=e,i=null),C(o,s,1,n,r),e=o.base,i&&e!==i&&(i._component=null,h(i,!1)));return e}(e,t,n,r);if(I="svg"===s||"foreignObject"!==s&&I,s=String(s),(!e||!z(e,s))&&(a=s,(u=I?document.createElementNS("http://www.w3.org/2000/svg",a):document.createElement(a)).normalizedNodeName=a,M=u,e)){for(;e.firstChild;)M.appendChild(e.firstChild);e.parentNode&&e.parentNode.replaceChild(M,e),h(e,!0);}var c=M.firstChild,N=M.__preactattr_,l=t.children;if(null==N){N=M.__preactattr_={};for(var D=M.attributes,g=D.length;g--;)N[D[g].name]=D[g].value;}return !w&&l&&1===l.length&&"string"==typeof l[0]&&null!=c&&void 0!==c.splitText&&null==c.nextSibling?c.nodeValue!=l[0]&&(c.nodeValue=l[0]):(l&&l.length||null!=c)&&function(e,t,n,r,o){var M,i,a,u,s,c=e.childNodes,N=[],l={},D=0,g=0,y=c.length,z=0,T=t?t.length:0;if(0!==y)for(var f=0;f<y;f++){var p=c[f],E=p.__preactattr_;null!=(d=T&&E?p._component?p._component.__key:E.key:null)?(D++,l[d]=p):(E||(void 0!==p.splitText?!o||p.nodeValue.trim():o))&&(N[z++]=p);}if(0!==T)for(f=0;f<T;f++){var d;if(u=t[f],s=null,null!=(d=u.key))D&&void 0!==l[d]&&(s=l[d],l[d]=void 0,D--);else if(g<z)for(M=g;M<z;M++)if(void 0!==N[M]&&j(i=N[M],u,o)){s=i,N[M]=void 0,M===z-1&&z--,M===g&&g++;break}s=L(s,u,n,r),a=c[f],s&&s!==e&&s!==a&&(null==a?e.appendChild(s):s===a.nextSibling?A(a):e.insertBefore(s,a));}if(D)for(var f in l)void 0!==l[f]&&h(l[f],!1);for(;g<=z;)void 0!==(s=N[z--])&&h(s,!1);}(M,l,n,r,w||null!=N.dangerouslySetInnerHTML),function(e,t,n){var r;for(r in n)t&&null!=t[r]||null==n[r]||f(e,r,n[r],n[r]=void 0,I);for(r in t)"children"===r||"innerHTML"===r||r in n&&t[r]===("value"===r||"checked"===r?e[r]:n[r])||f(e,r,n[r],n[r]=t[r],I);}(M,t.attributes,N),I=i,M}function h(e,t){var n=e._component;n?U(n):(null!=e.__preactattr_&&s(e.__preactattr_.ref,null),!1!==t&&null!=e.__preactattr_||A(e),v(e));}function v(e){for(e=e.lastChild;e;){var t=e.previousSibling;h(e,!0),e=t;}}var b=[];function k(e,t,n){var r,o=b.length;for(e.prototype&&e.prototype.render?(r=new e(t,n),Y.call(r,t,n)):((r=new Y(t,n)).constructor=e,r.render=m);o--;)if(b[o].constructor===e)return r.nextBase=b[o].nextBase,b.splice(o,1),r;return r}function m(e,t,n){return this.constructor(e,n)}function C(e,t,n,r,M){e._disable||(e._disable=!0,e.__ref=t.ref,e.__key=t.key,delete t.ref,delete t.key,void 0===e.constructor.getDerivedStateFromProps&&(!e.base||M?e.componentWillMount&&e.componentWillMount():e.componentWillReceiveProps&&e.componentWillReceiveProps(t,r)),r&&r!==e.context&&(e.prevContext||(e.prevContext=e.context),e.context=r),e.prevProps||(e.prevProps=e.props),e.props=t,e._disable=!1,0!==n&&(1!==n&&!1===o.syncComponentUpdates&&e.base?g(e):S(e,1,M)),s(e.__ref,e));}function S(e,t,n,r){if(!e._disable){var M,i,a,s=e.props,c=e.state,N=e.context,l=e.prevProps||s,D=e.prevState||c,g=e.prevContext||N,y=e.base,j=e.nextBase,z=y||j,A=e._component,f=!1,p=g;if(e.constructor.getDerivedStateFromProps&&(c=u(u({},c),e.constructor.getDerivedStateFromProps(s,c)),e.state=c),y&&(e.props=l,e.state=D,e.context=g,2!==t&&e.shouldComponentUpdate&&!1===e.shouldComponentUpdate(s,c,N)?f=!0:e.componentWillUpdate&&e.componentWillUpdate(s,c,N),e.props=s,e.state=c,e.context=N),e.prevProps=e.prevState=e.prevContext=e.nextBase=null,e._dirty=!1,!f){M=e.render(s,c,N),e.getChildContext&&(N=u(u({},N),e.getChildContext())),y&&e.getSnapshotBeforeUpdate&&(p=e.getSnapshotBeforeUpdate(l,D));var I,w,L=M&&M.nodeName;if("function"==typeof L){var v=T(M);(i=A)&&i.constructor===L&&v.key==i.__key?C(i,v,1,N,!1):(I=i,e._component=i=k(L,v,N),i.nextBase=i.nextBase||j,i._parentComponent=e,C(i,v,0,N,!1),S(i,1,n,!0)),w=i.base;}else a=z,(I=A)&&(a=e._component=null),(z||1===t)&&(a&&(a._component=null),w=x(a,M,N,n||!y,z&&z.parentNode,!0));if(z&&w!==z&&i!==A){var b=z.parentNode;b&&w!==b&&(b.replaceChild(w,z),I||(z._component=null,h(z,!1)));}if(I&&U(I),e.base=w,w&&!r){for(var m=e,Y=e;Y=Y._parentComponent;)(m=Y).base=w;w._component=m,w._componentConstructor=m.constructor;}}for(!y||n?E.push(e):f||(e.componentDidUpdate&&e.componentDidUpdate(l,D,p),o.afterUpdate&&o.afterUpdate(e));e._renderCallbacks.length;)e._renderCallbacks.pop().call(e);d||r||O();}}function U(e){o.beforeUnmount&&o.beforeUnmount(e);var t=e.base;e._disable=!0,e.componentWillUnmount&&e.componentWillUnmount(),e.base=null;var n=e._component;n?U(n):t&&(null!=t.__preactattr_&&s(t.__preactattr_.ref,null),e.nextBase=t,A(t),b.push(e),v(t)),s(e.__ref,null);}function Y(e,t){this._dirty=!0,this.context=t,this.props=e,this.state=this.state||{},this._renderCallbacks=[];}function Q(e,t,n){return x(n,e,{},!1,t,!1)}function B(){return {}}u(Y.prototype,{setState:function(e,t){this.prevState||(this.prevState=this.state),this.state=u(u({},this.state),"function"==typeof e?e(this.state,this.props):e),t&&this._renderCallbacks.push(t),g(this);},forceUpdate:function(e){e&&this._renderCallbacks.push(e),S(this,2);},render:function(){}});var _={h:a,createElement:a,cloneElement:N,createRef:B,Component:Y,render:Q,rerender:y,options:o};t.default=_;},function(e,t,n){n.r(t),function(e){n.d(t,"$mobx",(function(){return w})),n.d(t,"FlowCancellationError",(function(){return It})),n.d(t,"IDerivationState",(function(){return X})),n.d(t,"ObservableMap",(function(){return An})),n.d(t,"ObservableSet",(function(){return En})),n.d(t,"Reaction",(function(){return Ve})),n.d(t,"_allowStateChanges",(function(){return Ee})),n.d(t,"_allowStateChangesInsideComputed",(function(){return we})),n.d(t,"_allowStateReadsEnd",(function(){return De})),n.d(t,"_allowStateReadsStart",(function(){return le})),n.d(t,"_endAction",(function(){return pe})),n.d(t,"_getAdministration",(function(){return kn})),n.d(t,"_getGlobalState",(function(){return Ye})),n.d(t,"_interceptReads",(function(){return Lt})),n.d(t,"_isComputingDerivation",(function(){return Me})),n.d(t,"_resetGlobalState",(function(){return Qe})),n.d(t,"_startAction",(function(){return fe})),n.d(t,"action",(function(){return rt})),n.d(t,"autorun",(function(){return at})),n.d(t,"comparer",(function(){return h})),n.d(t,"computed",(function(){return te})),n.d(t,"configure",(function(){return gt})),n.d(t,"createAtom",(function(){return L})),n.d(t,"decorate",(function(){return yt})),n.d(t,"entries",(function(){return Qt})),n.d(t,"extendObservable",(function(){return jt})),n.d(t,"flow",(function(){return Ot})),n.d(t,"get",(function(){return Rt})),n.d(t,"getAtom",(function(){return bn})),n.d(t,"getDebugName",(function(){return mn})),n.d(t,"getDependencyTree",(function(){return At})),n.d(t,"getObserverTree",(function(){return pt})),n.d(t,"has",(function(){return Pt})),n.d(t,"intercept",(function(){return ht})),n.d(t,"isAction",(function(){return Mt})),n.d(t,"isArrayLike",(function(){return A})),n.d(t,"isBoxedObservable",(function(){return xe})),n.d(t,"isComputed",(function(){return bt})),n.d(t,"isComputedProp",(function(){return kt})),n.d(t,"isFlowCancellationError",(function(){return wt})),n.d(t,"isObservable",(function(){return Ct})),n.d(t,"isObservableArray",(function(){return jn})),n.d(t,"isObservableMap",(function(){return fn})),n.d(t,"isObservableObject",(function(){return vn})),n.d(t,"isObservableProp",(function(){return St})),n.d(t,"isObservableSet",(function(){return dn})),n.d(t,"keys",(function(){return Ut})),n.d(t,"observable",(function(){return F})),n.d(t,"observe",(function(){return Zt})),n.d(t,"onBecomeObserved",(function(){return Nt})),n.d(t,"onBecomeUnobserved",(function(){return lt})),n.d(t,"onReactionError",(function(){return We})),n.d(t,"reaction",(function(){return ct})),n.d(t,"remove",(function(){return _t})),n.d(t,"runInAction",(function(){return ot})),n.d(t,"set",(function(){return Bt})),n.d(t,"spy",(function(){return $e})),n.d(t,"toJS",(function(){return Vt})),n.d(t,"trace",(function(){return Wt})),n.d(t,"transaction",(function(){return Ft})),n.d(t,"untracked",(function(){return se})),n.d(t,"values",(function(){return Yt})),n.d(t,"when",(function(){return qt}));
    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */
    var r=function(e,t){return (r=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t;}||function(e,t){for(var n in t)t.hasOwnProperty(n)&&(e[n]=t[n]);})(e,t)};var o=function(){return (o=Object.assign||function(e){for(var t,n=1,r=arguments.length;n<r;n++)for(var o in t=arguments[n])Object.prototype.hasOwnProperty.call(t,o)&&(e[o]=t[o]);return e}).apply(this,arguments)};function M(e){var t="function"==typeof Symbol&&e[Symbol.iterator],n=0;return t?t.call(e):{next:function(){return e&&n>=e.length&&(e=void 0),{value:e&&e[n++],done:!e}}}}function i(e,t){var n="function"==typeof Symbol&&e[Symbol.iterator];if(!n)return e;var r,o,M=n.call(e),i=[];try{for(;(void 0===t||t-- >0)&&!(r=M.next()).done;)i.push(r.value);}catch(e){o={error:e};}finally{try{r&&!r.done&&(n=M.return)&&n.call(M);}finally{if(o)throw o.error}}return i}function a(){for(var e=[],t=0;t<arguments.length;t++)e=e.concat(i(arguments[t]));return e}var u=[];Object.freeze(u);var s={};function c(){return ++Ue.mobxGuid}function N(e){throw l(!1,e),"X"}function l(e,t){if(!e)throw new Error("[mobx] "+(t||"An invariant failed, however the error is obfuscated because this is a production build."))}Object.freeze(s);function D(e){var t=!1;return function(){if(!t)return t=!0,e.apply(this,arguments)}}var g=function(){};function y(e){return null!==e&&"object"==typeof e}function j(e){if(null===e||"object"!=typeof e)return !1;var t=Object.getPrototypeOf(e);return t===Object.prototype||null===t}function z(e,t,n){Object.defineProperty(e,t,{enumerable:!1,writable:!0,configurable:!0,value:n});}function T(e,t){var n="isMobX"+e;return t.prototype[n]=!0,function(e){return y(e)&&!0===e[n]}}function A(e){return Array.isArray(e)||jn(e)}function f(e){return e instanceof Map}function p(e){return e instanceof Set}function E(e){var t=new Set;for(var n in e)t.add(n);return Object.getOwnPropertySymbols(e).forEach((function(n){Object.getOwnPropertyDescriptor(e,n).enumerable&&t.add(n);})),Array.from(t)}function d(e){return e&&e.toString?e.toString():new String(e).toString()}function I(e){return null===e?null:"object"==typeof e?""+e:e}var w=Symbol("mobx administration"),O=function(){function e(e){void 0===e&&(e="Atom@"+c()),this.name=e,this.isPendingUnobservation=!1,this.isBeingObserved=!1,this.observers=new Set,this.diffValue=0,this.lastAccessedBy=0,this.lowestObserverState=X.NOT_TRACKING;}return e.prototype.onBecomeObserved=function(){this.onBecomeObservedListeners&&this.onBecomeObservedListeners.forEach((function(e){return e()}));},e.prototype.onBecomeUnobserved=function(){this.onBecomeUnobservedListeners&&this.onBecomeUnobservedListeners.forEach((function(e){return e()}));},e.prototype.reportObserved=function(){return Ge(this)},e.prototype.reportChanged=function(){Re(),function(e){if(e.lowestObserverState===X.STALE)return;e.lowestObserverState=X.STALE,e.observers.forEach((function(t){t.dependenciesState===X.UP_TO_DATE&&(t.isTracing!==K.NONE&&He(t,e),t.onBecomeStale()),t.dependenciesState=X.STALE;}));}(this),Ze();},e.prototype.toString=function(){return this.name},e}(),x=T("Atom",O);function L(e,t,n){void 0===t&&(t=g),void 0===n&&(n=g);var r=new O(e);return t!==g&&Nt(r,t),n!==g&&lt(r,n),r}var h={identity:function(e,t){return e===t},structural:function(e,t){return Sn(e,t)},default:function(e,t){return Object.is(e,t)},shallow:function(e,t){return Sn(e,t,1)}},v=Symbol("mobx did run lazy initializers"),b=Symbol("mobx pending decorators"),k={},m={};function C(e,t){var n=t?k:m;return n[e]||(n[e]={configurable:!0,enumerable:t,get:function(){return S(this),this[e]},set:function(t){S(this),this[e]=t;}})}function S(e){var t,n;if(!0!==e[v]){var r=e[b];if(r){z(e,v,!0);var o=a(Object.getOwnPropertySymbols(r),Object.keys(r));try{for(var i=M(o),u=i.next();!u.done;u=i.next()){var s=r[u.value];s.propertyCreator(e,s.prop,s.descriptor,s.decoratorTarget,s.decoratorArguments);}}catch(e){t={error:e};}finally{try{u&&!u.done&&(n=i.return)&&n.call(i);}finally{if(t)throw t.error}}}}}function U(e,t){return function(){var n,r=function(r,M,i,a){if(!0===a)return t(r,M,i,r,n),null;if(!Object.prototype.hasOwnProperty.call(r,b)){var u=r[b];z(r,b,o({},u));}return r[b][M]={prop:M,propertyCreator:t,descriptor:i,decoratorTarget:r,decoratorArguments:n},C(M,e)};return Y(arguments)?(n=u,r.apply(null,arguments)):(n=Array.prototype.slice.call(arguments),r)}}function Y(e){return (2===e.length||3===e.length)&&("string"==typeof e[1]||"symbol"==typeof e[1])||4===e.length&&!0===e[3]}function Q(e,t,n){return Ct(e)?e:Array.isArray(e)?F.array(e,{name:n}):j(e)?F.object(e,void 0,{name:n}):f(e)?F.map(e,{name:n}):p(e)?F.set(e,{name:n}):e}function B(e){return e}function _(e){l(e);var t=U(!0,(function(t,n,r,o,M){var i=r?r.initializer?r.initializer.call(t):r.value:void 0;wn(t).addObservableProp(n,i,e);})),n=("undefined"!=typeof process&&process.env,t);return n.enhancer=e,n}var P={deep:!0,name:void 0,defaultDecorator:void 0,proxy:!0};function R(e){return null==e?P:"string"==typeof e?{name:e,deep:!0,proxy:!0}:e}Object.freeze(P);var Z=_(Q),G=_((function(e,t,n){return null==e||vn(e)||jn(e)||fn(e)||dn(e)?e:Array.isArray(e)?F.array(e,{name:n,deep:!1}):j(e)?F.object(e,void 0,{name:n,deep:!1}):f(e)?F.map(e,{name:n,deep:!1}):p(e)?F.set(e,{name:n,deep:!1}):N(!1)})),H=_(B),V=_((function(e,t,n){return Sn(e,t)?t:e}));function W(e){return e.defaultDecorator?e.defaultDecorator.enhancer:!1===e.deep?B:Q}var J={box:function(e,t){arguments.length>2&&q("box");var n=R(t);return new Oe(e,W(n),n.name,!0,n.equals)},array:function(e,t){arguments.length>2&&q("array");var n=R(t);return Nn(e,W(n),n.name)},map:function(e,t){arguments.length>2&&q("map");var n=R(t);return new An(e,W(n),n.name)},set:function(e,t){arguments.length>2&&q("set");var n=R(t);return new En(e,W(n),n.name)},object:function(e,t,n){"string"==typeof arguments[1]&&q("object");var r=R(n);if(!1===r.proxy)return jt({},e,t,r);var o=zt(r),M=jt({},void 0,void 0,r),i=nn(M);return Tt(i,e,t,o),i},ref:H,shallow:G,deep:Z,struct:V},F=function(e,t,n){if("string"==typeof arguments[1]||"symbol"==typeof arguments[1])return Z.apply(null,arguments);if(Ct(e))return e;var r=j(e)?F.object(e,t,n):Array.isArray(e)?F.array(e,t):f(e)?F.map(e,t):p(e)?F.set(e,t):e;if(r!==e)return r;N(!1);};function q(e){N("Expected one or two arguments to observable."+e+". Did you accidentally try to use observable."+e+" as decorator?");}Object.keys(J).forEach((function(e){return F[e]=J[e]}));var X,K,$=U(!1,(function(e,t,n,r,M){var i=n.get,a=n.set,u=M[0]||{};wn(e).addComputedProp(e,t,o({get:i,set:a,context:e},u));})),ee=$({equals:h.structural}),te=function(e,t,n){if("string"==typeof t)return $.apply(null,arguments);if(null!==e&&"object"==typeof e&&1===arguments.length)return $.apply(null,arguments);var r="object"==typeof t?t:{};return r.get=e,r.set="function"==typeof t?t:r.set,r.name=r.name||e.name||"",new Le(r)};te.struct=ee,function(e){e[e.NOT_TRACKING=-1]="NOT_TRACKING",e[e.UP_TO_DATE=0]="UP_TO_DATE",e[e.POSSIBLY_STALE=1]="POSSIBLY_STALE",e[e.STALE=2]="STALE";}(X||(X={})),function(e){e[e.NONE=0]="NONE",e[e.LOG=1]="LOG",e[e.BREAK=2]="BREAK";}(K||(K={}));var ne=function(e){this.cause=e;};function re(e){return e instanceof ne}function oe(e){switch(e.dependenciesState){case X.UP_TO_DATE:return !1;case X.NOT_TRACKING:case X.STALE:return !0;case X.POSSIBLY_STALE:for(var t=le(!0),n=ce(),r=e.observing,o=r.length,M=0;M<o;M++){var i=r[M];if(he(i)){if(Ue.disableErrorBoundaries)i.get();else try{i.get();}catch(e){return Ne(n),De(t),!0}if(e.dependenciesState===X.STALE)return Ne(n),De(t),!0}}return ge(e),Ne(n),De(t),!1}}function Me(){return null!==Ue.trackingDerivation}function ie(e){var t=e.observers.size>0;Ue.computationDepth>0&&t&&N(!1),Ue.allowStateChanges||!t&&"strict"!==Ue.enforceActions||N(!1);}function ae(e,t,n){var r=le(!0);ge(e),e.newObserving=new Array(e.observing.length+100),e.unboundDepsCount=0,e.runId=++Ue.runId;var o,M=Ue.trackingDerivation;if(Ue.trackingDerivation=e,!0===Ue.disableErrorBoundaries)o=t.call(n);else try{o=t.call(n);}catch(e){o=new ne(e);}return Ue.trackingDerivation=M,function(e){for(var t=e.observing,n=e.observing=e.newObserving,r=X.UP_TO_DATE,o=0,M=e.unboundDepsCount,i=0;i<M;i++){0===(a=n[i]).diffValue&&(a.diffValue=1,o!==i&&(n[o]=a),o++),a.dependenciesState>r&&(r=a.dependenciesState);}n.length=o,e.newObserving=null,M=t.length;for(;M--;){0===(a=t[M]).diffValue&&_e(a,e),a.diffValue=0;}for(;o--;){var a;1===(a=n[o]).diffValue&&(a.diffValue=0,Be(a,e));}r!==X.UP_TO_DATE&&(e.dependenciesState=r,e.onBecomeStale());}(e),De(r),o}function ue(e){var t=e.observing;e.observing=[];for(var n=t.length;n--;)_e(t[n],e);e.dependenciesState=X.NOT_TRACKING;}function se(e){var t=ce();try{return e()}finally{Ne(t);}}function ce(){var e=Ue.trackingDerivation;return Ue.trackingDerivation=null,e}function Ne(e){Ue.trackingDerivation=e;}function le(e){var t=Ue.allowStateReads;return Ue.allowStateReads=e,t}function De(e){Ue.allowStateReads=e;}function ge(e){if(e.dependenciesState!==X.UP_TO_DATE){e.dependenciesState=X.UP_TO_DATE;for(var t=e.observing,n=t.length;n--;)t[n].lowestObserverState=X.UP_TO_DATE;}}var ye=0,je=1,ze=Object.getOwnPropertyDescriptor((function(){}),"name");ze&&ze.configurable;function Te(e,t,n){var r=function(){return Ae(e,t,n||this,arguments)};return r.isMobxAction=!0,r}function Ae(e,t,n,r){var o=fe();try{return t.apply(n,r)}catch(e){throw o.error=e,e}finally{pe(o);}}function fe(e,t,n){var r=0,o=ce();Re();var M={prevDerivation:o,prevAllowStateChanges:de(!0),prevAllowStateReads:le(!0),notifySpy:!1,startTime:r,actionId:je++,parentActionId:ye};return ye=M.actionId,M}function pe(e){ye!==e.actionId&&N("invalid action stack. did you forget to finish an action?"),ye=e.parentActionId,void 0!==e.error&&(Ue.suppressReactionErrors=!0),Ie(e.prevAllowStateChanges),De(e.prevAllowStateReads),Ze(),Ne(e.prevDerivation),e.notifySpy,Ue.suppressReactionErrors=!1;}function Ee(e,t){var n,r=de(e);try{n=t();}finally{Ie(r);}return n}function de(e){var t=Ue.allowStateChanges;return Ue.allowStateChanges=e,t}function Ie(e){Ue.allowStateChanges=e;}function we(e){var t,n=Ue.computationDepth;Ue.computationDepth=0;try{t=e();}finally{Ue.computationDepth=n;}return t}var Oe=function(e){function t(t,n,r,o,M){void 0===r&&(r="ObservableValue@"+c()),void 0===M&&(M=h.default);var i=e.call(this,r)||this;return i.enhancer=n,i.name=r,i.equals=M,i.hasUnreportedChange=!1,i.value=n(t,void 0,r),i}return function(e,t){function n(){this.constructor=e;}r(e,t),e.prototype=null===t?Object.create(t):(n.prototype=t.prototype,new n);}(t,e),t.prototype.dehanceValue=function(e){return void 0!==this.dehancer?this.dehancer(e):e},t.prototype.set=function(e){this.value;if((e=this.prepareNewValue(e))!==Ue.UNCHANGED){this.setNewValue(e);}},t.prototype.prepareNewValue=function(e){if(ie(this),rn(this)){var t=Mn(this,{object:this,type:"update",newValue:e});if(!t)return Ue.UNCHANGED;e=t.newValue;}return e=this.enhancer(e,this.value,this.name),this.equals(this.value,e)?Ue.UNCHANGED:e},t.prototype.setNewValue=function(e){var t=this.value;this.value=e,this.reportChanged(),an(this)&&sn(this,{type:"update",object:this,newValue:e,oldValue:t});},t.prototype.get=function(){return this.reportObserved(),this.dehanceValue(this.value)},t.prototype.intercept=function(e){return on(this,e)},t.prototype.observe=function(e,t){return t&&e({object:this,type:"update",newValue:this.value,oldValue:void 0}),un(this,e)},t.prototype.toJSON=function(){return this.get()},t.prototype.toString=function(){return this.name+"["+this.value+"]"},t.prototype.valueOf=function(){return I(this.get())},t.prototype[Symbol.toPrimitive]=function(){return this.valueOf()},t}(O),xe=T("ObservableValue",Oe),Le=function(){function e(e){this.dependenciesState=X.NOT_TRACKING,this.observing=[],this.newObserving=null,this.isBeingObserved=!1,this.isPendingUnobservation=!1,this.observers=new Set,this.diffValue=0,this.runId=0,this.lastAccessedBy=0,this.lowestObserverState=X.UP_TO_DATE,this.unboundDepsCount=0,this.__mapid="#"+c(),this.value=new ne(null),this.isComputing=!1,this.isRunningSetter=!1,this.isTracing=K.NONE,l(e.get,"missing option for computed: get"),this.derivation=e.get,this.name=e.name||"ComputedValue@"+c(),e.set&&(this.setter=Te(this.name+"-setter",e.set)),this.equals=e.equals||(e.compareStructural||e.struct?h.structural:h.default),this.scope=e.context,this.requiresReaction=!!e.requiresReaction,this.keepAlive=!!e.keepAlive;}return e.prototype.onBecomeStale=function(){!function(e){if(e.lowestObserverState!==X.UP_TO_DATE)return;e.lowestObserverState=X.POSSIBLY_STALE,e.observers.forEach((function(t){t.dependenciesState===X.UP_TO_DATE&&(t.dependenciesState=X.POSSIBLY_STALE,t.isTracing!==K.NONE&&He(t,e),t.onBecomeStale());}));}(this);},e.prototype.onBecomeObserved=function(){this.onBecomeObservedListeners&&this.onBecomeObservedListeners.forEach((function(e){return e()}));},e.prototype.onBecomeUnobserved=function(){this.onBecomeUnobservedListeners&&this.onBecomeUnobservedListeners.forEach((function(e){return e()}));},e.prototype.get=function(){this.isComputing&&N("Cycle detected in computation "+this.name+": "+this.derivation),0!==Ue.inBatch||0!==this.observers.size||this.keepAlive?(Ge(this),oe(this)&&this.trackAndCompute()&&function(e){if(e.lowestObserverState===X.STALE)return;e.lowestObserverState=X.STALE,e.observers.forEach((function(t){t.dependenciesState===X.POSSIBLY_STALE?t.dependenciesState=X.STALE:t.dependenciesState===X.UP_TO_DATE&&(e.lowestObserverState=X.UP_TO_DATE);}));}(this)):oe(this)&&(this.warnAboutUntrackedRead(),Re(),this.value=this.computeValue(!1),Ze());var e=this.value;if(re(e))throw e.cause;return e},e.prototype.peek=function(){var e=this.computeValue(!1);if(re(e))throw e.cause;return e},e.prototype.set=function(e){if(this.setter){l(!this.isRunningSetter,"The setter of computed value '"+this.name+"' is trying to update itself. Did you intend to update an _observable_ value, instead of the computed property?"),this.isRunningSetter=!0;try{this.setter.call(this.scope,e);}finally{this.isRunningSetter=!1;}}else l(!1,!1);},e.prototype.trackAndCompute=function(){var e=this.value,t=this.dependenciesState===X.NOT_TRACKING,n=this.computeValue(!0),r=t||re(e)||re(n)||!this.equals(e,n);return r&&(this.value=n),r},e.prototype.computeValue=function(e){var t;if(this.isComputing=!0,Ue.computationDepth++,e)t=ae(this,this.derivation,this.scope);else if(!0===Ue.disableErrorBoundaries)t=this.derivation.call(this.scope);else try{t=this.derivation.call(this.scope);}catch(e){t=new ne(e);}return Ue.computationDepth--,this.isComputing=!1,t},e.prototype.suspend=function(){this.keepAlive||(ue(this),this.value=void 0);},e.prototype.observe=function(e,t){var n=this,r=!0,o=void 0;return at((function(){var M=n.get();if(!r||t){var i=ce();e({type:"update",object:n,newValue:M,oldValue:o}),Ne(i);}r=!1,o=M;}))},e.prototype.warnAboutUntrackedRead=function(){},e.prototype.toJSON=function(){return this.get()},e.prototype.toString=function(){return this.name+"["+this.derivation.toString()+"]"},e.prototype.valueOf=function(){return I(this.get())},e.prototype[Symbol.toPrimitive]=function(){return this.valueOf()},e}(),he=T("ComputedValue",Le),ve=["mobxGuid","spyListeners","enforceActions","computedRequiresReaction","reactionRequiresObservable","observableRequiresReaction","allowStateReads","disableErrorBoundaries","runId","UNCHANGED"],be=function(){this.version=5,this.UNCHANGED={},this.trackingDerivation=null,this.computationDepth=0,this.runId=0,this.mobxGuid=0,this.inBatch=0,this.pendingUnobservations=[],this.pendingReactions=[],this.isRunningReactions=!1,this.allowStateChanges=!0,this.allowStateReads=!0,this.enforceActions=!1,this.spyListeners=[],this.globalReactionErrorHandlers=[],this.computedRequiresReaction=!1,this.reactionRequiresObservable=!1,this.observableRequiresReaction=!1,this.computedConfigurable=!1,this.disableErrorBoundaries=!1,this.suppressReactionErrors=!1;},ke={};function me(){return "undefined"!=typeof window?window:void 0!==e?e:"undefined"!=typeof self?self:ke}var Ce=!0,Se=!1,Ue=function(){var e=me();return e.__mobxInstanceCount>0&&!e.__mobxGlobals&&(Ce=!1),e.__mobxGlobals&&e.__mobxGlobals.version!==(new be).version&&(Ce=!1),Ce?e.__mobxGlobals?(e.__mobxInstanceCount+=1,e.__mobxGlobals.UNCHANGED||(e.__mobxGlobals.UNCHANGED={}),e.__mobxGlobals):(e.__mobxInstanceCount=1,e.__mobxGlobals=new be):(setTimeout((function(){Se||N("There are multiple, different versions of MobX active. Make sure MobX is loaded only once or use `configure({ isolateGlobalState: true })`");}),1),new be)}();function Ye(){return Ue}function Qe(){var e=new be;for(var t in e)-1===ve.indexOf(t)&&(Ue[t]=e[t]);Ue.allowStateChanges=!Ue.enforceActions;}function Be(e,t){e.observers.add(t),e.lowestObserverState>t.dependenciesState&&(e.lowestObserverState=t.dependenciesState);}function _e(e,t){e.observers.delete(t),0===e.observers.size&&Pe(e);}function Pe(e){!1===e.isPendingUnobservation&&(e.isPendingUnobservation=!0,Ue.pendingUnobservations.push(e));}function Re(){Ue.inBatch++;}function Ze(){if(0==--Ue.inBatch){Fe();for(var e=Ue.pendingUnobservations,t=0;t<e.length;t++){var n=e[t];n.isPendingUnobservation=!1,0===n.observers.size&&(n.isBeingObserved&&(n.isBeingObserved=!1,n.onBecomeUnobserved()),n instanceof Le&&n.suspend());}Ue.pendingUnobservations=[];}}function Ge(e){var t=Ue.trackingDerivation;return null!==t?(t.runId!==e.lastAccessedBy&&(e.lastAccessedBy=t.runId,t.newObserving[t.unboundDepsCount++]=e,e.isBeingObserved||(e.isBeingObserved=!0,e.onBecomeObserved())),!0):(0===e.observers.size&&Ue.inBatch>0&&Pe(e),!1)}function He(e,t){if(console.log("[mobx.trace] '"+e.name+"' is invalidated due to a change in: '"+t.name+"'"),e.isTracing===K.BREAK){var n=[];!function e(t,n,r){if(n.length>=1e3)return void n.push("(and many more)");n.push(""+new Array(r).join("\t")+t.name),t.dependencies&&t.dependencies.forEach((function(t){return e(t,n,r+1)}));}(At(e),n,1),new Function("debugger;\n/*\nTracing '"+e.name+"'\n\nYou are entering this break point because derivation '"+e.name+"' is being traced and '"+t.name+"' is now forcing it to update.\nJust follow the stacktrace you should now see in the devtools to see precisely what piece of your code is causing this update\nThe stackframe you are looking for is at least ~6-8 stack-frames up.\n\n"+(e instanceof Le?e.derivation.toString().replace(/[*]\//g,"/"):"")+"\n\nThe dependencies for this derivation are:\n\n"+n.join("\n")+"\n*/\n    ")();}}var Ve=function(){function e(e,t,n,r){void 0===e&&(e="Reaction@"+c()),void 0===r&&(r=!1),this.name=e,this.onInvalidate=t,this.errorHandler=n,this.requiresObservable=r,this.observing=[],this.newObserving=[],this.dependenciesState=X.NOT_TRACKING,this.diffValue=0,this.runId=0,this.unboundDepsCount=0,this.__mapid="#"+c(),this.isDisposed=!1,this._isScheduled=!1,this._isTrackPending=!1,this._isRunning=!1,this.isTracing=K.NONE;}return e.prototype.onBecomeStale=function(){this.schedule();},e.prototype.schedule=function(){this._isScheduled||(this._isScheduled=!0,Ue.pendingReactions.push(this),Fe());},e.prototype.isScheduled=function(){return this._isScheduled},e.prototype.runReaction=function(){if(!this.isDisposed){if(Re(),this._isScheduled=!1,oe(this)){this._isTrackPending=!0;try{this.onInvalidate(),this._isTrackPending;}catch(e){this.reportExceptionInDerivation(e);}}Ze();}},e.prototype.track=function(e){if(!this.isDisposed){Re();this._isRunning=!0;var t=ae(this,e,void 0);this._isRunning=!1,this._isTrackPending=!1,this.isDisposed&&ue(this),re(t)&&this.reportExceptionInDerivation(t.cause),Ze();}},e.prototype.reportExceptionInDerivation=function(e){var t=this;if(this.errorHandler)this.errorHandler(e,this);else {if(Ue.disableErrorBoundaries)throw e;var n="[mobx] Encountered an uncaught exception that was thrown by a reaction or observer component, in: '"+this+"'";Ue.suppressReactionErrors?console.warn("[mobx] (error in reaction '"+this.name+"' suppressed, fix error of causing action below)"):console.error(n,e),Ue.globalReactionErrorHandlers.forEach((function(n){return n(e,t)}));}},e.prototype.dispose=function(){this.isDisposed||(this.isDisposed=!0,this._isRunning||(Re(),ue(this),Ze()));},e.prototype.getDisposer=function(){var e=this.dispose.bind(this);return e[w]=this,e},e.prototype.toString=function(){return "Reaction["+this.name+"]"},e.prototype.trace=function(e){void 0===e&&(e=!1),Wt(this,e);},e}();function We(e){return Ue.globalReactionErrorHandlers.push(e),function(){var t=Ue.globalReactionErrorHandlers.indexOf(e);t>=0&&Ue.globalReactionErrorHandlers.splice(t,1);}}var Je=function(e){return e()};function Fe(){Ue.inBatch>0||Ue.isRunningReactions||Je(qe);}function qe(){Ue.isRunningReactions=!0;for(var e=Ue.pendingReactions,t=0;e.length>0;){100==++t&&(console.error("Reaction doesn't converge to a stable state after 100 iterations. Probably there is a cycle in the reactive function: "+e[0]),e.splice(0));for(var n=e.splice(0),r=0,o=n.length;r<o;r++)n[r].runReaction();}Ue.isRunningReactions=!1;}var Xe=T("Reaction",Ve);function Ke(e){var t=Je;Je=function(n){return e((function(){return t(n)}))};}function $e(e){return console.warn("[mobx.spy] Is a no-op in production builds"),function(){}}function et(){N(!1);}function tt(e){return function(t,n,r){if(r){if(r.value)return {value:Te(e,r.value),enumerable:!1,configurable:!0,writable:!0};var o=r.initializer;return {enumerable:!1,configurable:!0,writable:!0,initializer:function(){return Te(e,o.call(this))}}}return nt(e).apply(this,arguments)}}function nt(e){return function(t,n,r){Object.defineProperty(t,n,{configurable:!0,enumerable:!1,get:function(){},set:function(t){z(this,n,rt(e,t));}});}}var rt=function(e,t,n,r){return 1===arguments.length&&"function"==typeof e?Te(e.name||"<unnamed action>",e):2===arguments.length&&"function"==typeof t?Te(e,t):1===arguments.length&&"string"==typeof e?tt(e):!0!==r?tt(t).apply(null,arguments):void z(e,t,Te(e.name||t,n.value,this))};function ot(e,t){return Ae("string"==typeof e?e:e.name||"<unnamed action>","function"==typeof e?e:t,this,void 0)}function Mt(e){return "function"==typeof e&&!0===e.isMobxAction}function it(e,t,n){z(e,t,Te(t,n.bind(e)));}function at(e,t){void 0===t&&(t=s);var n,r=t&&t.name||e.name||"Autorun@"+c();if(!t.scheduler&&!t.delay)n=new Ve(r,(function(){this.track(i);}),t.onError,t.requiresObservable);else {var o=st(t),M=!1;n=new Ve(r,(function(){M||(M=!0,o((function(){M=!1,n.isDisposed||n.track(i);})));}),t.onError,t.requiresObservable);}function i(){e(n);}return n.schedule(),n.getDisposer()}rt.bound=function(e,t,n,r){return !0===r?(it(e,t,n.value),null):n?{configurable:!0,enumerable:!1,get:function(){return it(this,t,n.value||n.initializer.call(this)),this[t]},set:et}:{enumerable:!1,configurable:!0,set:function(e){it(this,t,e);},get:function(){}}};var ut=function(e){return e()};function st(e){return e.scheduler?e.scheduler:e.delay?function(t){return setTimeout(t,e.delay)}:ut}function ct(e,t,n){void 0===n&&(n=s);var r,o,M,i=n.name||"Reaction@"+c(),a=rt(i,n.onError?(r=n.onError,o=t,function(){try{return o.apply(this,arguments)}catch(e){r.call(this,e);}}):t),u=!n.scheduler&&!n.delay,N=st(n),l=!0,D=!1,g=n.compareStructural?h.structural:n.equals||h.default,y=new Ve(i,(function(){l||u?j():D||(D=!0,N(j));}),n.onError,n.requiresObservable);function j(){if(D=!1,!y.isDisposed){var t=!1;y.track((function(){var n=e(y);t=l||!g(M,n),M=n;})),l&&n.fireImmediately&&a(M,y),l||!0!==t||a(M,y),l&&(l=!1);}}return y.schedule(),y.getDisposer()}function Nt(e,t,n){return Dt("onBecomeObserved",e,t,n)}function lt(e,t,n){return Dt("onBecomeUnobserved",e,t,n)}function Dt(e,t,n,r){var o="function"==typeof r?bn(t,n):bn(t),M="function"==typeof r?r:n,i=e+"Listeners";return o[i]?o[i].add(M):o[i]=new Set([M]),"function"!=typeof o[e]?N(!1):function(){var e=o[i];e&&(e.delete(M),0===e.size&&delete o[i]);}}function gt(e){var t=e.enforceActions,n=e.computedRequiresReaction,r=e.computedConfigurable,o=e.disableErrorBoundaries,M=e.reactionScheduler,i=e.reactionRequiresObservable,a=e.observableRequiresReaction;if(!0===e.isolateGlobalState&&((Ue.pendingReactions.length||Ue.inBatch||Ue.isRunningReactions)&&N("isolateGlobalState should be called before MobX is running any reactions"),Se=!0,Ce&&(0==--me().__mobxInstanceCount&&(me().__mobxGlobals=void 0),Ue=new be)),void 0!==t){var u=void 0;switch(t){case!0:case"observed":u=!0;break;case!1:case"never":u=!1;break;case"strict":case"always":u="strict";break;default:N("Invalid value for 'enforceActions': '"+t+"', expected 'never', 'always' or 'observed'");}Ue.enforceActions=u,Ue.allowStateChanges=!0!==u&&"strict"!==u;}void 0!==n&&(Ue.computedRequiresReaction=!!n),void 0!==i&&(Ue.reactionRequiresObservable=!!i),void 0!==a&&(Ue.observableRequiresReaction=!!a,Ue.allowStateReads=!Ue.observableRequiresReaction),void 0!==r&&(Ue.computedConfigurable=!!r),void 0!==o&&(!0===o&&console.warn("WARNING: Debug feature only. MobX will NOT recover from errors when `disableErrorBoundaries` is enabled."),Ue.disableErrorBoundaries=!!o),M&&Ke(M);}function yt(e,t){var n="function"==typeof e?e.prototype:e,r=function(e){var r=t[e];Array.isArray(r)||(r=[r]);var o=Object.getOwnPropertyDescriptor(n,e),M=r.reduce((function(t,r){return r(n,e,t)}),o);M&&Object.defineProperty(n,e,M);};for(var o in t)r(o);return e}function jt(e,t,n,r){var o=zt(r=R(r));return S(e),wn(e,r.name,o.enhancer),t&&Tt(e,t,n,o),e}function zt(e){return e.defaultDecorator||(!1===e.deep?H:Z)}function Tt(e,t,n,r){var o,i;Re();try{var a=E(t);try{for(var u=M(a),s=u.next();!s.done;s=u.next()){var c=s.value,N=Object.getOwnPropertyDescriptor(t,c);0;var l=(n&&c in n?n[c]:N.get?$:r)(e,c,N,!0);l&&Object.defineProperty(e,c,l);}}catch(e){o={error:e};}finally{try{s&&!s.done&&(i=u.return)&&i.call(u);}finally{if(o)throw o.error}}}finally{Ze();}}function At(e,t){return ft(bn(e,t))}function ft(e){var t,n,r={name:e.name};return e.observing&&e.observing.length>0&&(r.dependencies=(t=e.observing,n=[],t.forEach((function(e){-1===n.indexOf(e)&&n.push(e);})),n).map(ft)),r}function pt(e,t){return Et(bn(e,t))}function Et(e){var t={name:e.name};return function(e){return e.observers&&e.observers.size>0}(e)&&(t.observers=Array.from(function(e){return e.observers}(e)).map(Et)),t}var dt=0;function It(){this.message="FLOW_CANCELLED";}function wt(e){return e instanceof It}function Ot(e){1!==arguments.length&&N("Flow expects 1 argument and cannot be used as decorator");var t=e.name||"<unnamed flow>";return function(){var n,r=this,o=arguments,M=++dt,i=rt(t+" - runid: "+M+" - init",e).apply(r,o),a=void 0,u=new Promise((function(e,r){var o=0;function u(e){var n;a=void 0;try{n=rt(t+" - runid: "+M+" - yield "+o++,i.next).call(i,e);}catch(e){return r(e)}c(n);}function s(e){var n;a=void 0;try{n=rt(t+" - runid: "+M+" - yield "+o++,i.throw).call(i,e);}catch(e){return r(e)}c(n);}function c(t){if(!t||"function"!=typeof t.then)return t.done?e(t.value):(a=Promise.resolve(t.value)).then(u,s);t.then(c,r);}n=r,u(void 0);}));return u.cancel=rt(t+" - runid: "+M+" - cancel",(function(){try{a&&xt(a);var e=i.return(void 0),t=Promise.resolve(e.value);t.then(g,g),xt(t),n(new It);}catch(e){n(e);}})),u}}function xt(e){"function"==typeof e.cancel&&e.cancel();}function Lt(e,t,n){var r;if(fn(e)||jn(e)||xe(e))r=kn(e);else {if(!vn(e))return N(!1);if("string"!=typeof t)return N(!1);r=kn(e,t);}return void 0!==r.dehancer?N(!1):(r.dehancer="function"==typeof t?t:n,function(){r.dehancer=void 0;})}function ht(e,t,n){return "function"==typeof n?function(e,t,n){return kn(e,t).intercept(n)}(e,t,n):function(e,t){return kn(e).intercept(t)}(e,t)}function vt(e,t){if(null==e)return !1;if(void 0!==t){if(!1===vn(e))return !1;if(!e[w].values.has(t))return !1;var n=bn(e,t);return he(n)}return he(e)}function bt(e){return arguments.length>1?N(!1):vt(e)}function kt(e,t){return "string"!=typeof t?N(!1):vt(e,t)}function mt(e,t){return null!=e&&(void 0!==t?!!vn(e)&&e[w].values.has(t):vn(e)||!!e[w]||x(e)||Xe(e)||he(e))}function Ct(e){return 1!==arguments.length&&N(!1),mt(e)}function St(e,t){return "string"!=typeof t?N(!1):mt(e,t)}function Ut(e){return vn(e)?e[w].getKeys():fn(e)||dn(e)?Array.from(e.keys()):jn(e)?e.map((function(e,t){return t})):N(!1)}function Yt(e){return vn(e)?Ut(e).map((function(t){return e[t]})):fn(e)?Ut(e).map((function(t){return e.get(t)})):dn(e)?Array.from(e.values()):jn(e)?e.slice():N(!1)}function Qt(e){return vn(e)?Ut(e).map((function(t){return [t,e[t]]})):fn(e)?Ut(e).map((function(t){return [t,e.get(t)]})):dn(e)?Array.from(e.entries()):jn(e)?e.map((function(e,t){return [t,e]})):N(!1)}function Bt(e,t,n){if(2!==arguments.length||dn(e))if(vn(e)){var r=e[w],o=r.values.get(t);o?r.write(t,n):r.addObservableProp(t,n,r.defaultEnhancer);}else if(fn(e))e.set(t,n);else if(dn(e))e.add(t);else {if(!jn(e))return N(!1);"number"!=typeof t&&(t=parseInt(t,10)),l(t>=0,"Not a valid index: '"+t+"'"),Re(),t>=e.length&&(e.length=t+1),e[t]=n,Ze();}else {Re();var M=t;try{for(var i in M)Bt(e,i,M[i]);}finally{Ze();}}}function _t(e,t){if(vn(e))e[w].remove(t);else if(fn(e))e.delete(t);else if(dn(e))e.delete(t);else {if(!jn(e))return N(!1);"number"!=typeof t&&(t=parseInt(t,10)),l(t>=0,"Not a valid index: '"+t+"'"),e.splice(t,1);}}function Pt(e,t){return vn(e)?kn(e).has(t):fn(e)||dn(e)?e.has(t):jn(e)?t>=0&&t<e.length:N(!1)}function Rt(e,t){if(Pt(e,t))return vn(e)?e[t]:fn(e)?e.get(t):jn(e)?e[t]:N(!1)}function Zt(e,t,n,r){return "function"==typeof n?function(e,t,n,r){return kn(e,t).observe(n,r)}(e,t,n,r):function(e,t,n){return kn(e).observe(t,n)}(e,t,n)}It.prototype=Object.create(Error.prototype);var Gt={detectCycles:!0,exportMapsAsObjects:!0,recurseEverything:!1};function Ht(e,t,n,r){return r.detectCycles&&e.set(t,n),n}function Vt(e,t){var n;return "boolean"==typeof t&&(t={detectCycles:t}),t||(t=Gt),t.detectCycles=void 0===t.detectCycles?!0===t.recurseEverything:!0===t.detectCycles,t.detectCycles&&(n=new Map),function e(t,n,r){if(!n.recurseEverything&&!Ct(t))return t;if("object"!=typeof t)return t;if(null===t)return null;if(t instanceof Date)return t;if(xe(t))return e(t.get(),n,r);if(Ct(t)&&Ut(t),!0===n.detectCycles&&null!==t&&r.has(t))return r.get(t);if(jn(t)||Array.isArray(t)){var o=Ht(r,t,[],n),M=t.map((function(t){return e(t,n,r)}));o.length=M.length;for(var i=0,a=M.length;i<a;i++)o[i]=M[i];return o}if(dn(t)||Object.getPrototypeOf(t)===Set.prototype){if(!1===n.exportMapsAsObjects){var u=Ht(r,t,new Set,n);return t.forEach((function(t){u.add(e(t,n,r));})),u}var s=Ht(r,t,[],n);return t.forEach((function(t){s.push(e(t,n,r));})),s}if(fn(t)||Object.getPrototypeOf(t)===Map.prototype){if(!1===n.exportMapsAsObjects){var c=Ht(r,t,new Map,n);return t.forEach((function(t,o){c.set(o,e(t,n,r));})),c}var N=Ht(r,t,{},n);return t.forEach((function(t,o){N[o]=e(t,n,r);})),N}var l=Ht(r,t,{},n);return E(t).forEach((function(o){l[o]=e(t[o],n,r);})),l}(e,t,n)}function Wt(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];var n=!1;"boolean"==typeof e[e.length-1]&&(n=e.pop());var r=Jt(e);if(!r)return N(!1);r.isTracing===K.NONE&&console.log("[mobx.trace] '"+r.name+"' tracing enabled"),r.isTracing=n?K.BREAK:K.LOG;}function Jt(e){switch(e.length){case 0:return Ue.trackingDerivation;case 1:return bn(e[0]);case 2:return bn(e[0],e[1])}}function Ft(e,t){void 0===t&&(t=void 0),Re();try{return e.apply(t)}finally{Ze();}}function qt(e,t,n){return 1===arguments.length||t&&"object"==typeof t?Kt(e,t):Xt(e,t,n||{})}function Xt(e,t,n){var r;"number"==typeof n.timeout&&(r=setTimeout((function(){if(!M[w].isDisposed){M();var e=new Error("WHEN_TIMEOUT");if(!n.onError)throw e;n.onError(e);}}),n.timeout)),n.name=n.name||"When@"+c();var o=Te(n.name+"-effect",t),M=at((function(t){e()&&(t.dispose(),r&&clearTimeout(r),o());}),n);return M}function Kt(e,t){var n;var r=new Promise((function(r,M){var i=Xt(e,r,o(o({},t),{onError:M}));n=function(){i(),M("WHEN_CANCELLED");};}));return r.cancel=n,r}function $t(e){return e[w]}function en(e){return "string"==typeof e||"number"==typeof e||"symbol"==typeof e}var tn={has:function(e,t){if(t===w||"constructor"===t||t===v)return !0;var n=$t(e);return en(t)?n.has(t):t in e},get:function(e,t){if(t===w||"constructor"===t||t===v)return e[t];var n=$t(e),r=n.values.get(t);if(r instanceof O){var o=r.get();return void 0===o&&n.has(t),o}return en(t)&&n.has(t),e[t]},set:function(e,t,n){return !!en(t)&&(Bt(e,t,n),!0)},deleteProperty:function(e,t){return !!en(t)&&($t(e).remove(t),!0)},ownKeys:function(e){return $t(e).keysAtom.reportObserved(),Reflect.ownKeys(e)},preventExtensions:function(e){return N("Dynamic observable objects cannot be frozen"),!1}};function nn(e){var t=new Proxy(e,tn);return e[w].proxy=t,t}function rn(e){return void 0!==e.interceptors&&e.interceptors.length>0}function on(e,t){var n=e.interceptors||(e.interceptors=[]);return n.push(t),D((function(){var e=n.indexOf(t);-1!==e&&n.splice(e,1);}))}function Mn(e,t){var n=ce();try{for(var r=a(e.interceptors||[]),o=0,M=r.length;o<M&&(l(!(t=r[o](t))||t.type,"Intercept handlers should return nothing or a change object"),t);o++);return t}finally{Ne(n);}}function an(e){return void 0!==e.changeListeners&&e.changeListeners.length>0}function un(e,t){var n=e.changeListeners||(e.changeListeners=[]);return n.push(t),D((function(){var e=n.indexOf(t);-1!==e&&n.splice(e,1);}))}function sn(e,t){var n=ce(),r=e.changeListeners;if(r){for(var o=0,M=(r=r.slice()).length;o<M;o++)r[o](t);Ne(n);}}var cn={get:function(e,t){return t===w?e[w]:"length"===t?e[w].getArrayLength():"number"==typeof t?Dn.get.call(e,t):"string"!=typeof t||isNaN(t)?Dn.hasOwnProperty(t)?Dn[t]:e[t]:Dn.get.call(e,parseInt(t))},set:function(e,t,n){return "length"===t&&e[w].setArrayLength(n),"number"==typeof t&&Dn.set.call(e,t,n),"symbol"==typeof t||isNaN(t)?e[t]=n:Dn.set.call(e,parseInt(t),n),!0},preventExtensions:function(e){return N("Observable arrays cannot be frozen"),!1}};function Nn(e,t,n,r){void 0===n&&(n="ObservableArray@"+c()),void 0===r&&(r=!1);var o,M,i,a=new ln(n,t,r);o=a.values,M=w,i=a,Object.defineProperty(o,M,{enumerable:!1,writable:!1,configurable:!0,value:i});var u=new Proxy(a.values,cn);if(a.proxy=u,e&&e.length){var s=de(!0);a.spliceWithArray(0,0,e),Ie(s);}return u}var ln=function(){function e(e,t,n){this.owned=n,this.values=[],this.proxy=void 0,this.lastKnownLength=0,this.atom=new O(e||"ObservableArray@"+c()),this.enhancer=function(n,r){return t(n,r,e+"[..]")};}return e.prototype.dehanceValue=function(e){return void 0!==this.dehancer?this.dehancer(e):e},e.prototype.dehanceValues=function(e){return void 0!==this.dehancer&&e.length>0?e.map(this.dehancer):e},e.prototype.intercept=function(e){return on(this,e)},e.prototype.observe=function(e,t){return void 0===t&&(t=!1),t&&e({object:this.proxy,type:"splice",index:0,added:this.values.slice(),addedCount:this.values.length,removed:[],removedCount:0}),un(this,e)},e.prototype.getArrayLength=function(){return this.atom.reportObserved(),this.values.length},e.prototype.setArrayLength=function(e){if("number"!=typeof e||e<0)throw new Error("[mobx.array] Out of range: "+e);var t=this.values.length;if(e!==t)if(e>t){for(var n=new Array(e-t),r=0;r<e-t;r++)n[r]=void 0;this.spliceWithArray(t,0,n);}else this.spliceWithArray(e,t-e);},e.prototype.updateArrayLength=function(e,t){if(e!==this.lastKnownLength)throw new Error("[mobx] Modification exception: the internal structure of an observable array was changed.");this.lastKnownLength+=t;},e.prototype.spliceWithArray=function(e,t,n){var r=this;ie(this.atom);var o=this.values.length;if(void 0===e?e=0:e>o?e=o:e<0&&(e=Math.max(0,o+e)),t=1===arguments.length?o-e:null==t?0:Math.max(0,Math.min(t,o-e)),void 0===n&&(n=u),rn(this)){var M=Mn(this,{object:this.proxy,type:"splice",index:e,removedCount:t,added:n});if(!M)return u;t=M.removedCount,n=M.added;}n=0===n.length?n:n.map((function(e){return r.enhancer(e,void 0)}));var i=this.spliceItemsIntoValues(e,t,n);return 0===t&&0===n.length||this.notifyArraySplice(e,n,i),this.dehanceValues(i)},e.prototype.spliceItemsIntoValues=function(e,t,n){var r;if(n.length<1e4)return (r=this.values).splice.apply(r,a([e,t],n));var o=this.values.slice(e,e+t);return this.values=this.values.slice(0,e).concat(n,this.values.slice(e+t)),o},e.prototype.notifyArrayChildUpdate=function(e,t,n){var r=!this.owned&&!1,o=an(this),M=o||r?{object:this.proxy,type:"update",index:e,newValue:t,oldValue:n}:null;this.atom.reportChanged(),o&&sn(this,M);},e.prototype.notifyArraySplice=function(e,t,n){var r=!this.owned&&!1,o=an(this),M=o||r?{object:this.proxy,type:"splice",index:e,removed:n,added:t,removedCount:n.length,addedCount:t.length}:null;this.atom.reportChanged(),o&&sn(this,M);},e}(),Dn={intercept:function(e){return this[w].intercept(e)},observe:function(e,t){return void 0===t&&(t=!1),this[w].observe(e,t)},clear:function(){return this.splice(0)},replace:function(e){var t=this[w];return t.spliceWithArray(0,t.values.length,e)},toJS:function(){return this.slice()},toJSON:function(){return this.toJS()},splice:function(e,t){for(var n=[],r=2;r<arguments.length;r++)n[r-2]=arguments[r];var o=this[w];switch(arguments.length){case 0:return [];case 1:return o.spliceWithArray(e);case 2:return o.spliceWithArray(e,t)}return o.spliceWithArray(e,t,n)},spliceWithArray:function(e,t,n){return this[w].spliceWithArray(e,t,n)},push:function(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];var n=this[w];return n.spliceWithArray(n.values.length,0,e),n.values.length},pop:function(){return this.splice(Math.max(this[w].values.length-1,0),1)[0]},shift:function(){return this.splice(0,1)[0]},unshift:function(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];var n=this[w];return n.spliceWithArray(0,0,e),n.values.length},reverse:function(){var e=this.slice();return e.reverse.apply(e,arguments)},sort:function(e){var t=this.slice();return t.sort.apply(t,arguments)},remove:function(e){var t=this[w],n=t.dehanceValues(t.values).indexOf(e);return n>-1&&(this.splice(n,1),!0)},get:function(e){var t=this[w];if(t){if(e<t.values.length)return t.atom.reportObserved(),t.dehanceValue(t.values[e]);console.warn("[mobx.array] Attempt to read an array index ("+e+") that is out of bounds ("+t.values.length+"). Please check length first. Out of bound indices will not be tracked by MobX");}},set:function(e,t){var n=this[w],r=n.values;if(e<r.length){ie(n.atom);var o=r[e];if(rn(n)){var M=Mn(n,{type:"update",object:n.proxy,index:e,newValue:t});if(!M)return;t=M.newValue;}(t=n.enhancer(t,o))!==o&&(r[e]=t,n.notifyArrayChildUpdate(e,t,o));}else {if(e!==r.length)throw new Error("[mobx.array] Index out of bounds, "+e+" is larger than "+r.length);n.spliceWithArray(e,0,[t]);}}};["concat","every","filter","forEach","indexOf","join","lastIndexOf","map","reduce","reduceRight","slice","some","toString","toLocaleString"].forEach((function(e){Dn[e]=function(){var t=this[w];t.atom.reportObserved();var n=t.dehanceValues(t.values);return n[e].apply(n,arguments)};}));var gn,yn=T("ObservableArrayAdministration",ln);function jn(e){return y(e)&&yn(e[w])}var zn,Tn={},An=function(){function e(e,t,n){if(void 0===t&&(t=Q),void 0===n&&(n="ObservableMap@"+c()),this.enhancer=t,this.name=n,this[gn]=Tn,this._keysAtom=L(this.name+".keys()"),this[Symbol.toStringTag]="Map","function"!=typeof Map)throw new Error("mobx.map requires Map polyfill for the current browser. Check babel-polyfill or core-js/es6/map.js");this._data=new Map,this._hasMap=new Map,this.merge(e);}return e.prototype._has=function(e){return this._data.has(e)},e.prototype.has=function(e){var t=this;if(!Ue.trackingDerivation)return this._has(e);var n=this._hasMap.get(e);if(!n){var r=n=new Oe(this._has(e),B,this.name+"."+d(e)+"?",!1);this._hasMap.set(e,r),lt(r,(function(){return t._hasMap.delete(e)}));}return n.get()},e.prototype.set=function(e,t){var n=this._has(e);if(rn(this)){var r=Mn(this,{type:n?"update":"add",object:this,newValue:t,name:e});if(!r)return this;t=r.newValue;}return n?this._updateValue(e,t):this._addValue(e,t),this},e.prototype.delete=function(e){var t=this;if(rn(this)&&!(r=Mn(this,{type:"delete",object:this,name:e})))return !1;if(this._has(e)){var n=an(this),r=n?{type:"delete",object:this,oldValue:this._data.get(e).value,name:e}:null;return Ft((function(){t._keysAtom.reportChanged(),t._updateHasMapEntry(e,!1),t._data.get(e).setNewValue(void 0),t._data.delete(e);})),n&&sn(this,r),!0}return !1},e.prototype._updateHasMapEntry=function(e,t){var n=this._hasMap.get(e);n&&n.setNewValue(t);},e.prototype._updateValue=function(e,t){var n=this._data.get(e);if((t=n.prepareNewValue(t))!==Ue.UNCHANGED){var r=an(this),o=r?{type:"update",object:this,oldValue:n.value,name:e,newValue:t}:null;n.setNewValue(t),r&&sn(this,o);}},e.prototype._addValue=function(e,t){var n=this;ie(this._keysAtom),Ft((function(){var r=new Oe(t,n.enhancer,n.name+"."+d(e),!1);n._data.set(e,r),t=r.value,n._updateHasMapEntry(e,!0),n._keysAtom.reportChanged();}));var r=an(this),o=r?{type:"add",object:this,name:e,newValue:t}:null;r&&sn(this,o);},e.prototype.get=function(e){return this.has(e)?this.dehanceValue(this._data.get(e).get()):this.dehanceValue(void 0)},e.prototype.dehanceValue=function(e){return void 0!==this.dehancer?this.dehancer(e):e},e.prototype.keys=function(){return this._keysAtom.reportObserved(),this._data.keys()},e.prototype.values=function(){var e=this,t=0,n=Array.from(this.keys());return Qn({next:function(){return t<n.length?{value:e.get(n[t++]),done:!1}:{done:!0}}})},e.prototype.entries=function(){var e=this,t=0,n=Array.from(this.keys());return Qn({next:function(){if(t<n.length){var r=n[t++];return {value:[r,e.get(r)],done:!1}}return {done:!0}}})},e.prototype[(gn=w,Symbol.iterator)]=function(){return this.entries()},e.prototype.forEach=function(e,t){var n,r;try{for(var o=M(this),a=o.next();!a.done;a=o.next()){var u=i(a.value,2),s=u[0],c=u[1];e.call(t,c,s,this);}}catch(e){n={error:e};}finally{try{a&&!a.done&&(r=o.return)&&r.call(o);}finally{if(n)throw n.error}}},e.prototype.merge=function(e){var t=this;return fn(e)&&(e=e.toJS()),Ft((function(){j(e)?E(e).forEach((function(n){return t.set(n,e[n])})):Array.isArray(e)?e.forEach((function(e){var n=i(e,2),r=n[0],o=n[1];return t.set(r,o)})):f(e)?(e.constructor!==Map&&N("Cannot initialize from classes that inherit from Map: "+e.constructor.name),e.forEach((function(e,n){return t.set(n,e)}))):null!=e&&N("Cannot initialize map from "+e);})),this},e.prototype.clear=function(){var e=this;Ft((function(){se((function(){var t,n;try{for(var r=M(e.keys()),o=r.next();!o.done;o=r.next()){var i=o.value;e.delete(i);}}catch(e){t={error:e};}finally{try{o&&!o.done&&(n=r.return)&&n.call(r);}finally{if(t)throw t.error}}}));}));},e.prototype.replace=function(e){var t=this;return Ft((function(){var n,r=j(n=e)?Object.keys(n):Array.isArray(n)?n.map((function(e){return i(e,1)[0]})):f(n)||fn(n)?Array.from(n.keys()):N("Cannot get keys from '"+n+"'");Array.from(t.keys()).filter((function(e){return -1===r.indexOf(e)})).forEach((function(e){return t.delete(e)})),t.merge(e);})),this},Object.defineProperty(e.prototype,"size",{get:function(){return this._keysAtom.reportObserved(),this._data.size},enumerable:!0,configurable:!0}),e.prototype.toPOJO=function(){var e,t,n={};try{for(var r=M(this),o=r.next();!o.done;o=r.next()){var a=i(o.value,2),u=a[0],s=a[1];n["symbol"==typeof u?u:d(u)]=s;}}catch(t){e={error:t};}finally{try{o&&!o.done&&(t=r.return)&&t.call(r);}finally{if(e)throw e.error}}return n},e.prototype.toJS=function(){return new Map(this)},e.prototype.toJSON=function(){return this.toPOJO()},e.prototype.toString=function(){var e=this;return this.name+"[{ "+Array.from(this.keys()).map((function(t){return d(t)+": "+e.get(t)})).join(", ")+" }]"},e.prototype.observe=function(e,t){return un(this,e)},e.prototype.intercept=function(e){return on(this,e)},e}(),fn=T("ObservableMap",An),pn={},En=function(){function e(e,t,n){if(void 0===t&&(t=Q),void 0===n&&(n="ObservableSet@"+c()),this.name=n,this[zn]=pn,this._data=new Set,this._atom=L(this.name),this[Symbol.toStringTag]="Set","function"!=typeof Set)throw new Error("mobx.set requires Set polyfill for the current browser. Check babel-polyfill or core-js/es6/set.js");this.enhancer=function(e,r){return t(e,r,n)},e&&this.replace(e);}return e.prototype.dehanceValue=function(e){return void 0!==this.dehancer?this.dehancer(e):e},e.prototype.clear=function(){var e=this;Ft((function(){se((function(){var t,n;try{for(var r=M(e._data.values()),o=r.next();!o.done;o=r.next()){var i=o.value;e.delete(i);}}catch(e){t={error:e};}finally{try{o&&!o.done&&(n=r.return)&&n.call(r);}finally{if(t)throw t.error}}}));}));},e.prototype.forEach=function(e,t){var n,r;try{for(var o=M(this),i=o.next();!i.done;i=o.next()){var a=i.value;e.call(t,a,a,this);}}catch(e){n={error:e};}finally{try{i&&!i.done&&(r=o.return)&&r.call(o);}finally{if(n)throw n.error}}},Object.defineProperty(e.prototype,"size",{get:function(){return this._atom.reportObserved(),this._data.size},enumerable:!0,configurable:!0}),e.prototype.add=function(e){var t=this;if((ie(this._atom),rn(this))&&!(r=Mn(this,{type:"add",object:this,newValue:e})))return this;if(!this.has(e)){Ft((function(){t._data.add(t.enhancer(e,void 0)),t._atom.reportChanged();}));var n=an(this),r=n?{type:"add",object:this,newValue:e}:null;n&&sn(this,r);}return this},e.prototype.delete=function(e){var t=this;if(rn(this)&&!(r=Mn(this,{type:"delete",object:this,oldValue:e})))return !1;if(this.has(e)){var n=an(this),r=n?{type:"delete",object:this,oldValue:e}:null;return Ft((function(){t._atom.reportChanged(),t._data.delete(e);})),n&&sn(this,r),!0}return !1},e.prototype.has=function(e){return this._atom.reportObserved(),this._data.has(this.dehanceValue(e))},e.prototype.entries=function(){var e=0,t=Array.from(this.keys()),n=Array.from(this.values());return Qn({next:function(){var r=e;return e+=1,r<n.length?{value:[t[r],n[r]],done:!1}:{done:!0}}})},e.prototype.keys=function(){return this.values()},e.prototype.values=function(){this._atom.reportObserved();var e=this,t=0,n=Array.from(this._data.values());return Qn({next:function(){return t<n.length?{value:e.dehanceValue(n[t++]),done:!1}:{done:!0}}})},e.prototype.replace=function(e){var t=this;return dn(e)&&(e=e.toJS()),Ft((function(){Array.isArray(e)||p(e)?(t.clear(),e.forEach((function(e){return t.add(e)}))):null!=e&&N("Cannot initialize set from "+e);})),this},e.prototype.observe=function(e,t){return un(this,e)},e.prototype.intercept=function(e){return on(this,e)},e.prototype.toJS=function(){return new Set(this)},e.prototype.toString=function(){return this.name+"[ "+Array.from(this).join(", ")+" ]"},e.prototype[(zn=w,Symbol.iterator)]=function(){return this.values()},e}(),dn=T("ObservableSet",En),In=function(){function e(e,t,n,r){void 0===t&&(t=new Map),this.target=e,this.values=t,this.name=n,this.defaultEnhancer=r,this.keysAtom=new O(n+".keys");}return e.prototype.read=function(e){return this.values.get(e).get()},e.prototype.write=function(e,t){var n=this.target,r=this.values.get(e);if(r instanceof Le)r.set(t);else {if(rn(this)){if(!(M=Mn(this,{type:"update",object:this.proxy||n,name:e,newValue:t})))return;t=M.newValue;}if((t=r.prepareNewValue(t))!==Ue.UNCHANGED){var o=an(this),M=o?{type:"update",object:this.proxy||n,oldValue:r.value,name:e,newValue:t}:null;r.setNewValue(t),o&&sn(this,M);}}},e.prototype.has=function(e){var t=this.pendingKeys||(this.pendingKeys=new Map),n=t.get(e);if(n)return n.get();var r=!!this.values.get(e);return n=new Oe(r,B,this.name+"."+d(e)+"?",!1),t.set(e,n),n.get()},e.prototype.addObservableProp=function(e,t,n){void 0===n&&(n=this.defaultEnhancer);var r=this.target;if(rn(this)){var o=Mn(this,{object:this.proxy||r,name:e,type:"add",newValue:t});if(!o)return;t=o.newValue;}var M=new Oe(t,n,this.name+"."+d(e),!1);this.values.set(e,M),t=M.value,Object.defineProperty(r,e,function(e){return On[e]||(On[e]={configurable:!0,enumerable:!0,get:function(){return this[w].read(e)},set:function(t){this[w].write(e,t);}})}(e)),this.notifyPropertyAddition(e,t);},e.prototype.addComputedProp=function(e,t,n){var r,o,M,i=this.target;n.name=n.name||this.name+"."+d(t),this.values.set(t,new Le(n)),(e===i||(r=e,o=t,!(M=Object.getOwnPropertyDescriptor(r,o))||!1!==M.configurable&&!1!==M.writable))&&Object.defineProperty(e,t,function(e){return xn[e]||(xn[e]={configurable:Ue.computedConfigurable,enumerable:!1,get:function(){return Ln(this).read(e)},set:function(t){Ln(this).write(e,t);}})}(t));},e.prototype.remove=function(e){if(this.values.has(e)){var t=this.target;if(rn(this))if(!(i=Mn(this,{object:this.proxy||t,name:e,type:"remove"})))return;try{Re();var n=an(this),r=this.values.get(e),o=r&&r.get();if(r&&r.set(void 0),this.keysAtom.reportChanged(),this.values.delete(e),this.pendingKeys){var M=this.pendingKeys.get(e);M&&M.set(!1);}delete this.target[e];var i=n?{type:"remove",object:this.proxy||t,oldValue:o,name:e}:null;0,n&&sn(this,i);}finally{Ze();}}},e.prototype.illegalAccess=function(e,t){console.warn("Property '"+t+"' of '"+e+"' was accessed through the prototype chain. Use 'decorate' instead to declare the prop or access it statically through it's owner");},e.prototype.observe=function(e,t){return un(this,e)},e.prototype.intercept=function(e){return on(this,e)},e.prototype.notifyPropertyAddition=function(e,t){var n=an(this),r=n?{type:"add",object:this.proxy||this.target,name:e,newValue:t}:null;if(n&&sn(this,r),this.pendingKeys){var o=this.pendingKeys.get(e);o&&o.set(!0);}this.keysAtom.reportChanged();},e.prototype.getKeys=function(){var e,t;this.keysAtom.reportObserved();var n=[];try{for(var r=M(this.values),o=r.next();!o.done;o=r.next()){var a=i(o.value,2),u=a[0];a[1]instanceof Oe&&n.push(u);}}catch(t){e={error:t};}finally{try{o&&!o.done&&(t=r.return)&&t.call(r);}finally{if(e)throw e.error}}return n},e}();function wn(e,t,n){if(void 0===t&&(t=""),void 0===n&&(n=Q),Object.prototype.hasOwnProperty.call(e,w))return e[w];j(e)||(t=(e.constructor.name||"ObservableObject")+"@"+c()),t||(t="ObservableObject@"+c());var r=new In(e,new Map,d(t),n);return z(e,w,r),r}var On=Object.create(null),xn=Object.create(null);function Ln(e){var t=e[w];return t||(S(e),e[w])}var hn=T("ObservableObjectAdministration",In);function vn(e){return !!y(e)&&(S(e),hn(e[w]))}function bn(e,t){if("object"==typeof e&&null!==e){if(jn(e))return void 0!==t&&N(!1),e[w].atom;if(dn(e))return e[w];if(fn(e)){var n=e;return void 0===t?n._keysAtom:((r=n._data.get(t)||n._hasMap.get(t))||N(!1),r)}var r;if(S(e),t&&!e[w]&&e[t],vn(e))return t?((r=e[w].values.get(t))||N(!1),r):N(!1);if(x(e)||he(e)||Xe(e))return e}else if("function"==typeof e&&Xe(e[w]))return e[w];return N(!1)}function kn(e,t){return e||N("Expecting some object"),void 0!==t?kn(bn(e,t)):x(e)||he(e)||Xe(e)||fn(e)||dn(e)?e:(S(e),e[w]?e[w]:void N(!1))}function mn(e,t){return (void 0!==t?bn(e,t):vn(e)||fn(e)||dn(e)?kn(e):bn(e)).name}var Cn=Object.prototype.toString;function Sn(e,t,n){return void 0===n&&(n=-1),function e(t,n,r,o,M){if(t===n)return 0!==t||1/t==1/n;if(null==t||null==n)return !1;if(t!=t)return n!=n;var i=typeof t;if("function"!==i&&"object"!==i&&"object"!=typeof n)return !1;var a=Cn.call(t);if(a!==Cn.call(n))return !1;switch(a){case"[object RegExp]":case"[object String]":return ""+t==""+n;case"[object Number]":return +t!=+t?+n!=+n:0==+t?1/+t==1/n:+t==+n;case"[object Date]":case"[object Boolean]":return +t==+n;case"[object Symbol]":return "undefined"!=typeof Symbol&&Symbol.valueOf.call(t)===Symbol.valueOf.call(n);case"[object Map]":case"[object Set]":r>=0&&r++;}t=Un(t),n=Un(n);var u="[object Array]"===a;if(!u){if("object"!=typeof t||"object"!=typeof n)return !1;var s=t.constructor,c=n.constructor;if(s!==c&&!("function"==typeof s&&s instanceof s&&"function"==typeof c&&c instanceof c)&&"constructor"in t&&"constructor"in n)return !1}if(0===r)return !1;r<0&&(r=-1);M=M||[];var N=(o=o||[]).length;for(;N--;)if(o[N]===t)return M[N]===n;if(o.push(t),M.push(n),u){if((N=t.length)!==n.length)return !1;for(;N--;)if(!e(t[N],n[N],r-1,o,M))return !1}else {var l=Object.keys(t),D=void 0;if(N=l.length,Object.keys(n).length!==N)return !1;for(;N--;)if(D=l[N],!Yn(n,D)||!e(t[D],n[D],r-1,o,M))return !1}return o.pop(),M.pop(),!0}(e,t,n)}function Un(e){return jn(e)?e.slice():f(e)||fn(e)||p(e)||dn(e)?Array.from(e.entries()):e}function Yn(e,t){return Object.prototype.hasOwnProperty.call(e,t)}function Qn(e){return e[Symbol.iterator]=Bn,e}function Bn(){return this}if("undefined"==typeof Proxy||"undefined"==typeof Symbol)throw new Error("[mobx] MobX 5+ requires Proxy and Symbol objects. If your environment doesn't support Symbol or Proxy objects, please downgrade to MobX 4. For React Native Android, consider upgrading JSCore.");"object"==typeof __MOBX_DEVTOOLS_GLOBAL_HOOK__&&__MOBX_DEVTOOLS_GLOBAL_HOOK__.injectMobx({spy:$e,extras:{getDebugName:mn},$mobx:w});}.call(this,n(3));},function(e,t,n){n.r(t),function(e){n.d(t,"observer",(function(){return A})),n.d(t,"Observer",(function(){return p})),n.d(t,"useStaticRendering",(function(){return g})),n.d(t,"connect",(function(){return x})),n.d(t,"inject",(function(){return O})),n.d(t,"Provider",(function(){return v}));var r=n(0),o=n(1);function M(e){return !(e.prototype&&e.prototype.render||r.Component.isPrototypeOf(e))}function i(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},n=t.prefix,r=void 0===n?"":n,o=t.suffix,M=void 0===o?"":o,i=e.displayName||e.name||e.constructor&&e.constructor.name||"<component>";return r+i+M}var a="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},u=function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")},s=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),c=function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t);},N=function(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return !t||"object"!=typeof t&&"function"!=typeof t?e:t},l=!1,D=console;function g(e){l=e;}function y(e,t,n,r,M){var i=function(e){var t=Object(o._getGlobalState)().allowStateChanges;return Object(o._getGlobalState)().allowStateChanges=e,t}(e),a=void 0;try{a=t(n,r,M);}finally{!function(e){Object(o._getGlobalState)().allowStateChanges=e;}(i);}return a}function j(e,t){var n=arguments.length>2&&void 0!==arguments[2]&&arguments[2],r=e[t],o=T[t],M=r?!0===n?function(){o.apply(this,arguments),r.apply(this,arguments);}:function(){r.apply(this,arguments),o.apply(this,arguments);}:o;e[t]=M;}function z(e,t){if(null==e||null==t||"object"!==(void 0===e?"undefined":a(e))||"object"!==(void 0===t?"undefined":a(t)))return e!==t;var n=Object.keys(e);if(n.length!==Object.keys(t).length)return !0;for(var r=void 0,o=n.length-1;r=n[o];o--)if(t[r]!==e[r])return !0;return !1}var T={componentWillMount:function(){var e=this;if(!0!==l){var t=i(this),n=!1,M=!1;N.call(this,"props"),N.call(this,"state");var a=this.render.bind(this),u=null,s=!1,c=function(e,t,n){s=!1;var r=void 0,o=void 0;if(u.track((function(){try{o=y(!1,a,e,t,n);}catch(e){r=e;}})),r)throw r;return o};this.render=function(){return (u=new o.Reaction(t+".render()",(function(){if(!s&&(s=!0,"function"==typeof e.componentWillReact&&e.componentWillReact(),!0!==e.__$mobxIsUnmounted)){var t=!0;try{M=!0,n||r.Component.prototype.forceUpdate.call(e),t=!1;}finally{M=!1,t&&u.dispose();}}}))).reactComponent=e,c.$mobx=u,e.render=c,c(e.props,e.state,e.context)};}function N(e){var t=this[e],r=Object(o.createAtom)("reactive "+e);Object.defineProperty(this,e,{configurable:!0,enumerable:!0,get:function(){return r.reportObserved(),t},set:function(e){!M&&z(t,e)?(t=e,n=!0,r.reportChanged(),n=!1):t=e;}});}},componentWillUnmount:function(){!0!==l&&(this.render.$mobx&&this.render.$mobx.dispose(),this.__$mobxIsUnmounted=!0);},componentDidMount:function(){},componentDidUpdate:function(){},shouldComponentUpdate:function(e,t){return l&&D.warn("[mobx-preact] It seems that a re-rendering of a React component is triggered while in static (server-side) mode. Please make sure components are rendered only once server-side."),this.state!==t||z(this.props,e)}};function A(e){var t,n;if(arguments.length>1&&D.warn('Mobx observer: Using observer to inject stores is not supported. Use `@connect(["store1", "store2"]) ComponentClass instead or preferably, use `@inject("store1", "store2") @observer ComponentClass` or `inject("store1", "store2")(observer(componentClass))``'),!0===e.isMobxInjector&&D.warn("Mobx observer: You are trying to use 'observer' on a component that already has 'inject'. Please apply 'observer' before applying 'inject'"),M(e))return A((n=t=function(t){function n(){return u(this,n),N(this,(n.__proto__||Object.getPrototypeOf(n)).apply(this,arguments))}return c(n,t),s(n,[{key:"render",value:function(){return e.call(this,this.props,this.context)}}]),n}(r.Component),t.displayName=i(e),n));if(!e)throw new Error("Please pass a valid component to 'observer'");var o=e.prototype||e;return f(o),e.isMobXReactObserver=!0,e}function f(e){j(e,"componentWillMount",!0),j(e,"componentDidMount"),e.shouldComponentUpdate||(e.shouldComponentUpdate=T.shouldComponentUpdate);}var p=A((function(e){return e.children[0]()}));p.displayName="Observer";var E=function(e,t){return e(t={exports:{}},t.exports),t.exports}((function(e,t){var n,r,o,M,i,a,u,s;e.exports=(n={childContextTypes:!0,contextTypes:!0,defaultProps:!0,displayName:!0,getDefaultProps:!0,getDerivedStateFromProps:!0,mixins:!0,propTypes:!0,type:!0},r={name:!0,length:!0,prototype:!0,caller:!0,callee:!0,arguments:!0,arity:!0},o=Object.defineProperty,M=Object.getOwnPropertyNames,i=Object.getOwnPropertySymbols,a=Object.getOwnPropertyDescriptor,u=Object.getPrototypeOf,s=u&&u(Object),function e(t,c,N){if("string"!=typeof c){if(s){var l=u(c);l&&l!==s&&e(t,l,N);}var D=M(c);i&&(D=D.concat(i(c)));for(var g=0;g<D.length;++g){var y=D[g];if(!(n[y]||r[y]||N&&N[y])){var j=a(c,y);try{o(t,y,j);}catch(e){}}}return t}return t});})),d={isMobxInjector:{value:!0,writable:!0,configurable:!0,enumerable:!0}};function I(e,t,n){var o,M,a=i(t,{prefix:"inject-",suffix:n?"-with-"+n:""}),l=(M=o=function(n){function o(){return u(this,o),N(this,(o.__proto__||Object.getPrototypeOf(o)).apply(this,arguments))}return c(o,n),s(o,[{key:"render",value:function(){var n={};for(var o in this.props)this.props.hasOwnProperty(o)&&(n[o]=this.props[o]);var M=e(this.context.mobxStores||{},n,this.context)||{};for(var i in M)n[i]=M[i];return Object(r.h)(t,n)}}]),o}(r.Component),o.displayName=a,M);return E(l,t),l.wrappedComponent=t,Object.defineProperties(l,d),l}function w(e){return function(t,n){return e.forEach((function(e){if(!(e in n)){if(!(e in t))throw new Error("MobX injector: Store '"+e+"' is not available! Make sure it is provided by some Provider");n[e]=t[e];}})),n}}function O(){var e=void 0;if("function"==typeof arguments[0])return e=arguments[0],function(t){var n=I(e,t);return n.isMobxInjector=!1,(n=A(n)).isMobxInjector=!0,n};for(var t=[],n=0;n<arguments.length;n++)t[n]=arguments[n];return e=w(t),function(n){return I(e,n,t.join("-"))}}function x(e,t){if("string"==typeof e)throw new Error("Store names should be provided as array");return Array.isArray(e)?t?O.apply(null,e)(x(t)):function(t){return x(e,t)}:A(e)}var L={children:!0,key:!0,ref:!0},h=console,v=function(e){function t(){return u(this,t),N(this,(t.__proto__||Object.getPrototypeOf(t)).apply(this,arguments))}return c(t,e),s(t,[{key:"render",value:function(e){var t=e.children;return t.length>1?Object(r.h)("div",null," ",t," "):t[0]}},{key:"getChildContext",value:function(){var e={},t=this.context.mobxStores;if(t)for(var n in t)e[n]=t[n];for(var r in this.props)L[r]||"suppressChangedStoreWarning"===r||(e[r]=this.props[r]);return {mobxStores:e}}},{key:"componentWillReceiveProps",value:function(e){if(Object.keys(e).length!==Object.keys(this.props).length&&h.warn("MobX Provider: The set of provided stores has changed. Please avoid changing stores as the change might not propagate to all children"),!e.suppressChangedStoreWarning)for(var t in e)L[t]||this.props[t]===e[t]||h.warn("MobX Provider: Provided store '"+t+"' has changed. Please avoid replacing stores as the change might not propagate to all children");}}]),t}(r.Component);if(!r.Component)throw new Error("mobx-preact requires Preact to be available")}.call(this,n(3));},function(e,t){var n;n=function(){return this}();try{n=n||new Function("return this")();}catch(e){"object"==typeof window&&(n=window);}e.exports=n;},function(e,t,n){Object.defineProperty(t,"__esModule",{value:!0}),t.JSONHTTPError=t.TextHTTPError=t.HTTPError=t.getPagination=void 0;var r=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r]);}return e},o=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),M=n(10);function i(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function a(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return !t||"object"!=typeof t&&"function"!=typeof t?e:t}function u(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t);}Object.defineProperty(t,"getPagination",{enumerable:!0,get:function(){return M.getPagination}});var s=t.HTTPError=function(e){function t(e){i(this,t);var n=a(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e.statusText));return n.name=n.constructor.name,"function"==typeof Error.captureStackTrace?Error.captureStackTrace(n,n.constructor):n.stack=new Error(e.statusText).stack,n.status=e.status,n}return u(t,e),t}(function(e){function t(){var t=Reflect.construct(e,Array.from(arguments));return Object.setPrototypeOf(t,Object.getPrototypeOf(this)),t}return t.prototype=Object.create(e.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),Object.setPrototypeOf?Object.setPrototypeOf(t,e):t.__proto__=e,t}(Error)),c=t.TextHTTPError=function(e){function t(e,n){i(this,t);var r=a(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e));return r.data=n,r}return u(t,e),t}(s),N=t.JSONHTTPError=function(e){function t(e,n){i(this,t);var r=a(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e));return r.json=n,r}return u(t,e),t}(s),l=function(){function e(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"",n=arguments[1];i(this,e),this.apiURL=t,this.apiURL.match(/\/[^\/]?/)&&(this._sameOrigin=!0),this.defaultHeaders=n&&n.defaultHeaders||{};}return o(e,[{key:"headers",value:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};return r({},this.defaultHeaders,{"Content-Type":"application/json"},e)}},{key:"parseJsonResponse",value:function(e){return e.json().then((function(t){if(!e.ok)return Promise.reject(new N(e,t));var n=(0, M.getPagination)(e);return n?{pagination:n,items:t}:t}))}},{key:"request",value:function(e){var t=this,n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},o=this.headers(n.headers||{});return this._sameOrigin&&(n.credentials=n.credentials||"same-origin"),fetch(this.apiURL+e,r({},n,{headers:o})).then((function(e){var n=e.headers.get("Content-Type");return n&&n.match(/json/)?t.parseJsonResponse(e):e.ok?e.text().then((function(e){})):e.text().then((function(t){return Promise.reject(new c(e,t))}))}))}}]),e}();t.default=l;},function(e,t,n){Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var r=n(0);function o(e){return (o="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function M(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function i(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}function a(e,t){return (a=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function u(e){var t=function(){if("undefined"==typeof Reflect||!Reflect.construct)return !1;if(Reflect.construct.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],(function(){}))),!0}catch(e){return !1}}();return function(){var n,r=c(e);if(t){var o=c(this).constructor;n=Reflect.construct(r,arguments,o);}else n=r.apply(this,arguments);return s(this,n)}}function s(e,t){return !t||"object"!==o(t)&&"function"!=typeof t?function(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}(e):t}function c(e){return (c=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}var N=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&a(e,t);}(c,e);var t,n,s=u(c);function c(){return M(this,c),s.apply(this,arguments)}return t=c,(n=[{key:"render",value:function(){var e=this.props,t=e.saving,n=e.text,o=e.saving_text;return (0, r.h)("button",{type:"submit",className:"btn".concat(t?" saving":"")},t?o||"Saving":n||"Save")}}])&&i(t.prototype,n),c}(r.Component);t.default=N;},function(e,t,n){Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var r=n(0);function o(e){return (o="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function M(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function i(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}function a(e,t){return (a=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function u(e){var t=function(){if("undefined"==typeof Reflect||!Reflect.construct)return !1;if(Reflect.construct.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],(function(){}))),!0}catch(e){return !1}}();return function(){var n,r=c(e);if(t){var o=c(this).constructor;n=Reflect.construct(r,arguments,o);}else n=r.apply(this,arguments);return s(this,n)}}function s(e,t){return !t||"object"!==o(t)&&"function"!=typeof t?function(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}(e):t}function c(e){return (c=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}var N={confirm:{type:"success",text:"message_confirm"},password_mail:{type:"success",text:"message_password_mail"},email_changed:{type:"sucess",text:"message_email_changed"},verfication_error:{type:"error",text:"message_verfication_error"},signup_disabled:{type:"error",text:"message_signup_disabled"}},l=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&a(e,t);}(c,e);var t,n,s=u(c);function c(){return M(this,c),s.apply(this,arguments)}return t=c,(n=[{key:"render",value:function(){var e=this.props,t=e.type,n=e.t,o=N[t];return (0, r.h)("div",{className:"flashMessage ".concat(o.type)},(0, r.h)("span",null,n(o.text)))}}])&&i(t.prototype,n),c}(r.Component);t.default=l;},function(e,t,n){e.exports=function(e){var t=[];return t.toString=function(){return this.map((function(t){var n=function(e,t){var n=e[1]||"",r=e[3];if(!r)return n;if(t&&"function"==typeof btoa){var o=(i=r,a=btoa(unescape(encodeURIComponent(JSON.stringify(i)))),u="sourceMappingURL=data:application/json;charset=utf-8;base64,".concat(a),"/*# ".concat(u," */")),M=r.sources.map((function(e){return "/*# sourceURL=".concat(r.sourceRoot||"").concat(e," */")}));return [n].concat(M).concat([o]).join("\n")}var i,a,u;return [n].join("\n")}(t,e);return t[2]?"@media ".concat(t[2]," {").concat(n,"}"):n})).join("")},t.i=function(e,n,r){"string"==typeof e&&(e=[[null,e,""]]);var o={};if(r)for(var M=0;M<this.length;M++){var i=this[M][0];null!=i&&(o[i]=!0);}for(var a=0;a<e.length;a++){var u=[].concat(e[a]);r&&o[u[0]]||(n&&(u[2]?u[2]="".concat(n," and ").concat(u[2]):u[2]=n),t.push(u));}},t};},function(e,t,n){Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var r=n(0),o=n(1),M=n(2),i=N(n(9)),a=N(n(13)),u=N(n(19)),s=N(n(25)),c=N(n(26));function N(e){return e&&e.__esModule?e:{default:e}}function l(e,t){return function(e){if(Array.isArray(e))return e}(e)||function(e,t){if("undefined"==typeof Symbol||!(Symbol.iterator in Object(e)))return;var n=[],r=!0,o=!1,M=void 0;try{for(var i,a=e[Symbol.iterator]();!(r=(i=a.next()).done)&&(n.push(i.value),!t||n.length!==t);r=!0);}catch(e){o=!0,M=e;}finally{try{r||null==a.return||a.return();}finally{if(o)throw M}}return n}(e,t)||function(e,t){if(!e)return;if("string"==typeof e)return D(e,t);var n=Object.prototype.toString.call(e).slice(8,-1);"Object"===n&&e.constructor&&(n=e.constructor.name);if("Map"===n||"Set"===n)return Array.from(e);if("Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))return D(e,t)}(e,t)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function D(e,t){(null==t||t>e.length)&&(t=e.length);for(var n=0,r=new Array(t);n<t;n++)r[n]=e[n];return r}function g(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r);}return n}function y(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?g(Object(n),!0).forEach((function(t){j(e,t,n[t]);})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):g(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t));}));}return e}function j(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}var z={};function T(e){var t=arguments,n=z[e]||new Set;Array.from(n.values()).forEach((function(e){e.apply(e,Array.prototype.slice.call(t,1));}));}var A={login:!0,signup:!0,error:!0},f={on:function(e,t){z[e]=z[e]||new Set,z[e].add(t);},off:function(e,t){z[e]&&(t?z[e].delete(t):z[e].clear());},open:function(e){if(!A[e=e||"login"])throw new Error("Invalid action for open: ".concat(e));u.default.openModal(u.default.user?"user":e);},close:function(){u.default.closeModal();},currentUser:function(){return u.default.gotrue&&u.default.gotrue.currentUser()},logout:function(){return u.default.logout()},get gotrue(){return u.default.gotrue||u.default.openModal("login"),u.default.gotrue},refresh:function(e){return u.default.gotrue||u.default.openModal("login"),u.default.gotrue.currentUser().jwt(e)},init:function(e){!function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=e.APIUrl,n=e.logo,o=void 0===n||n,i=e.namePlaceholder,N=e.locale;N&&(u.default.locale=N);var l=document.querySelectorAll("[data-netlify-identity-menu],[data-netlify-identity-button]");Array.prototype.slice.call(l).forEach((function(e){var t=null===e.getAttribute("data-netlify-identity-menu")?"button":"menu";(0, r.render)((0, r.h)(M.Provider,{store:u.default},(0, r.h)(s.default,{mode:t,text:e.innerText.trim()})),e,null);})),u.default.init(O(t)),u.default.modal.logo=o,u.default.setNamePlaceholder(i),(I=document.createElement("iframe")).id="netlify-identity-widget",I.title="Netlify identity widget",I.onload=function(){var e=I.contentDocument.createElement("style");e.innerHTML=c.default.toString(),I.contentDocument.head.appendChild(e),d=(0, r.render)((0, r.h)(M.Provider,{store:u.default},(0, r.h)(a.default,null)),I.contentDocument.body,d),b();},E(I,x),I.src="about:blank";var D=e.container?document.querySelector(e.container):document.body;D.appendChild(I),p&&(I.setAttribute("style",p),p=null);}(e);},setLocale:function(e){e&&(u.default.locale=e);},store:u.default},p=null;function E(e,t){var n="";for(var r in t)n+="".concat(r,": ").concat(t[r],"; ");e?e.setAttribute("style",n):p=n;}var d,I,w={localhost:!0,"127.0.0.1":!0,"0.0.0.0":!0};function O(e){var t=w[document.location.hostname];if(e)return new i.default({APIUrl:e,setCookie:!t});if(t){u.default.setIsLocal(t);var n=localStorage.getItem("netlifySiteURL");return n&&u.default.setSiteURL(n),null}return new i.default({setCookie:!t})}var x={position:"fixed",top:0,left:0,border:"none",width:"100%",height:"100%",overflow:"visible",background:"transparent",display:"none","z-index":99};(0, o.observe)(u.default.modal,"isOpen",(function(){u.default.settings||u.default.loadSettings(),E(I,y(y({},x),{},{display:u.default.modal.isOpen?"block !important":"none"})),u.default.modal.isOpen?T("open",u.default.modal.page):T("close");})),(0, o.observe)(u.default,"siteURL",(function(){var e;if(null===u.default.siteURL||void 0===u.default.siteURL?localStorage.removeItem("netlifySiteURL"):localStorage.setItem("netlifySiteURL",u.default.siteURL),u.default.siteURL){var t=u.default.siteURL.replace(/\/$/,"");e="".concat(t,"/.netlify/identity");}u.default.init(O(e),!0);})),(0, o.observe)(u.default,"user",(function(){u.default.user?T("login",u.default.user):T("logout");})),(0, o.observe)(u.default,"gotrue",(function(){u.default.gotrue&&T("init",u.default.gotrue.currentUser());})),(0, o.observe)(u.default,"error",(function(){T("error",u.default.error);}));var L=/(confirmation|invite|recovery|email_change)_token=([^&]+)/,h=/error=access_denied&error_description=403/,v=/access_token=/;function b(){var e=(document.location.hash||"").replace(/^#\/?/,"");if(e){var t=e.match(L);if(t&&(u.default.verifyToken(t[1],t[2]),document.location.hash=""),e.match(h)&&(u.default.openModal("signup"),document.location.hash=""),e.match(v)){var n={};if(e.split("&").forEach((function(e){var t=l(e.split("="),2),r=t[0],o=t[1];n[r]=o;})),document&&n.access_token&&(document.cookie="nf_jwt=".concat(n.access_token)),n.state)try{var r=decodeURIComponent(n.state);if("implicit"===JSON.parse(r).auth_type)return}catch(e){}document.location.hash="",u.default.openModal("login"),u.default.completeExternalLogin(n);}}}var k=f;t.default=k;},function(e,t,n){function r(e){return (r="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var o,M=function(e){if(e&&e.__esModule)return e;if(null===e||"object"!==r(e)&&"function"!=typeof e)return {default:e};var t=a();if(t&&t.has(e))return t.get(e);var n={},o=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var M in e)if(Object.prototype.hasOwnProperty.call(e,M)){var i=o?Object.getOwnPropertyDescriptor(e,M):null;i&&(i.get||i.set)?Object.defineProperty(n,M,i):n[M]=e[M];}n.default=e,t&&t.set(e,n);return n}(n(4)),i=(o=n(11))&&o.__esModule?o:{default:o};function a(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return a=function(){return e},e}function u(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function s(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}var c=/^http:\/\//,N=function(){function e(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},n=t.APIUrl,r=void 0===n?"/.netlify/identity":n,o=t.audience,i=void 0===o?"":o,a=t.setCookie,s=void 0!==a&&a;u(this,e),r.match(c)&&console.warn("Warning:\n\nDO NOT USE HTTP IN PRODUCTION FOR GOTRUE EVER!\nGoTrue REQUIRES HTTPS to work securely."),i&&(this.audience=i),this.setCookie=s,this.api=new M.default(r);}var t,n;return t=e,(n=[{key:"_request",value:function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};t.headers=t.headers||{};var n=t.audience||this.audience;return n&&(t.headers["X-JWT-AUD"]=n),this.api.request(e,t).catch((function(e){return e instanceof M.JSONHTTPError&&e.json&&(e.json.msg?e.message=e.json.msg:e.json.error&&(e.message="".concat(e.json.error,": ").concat(e.json.error_description))),Promise.reject(e)}))}},{key:"settings",value:function(){return this._request("/settings")}},{key:"signup",value:function(e,t,n){return this._request("/signup",{method:"POST",body:JSON.stringify({email:e,password:t,data:n})})}},{key:"login",value:function(e,t,n){var r=this;return this._setRememberHeaders(n),this._request("/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:"grant_type=password&username=".concat(encodeURIComponent(e),"&password=").concat(encodeURIComponent(t))}).then((function(e){return i.default.removeSavedSession(),r.createUser(e,n)}))}},{key:"loginExternalUrl",value:function(e){return "".concat(this.api.apiURL,"/authorize?provider=").concat(e)}},{key:"confirm",value:function(e,t){return this._setRememberHeaders(t),this.verify("signup",e,t)}},{key:"requestPasswordRecovery",value:function(e){return this._request("/recover",{method:"POST",body:JSON.stringify({email:e})})}},{key:"recover",value:function(e,t){return this._setRememberHeaders(t),this.verify("recovery",e,t)}},{key:"acceptInvite",value:function(e,t,n){var r=this;return this._setRememberHeaders(n),this._request("/verify",{method:"POST",body:JSON.stringify({token:e,password:t,type:"signup"})}).then((function(e){return r.createUser(e,n)}))}},{key:"acceptInviteExternalUrl",value:function(e,t){return "".concat(this.api.apiURL,"/authorize?provider=").concat(e,"&invite_token=").concat(t)}},{key:"createUser",value:function(e){var t=arguments.length>1&&void 0!==arguments[1]&&arguments[1];this._setRememberHeaders(t);var n=new i.default(this.api,e,this.audience);return n.getUserData().then((function(e){return t&&e._saveSession(),e}))}},{key:"currentUser",value:function(){var e=i.default.recoverSession(this.api);return e&&this._setRememberHeaders(e._fromStorage),e}},{key:"verify",value:function(e,t,n){var r=this;return this._setRememberHeaders(n),this._request("/verify",{method:"POST",body:JSON.stringify({token:t,type:e})}).then((function(e){return r.createUser(e,n)}))}},{key:"_setRememberHeaders",value:function(e){this.setCookie&&(this.api.defaultHeaders=this.api.defaultHeaders||{},this.api.defaultHeaders["X-Use-Cookie"]=e?"1":"session");}}])&&s(t.prototype,n),e}();t.default=N,"undefined"!=typeof window&&(window.GoTrue=N);},function(e,t,n){Object.defineProperty(t,"__esModule",{value:!0});var r=function(e,t){if(Array.isArray(e))return e;if(Symbol.iterator in Object(e))return function(e,t){var n=[],r=!0,o=!1,M=void 0;try{for(var i,a=e[Symbol.iterator]();!(r=(i=a.next()).done)&&(n.push(i.value),!t||n.length!==t);r=!0);}catch(e){o=!0,M=e;}finally{try{!r&&a.return&&a.return();}finally{if(o)throw M}}return n}(e,t);throw new TypeError("Invalid attempt to destructure non-iterable instance")};t.getPagination=function(e){var t=e.headers.get("Link"),n={};if(null==t)return null;t=t.split(",");for(var o=e.headers.get("X-Total-Count"),M=0,i=t.length;M<i;M++){var a=t[M].replace(/(^\s*|\s*$)/,"").split(";"),u=r(a,2),s=u[0],c=u[1],N=s.match(/page=(\d+)/),l=N&&parseInt(N[1],10);c.match(/last/)?n.last=l:c.match(/next/)?n.next=l:c.match(/prev/)?n.prev=l:c.match(/first/)&&(n.first=l);}return n.last=Math.max(n.last||0,n.prev&&n.prev+1||0),n.current=n.next?n.next-1:n.last||1,n.total=o?parseInt(o,10):null,n};},function(e,t,n){function r(e){return (r="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var o,M=function(e){if(e&&e.__esModule)return e;if(null===e||"object"!==r(e)&&"function"!=typeof e)return {default:e};var t=a();if(t&&t.has(e))return t.get(e);var n={},o=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var M in e)if(Object.prototype.hasOwnProperty.call(e,M)){var i=o?Object.getOwnPropertyDescriptor(e,M):null;i&&(i.get||i.set)?Object.defineProperty(n,M,i):n[M]=e[M];}n.default=e,t&&t.set(e,n);return n}(n(4)),i=(o=n(12))&&o.__esModule?o:{default:o};function a(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return a=function(){return e},e}function u(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r);}return n}function s(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?u(Object(n),!0).forEach((function(t){c(e,t,n[t]);})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):u(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t));}));}return e}function c(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function N(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}var l={},D=null,g={api:1,token:1,audience:1,url:1},y={api:1},j=function(){return "undefined"!=typeof window},z=function(){function e(t,n,r){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e),this.api=t,this.url=t.apiURL,this.audience=r,this._processTokenResponse(n),D=this;}var t,n,r;return t=e,r=[{key:"removeSavedSession",value:function(){j()&&localStorage.removeItem("gotrue.user");}},{key:"recoverSession",value:function(t){if(D)return D;var n=j()&&localStorage.getItem("gotrue.user");if(n)try{var r=JSON.parse(n),o=r.url,i=r.token,a=r.audience;return o&&i?new e(t||new M.default(o,{}),i,a)._saveUserData(r,!0):null}catch(e){return console.error(new Error("Gotrue-js: Error recovering session: ".concat(e))),null}return null}}],(n=[{key:"update",value:function(e){var t=this;return this._request("/user",{method:"PUT",body:JSON.stringify(e)}).then((function(e){return t._saveUserData(e)._refreshSavedSession()}))}},{key:"jwt",value:function(e){var t=this.tokenDetails();if(null==t)return Promise.reject(new Error("Gotrue-js: failed getting jwt access token"));var n=t.expires_at,r=t.refresh_token,o=t.access_token;return e||n-6e4<Date.now()?this._refreshToken(r):Promise.resolve(o)}},{key:"logout",value:function(){return this._request("/logout",{method:"POST"}).then(this.clearSession.bind(this)).catch(this.clearSession.bind(this))}},{key:"_refreshToken",value:function(e){var t=this;return l[e]?l[e]:l[e]=this.api.request("/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:"grant_type=refresh_token&refresh_token=".concat(e)}).then((function(n){return delete l[e],t._processTokenResponse(n),t._refreshSavedSession(),t.token.access_token})).catch((function(n){return delete l[e],t.clearSession(),Promise.reject(n)}))}},{key:"_request",value:function(e){var t=this,n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};n.headers=n.headers||{};var r=n.audience||this.audience;return r&&(n.headers["X-JWT-AUD"]=r),this.jwt().then((function(r){return t.api.request(e,s({headers:Object.assign(n.headers,{Authorization:"Bearer ".concat(r)})},n)).catch((function(e){return e instanceof M.JSONHTTPError&&e.json&&(e.json.msg?e.message=e.json.msg:e.json.error&&(e.message="".concat(e.json.error,": ").concat(e.json.error_description))),Promise.reject(e)}))}))}},{key:"getUserData",value:function(){return this._request("/user").then(this._saveUserData.bind(this)).then(this._refreshSavedSession.bind(this))}},{key:"_saveUserData",value:function(t,n){for(var r in t)r in e.prototype||r in g||(this[r]=t[r]);return n&&(this._fromStorage=!0),this}},{key:"_processTokenResponse",value:function(e){var t;this.token=e;try{t=JSON.parse(function(e){var t=e.replace(/-/g,"+").replace(/_/g,"/");switch(t.length%4){case 0:break;case 2:t+="==";break;case 3:t+="=";break;default:throw "Illegal base64url string!"}var n=window.atob(t);try{return decodeURIComponent(escape(n))}catch(e){return n}}(e.access_token.split(".")[1])),this.token.expires_at=1e3*t.exp;}catch(t){console.error(new Error("Gotrue-js: Failed to parse tokenResponse claims: ".concat(JSON.stringify(e))));}}},{key:"_refreshSavedSession",value:function(){return j()&&localStorage.getItem("gotrue.user")&&this._saveSession(),this}},{key:"_saveSession",value:function(){return j()&&localStorage.setItem("gotrue.user",JSON.stringify(this._details)),this}},{key:"tokenDetails",value:function(){return this.token}},{key:"clearSession",value:function(){e.removeSavedSession(),this.token=null,D=null;}},{key:"admin",get:function(){return new i.default(this)}},{key:"_details",get:function(){var t={};for(var n in this)n in e.prototype||n in y||(t[n]=this[n]);return t}}])&&N(t.prototype,n),r&&N(t,r),e}();t.default=z;},function(e,t,n){function r(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var o=function(){function e(t){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e),this.user=t;}var t,n;return t=e,(n=[{key:"listUsers",value:function(e){return this.user._request("/admin/users",{method:"GET",audience:e})}},{key:"getUser",value:function(e){return this.user._request("/admin/users/".concat(e.id))}},{key:"updateUser",value:function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};return this.user._request("/admin/users/".concat(e.id),{method:"PUT",body:JSON.stringify(t)})}},{key:"createUser",value:function(e,t){var n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{};return n.email=e,n.password=t,this.user._request("/admin/users",{method:"POST",body:JSON.stringify(n)})}},{key:"deleteUser",value:function(e){return this.user._request("/admin/users/".concat(e.id),{method:"DELETE"})}}])&&r(t.prototype,n),e}();t.default=o;},function(e,t,n){Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var r,o=n(0),M=n(2),i=l(n(14)),a=l(n(15)),u=l(n(16)),s=l(n(17)),c=l(n(18)),N=l(n(6));function l(e){return e&&e.__esModule?e:{default:e}}function D(e){return (D="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function g(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function y(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}function j(e,t){return (j=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function z(e){var t=function(){if("undefined"==typeof Reflect||!Reflect.construct)return !1;if(Reflect.construct.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],(function(){}))),!0}catch(e){return !1}}();return function(){var n,r=A(e);if(t){var o=A(this).constructor;n=Reflect.construct(r,arguments,o);}else n=r.apply(this,arguments);return T(this,n)}}function T(e,t){return !t||"object"!==D(t)&&"function"!=typeof t?function(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}(e):t}function A(e){return (A=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}var f={login:!0,signup:!0},p={login:{login:!0,button:"log_in",button_saving:"logging_in",email:!0,password:"current-password",link:"amnesia",link_text:"forgot_password",providers:!0},signup:{signup:!0,button:"sign_up",button_saving:"signing_up",name:!0,email:!0,password:"new-password",providers:!0},amnesia:{title:"recover_password",button:"send_recovery_email",button_saving:"sending_recovery_email",email:!0,link:"login",link_text:"never_mind"},recovery:{title:"recover_password",button:"update_password",button_saving:"updating_password",password:"new-password",link:"login",link_text:"never_mind"},invite:{title:"complete_your_signup",button:"sign_up",button_saving:"signing_up",password:"new-password",providers:!0},user:{title:"logged_in"}},E=(0, M.connect)(["store"])(r=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&j(e,t);}(l,e);var t,n,M=z(l);function l(){var e;g(this,l);for(var t=arguments.length,n=new Array(t),r=0;r<t;r++)n[r]=arguments[r];return (e=M.call.apply(M,[this].concat(n))).handleClose=function(){return e.props.store.closeModal()},e.handlePage=function(t){return e.props.store.openModal(t)},e.handleLogout=function(){return e.props.store.logout()},e.handleSiteURL=function(t){return e.props.store.setSiteURL(t)},e.clearSiteURL=function(t){return e.props.store.clearSiteURL()},e.clearStoreError=function(){return e.props.store.setError()},e.handleExternalLogin=function(t){return e.props.store.externalLogin(t)},e.handleUser=function(t){var n=t.name,r=t.email,o=t.password,M=e.props.store;switch(M.modal.page){case"login":M.login(r,o);break;case"signup":M.signup(n,r,o);break;case"amnesia":M.requestPasswordRecovery(r);break;case"invite":M.acceptInvite(o);break;case"recovery":M.updatePassword(o);}},e}return t=l,(n=[{key:"renderBody",value:function(){var e=this,t=this.props.store,n=p[t.modal.page]||{};return t.isLocal&&null===t.siteURL?(0, o.h)(a.default,{devMode:null!=t.siteURL,onSiteURL:t.siteURL?this.clearSiteURL:this.handleSiteURL,t:t.translate}):t.settings?t.user?(0, o.h)(u.default,{user:t.user,saving:t.saving,onLogout:this.handleLogout,t:t.translate}):"signup"===t.modal.page&&t.settings.disable_signup?(0, o.h)(N.default,{type:"signup_disabled",t:t.translate}):(0, o.h)("div",null,(0, o.h)(s.default,{page:p[t.modal.page]||{},message:t.message,saving:t.saving,onSubmit:this.handleUser,namePlaceholder:t.namePlaceholder,t:t.translate}),!t.user&&n.link&&t.gotrue&&(0, o.h)("button",{onclick:function(){return e.handlePage(n.link)},className:"btnLink forgotPasswordLink"},t.translate(n.link_text)),t.isLocal?(0, o.h)(a.default,{devMode:null!=t.siteURL,onSiteURL:t.siteURL?this.clearSiteURL:this.handleSiteURL,t:t.translate}):(0, o.h)("div",null)):void 0}},{key:"renderProviders",value:function(){var e=this.props.store;if(!e.gotrue||!e.settings)return null;if("signup"===e.modal.page&&e.settings.disable_signup)return null;if(!(p[e.modal.page]||{}).providers)return null;var t=["Google","GitHub","GitLab","BitBucket","SAML"].filter((function(t){return e.settings.external[t.toLowerCase()]}));return t.length?(0, o.h)(c.default,{providers:t,labels:e.settings.external_labels||{},onLogin:this.handleExternalLogin,t:e.translate}):null}},{key:"render",value:function(){var e=this.props.store,t=f[e.modal.page],n=e.settings&&!e.settings.disable_signup,r=p[e.modal.page]||{};return (0, o.h)("div",null,(0, o.h)(i.default,{page:r,error:e.error,showHeader:t,showSignup:n,devSettings:!e.gotrue,loading:!e.error&&e.gotrue&&!e.settings,isOpen:e.modal.isOpen,onPage:this.handlePage,onClose:this.handleClose,logo:e.modal.logo,t:e.translate,isLocal:e.isLocal,clearSiteURL:this.clearSiteURL,clearStoreError:this.clearStoreError},this.renderBody(),this.renderProviders()))}}])&&y(t.prototype,n),l}(o.Component))||r;t.default=E;},function(e,t,n){Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var r=n(0);function o(e){return (o="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function M(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function i(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}function a(e,t){return (a=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function u(e){var t=function(){if("undefined"==typeof Reflect||!Reflect.construct)return !1;if(Reflect.construct.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],(function(){}))),!0}catch(e){return !1}}();return function(){var n,r=c(e);if(t){var o=c(this).constructor;n=Reflect.construct(r,arguments,o);}else n=r.apply(this,arguments);return s(this,n)}}function s(e,t){return !t||"object"!==o(t)&&"function"!=typeof t?function(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}(e):t}function c(e){return (c=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}var N=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&a(e,t);}(c,e);var t,n,s=u(c);function c(){var e;M(this,c);for(var t=arguments.length,n=new Array(t),r=0;r<t;r++)n[r]=arguments[r];return (e=s.call.apply(s,[this].concat(n))).handleClose=function(t){t.preventDefault(),e.props.onClose();},e.blockEvent=function(e){e.stopPropagation();},e.linkHandler=function(t){return function(n){n.preventDefault(),e.props.onPage(t);}},e}return t=c,(n=[{key:"render",value:function(){var e=this.props,t=e.page,n=e.error,o=e.loading,M=e.showHeader,i=e.showSignup,a=e.devSettings,u=e.isOpen,s=e.children,c=e.logo,N=e.t,l=e.isLocal,D=e.clearSiteURL,g=e.clearStoreError,y=o||!u,j=n?function(e){return e.json&&e.json.error_description||e.message||e.toString()}(n):null;return (0, r.h)("div",{className:"modalContainer",role:"dialog","aria-hidden":"".concat(y),onClick:this.handleClose},(0, r.h)("div",{className:"modalDialog".concat(o?" visuallyHidden":""),onClick:this.blockEvent},(0, r.h)("div",{className:"modalContent"},(0, r.h)("button",{onclick:this.handleClose,className:"btn btnClose"},(0, r.h)("span",{className:"visuallyHidden"},"Close")),M&&(0, r.h)("div",{className:"header"},i&&(0, r.h)("button",{className:"btn btnHeader ".concat(t.signup?"active":""),onclick:this.linkHandler("signup")},N("sign_up")),!a&&(0, r.h)("button",{className:"btn btnHeader ".concat(t.login?"active":""),onclick:this.linkHandler("login")},N("log_in"))),t.title&&(0, r.h)("div",{className:"header"},(0, r.h)("button",{className:"btn btnHeader active"},N(t.title))),a&&(0, r.h)("div",{className:"header"},(0, r.h)("button",{className:"btn btnHeader active"},N("site_url_title"))),j&&(0, r.h)("div",{className:"flashMessage error"},(0, r.h)("span",null,N(j))),l&&j&&j.includes("Failed to load settings from")&&(0, r.h)("div",null,(0, r.h)("button",{onclick:function(e){D(e),g();},className:"btnLink forgotPasswordLink"},N("site_url_link_text"))),s)),c&&(0, r.h)("a",{href:"https://www.netlify.com",className:"callOut".concat(o?" visuallyHidden":"")},(0, r.h)("span",{className:"netlifyLogo"}),N("coded_by")))}}])&&i(t.prototype,n),c}(r.Component);t.default=N;},function(e,t,n){Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var r=n(0);function o(e){return (o="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function M(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}function i(e,t){return (i=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function a(e){var t=function(){if("undefined"==typeof Reflect||!Reflect.construct)return !1;if(Reflect.construct.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],(function(){}))),!0}catch(e){return !1}}();return function(){var n,r=s(e);if(t){var o=s(this).constructor;n=Reflect.construct(r,arguments,o);}else n=r.apply(this,arguments);return u(this,n)}}function u(e,t){return !t||"object"!==o(t)&&"function"!=typeof t?function(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}(e):t}function s(e){return (s=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}var c=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&i(e,t);}(s,e);var t,n,u=a(s);function s(e){var t;return function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,s),(t=u.call(this,e)).handleInput=function(e){var n,r,o;t.setState((n={},r=e.target.name,o=e.target.value,r in n?Object.defineProperty(n,r,{value:o,enumerable:!0,configurable:!0,writable:!0}):n[r]=o,n));},t.addSiteURL=function(e){e.preventDefault(),t.props.onSiteURL(t.state.url);},t.clearSiteURL=function(e){e.preventDefault,t.props.onSiteURL();},t.state={url:"",development:e.devMode||!1},t}return t=s,(n=[{key:"render",value:function(){var e=this,t=this.state,n=t.url,o=t.development,M=this.props.t;return (0, r.h)("div",null,o?(0, r.h)("div",{class:"subheader"},(0, r.h)("h3",null,M("site_url_title")),(0, r.h)("button",{onclick:function(t){return e.clearSiteURL(t)},className:"btnLink forgotPasswordLink"},M("site_url_link_text"))):(0, r.h)("form",{onsubmit:this.addSiteURL,className:"form"},(0, r.h)("div",{className:"flashMessage"},M("site_url_message")),(0, r.h)("div",{className:"formGroup"},(0, r.h)("label",null,(0, r.h)("span",{className:"visuallyHidden"},M("site_url_label")),(0, r.h)("input",{className:"formControl",type:"url",name:"url",value:n,placeholder:M("site_url_placeholder"),autocapitalize:"off",required:!0,oninput:this.handleInput}),(0, r.h)("div",{className:"inputFieldIcon inputFieldUrl"}))),(0, r.h)("button",{type:"submit",className:"btn"},M("site_url_submit"))))}}])&&M(t.prototype,n),s}(r.Component);t.default=c;},function(e,t,n){Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var r,o=n(0),M=(r=n(5))&&r.__esModule?r:{default:r};function i(e){return (i="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function a(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function u(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}function s(e,t){return (s=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function c(e){var t=function(){if("undefined"==typeof Reflect||!Reflect.construct)return !1;if(Reflect.construct.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],(function(){}))),!0}catch(e){return !1}}();return function(){var n,r=l(e);if(t){var o=l(this).constructor;n=Reflect.construct(r,arguments,o);}else n=r.apply(this,arguments);return N(this,n)}}function N(e,t){return !t||"object"!==i(t)&&"function"!=typeof t?function(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}(e):t}function l(e){return (l=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}var D=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&s(e,t);}(N,e);var t,n,i=c(N);function N(){var e;a(this,N);for(var t=arguments.length,n=new Array(t),r=0;r<t;r++)n[r]=arguments[r];return (e=i.call.apply(i,[this].concat(n))).handleLogout=function(t){t.preventDefault(),e.props.onLogout();},e}return t=N,(n=[{key:"render",value:function(){var e=this.props,t=e.user,n=e.saving,r=e.t;return (0, o.h)("form",{onSubmit:this.handleLogout,className:"form ".concat(n?"disabled":"")},(0, o.h)("p",{className:"infoText"},r("logged_in_as")," ",(0, o.h)("br",null),(0, o.h)("span",{className:"infoTextEmail"},t.user_metadata.full_name||t.user_metadata.name||t.email)),(0, o.h)(M.default,{saving:n,text:r("log_out"),saving_text:r("logging_out")}))}}])&&u(t.prototype,n),N}(o.Component);t.default=D;},function(e,t,n){Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var r=n(0),o=i(n(6)),M=i(n(5));function i(e){return e&&e.__esModule?e:{default:e}}function a(e){return (a="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function u(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}function s(e,t){return (s=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function c(e){var t=function(){if("undefined"==typeof Reflect||!Reflect.construct)return !1;if(Reflect.construct.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],(function(){}))),!0}catch(e){return !1}}();return function(){var n,r=l(e);if(t){var o=l(this).constructor;n=Reflect.construct(r,arguments,o);}else n=r.apply(this,arguments);return N(this,n)}}function N(e,t){return !t||"object"!==a(t)&&"function"!=typeof t?function(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}(e):t}function l(e){return (l=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}var D=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&s(e,t);}(N,e);var t,n,a=c(N);function N(e){var t;return function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,N),(t=a.call(this,e)).handleInput=function(e){var n,r,o;t.setState((n={},r=e.target.name,o=e.target.value,r in n?Object.defineProperty(n,r,{value:o,enumerable:!0,configurable:!0,writable:!0}):n[r]=o,n));},t.handleLogin=function(e){e.preventDefault(),t.props.onSubmit(t.state);},t.state={name:"",email:"",password:""},t}return t=N,(n=[{key:"render",value:function(){var e=this.props,t=e.page,n=e.message,i=e.saving,a=e.namePlaceholder,u=e.t,s=this.state,c=s.name,N=s.email,l=s.password;return (0, r.h)("form",{onsubmit:this.handleLogin,className:"form ".concat(i?"disabled":"")},n&&(0, r.h)(o.default,{type:n,t:u}),t.name&&(0, r.h)("div",{className:"formGroup"},(0, r.h)("label",null,(0, r.h)("span",{className:"visuallyHidden"},u("form_name_placeholder")),(0, r.h)("input",{className:"formControl",type:"name",name:"name",value:c,placeholder:a||u("form_name_label"),autocapitalize:"off",required:!0,oninput:this.handleInput}),(0, r.h)("div",{className:"inputFieldIcon inputFieldName"}))),t.email&&(0, r.h)("div",{className:"formGroup"},(0, r.h)("label",null,(0, r.h)("span",{className:"visuallyHidden"},u("form_name_label")),(0, r.h)("input",{className:"formControl",type:"email",name:"email",value:N,placeholder:u("form_email_placeholder"),autocapitalize:"off",required:!0,oninput:this.handleInput}),(0, r.h)("div",{className:"inputFieldIcon inputFieldEmail"}))),t.password&&(0, r.h)("div",{className:"formGroup"},(0, r.h)("label",null,(0, r.h)("span",{className:"visuallyHidden"},u("form_password_label")),(0, r.h)("input",{className:"formControl",type:"password",name:"password",value:l,placeholder:u("form_password_placeholder"),autocomplete:t.password,required:!0,oninput:this.handleInput}),(0, r.h)("div",{className:"inputFieldIcon inputFieldPassword"}))),(0, r.h)(M.default,{saving:i,text:u(t.button),saving_text:u(t.button_saving)}))}}])&&u(t.prototype,n),N}(r.Component);t.default=D;},function(e,t,n){Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var r=n(0);function o(e){return (o="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function M(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function i(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}function a(e,t,n){return t&&i(e.prototype,t),n&&i(e,n),e}function u(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&s(e,t);}function s(e,t){return (s=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function c(e){var t=function(){if("undefined"==typeof Reflect||!Reflect.construct)return !1;if(Reflect.construct.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],(function(){}))),!0}catch(e){return !1}}();return function(){var n,r=l(e);if(t){var o=l(this).constructor;n=Reflect.construct(r,arguments,o);}else n=r.apply(this,arguments);return N(this,n)}}function N(e,t){return !t||"object"!==o(t)&&"function"!=typeof t?function(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}(e):t}function l(e){return (l=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}var D=function(e){u(n,e);var t=c(n);function n(){var e;M(this,n);for(var r=arguments.length,o=new Array(r),i=0;i<r;i++)o[i]=arguments[i];return (e=t.call.apply(t,[this].concat(o))).handleLogin=function(t){t.preventDefault(),e.props.onLogin(e.props.provider.toLowerCase());},e}return a(n,[{key:"render",value:function(){var e=this.props,t=e.provider,n=e.label,o=e.t;return (0, r.h)("button",{onClick:this.handleLogin,className:"provider".concat(t," btn btnProvider")},"".concat(o("continue_with")," ").concat(n))}}]),n}(r.Component),g=function(e){u(n,e);var t=c(n);function n(){return M(this,n),t.apply(this,arguments)}return a(n,[{key:"getLabel",value:function(e){var t=e.toLowerCase();return t in this.props.labels?this.props.labels[t]:e}},{key:"render",value:function(){var e=this,t=this.props,n=t.providers,o=t.onLogin,M=t.t;return (0, r.h)("div",{className:"providersGroup"},(0, r.h)("hr",{className:"hr"}),n.map((function(t){return (0, r.h)(D,{key:t,provider:t,label:e.getLabel(t),onLogin:o,t:M})})))}}]),n}(r.Component);t.default=g;},function(e,t,n){Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var r=n(1),o=n(20),M=(0, r.observable)({user:null,recovered_user:null,message:null,settings:null,gotrue:null,error:null,siteURL:null,remember:!0,saving:!1,invite_token:null,email_change_token:null,namePlaceholder:null,modal:{page:"login",isOpen:!1,logo:!0},locale:o.defaultLocale});M.setNamePlaceholder=(0, r.action)((function(e){M.namePlaceholder=e;})),M.startAction=(0, r.action)((function(){M.saving=!0,M.error=null,M.message=null;})),M.setError=(0, r.action)((function(e){M.saving=!1,M.error=e;})),M.init=(0, r.action)((function(e,t){e&&(M.gotrue=e,M.user=e.currentUser(),M.user&&(M.modal.page="user")),t&&M.loadSettings();})),M.loadSettings=(0, r.action)((function(){M.settings||M.gotrue&&M.gotrue.settings().then((0, r.action)((function(e){return M.settings=e}))).catch((0, r.action)((function(e){M.error=new Error("Failed to load settings from ".concat(M.gotrue.api.apiURL));})));})),M.setIsLocal=(0, r.action)((function(e){M.isLocal=e;})),M.setSiteURL=(0, r.action)((function(e){M.siteURL=e;})),M.clearSiteURL=(0, r.action)((function(){M.gotrue=null,M.siteURL=null,M.settings=null;})),M.login=(0, r.action)((function(e,t){return M.startAction(),M.gotrue.login(e,t,M.remember).then((0, r.action)((function(e){M.user=e,M.modal.page="user",M.invite_token=null,M.email_change_token&&M.doEmailChange(),M.saving=!1;}))).catch(M.setError)})),M.externalLogin=(0, r.action)((function(e){M.error=null,M.message=null;var t=M.invite_token?M.gotrue.acceptInviteExternalUrl(e,M.invite_token):M.gotrue.loginExternalUrl(e);window.location.href=t;})),M.completeExternalLogin=(0, r.action)((function(e){M.startAction(),M.gotrue.createUser(e,M.remember).then((function(e){M.user=e,M.modal.page="user",M.saving=!1;})).catch(M.setError);})),M.signup=(0, r.action)((function(e,t,n){return M.startAction(),M.gotrue.signup(t,n,{full_name:e}).then((0, r.action)((function(){M.settings.autoconfirm?M.login(t,n,M.remember):M.message="confirm",M.saving=!1;}))).catch(M.setError)})),M.logout=(0, r.action)((function(){if(M.user)return M.startAction(),M.user.logout().then((0, r.action)((function(){M.user=null,M.modal.page="login",M.saving=!1;}))).catch(M.setError);M.modal.page="login",M.saving=!1;})),M.updatePassword=(0, r.action)((function(e){M.startAction(),(M.recovered_user||M.user).update({password:e}).then((function(e){M.user=e,M.recovered_user=null,M.modal.page="user",M.saving=!1;})).catch(M.setError);})),M.acceptInvite=(0, r.action)((function(e){M.startAction(),M.gotrue.acceptInvite(M.invite_token,e,M.remember).then((function(e){M.saving=!1,M.invite_token=null,M.user=e,M.modal.page="user";})).catch(M.setError);})),M.doEmailChange=(0, r.action)((function(){return M.startAction(),M.user.update({email_change_token:M.email_change_token}).then((0, r.action)((function(e){M.user=e,M.email_change_token=null,M.message="email_changed",M.saving=!1;}))).catch(M.setError)})),M.verifyToken=(0, r.action)((function(e,t){var n=M.gotrue;switch(M.modal.isOpen=!0,e){case"confirmation":M.startAction(),M.modal.page="signup",n.confirm(t,M.remember).then((0, r.action)((function(e){M.user=e,M.saving=!1;}))).catch((0, r.action)((function(e){console.error(e),M.message="verfication_error",M.modal.page="signup",M.saving=!1;})));break;case"email_change":M.email_change_token=t,M.modal.page="message",M.user?M.doEmailChange():M.modal.page="login";break;case"invite":M.modal.page=e,M.invite_token=t;break;case"recovery":M.startAction(),M.modal.page=e,M.gotrue.recover(t,M.remember).then((function(e){M.saving=!1,M.recovered_user=e;})).catch((function(e){M.saving=!1,M.error=e,M.modal.page="login";}));break;default:M.error="Unkown token type";}})),M.requestPasswordRecovery=(0, r.action)((function(e){M.startAction(),M.gotrue.requestPasswordRecovery(e).then((0, r.action)((function(){M.message="password_mail",M.saving=!1;}))).catch(M.setError);})),M.openModal=(0, r.action)((function(e){M.modal.page=e,M.modal.isOpen=!0;})),M.closeModal=(0, r.action)((function(){M.modal.isOpen=!1,M.error=null,M.message=null,M.saving=!1;})),M.translate=(0, r.action)((function(e){return (0, o.getTranslation)(e,M.locale)}));var i=M;t.default=i;},function(e,t,n){function r(e){return (r="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(t,"__esModule",{value:!0}),t.getTranslation=t.defaultLocale=void 0;var o=s(n(21)),M=s(n(22)),i=s(n(23)),a=s(n(24));function u(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return u=function(){return e},e}function s(e){if(e&&e.__esModule)return e;if(null===e||"object"!==r(e)&&"function"!=typeof e)return {default:e};var t=u();if(t&&t.has(e))return t.get(e);var n={},o=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var M in e)if(Object.prototype.hasOwnProperty.call(e,M)){var i=o?Object.getOwnPropertyDescriptor(e,M):null;i&&(i.get||i.set)?Object.defineProperty(n,M,i):n[M]=e[M];}return n.default=e,t&&t.set(e,n),n}t.defaultLocale="en";var c={en:o,fr:M,es:i,hu:a};t.getTranslation=function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"en",n=c[t]&&c[t][e];return n||c.en[e]||e};},function(e){e.exports=JSON.parse('{"log_in":"Log in","log_out":"Log out","logged_in_as":"Logged in as","logged_in":"Logged in","logging_in":"Logging in","logging_out":"Logging out","sign_up":"Sign up","signing_up":"Signing up","forgot_password":"Forgot password?","recover_password":"Recover password","send_recovery_email":"Send recovery email","sending_recovery_email":"Sending recovery email","never_mind":"Never mind","update_password":"Update password","updating_password":"Updating password","complete_your_signup":"Complete your signup","site_url_title":"Development Settings","site_url_link_text":"Clear localhost URL","site_url_message":"Looks like you\'re running a local server. Please let us know the URL of your Netlify site.","site_url_label":"Enter your Netlify Site URL","site_url_placeholder":"URL of your Netlify site","site_url_submit":"Set site\'s URL","message_confirm":"A confirmation message was sent to your email, click the link there to continue.","message_password_mail":"We\'ve sent a recovery email to your account, follow the link there to reset your password.","message_email_changed":"Your email address has been updated!","message_verfication_error":"There was an error verifying your account. Please try again or contact an administrator.","message_signup_disabled":"Public signups are disabled. Contact an administrator and ask for an invite.","form_name_placeholder":"Name","form_email_label":"Enter your email","form_name_label":"Enter your name","form_email_placeholder":"Email","form_password_label":"Enter your password","form_password_placeholder":"Password","coded_by":"Coded by Netlify","No user found with this email":"No user found with this email","Invalid Password":"Invalid Password","continue_with":"Continue with"}');},function(e){e.exports=JSON.parse('{"log_in":"Connexion","log_out":"Déconnexion","logged_in_as":"Connecté en tant que","logged_in":"Connecté","logging_in":"Connection","logging_out":"Déconnexion","sign_up":"Inscription","signing_up":"Inscription","forgot_password":"Mot de passe oublié ?","recover_password":"Récupérer le mot de passe","send_recovery_email":"Envoyer l\'e-mail de récupération","sending_recovery_email":"Envoi de l\'e-mail de récupération","never_mind":"Laisser tomber","update_password":"Mise à jour du mot de passe","updating_password":"Mise à jour du mot de passe","complete_your_signup":"Compléter l\'inscription","site_url_title":"Paramètres de développement","site_url_link_text":"Effacer l\'URL localhost","site_url_message":"On dirait que vous faites tourner un serveur local. Veuillez nous indiquer l\'URL de votre site Netlify.","site_url_label":"Entrez l\'URL de votre site Netlify","site_url_placeholder":"URL de votre site Netlify","site_url_submit":"Définir l\'URL du site","message_confirm":"Un message de confirmation a été envoyé à votre adresse électronique, cliquez sur le lien pour continuer.","message_password_mail":"Nous avons envoyé un e-mail de récupération à votre compte, suivez le lien qui s\'y trouve pour réinitialiser votre mot de passe.","message_email_changed":"Votre adresse e-mail a été mise à jour !","message_verfication_error":"Il y a eu une erreur lors de la vérification de votre compte. Veuillez réessayer ou contacter un administrateur.","message_signup_disabled":"Les inscriptions publiques sont désactivées. Contactez un administrateur et demandez une invitation.","form_name_placeholder":"Nom","form_email_label":"Entrez votre adresse e-mail","form_name_label":"Saisissez votre nom","form_email_placeholder":"E-mail","form_password_label":"Saisissez votre mot de passe","form_password_placeholder":"Mot de passe","coded_by":"Codé par Netlify","No user found with this email":"Aucun utilisateur trouvé avec cet e-mail","Invalid Password":"Mot de passe incorrect"}');},function(e){e.exports=JSON.parse('{"log_in":"Iniciar sesión","log_out":"Cerrar sesión","logged_in_as":"Conectado como","logged_in":"Conectado","logging_in":"Iniciando sesión","logging_out":"Cerrando sesión","sign_up":"Registrate","signing_up":"Registrandose","forgot_password":"¿Olvidaste tu contraseña?","recover_password":"Recuperar contraseña","send_recovery_email":"Enviar correo electrónico de recuperación","sending_recovery_email":"Enviando correo electrónico de recuperación","never_mind":"Regresar","update_password":"Actualizar contraseña","updating_password":"Actualizando contraseña","complete_your_signup":"Completa tu registro","site_url_title":"Configuración de desarrollo","site_url_link_text":"Borrar URL del localhost","site_url_message":"Parece que estas corriendo un servidor local. Por favor haznos saber la URL de tu sitio en Netlify.","site_url_label":"Ingresa la URL de tu sitio en Netlify","site_url_placeholder":"URL de tu sitio en Netlify","site_url_submit":"Establecer la URL del sitio","message_confirm":"Se envió un mensaje de confirmación a tu correo electrónico, haz clic en el enlace allí para continuar.","message_password_mail":"Hemos enviado un correo electrónico de recuperación a tu correo electrónico, sigue el enlace allí para restablecer tu contraseña.","message_email_changed":"¡Tu dirección de correo electrónico ha sido actualizada!","message_verfication_error":"Se produjo un error al verificar tu cuenta. Por favor intenta nuevamente o contacta a un administrador.","message_signup_disabled":"Los registros públicos están deshabilitados. Contacta a un administrador y solicita una invitación.","form_name_placeholder":"Nombre","form_email_label":"Ingresa tu correo electrónico","form_name_label":"Ingresa tu nombre","form_email_placeholder":"Correo electrónico","form_password_label":"Ingresa tu contraseña","form_password_placeholder":"Contraseña","coded_by":"Codificado por Netlify","No user found with this email":"No existe ningún usuario con este correo electrónico","Invalid Password":"La contraseña es invalida","continue_with":"Continúa con"}');},function(e){e.exports=JSON.parse('{"log_in":"Bejelentkezés","log_out":"Kijelentkezés","logged_in_as":"Bejelentkezve mint","logged_in":"Bejelentkezve","logging_in":"Bejelentkezés","logging_out":"Kijelentkezés","sign_up":"Regisztráció","signing_up":"Regisztrálás","forgot_password":"Elfelejtette a jelszavát?","recover_password":"Jelszó visszaállítása","send_recovery_email":"Jelszópótló levél küldése","sending_recovery_email":"Jelszópótló levél küldése","never_mind":"Mégsem","update_password":"Új jelszó beállítása","updating_password":"Új jelszó beállítása","complete_your_signup":"Regisztráció befejezése","site_url_title":"Fejlesztői Beállítások","site_url_link_text":"Localhost URL törlése","site_url_message":"Úgy néz ki egy helyi szervert futtat. Kérjük adja meg a Netlify oldala URL-jét.","site_url_label":"Adja meg a Netlify oldala URL-jét","site_url_placeholder":"a Netlify oldala URL-je","site_url_submit":"URL beállítása","message_confirm":"Elküldtünk egy megerősítő levelet e-mailben, kérjük kattintson a linkre a levélben a folytatáshoz.","message_password_mail":"Elküldtünk egy jelszópótló levelet e-mailben, kérjük kövesse a linket a levélben a jelszava visszaállításához.","message_email_changed":"Az e-mail címét frissítettük!","message_verfication_error":"Probléma történt a fiókja megerősítése közben. Kérjük próbálja újra, vagy vegye fel a kapcsolatot egy adminisztrátorral.","message_signup_disabled":"A nyilvános regisztráció nincs engedélyezve. Vegye fel a kapcsolatot egy adminisztrátorral és kérjen meghívót.","form_name_placeholder":"Név","form_email_label":"Adja meg az e-mail címét","form_name_label":"Adja meg a nevét","form_email_placeholder":"E-mail","form_password_label":"Adja meg a jelszavát","form_password_placeholder":"Jelszó","coded_by":"Fejlesztette a Netlify","No user found with this email":"Nem található fiók ezzel az e-mail címmel","Invalid Password":"Helytelen Jelszó","continue_with":"Bejelentkezés ezzel:"}');},function(e,t,n){Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var r,o=n(0);function M(e){return (M="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function i(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function a(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}function u(e,t){return (u=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function s(e){var t=function(){if("undefined"==typeof Reflect||!Reflect.construct)return !1;if(Reflect.construct.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],(function(){}))),!0}catch(e){return !1}}();return function(){var n,r=N(e);if(t){var o=N(this).constructor;n=Reflect.construct(r,arguments,o);}else n=r.apply(this,arguments);return c(this,n)}}function c(e,t){return !t||"object"!==M(t)&&"function"!=typeof t?function(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}(e):t}function N(e){return (N=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}var l=(0, n(2).connect)(["store"])(r=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&u(e,t);}(c,e);var t,n,M=s(c);function c(){var e;i(this,c);for(var t=arguments.length,n=new Array(t),r=0;r<t;r++)n[r]=arguments[r];return (e=M.call.apply(M,[this].concat(n))).handleSignup=function(t){t.preventDefault(),e.props.store.openModal("signup");},e.handleLogin=function(t){t.preventDefault(),e.props.store.openModal("login");},e.handleLogout=function(t){t.preventDefault(),e.props.store.openModal("user");},e.handleButton=function(t){t.preventDefault(),e.props.store.openModal(e.props.store.user?"user":"login");},e}return t=c,(n=[{key:"render",value:function(){var e=this.props.store,t=e.user,n=e.translate;return "button"===this.props.mode?(0, o.h)("a",{className:"netlify-identity-button",href:"#",onClick:this.handleButton},this.props.text||n(t?"log_out":"log_in")):t?(0, o.h)("ul",{className:"netlify-identity-menu"},(0, o.h)("li",{className:"netlify-identity-item netlify-identity-user-details"},n("logged_in_as")," ",(0, o.h)("span",{className:"netlify-identity-user"},t.user_metadata.name||t.email)),(0, o.h)("li",{className:"netlify-identity-item"},(0, o.h)("a",{className:"netlify-identity-logout",href:"#",onClick:this.handleLogout},n("log_out")))):(0, o.h)("ul",{className:"netlify-identity-menu"},(0, o.h)("li",{className:"netlify-identity-item"},(0, o.h)("a",{className:"netlify-identity-signup",href:"#",onClick:this.handleSignup},n("sign_up"))),(0, o.h)("li",{className:"netlify-identity-item"},(0, o.h)("a",{className:"netlify-identity-login",href:"#",onClick:this.handleLogin},n("log_in"))))}}])&&a(t.prototype,n),c}(o.Component))||r;t.default=l;},function(e,t,n){n.r(t);var r=n(7),o=n.n(r)()(!0);o.push([e.i,'::-webkit-input-placeholder {\n  /* Chrome/Opera/Safari */\n  color: #a3a9ac;\n  font-weight: 500;\n}\n\n::-moz-placeholder {\n  /* Firefox 19+ */\n  color: #a3a9ac;\n  font-weight: 500;\n}\n\n:-ms-input-placeholder {\n  /* IE 10+ */\n  color: #a3a9ac;\n  font-weight: 500;\n}\n\n:-moz-placeholder {\n  /* Firefox 18- */\n  color: #a3a9ac;\n  font-weight: 500;\n}\n\n.modalContainer {\n  position: absolute;\n  top: 0;\n  left: 0;\n  width: 100%;\n  min-height: 100%;\n  overflow-x: hidden;\n  overflow-y: auto;\n  -webkit-box-sizing: border-box;\n          box-sizing: border-box;\n  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,\n    Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";\n  font-size: 14px;\n  line-height: 1.5;\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  -webkit-box-orient: vertical;\n  -webkit-box-direction: normal;\n      -ms-flex-direction: column;\n          flex-direction: column;\n  -webkit-box-align: center;\n      -ms-flex-align: center;\n          align-items: center;\n  z-index: 99999;\n}\n\n.modalContainer::before {\n  content: "";\n  display: block;\n  position: fixed;\n  top: 0;\n  bottom: 0;\n  left: 0;\n  right: 0;\n  background-color: #fff;\n  z-index: -1;\n}\n\n.modalDialog {\n  -webkit-box-flex: 1;\n      -ms-flex-positive: 1;\n          flex-grow: 1;\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  -webkit-box-orient: vertical;\n  -webkit-box-direction: normal;\n      -ms-flex-direction: column;\n          flex-direction: column;\n  width: 100%;\n}\n\n.modalContent {\n  position: relative;\n  padding: 32px;\n  opacity: 0;\n  -webkit-transform: translateY(10px) scale(1);\n          transform: translateY(10px) scale(1);\n  background: #fff;\n}\n\n[aria-hidden="false"] .modalContent {\n    -webkit-animation: bouncyEntrance 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28);\n            animation: bouncyEntrance 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28);\n    -webkit-animation-fill-mode: forwards;\n            animation-fill-mode: forwards;\n  }\n\n@-webkit-keyframes bouncyEntrance {\n  0% {\n    opacity: 0;\n    -webkit-transform: translateY(10px) scale(0.9);\n            transform: translateY(10px) scale(0.9);\n  }\n\n  100% {\n    opacity: 1;\n    -webkit-transform: translateY(0) scale(1);\n            transform: translateY(0) scale(1);\n  }\n}\n\n@keyframes bouncyEntrance {\n  0% {\n    opacity: 0;\n    -webkit-transform: translateY(10px) scale(0.9);\n            transform: translateY(10px) scale(0.9);\n  }\n\n  100% {\n    opacity: 1;\n    -webkit-transform: translateY(0) scale(1);\n            transform: translateY(0) scale(1);\n  }\n}\n\n@media (min-width: 480px) {\n  .modalContainer::before {\n    background-color: rgb(14, 30, 37);\n    -webkit-animation: fadeIn 0.1s ease-in;\n            animation: fadeIn 0.1s ease-in;\n    -webkit-animation-fill-mode: forwards;\n            animation-fill-mode: forwards;\n  }\n\n  .modalDialog {\n    max-width: 364px;\n    -webkit-box-pack: center;\n        -ms-flex-pack: center;\n            justify-content: center;\n  }\n\n  .modalContent {\n    background: #fff;\n    -webkit-box-shadow: 0 4px 12px 0 rgba(0, 0, 0, .07),\n      0 12px 32px 0 rgba(14, 30, 37, .1);\n            box-shadow: 0 4px 12px 0 rgba(0, 0, 0, .07),\n      0 12px 32px 0 rgba(14, 30, 37, .1);\n    border-radius: 8px;\n    margin-top: 32px;\n  }\n}\n\n@-webkit-keyframes fadeIn {\n  0% {\n    opacity: 0;\n  }\n\n  100% {\n    opacity: 0.67;\n  }\n}\n\n@keyframes fadeIn {\n  0% {\n    opacity: 0;\n  }\n\n  100% {\n    opacity: 0.67;\n  }\n}\n\n.flashMessage {\n  text-align: center;\n  color: rgb(14, 30, 37);\n  font-weight: 500;\n  font-size: 14px;\n  background-color: #f2f3f3;\n  padding: 6px;\n  border-radius: 4px;\n  opacity: 0.7;\n  -webkit-transition: opacity 0.2s linear;\n  transition: opacity 0.2s linear;\n}\n\n.flashMessage:hover,\n.flashMessage:focus {\n  opacity: 1;\n}\n\n.error {\n  color: #fa3946;\n  background-color: #fceef0;\n  opacity: 1;\n}\n\n.error span::before {\n  content: "";\n  display: inline-block;\n  position: relative;\n  top: 3px;\n  margin-right: 4px;\n  width: 16px;\n  height: 16px;\n  background: no-repeat center center;\n  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE2IDE2Ij4KICA8cGF0aCBmaWxsPSIjRkEzOTQ2IiBkPSJNOCwxLjMzMzMzMzMzIEMxMS42NzYsMS4zMzMzMzMzMyAxNC42NjY2NjY3LDQuMzI0IDE0LjY2NjY2NjcsOCBDMTQuNjY2NjY2NywxMS42NzYgMTEuNjc2LDE0LjY2NjY2NjcgOCwxNC42NjY2NjY3IEM0LjMyNCwxNC42NjY2NjY3IDEuMzMzMzMzMzMsMTEuNjc2IDEuMzMzMzMzMzMsOCBDMS4zMzMzMzMzMyw0LjMyNCA0LjMyNCwxLjMzMzMzMzMzIDgsMS4zMzMzMzMzMyBaIE04LDAgQzMuNTgyLDAgMCwzLjU4MiAwLDggQzAsMTIuNDE4IDMuNTgyLDE2IDgsMTYgQzEyLjQxOCwxNiAxNiwxMi40MTggMTYsOCBDMTYsMy41ODIgMTIuNDE4LDAgOCwwIFogTTcuMTI2NjY2NjcsNS4wMTczMzMzMyBDNy4wNjA2NjY2Nyw0LjQ3OTMzMzMzIDcuNDc4NjY2NjcsNCA4LjAyNTMzMzMzLDQgQzguNTM5MzMzMzMsNCA4Ljk0MzMzMzMzLDQuNDUwNjY2NjcgOC44Nzg2NjY2Nyw0Ljk2NzMzMzMzIEw4LjM3NCw5LjAwMjY2NjY3IEM4LjM1MDY2NjY3LDkuMTkxMzMzMzMgOC4xOSw5LjMzMzMzMzMzIDgsOS4zMzMzMzMzMyBDNy44MSw5LjMzMzMzMzMzIDcuNjQ5MzMzMzMsOS4xOTEzMzMzMyA3LjYyNTMzMzMzLDkuMDAyNjY2NjcgTDcuMTI2NjY2NjcsNS4wMTczMzMzMyBMNy4xMjY2NjY2Nyw1LjAxNzMzMzMzIFogTTgsMTIuMTY2NjY2NyBDNy41NCwxMi4xNjY2NjY3IDcuMTY2NjY2NjcsMTEuNzkzMzMzMyA3LjE2NjY2NjY3LDExLjMzMzMzMzMgQzcuMTY2NjY2NjcsMTAuODczMzMzMyA3LjU0LDEwLjUgOCwxMC41IEM4LjQ2LDEwLjUgOC44MzMzMzMzMywxMC44NzMzMzMzIDguODMzMzMzMzMsMTEuMzMzMzMzMyBDOC44MzMzMzMzMywxMS43OTMzMzMzIDguNDYsMTIuMTY2NjY2NyA4LDEyLjE2NjY2NjcgWiIvPgo8L3N2Zz4K);\n}\n\n.success {\n}\n\n.disabled {\n  opacity: 0.38;\n  pointer-events: none;\n}\n\n.infoText {\n  text-align: center;\n  margin: 32px 0;\n}\n\n.infoTextEmail {\n  font-size: 16px;\n  font-weight: 500;\n}\n\n.saving {\n  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABQCAMAAACeYYN3AAAAxlBMVEUAAAD////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////DTx3aAAAAQnRSTlMAAQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8wMTIzNDU2Nzg5Ojs8PT4/QEGgjKRfAAACk0lEQVR4AYXQDXP5WhAG8CUhiSQqSv4RRRMVL1Fa1VZf3PL9v9Tde9wc9M8+P8/M7s6czJiHgNIvVCJO6YiAMlAiWckASiQrm4bJMZTDrmbBIEC9qpgVjp6n4B+oyEwCzKrMQBVaQIlkpmXZln1dhQB+49gOh5dLexlV6MhsAqyazEQVugCqsOK5nsQmwPWZ53ucvyczSGb4l9T9OsdnLgFOXVZFFd4AqEKrIasR4AdBI2hw1GR6VzMwSWY2A60ZNDl6KnUC3KbMRhXeAqhCpyXzCAjarNVucdqXVEhWaRfCdsj5vQcE1EOZQ7Jy+EcUlklWi2Q3BLQ6nagTcTra2Y0qrHZirRN3OOezTUAjvq4bd7suqpDfSGJUoXcnCwiIerIqqlC96vf6HD1ZsUcE3PYH/QGnrx3uYnqoQn4l6aMK/XtZi4BuIrNIZqVJkiapkhx37Y6AcDgcpsNU44Nz3OuoQn4jSVGFNw+ykID+SGaTzM5G2YiTFVM73AMConE2zjhj7XAXs4EqHE/4d12GKgwmsoiAZCpzSObMptPZdHZVSkCc5/ksnym8cPRUmiQzpvNcmedzTl4o7qlBsuZc1iVg9ChDFdYWshEBveV/FssFZ/l7Z7eowsfl0/JJ4UXj43A/ogpbT7IeAZNnWQ1VuJJNCBi8HKxeVhw9tRaq8JkfrV/WHDULxb1CFbbX7HX9yllfck9A/ipzSea+yeYEJO+yEFX4tim8b94VXjj/zzdU4Z/NmY/NB+fkTglYfMg8knmfsiUBD1+yCFX4+X309f3FOds/UYVR8fH2e6vwovExIuB5K/NJ5v8jWxGQ/chiVOF2d+pn98M5zt3WJFm83+/2O4UXjprabkzAWn+o56k9qvBfX4hMaM+SxOMAAAAASUVORK5CYII=);\n  background-repeat: repeat-x;\n  background-size: contain;\n  background-origin: border-box;\n  background-position: 0% 0%;\n  -webkit-animation: loading 20s linear infinite;\n          animation: loading 20s linear infinite;\n  pointer-events: none;\n}\n\n.saving::after {\n  content: "…";\n}\n\n@-webkit-keyframes loading {\n  0% {\n    background-position: 0% 0%;\n  }\n\n  100% {\n    background-position: 700% 0%;\n  }\n}\n\n@keyframes loading {\n  0% {\n    background-position: 0% 0%;\n  }\n\n  100% {\n    background-position: 700% 0%;\n  }\n}\n\n.btn {\n  display: block;\n  position: relative;\n  width: 100%;\n  height: auto;\n  margin: 14px 0 0;\n  padding: 6px;\n  outline: 0;\n  cursor: pointer;\n  border: 2px solid rgb(14, 30, 37);\n  border-radius: 4px;\n  background-color: #2d3b41;\n  color: #fff;\n  -webkit-transition: background-color 0.2s ease;\n  transition: background-color 0.2s ease;\n  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,\n    Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";\n  font-size: 14px;\n  font-weight: 500;\n  line-height: 24px;\n  text-align: center;\n  text-decoration: none;\n  white-space: nowrap;\n}\n\n.btn:hover,\n.btn:focus {\n  background-color: rgb(14, 30, 37);\n  text-decoration: none;\n}\n\n.btnClose {\n  position: absolute;\n  top: 0;\n  right: 0;\n  margin: 0;\n  padding: 0;\n  border: 0;\n  width: 24px;\n  height: 24px;\n  border-radius: 50%;\n  margin: 6px;\n  background: #fff;\n  color: #a3a9ac;\n}\n\n.btnClose::before {\n  content: "×";\n  font-size: 25px;\n  line-height: 9px;\n}\n\n.btnClose:hover,\n.btnClose:focus {\n  background: #e9ebeb;\n  color: rgb(14, 30, 37);\n}\n\n.header {\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  margin-top: -8px;\n  margin-bottom: 32px;\n}\n\n.btnHeader {\n  font-size: 16px;\n  line-height: 24px;\n  background: #fff;\n  color: #a3a9ac;\n  border: 0;\n  border-bottom: 2px solid #e9ebeb;\n  border-radius: 4px 4px 0 0;\n  margin: 0;\n}\n\n.btnHeader:focus,\n.btnHeader.active {\n  background: #fff;\n  color: rgb(14, 30, 37);\n  border-color: rgb(14, 30, 37);\n  font-weight: 700;\n}\n\n.btnHeader:not(:only-child):hover {\n  background-color: #e9ebeb;\n  color: rgb(14, 30, 37);\n}\n\n.btnHeader:only-child {\n  cursor: auto;\n}\n\n.btnLink {\n  display: block;\n  position: relative;\n  width: auto;\n  height: auto;\n  margin: 14px auto 0;\n  padding: 6px;\n  padding-bottom: 0;\n  outline: 0;\n  cursor: pointer;\n  color: rgb(14, 30, 37);\n  border: none;\n  border-bottom: 2px solid #e9ebeb;\n  border-radius: 0;\n  background-color: inherit;\n  -webkit-transition: border-color 0.2s ease;\n  transition: border-color 0.2s ease;\n  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,\n    Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";\n  font-size: 14px;\n  font-weight: 500;\n  line-height: 24px;\n  text-align: center;\n  white-space: nowrap;\n}\n\n.btnLink:hover,\n.btnLink:focus {\n  background-color: inherit;\n  border-color: #a3a9ac;\n}\n\n.form {\n}\n\n.formGroup {\n  position: relative;\n  margin-top: 14px;\n}\n\n.formControl {\n  -webkit-box-sizing: border-box;\n          box-sizing: border-box;\n  display: block;\n  width: 100%;\n  height: 40px;\n  margin: 0;\n  padding: 6px 12px 6px 34px;\n  border: 2px solid #e9ebeb;\n  border-radius: 4px;\n  background: #fff;\n  color: rgb(14, 30, 37);\n  -webkit-box-shadow: none;\n          box-shadow: none;\n  font-size: 16px;\n  font-weight: 500;\n  line-height: 24px;\n  -webkit-transition: -webkit-box-shadow ease-in-out 0.15s;\n  transition: -webkit-box-shadow ease-in-out 0.15s;\n  transition: box-shadow ease-in-out 0.15s;\n  transition: box-shadow ease-in-out 0.15s, -webkit-box-shadow ease-in-out 0.15s;\n  -webkit-appearance: none;\n  -moz-appearance: none;\n}\n\n.inputFieldIcon {\n  position: absolute;\n  top: 12px;\n  left: 12px;\n  display: inline-block;\n  width: 16px;\n  height: 16px;\n  background-repeat: no-repeat;\n  background-position: center;\n  pointer-events: none;\n}\n\n.inputFieldName {\n  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNCIgaGVpZ2h0PSIxNCIgdmlld0JveD0iMCAwIDE0IDE0Ij4gIDxwYXRoIGZpbGw9IiNBM0E5QUMiIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTgsNyBDNi4zNDMxNDU3NSw3IDUsNS42NTY4NTQyNSA1LDQgQzUsMi4zNDMxNDU3NSA2LjM0MzE0NTc1LDEgOCwxIEM5LjY1Njg1NDI1LDEgMTEsMi4zNDMxNDU3NSAxMSw0IEMxMSw1LjY1Njg1NDI1IDkuNjU2ODU0MjUsNyA4LDcgWiBNOCwxNSBMMS41LDE1IEMxLjUsMTEuMTM0MDA2OCA0LjQxMDE0OTEzLDggOCw4IEMxMS41ODk4NTA5LDggMTQuNSwxMS4xMzQwMDY4IDE0LjUsMTUgTDgsMTUgWiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTEgLTEpIi8+PC9zdmc+);\n}\n\n.inputFieldEmail {\n  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxMSIgdmlld0JveD0iMCAwIDE2IDExIj4gIDxwYXRoIGZpbGw9IiNBM0E5QUMiIGQ9Ik0xLjE3MDczMTcxLDMgQzAuNTIyMTQ2MzQxLDMgMy45MDI0NTk4N2UtMDgsMy41NDUxMTA4MSAzLjkwMjQ1OTg3ZS0wOCw0LjIyMjIyMTU0IEwzLjkwMjQ1OTg3ZS0wOCwxMi43Nzc3Nzg1IEMzLjkwMjQ1OTg3ZS0wOCwxMy40NTQ4ODkyIDAuNTIyMTQ2MzQxLDE0IDEuMTcwNzMxNzEsMTQgTDE0LjgyOTI2ODMsMTQgQzE1LjQ3Nzg1MzcsMTQgMTYsMTMuNDU0ODg5MiAxNiwxMi43Nzc3Nzg1IEwxNiw0LjIyMjIyMTU0IEMxNiwzLjU0NTExMDgxIDE1LjQ3Nzg1MzcsMyAxNC44MjkyNjgzLDMgTDEuMTcwNzMxNzEsMyBaIE0yLjMzNzQyMTE5LDUuMDAxODY1NjYgQzIuNDU3NTExNzUsNC45ODk1NTIxNCAyLjU2MDcxNDU3LDUuMDM5MzM5OCAyLjYzNjM1OTg1LDUuMTE3Mjg0MzcgTDcuNDgyNjA2MTcsMTAuMTEzMjU0NSBDNy43ODQ0ODgyMiwxMC40MjQ3NDU1IDguMjAzMjc4MjksMTAuNDI0NzY2IDguNTA1ODk2MTksMTAuMTEzMjU0NSBMMTMuMzYzNjQwMiw1LjExNzI4NDM3IEMxMy41MDUxMjU1LDQuOTcxMjA0OTkgMTMuNzUyOTc3OSw0Ljk4MTg5NzIzIDEzLjg4MzkyMjIsNS4xMzk3MzYwMiBDMTQuMDE0ODY2NSw1LjI5NzU3NDgxIDE0LjAwNTI4MjEsNS41NzQwNzQ4OCAxMy44NjM3OTY3LDUuNzIwMTU0MjYgTDExLjExNTg2MDYsOC41NDg0MTE1MiBMMTMuODU4MDU3MSwxMS4yNjc2NDY5IEMxNC4wMjE3ODM1LDExLjQwMzE5ODIgMTQuMDQ4OTM2MywxMS43MDE0OTMyIDEzLjkxMjk4ODIsMTEuODcwOTg4OCBDMTMuNzc3MDQwMSwxMi4wNDA1MDQ5IDEzLjUwODI4OTcsMTIuMDQzNDE5MSAxMy4zNjkzOTgyLDExLjg3Njk0MDQgTDEwLjU3NTQ3MTUsOS4xMDYzOTg2MiBMOS4wMDYwNTI3NSwxMC43MTYxMjQ0IEM4LjQzNDk0MTk1LDExLjMwNDAzMzQgNy41NTMzMDI4NiwxMS4zMDUxNjIxIDYuOTgyNDY4LDEwLjcxNjEyNDQgTDUuNDI0NTI4NSw5LjEwNjM5ODYyIEwyLjYzMDYwMTgzLDExLjg3Njk0MDQgQzIuNDkxNzEwMzMsMTIuMDQzNDM5NyAyLjIyMjk1OTg4LDEyLjA0MDUyNTUgMi4wODcwMTE3OCwxMS44NzA5ODg4IEMxLjk1MTA2MzY3LDExLjcwMTQ5MzIgMS45NzgyMTY1LDExLjQwMzE5ODIgMi4xNDE5NDI5LDExLjI2NzY0NjkgTDQuODg0MTM5MzksOC41NDg0MTE1MiBMMi4xMzYyMDMyOCw1LjcyMDE1NDI2IEMyLjAyODcxNDE0LDUuNjE2MjI4MTYgMS45ODM1NTE0MSw1LjQzODk1NDUzIDIuMDI1OTkxNSw1LjI4NzQ5ODI1IEMyLjA2ODQxMzE5LDUuMTM2MDYyNDkgMi4xOTYwMjc4MSw1LjAxOTAyMjQ5IDIuMzM3NDIxMTksNS4wMDE4NjU2NiBaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwIC0zKSIvPjwvc3ZnPg==);\n}\n\n.inputFieldPassword {\n  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMiIgaGVpZ2h0PSIxNCIgdmlld0JveD0iMCAwIDEyIDE0Ij4gIDxwYXRoIGZpbGw9IiNBM0E5QUMiIGQ9Ik0yLjQ0NTkxMDQ1LDMuNjQzMDg0MjcgQzIuNDQ1OTEwMzgsMi42NzY2MjEzNyAyLjgxODk3NTQ2LDEuNzQ5NzYzOTMgMy40ODI5OTUxOCwxLjA2NjUxMDUyIEM0LjE0NzAxNDksMC4zODMyNTcxMTEgNS4wNDc1NjY0MywtMC4wMDAzOTMwNDg2MTggNS45ODY0NDEwNSwzLjAyMTc0MDY5ZS0wNyBMNi4xMTc1MTg0NywzLjAyMTc0MDY5ZS0wNyBDOC4wNjkyOTIwNSwwLjAwMjQ1Mjc4Mzg0IDkuNjUwNzAwMTMsMS42MzA5OTI4MyA5LjY1MjI4NzQyLDMuNjQwMTE4NzkgTDkuNjUyMjg3NDIsNC42NzgwMzQ0NSBDOS4xMzk1MDEwNSw0LjcwMzI0MDk4IDguNjM2Nzk3NTYsNC43NDYyNDAzNCA4LjEzMTIxMzI1LDQuODAxMTAxNiBMOC4xMzEyMTMyNSwzLjY0MzA4NDI3IEM4LjEzMTIxMzI1LDIuNDk2NjM0MjkgNy4yMjgzNjE2LDEuNTY3MjUyOTUgNi4xMTQ2Mzc2NCwxLjU2NzI1Mjk1IEw1Ljk4MzU2MDIzLDEuNTY3MjUyOTUgQzQuODY5ODM2MjgsMS41NjcyNTI5NSAzLjk2Njk4NDYyLDIuNDk2NjM0MjkgMy45NjY5ODQ2MiwzLjY0MzA4NDI3IEwzLjk2Njk4NDYyLDMuOTYwMzg5OTEgQzMuOTY3NTc5ODgsNC4zNTY0OTE4MiAzLjY3NzAzNTY1LDQuNjg4ODc1OTUgMy4yOTQzMTI2Miw0LjcyOTkzMDI0IEwzLjI3ODQ2ODEsNC43Mjk5MzAyNCBDMy4wNjYyNDA5Miw0Ljc1MzUwMjk2IDIuODU0MjgyODcsNC42ODMxMDg3IDIuNjk1NDU2MTMsNC41MzYzMDM3NiBDMi41MzY2Mjk0LDQuMzg5NDk4ODIgMi40NDU5MDUzMyw0LjE4MDEyMTMzIDIuNDQ1OTEwNDUsMy45NjAzODk5MSBMMi40NDU5MTA0NSwzLjY0MzA4NDI3IFogTTExLjQxNjY2Niw3LjExNTY1MzUyIEwxMS40MTY2NjYsMTIuNjkwNzQzMyBDMTEuNDE3MDQwOCwxMy4wODMxMTQzIDExLjE0NTkyMDMsMTMuNDIwMTM3MSAxMC43NzEzNjE4LDEzLjQ5MjkwMzkgTDEwLjI5MDI2NDQsMTMuNTg2MzE2MyBDOC44NzYwNzU2NCwxMy44NjE1OTU5IDcuNDM5OTcxMzMsMTQuMDAwMDkzNyA2LjAwMDcyMDA1LDEzLjk5OTk5OTggQzQuNTYwOTg3NTgsMTQuMDAwMTg2MiAzLjEyNDM5Njg0LDEzLjg2MTY4OCAxLjcwOTczNTI0LDEzLjU4NjMxNjMgTDEuMjI4NjM3OTIsMTMuNDkyOTAzOSBDMC44NTQwNzk0MDcsMTMuNDIwMTM3MSAwLjU4Mjk1ODg2NywxMy4wODMxMTQzIDAuNTgzMzMzNzIyLDEyLjY5MDc0MzMgTDAuNTgzMzMzNzIyLDcuMTE1NjUzNTIgQzAuNTgyOTU4ODY3LDYuNzIzMjgyNTYgMC44NTQwNzk0MDcsNi4zODYyNTk4MSAxLjIyODYzNzkyLDYuMzEzNDkyOTkgTDEuMjk5MjE4MDYsNi4zMDAxNDgzNiBDNC40MDU5OTg0Nyw1LjY5NTEyMTY3IDcuNTk1NDQxNjIsNS42OTUxMjE2NyAxMC43MDIyMjIsNi4zMDAxNDgzNiBMMTAuNzcyODAyMiw2LjMxMzQ5Mjk5IEMxMS4xNDY3ODgsNi4zODY4ODY0NSAxMS40MTcxNzE2LDYuNzIzNzQ1MTYgMTEuNDE2NjY2LDcuMTE1NjUzNTIgWiIvPjwvc3ZnPg==);\n}\n\n.inputFieldUrl {\n  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNCIgaGVpZ2h0PSIxNCIgdmlld0JveD0iMCAwIDE0IDE0Ij4gIDxwYXRoIGZpbGw9IiNBM0E5QUMiIGQ9Ik0xMCw1IEMxMCwzLjg5NTQzMDUgOS4xMDQ1Njk1LDMgOCwzIEM2Ljg5NTQzMDUsMyA2LDMuODk1NDMwNSA2LDUgTTQsMTAgTDQsMTEgTDYsMTEgTDYsMTAgQzYsOS40NDc3MTUyNSA1LjU1MjI4NDc1LDkgNSw5IEM0LjQ0NzcxNTI1LDkgNCw5LjQ0NzcxNTI1IDQsMTAgWiBNMTIsMTAgQzEyLDkuNDQ3NzE1MjUgMTEuNTUyMjg0Nyw5IDExLDkgQzEwLjQ0NzcxNTMsOSAxMCw5LjQ0NzcxNTI1IDEwLDEwIEwxMCwxMSBMMTIsMTEgTDEyLDEwIFogTTYsNiBMNiw1IEw0LDUgTDQsNiBDNCw2LjU1MjI4NDc1IDQuNDQ3NzE1MjUsNyA1LDcgQzUuNTUyMjg0NzUsNyA2LDYuNTUyMjg0NzUgNiw2IFogTTEwLDYgQzEwLDYuNTUyMjg0NzUgMTAuNDQ3NzE1Myw3IDExLDcgQzExLjU1MjI4NDcsNyAxMiw2LjU1MjI4NDc1IDEyLDYgTDEyLDUgTDEwLDUgTDEwLDYgWiBNNCw1IEM0LDIuNzkwODYxIDUuNzkwODYxLDEgOCwxIEMxMC4yMDkxMzksMSAxMiwyLjc5MDg2MSAxMiw1IEw0LDUgWiBNNCwxMSBMMTIsMTEgQzEyLDEzLjIwOTEzOSAxMC4yMDkxMzksMTUgOCwxNSBDNS43OTA4NjEsMTUgNCwxMy4yMDkxMzkgNCwxMSBaIE0xMCwxMSBMNiwxMSBDNiwxMi4xMDQ1Njk1IDYuODk1NDMwNSwxMyA4LDEzIEM5LjEwNDU2OTUsMTMgMTAsMTIuMTA0NTY5NSAxMCwxMSBaIE04LDExIEM3LjQ0NzcxNTI1LDExIDcsMTAuNTUyMjg0NyA3LDEwIEw3LDYgQzcsNS40NDc3MTUyNSA3LjQ0NzcxNTI1LDUgOCw1IEM4LjU1MjI4NDc1LDUgOSw1LjQ0NzcxNTI1IDksNiBMOSwxMCBDOSwxMC41NTIyODQ3IDguNTUyMjg0NzUsMTEgOCwxMSBaIiB0cmFuc2Zvcm09InJvdGF0ZSg0NSA4LjcwNyA2LjI5MykiLz48L3N2Zz4=);\n}\n\n.formLabel {\n}\n\n.hr {\n  border: 0;\n  border-top: 2px solid #e9ebeb;\n  margin: 32px 0 -1px;\n  text-align: center;\n  overflow: visible;\n}\n\n.hr::before {\n  content: "or";\n  position: relative;\n  display: inline-block;\n  font-size: 12px;\n  font-weight: 800;\n  line-height: 1;\n  text-transform: uppercase;\n  background-color: #fff;\n  color: rgb(14, 30, 37);\n  padding: 4px;\n  top: -11px;\n}\n\n.btnProvider {\n  padding-left: 40px;\n  padding-right: 40px;\n}\n\n.btnProvider::before {\n  content: "";\n  position: absolute;\n  display: inline-block;\n  vertical-align: middle;\n  width: 32px;\n  height: 40px;\n  background-repeat: no-repeat;\n  background-position: left center;\n  top: -2px;\n  left: 14px;\n}\n\n.providerGoogle {\n  background-color: #4285f4;\n  border-color: #366dc7;\n}\n\n.providerGoogle:hover,\n.providerGoogle:focus {\n  background-color: #366dc7;\n}\n\n.providerGitHub {\n  background-color: #333;\n  border-color: #000;\n}\n\n.providerGitHub:hover,\n.providerGitHub:focus {\n  background-color: #000;\n}\n\n.providerGitLab {\n  background-color: #e24329;\n  border-color: #b03320;\n}\n\n.providerGitLab:hover,\n.providerGitLab:focus {\n  background-color: #b03320;\n}\n\n.providerBitbucket {\n  background-color: #205081;\n  border-color: #14314f;\n}\n\n.providerBitbucket:hover,\n.providerBitbucket:focus {\n  background-color: #14314f;\n}\n\n.providerGoogle:before {\n  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMyIgaGVpZ2h0PSIxMiIgdmlld0JveD0iMCAwIDEzIDEyIj4gIDxnIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTEuNDg4IC0yKSI+ICAgIDxyZWN0IHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIvPiAgICA8cGF0aCBmaWxsPSIjRkZGRkZGIiBmaWxsLXJ1bGU9Im5vbnplcm8iIGQ9Ik0wLjY1MjczNDM3NSwzLjI5NTI4MjQ0IEMwLjIzNzk4NDM3NSw0LjEwNTgzMjA2IDIuODQyMTcwOTRlLTE0LDUuMDE2MDQ1OCAyLjg0MjE3MDk0ZS0xNCw1Ljk3OTM4OTMxIEMyLjg0MjE3MDk0ZS0xNCw2Ljk0MjczMjgyIDAuMjM3OTg0Mzc1LDcuODUyOTAwNzYgMC42NTI3MzQzNzUsOC42NjM0NTAzOCBDMS42NTkwNDY4NywxMC42MTY3MDIzIDMuNzI2MDkzNzUsMTEuOTU4Nzc4NiA2LjExOTUzMTI1LDExLjk1ODc3ODYgQzcuNzcxNzgxMjUsMTEuOTU4Nzc4NiA5LjE1ODg1OTM3LDExLjQyNzI1MTkgMTAuMTcyMDE1NiwxMC41MTA0NDI3IEMxMS4zMjc5MDYyLDkuNDY3MzU4NzggMTEuOTk0MjgxMiw3LjkzMjY0MTIyIDExLjk5NDI4MTIsNi4xMTIyNTk1NCBDMTEuOTk0MjgxMiw1LjYyMDYyNTk1IDExLjk1MzQ1MzEsNS4yNjE4NjI2IDExLjg2NTA5MzcsNC44ODk4MTY3OSBMNi4xMTk1MzEyNSw0Ljg4OTgxNjc5IEw2LjExOTUzMTI1LDcuMTA4ODA5MTYgTDkuNDkyMDQ2ODcsNy4xMDg4MDkxNiBDOS40MjQwNzgxMiw3LjY2MDI1OTU0IDkuMDU2OTA2MjUsOC40OTA3MzI4MiA4LjI0MDk1MzEyLDkuMDQ4Nzc4NjMgQzcuNzI0MjAzMTIsOS40MDA5MDA3NiA3LjAzMDY0MDYyLDkuNjQ2NzE3NTYgNi4xMTk1MzEyNSw5LjY0NjcxNzU2IEM0LjUwMTI2NTYyLDkuNjQ2NzE3NTYgMy4xMjc3ODEyNSw4LjYwMzY3OTM5IDIuNjM4MTcxODcsNy4xNjE5ODQ3MyBMMi42Mjg3MTIwNSw3LjE2Mjc2OTU5IEMyLjUwNTM0MTU4LDYuNzk3Mjk0NjggMi40MzQyMTg3NSw2LjM4MTEyMjg1IDIuNDM0MjE4NzUsNS45NzkzODkzMSBDMi40MzQyMTg3NSw1LjU2NzQ1MDM4IDIuNTA4OTg0MzgsNS4xNjg4Mzk2OSAyLjYzMTM3NSw0Ljc5Njc5Mzg5IEMzLjEyNzc4MTI1LDMuMzU1MDk5MjQgNC41MDEyNjU2MiwyLjMxMjAxNTI3IDYuMTE5NTMxMjUsMi4zMTIwMTUyNyBDNy4yNjg2MjUsMi4zMTIwMTUyNyA4LjA0Mzc1LDIuNzk3MDA3NjMgOC40ODU3MzQzNywzLjIwMjMwNTM0IEwxMC4yMTI3OTY5LDEuNTU0NjQxMjIgQzkuMTUyMTA5MzcsMC41OTEyOTc3MSA3Ljc3MTc4MTI1LDguODgxNzg0MmUtMTYgNi4xMTk1MzEyNSw4Ljg4MTc4NDJlLTE2IEMzLjcyNjA5Mzc1LDguODgxNzg0MmUtMTYgMS42NTkwNDY4NywxLjM0MjAzMDUzIDAuNjUyNzM0Mzc1LDMuMjk1MjgyNDQgTDAuNjUyNzM0Mzc1LDMuMjk1MjgyNDQgWiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMiAyKSIvPiAgPC9nPjwvc3ZnPg==);\n}\n\n.providerGitHub:before {\n  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE2IDE2Ij4gIDxnIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+ICAgIDxyZWN0IHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIvPiAgICA8cGF0aCBmaWxsPSIjRkZGRkZGIiBmaWxsLXJ1bGU9Im5vbnplcm8iIGQ9Ik04LjAwMDA2NjI1LDAgQzMuNTgyMzMwNzksMCAwLDMuNjcyMzE1ODUgMCw4LjIwMjUzNzczIEMwLDExLjgyNjYzMzggMi4yOTIyNjI0OCwxNC45MDEyOTUgNS40NzA5MzM1NiwxNS45ODU5MDIzIEM1Ljg3MDc1MTM5LDE2LjA2MTgzMTUgNi4wMTc1MzY3NSwxNS44MDc5NjQyIDYuMDE3NTM2NzUsMTUuNTkxMzE0NCBDNi4wMTc1MzY3NSwxNS4zOTU3MTgzIDYuMDEwMTE3OTksMTQuNzQ5NTcyMiA2LjAwNjY3MzU2LDE0LjA2NDE3MTEgQzMuNzgxMDQ3NDEsMTQuNTYwMzYwMiAzLjMxMTQxMzc5LDEzLjA5NjM3ODEgMy4zMTE0MTM3OSwxMy4wOTYzNzgxIEMyLjk0NzQ5NzQsMTIuMTQ4MjgwNiAyLjQyMzE1MDUsMTEuODk2MTc5IDIuNDIzMTUwNSwxMS44OTYxNzkgQzEuNjk3MzA0OTEsMTEuMzg3MDg2IDIuNDc3ODYzNzksMTEuMzk3NTQ0OSAyLjQ3Nzg2Mzc5LDExLjM5NzU0NDkgQzMuMjgxMjA4ODcsMTEuNDU1NDA4NyAzLjcwNDIxMDMxLDEyLjI0MjgxODcgMy43MDQyMTAzMSwxMi4yNDI4MTg3IEM0LjQxNzczNTQ3LDEzLjQ5NjgwNjcgNS41NzU3MjM0NiwxMy4xMzQyNzQ4IDYuMDMyMjQxNzgsMTIuOTI0Njg4MiBDNi4xMDQwNDQ3MiwxMi4zOTQ1NDE0IDYuMzExMzcyNDQsMTIuMDMyNjg4NyA2LjU0MDE2MTQ0LDExLjgyNzg1NjIgQzQuNzYzMjM3NDQsMTEuNjIwNDQyOCAyLjg5NTMwMTE5LDEwLjkxNzExMjEgMi44OTUzMDExOSw3Ljc3NDEyNzk5IEMyLjg5NTMwMTE5LDYuODc4NTk2ODggMy4yMDc4MTYxOCw2LjE0Njg3NzU3IDMuNzE5NTc3NzMsNS41NzI0NDk5OSBDMy42MzY1MTQxNyw1LjM2NTg1MTY2IDMuMzYyNjgyNjgsNC41MzE1ODAxNyAzLjc5NzA3NzIxLDMuNDAxNzQxMzMgQzMuNzk3MDc3MjEsMy40MDE3NDEzMyA0LjQ2ODg3MTg4LDMuMTgxMjg4MjcgNS45OTc2NjUwNyw0LjI0MjUzMjY3IEM2LjYzNTgxMDQ0LDQuMDYwNzkxMzQgNy4zMjAxOTA0NCwzLjk2OTY0OTAyIDguMDAwMDY2MjUsMy45NjY1MjQ5MiBDOC42Nzk5NDIwNiwzLjk2OTY0OTAyIDkuMzY0ODUyLDQuMDYwNzkxMzQgMTAuMDA0MTg5Niw0LjI0MjUzMjY3IEMxMS41MzExMjgxLDMuMTgxMjg4MjcgMTIuMjAxOTk1NCwzLjQwMTc0MTMzIDEyLjIwMTk5NTQsMy40MDE3NDEzMyBDMTIuNjM3NDQ5OCw0LjUzMTU4MDE3IDEyLjM2MzQ4NTgsNS4zNjU4NTE2NiAxMi4yODA0MjIzLDUuNTcyNDQ5OTkgQzEyLjc5MzM3NjEsNi4xNDY4Nzc1NyAxMy4xMDM3NzE0LDYuODc4NTk2ODggMTMuMTAzNzcxNCw3Ljc3NDEyNzk5IEMxMy4xMDM3NzE0LDEwLjkyNDU4MjggMTEuMjMyMjU4MywxMS42MTgyNjk2IDkuNDUwODMwMDYsMTEuODIxMzM2MyBDOS43Mzc3NzY4NywxMi4wNzU4ODI5IDkuOTkzNDU4ODcsMTIuNTc1MDYwMiA5Ljk5MzQ1ODg3LDEzLjM0MDMyOTggQzkuOTkzNDU4ODcsMTQuNDM3ODQxMSA5Ljk4NDE4NTUsMTUuMzIxMTQ3MyA5Ljk4NDE4NTUsMTUuNTkxMzE0NCBDOS45ODQxODU1LDE1LjgwOTU5NDIgMTAuMTI4MTg4NywxNi4wNjUzNjMxIDEwLjUzMzcwMzEsMTUuOTg0ODE1NiBDMTMuNzEwNjUyLDE0Ljg5ODk4NTggMTYsMTEuODI1NDExMyAxNiw4LjIwMjUzNzczIEMxNiwzLjY3MjMxNTg1IDEyLjQxODE5OTIsMCA4LjAwMDA2NjI1LDAgWiBNMi45OTYyODQ5NiwxMS42ODQ2ODgyIEMyLjk3ODY2NTQxLDExLjcyNTQzNzMgMi45MTYxMzU5MSwxMS43Mzc2NjIxIDIuODU5MTcwNDgsMTEuNzA5NjgxIEMyLjgwMTE0NTIyLDExLjY4MjkyMjMgMi43Njg1NTU3MSwxMS42MjczNjc2IDIuNzg3MzY3NTUsMTEuNTg2NDgyNyBDMi44MDQ1ODk2NSwxMS41NDQ1MTEgMi44NjcyNTE2MiwxMS41MzI4Mjk1IDIuOTI1MTQ0MzksMTEuNTYwOTQ2NSBDMi45ODMzMDIxNCwxMS41ODc3MDUxIDMuMDE2NDIxNTcsMTEuNjQzODAzMSAyLjk5NjI4NDk2LDExLjY4NDY4ODIgWiBNMy4zODk3OTkzMiwxMi4wNDQ3MDI0IEMzLjM1MTY0NTc0LDEyLjA4MDk2OTEgMy4yNzcwNjA3NywxMi4wNjQxMjYxIDMuMjI2NDU0MjYsMTIuMDA2ODA1NyBDMy4xNzQxMjU1NSwxMS45NDk2MjEgMy4xNjQzMjIyMSwxMS44NzMxNDg0IDMuMjAzMDA1NywxMS44MzYzMzgyIEMzLjI0MjM1MTU5LDExLjgwMDA3MTUgMy4zMTQ2ODQ0NSwxMS44MTcwNTAzIDMuMzY3MTQ1NjQsMTEuODc0MjM1IEMzLjQxOTQ3NDMyLDExLjkzMjA5ODggMy40Mjk2NzUxMiwxMi4wMDgwMjgxIDMuMzg5Nzk5MzIsMTIuMDQ0NzAyNCBaIE0zLjY1OTc2NTA4LDEyLjUwNTMyODMgQzMuNjEwNzQ4MzMsMTIuNTQwMjM2OCAzLjUzMDU5OTI5LDEyLjUwNzUwMTUgMy40ODEwNTI2MSwxMi40MzQ1NjA2IEMzLjQzMjAzNTgzLDEyLjM2MTYxOTUgMy40MzIwMzU4MywxMi4yNzQxNDQ2IDMuNDgyMTEyNDQsMTIuMjM5MTAwMyBDMy41MzE3OTE1NywxMi4yMDQwNTYgMy42MTA3NDgzMywxMi4yMzU1Njg4IDMuNjYwOTU3MzgsMTIuMzA3OTY2NSBDMy43MDk4NDE2OCwxMi4zODIxMjk5IDMuNzA5ODQxNjgsMTIuNDY5NjA0OCAzLjY1OTc2NTA4LDEyLjUwNTMyODMgWiBNNC4xMTYzMzQ5NSwxMy4wMzg3OTgxIEM0LjA3MjQ4NDgyLDEzLjA4ODM3NjQgMy45NzkwODgwMiwxMy4wNzUwNjUgMy45MTA3Mjk0OCwxMy4wMDc0MjE0IEMzLjg0MDc4MTI0LDEyLjk0MTI3MTggMy44MjEzMDcwMSwxMi44NDc0MTI5IDMuODY1Mjg5NjMsMTIuNzk3ODM0NyBDMy45MDk2Njk2NiwxMi43NDgxMjA3IDQuMDAzNTk2MzksMTIuNzYyMTExMyA0LjA3MjQ4NDgyLDEyLjgyOTIxMTYgQzQuMTQxOTAzMTYsMTIuODk1MjI1MyA0LjE2MzA5OTYsMTIuOTg5NzYzNCA0LjExNjMzNDk1LDEzLjAzODc5ODEgWiBNNC43MDY0MDcxOSwxMy4yMTg4OTE2IEM0LjY4NzA2NTQ2LDEzLjI4MzEzOTUgNC41OTcxMTMwNiwxMy4zMTIzNDMgNC41MDY0OTgyNywxMy4yODUwNDExIEM0LjQxNjAxNTk3LDEzLjI1NjkyNDIgNC4zNTY3OTg0MiwxMy4xODE2NzQxIDQuMzc1MDgwMzYsMTMuMTE2NzQ3IEM0LjM5Mzg5MjE5LDEzLjA1MjA5MTcgNC40ODQyNDIwMSwxMy4wMjE2NjU2IDQuNTc1NTE5MTgsMTMuMDUwODY5MiBDNC42NjU4NjkwMSwxMy4wNzg4NTAzIDQuNzI1MjE5MDUsMTMuMTUzNTU3MSA0LjcwNjQwNzE5LDEzLjIxODg5MTYgWiBNNS4zNzc5MzQxOSwxMy4yOTUyODI1IEM1LjM4MDE4NjI5LDEzLjM2MjkyNjEgNS4zMDMzNDkxOSwxMy40MTkwMjQxIDUuMjA4MjMwMTgsMTMuNDIwMjQ2NyBDNS4xMTI1ODEyNSwxMy40MjI0MiA1LjAzNTIxNDI1LDEzLjM2NzY4MDMgNS4wMzQxNTQ0MiwxMy4zMDExMjMyIEM1LjAzNDE1NDQyLDEzLjIzMjgwMDUgNS4xMDkyNjkzLDEzLjE3NzI0NTggNS4yMDQ5MTgyMywxMy4xNzU2MTU4IEM1LjMwMDAzNzI2LDEzLjE3MzcxNDIgNS4zNzc5MzQxOSwxMy4yMjgwNDY0IDUuMzc3OTM0MTksMTMuMjk1MjgyNSBaIE02LjAzNzYzNDE5LDEzLjI2OTM1NDggQzYuMDQ5MDI3MjksMTMuMzM1MzY4NSA1Ljk4MjkyMDg4LDEzLjQwMzE0NzkgNS44ODg0NjQyNSwxMy40MjEyMTM0IEM1Ljc5NTU5NzM2LDEzLjQzODU5OTcgNS43MDk2MTkyOSwxMy4zOTc4NTA1IDUuNjk3ODI4NzcsMTMuMzMyMzgwMiBDNS42ODYzMDMyMiwxMy4yNjQ3MzY1IDUuNzUzNjAxOTEsMTMuMTk2OTU3MSA1Ljg0NjMzNjMzLDEzLjE3OTQzNSBDNS45NDA5MjU0NCwxMy4xNjI1OTIgNi4wMjU1Nzg3MiwxMy4yMDIyNTQ1IDYuMDM3NjM0MTksMTMuMjY5MzU0OCBaIi8+ICA8L2c+PC9zdmc+);\n}\n\n.providerGitLab:before {\n  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNCIgaGVpZ2h0PSIxMyIgdmlld0JveD0iMCAwIDE0IDEzIj4gIDxnIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTEgLTIpIj4gICAgPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2Ii8+ICAgIDxwYXRoIGZpbGw9IiNGRkZGRkYiIGZpbGwtcnVsZT0ibm9uemVybyIgZD0iTTcuMDA0MDkzMzYsMTIuOTQ5MjQzMyBMNC40MjgwOTMzMyw0Ljk5NzI4MjU0IEw5LjU4MDA5MzM2LDQuOTk3MjgyNTQgTDcuMDA0MDkzMzYsMTIuOTQ5MjQzMyBaIE03LjAwNDA5MzM2LDEyLjk0OTIzIEwwLjgxNzg5MzMzMyw0Ljk5NzI2OTE3IEw0LjQyODA5MzMzLDQuOTk3MjY5MTcgTDcuMDA0MDkzMzYsMTIuOTQ5MjMgWiBNMC44MTc4OTk5OTksNC45OTcyODkyMyBMNy4wMDQwOTk5OCwxMi45NDkyNSBMMC4yMjg4MzMzMzMsOC4wMTE4ODA4IEMwLjA0MTksNy44NzU2NzE1MiAtMC4wMzYzLDcuNjM0MjEyNyAwLjAzNTEsNy40MTM4MTcxMiBMMC44MTc4OTk5OTksNC45OTcyODkyMyBaIE0wLjgxNzg5OTk5OSw0Ljk5NzI5NTkxIEwyLjM2OTM2NjY3LDAuMjA3OTA0NzE0IEMyLjQ0OTE2NjY3LC0wLjAzODUwMjM1ODggMi43OTY3NjY2NywtMC4wMzg1NjkyMjY1IDIuODc2NTY2NjcsMC4yMDc5MDQ3MTQgTDQuNDI4MSw0Ljk5NzI5NTkxIEwwLjgxNzg5OTk5OSw0Ljk5NzI5NTkxIFogTTcuMDA0MDkzMzYsMTIuOTQ5MjMgTDkuNTgwMDkzMzYsNC45OTcyNjkxNyBMMTMuMTkwMjkzMyw0Ljk5NzI2OTE3IEw3LjAwNDA5MzM2LDEyLjk0OTIzIFogTTEzLjE5MDI5MzMsNC45OTcyODkyMyBMMTMuOTczMDkzMyw3LjQxMzgxNzEyIEMxNC4wNDQ0OTMzLDcuNjM0MjEyNyAxMy45NjYyOTM0LDcuODc1NjcxNTIgMTMuNzc5MzYsOC4wMTE4ODA4IEw3LjAwNDA5MzM2LDEyLjk0OTI1IEwxMy4xOTAyOTMzLDQuOTk3Mjg5MjMgWiBNMTMuMTkwMjkzMyw0Ljk5NzI5NTkxIEw5LjU4MDA5MzM2LDQuOTk3Mjk1OTEgTDExLjEzMTYyNjcsMC4yMDc5MDQ3MTQgQzExLjIxMTQyNjcsLTAuMDM4NTY5MjI2NSAxMS41NTkwMjY3LC0wLjAzODUwMjM1ODggMTEuNjM4ODI2NywwLjIwNzkwNDcxNCBMMTMuMTkwMjkzMyw0Ljk5NzI5NTkxIFoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDEgMikiLz4gIDwvZz48L3N2Zz4=);\n}\n\n.providerBitbucket:before {\n  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNCIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE0IDE2Ij4gIDxnIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTEpIj4gICAgPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2Ii8+ICAgIDxnIGZpbGw9IiNGRkZGRkYiIGZpbGwtcnVsZT0ibm9uemVybyIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMSkiPiAgICAgIDxwYXRoIGQ9Ik03LDIuNDk4OTQxODdlLTA3IEw3LDIuNDk4OTQxODdlLTA3IEMzLjE1NzIxMjI5LDIuNDk4OTQxODdlLTA3IDAuMDAwNjM2NTM1NDM1LDEuMDIwODQ0MjQgMC4wMDA2MzY1MzU0MzUsMi4zMTM5MTM1OSBDMC4wMDA2MzY1MzU0MzUsMi42NTQxOTUxMyAwLjgyNDA5MTAyMyw3LjQ4NjE5MiAxLjE2NzE5NzE3LDkuMzkxNzY3NTkgQzEuMzA0NDM5MzcsMTAuMjc2NDk5OSAzLjU2ODkzOTUzLDExLjUwMTUxMyA3LDExLjUwMTUxMyBMNywxMS41MDE1MTMgQzEwLjQzMTA2MDIsMTEuNTAxNTEzIDEyLjYyNjkzODYsMTAuMjc2NDk5OSAxMi44MzI4MDMyLDkuMzkxNzY3NTkgQzEzLjE3NTkwODYsNy40ODYxOTIgMTMuOTk5MzYzMiwyLjY1NDE5NTEzIDEzLjk5OTM2MzIsMi4zMTM5MTM1OSBDMTMuOTMwNzQyMSwxLjAyMDg0NDI0IDEwLjg0Mjc4NzQsMi40OTg5NDE4N2UtMDcgNywyLjQ5ODk0MTg3ZS0wNyBMNywyLjQ5ODk0MTg3ZS0wNyBaIE03LDkuOTM2MjE4MzEgQzUuNzY0ODE4MjgsOS45MzYyMTgzMSA0LjgwNDEyMTI2LDguOTgzNDI5ODYgNC44MDQxMjEyNiw3Ljc1ODQxNjcxIEM0LjgwNDEyMTI2LDYuNTMzNDAzNTUgNS43NjQ4MTgyOCw1LjU4MDYxNTk3IDcsNS41ODA2MTU5NyBDOC4yMzUxODExMiw1LjU4MDYxNTk3IDkuMTk1ODc4NCw2LjUzMzQwMzU1IDkuMTk1ODc4NCw3Ljc1ODQxNjcxIEM5LjE5NTg3ODQsOC45MTUzNzM3MiA4LjIzNTE4MTEyLDkuOTM2MjE4MzEgNyw5LjkzNjIxODMxIEw3LDkuOTM2MjE4MzEgWiBNNywyLjk5NDQ3NjY3IEM0LjUyOTYzNjIyLDIuOTk0NDc2NjcgMi41Mzk2MjExLDIuNTg2MTM4OTUgMi41Mzk2MjExLDIuMDQxNjg4ODYgQzIuNTM5NjIxMSwxLjQ5NzIzODE1IDQuNTI5NjM2MjIsMS4wODg5MDA0MyA3LDEuMDg4OTAwNDMgQzkuNDcwMzYyODQsMS4wODg5MDA0MyAxMS40NjAzNzg2LDEuNDk3MjM4MTUgMTEuNDYwMzc4NiwyLjA0MTY4ODg2IEMxMS40NjAzNzg2LDIuNTg2MTM4OTUgOS40NzAzNjI4NCwyLjk5NDQ3NjY3IDcsMi45OTQ0NzY2NyBMNywyLjk5NDQ3NjY3IFoiLz4gICAgICA8cGF0aCBkPSJNMTIuMDY0NTA5NiwxMS4yMjkyODc2IEMxMS45MjcyNjY3LDExLjIyOTI4NzYgMTEuODU4NjQ1NywxMS4yOTczNDM4IDExLjg1ODY0NTcsMTEuMjk3MzQzOCBDMTEuODU4NjQ1NywxMS4yOTczNDM4IDEwLjE0MzExNTYsMTIuNjU4NDcgNy4wNTUxNjA5MywxMi42NTg0NyBDMy45NjcyMDY4NywxMi42NTg0NyAyLjI1MTY3NjE2LDExLjI5NzM0MzggMi4yNTE2NzYxNiwxMS4yOTczNDM4IEMyLjI1MTY3NjE2LDExLjI5NzM0MzggMi4xMTQ0MzM5NSwxMS4yMjkyODc2IDIuMDQ1ODEyODUsMTEuMjI5Mjg3NiBDMS45MDg1NzAwMiwxMS4yMjkyODc2IDEuNzcxMzI3ODEsMTEuMjk3MzQzOCAxLjc3MTMyNzgxLDExLjUwMTUxMyBMMS43NzEzMjc4MSwxMS41Njk1NjkyIEMyLjA0NTgxMjg1LDEyLjk5ODc1MTYgMi4yNTE2NzYxNiwxNC4wMTk1OTU2IDIuMjUxNjc2MTYsMTQuMTU1NzA3OSBDMi40NTc1NDAwOSwxNS4xNzY1NTI1IDQuNTE2MTc2MzIsMTUuOTkzMjI4IDYuOTg2NTM5ODIsMTUuOTkzMjI4IEw2Ljk4NjUzOTgyLDE1Ljk5MzIyOCBDOS40NTY5MDMzMSwxNS45OTMyMjggMTEuNTE1NTM5NSwxNS4xNzY1NTI1IDExLjcyMTQwMzUsMTQuMTU1NzA3OSBDMTEuNzIxNDAzNSwxNC4wMTk1OTU2IDExLjkyNzI2NjcsMTIuOTk4NzUxNiAxMi4yMDE3NTE4LDExLjU2OTU2OTIgTDEyLjIwMTc1MTgsMTEuNTAxNTEzIEMxMi4yNzAzNzI5LDExLjM2NTQgMTIuMjAxNzUxOCwxMS4yMjkyODc2IDEyLjA2NDUwOTYsMTEuMjI5Mjg3NiBMMTIuMDY0NTA5NiwxMS4yMjkyODc2IFoiLz4gICAgICA8ZWxsaXBzZSBjeD0iNyIgY3k9IjcuNjkiIHJ4PSIxLjA5OCIgcnk9IjEuMDg5Ii8+ICAgIDwvZz4gIDwvZz48L3N2Zz4=);\n}\n\n.callOut {\n  display: block;\n  padding: 32px;\n  font-size: 14px;\n  font-weight: 500;\n  text-decoration: none;\n  color: #a3a9ac;\n  text-align: center;\n}\n\n.callOut:after {\n  content: " ♥";\n  -webkit-transition: color 4s ease;\n  transition: color 4s ease;\n}\n\n.callOut:hover:after {\n  color: red;\n}\n\n.callOut .netlifyLogo {\n  display: block;\n  margin: auto;\n  width: 32px;\n  height: 32px;\n  margin-bottom: 8px;\n  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj4gIDxkZWZzPiAgICA8cmFkaWFsR3JhZGllbnQgaWQ9ImEiIGN5PSIwJSIgcj0iMTAwJSIgZng9IjUwJSIgZnk9IjAlIiBncmFkaWVudFRyYW5zZm9ybT0ibWF0cml4KDAgMSAtMS4xNTE4NSAwIC41IC0uNSkiPiAgICAgIDxzdG9wIHN0b3AtY29sb3I9IiMyMEM2QjciIG9mZnNldD0iMCUiLz4gICAgICA8c3RvcCBzdG9wLWNvbG9yPSIjNEQ5QUJGIiBvZmZzZXQ9IjEwMCUiLz4gICAgPC9yYWRpYWxHcmFkaWVudD4gIDwvZGVmcz4gIDxwYXRoIGZpbGw9InVybCgjYSkiIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTIyLjk4MDYyMywxMS42MjYyMzc3IEMyMi44NzE3MTA3LDExLjUwNTEzMDYgMjIuNzM1NTcwNCwxMS4zOTc0Nzk4IDIyLjU3MjIwMjEsMTEuMzE2NzQxOCBDMjIuNTU4NTg4MSwxMS4zMTY3NDE4IDIyLjU0NDk3NCwxMS4yODk4MjkxIDIyLjUzMTM2LDExLjI3NjM3MjcgTDIzLjE3MTIxOTQsNy4zNjA1NzY2MSBDMjMuMTcxMjE5NCw3LjMzMzY2MzkyIDIzLjE4NDgzMzQsNy4zMjAyMDc1OCAyMy4xOTg0NDc1LDcuMzIwMjA3NTggTDIzLjIxMjA2MTUsNy4zMjAyMDc1OCBDMjMuMjEyMDYxNSw3LjMyMDIwNzU4IDIzLjIyNTY3NTUsNy4zMjAyMDc1OCAyMy4yMzkyODk2LDcuMzMzNjYzOTIgTDI2LjE2NjMwNiwxMC4yMjY3Nzc5IEMyNi4xNzk5MiwxMC4yNDAyMzQzIDI2LjE3OTkyLDEwLjI1MzY5MDYgMjYuMTc5OTIsMTAuMjY3MTQ2OSBDMjYuMTc5OTIsMTAuMjgwNjAzMyAyNi4xNjYzMDYsMTAuMjk0MDU5NiAyNi4xNTI2OTE5LDEwLjMwNzUxNiBMMjMuMDIxNDY1MSwxMS42Mzk2OTQgTDIzLjAwNzg1MSwxMS42Mzk2OTQgQzIyLjk5NDIzNywxMS42Mzk2OTQgMjIuOTk0MjM3LDExLjYzOTY5NCAyMi45ODA2MjMsMTEuNjI2MjM3NyBaIE0xNi4zNTA1NzM2LDkuNDU5NzM4MSBDMTYuMzIzMzQ1Myw5LjE5MDYxMjc0IDE2LjIyODA0NjMsOC45MjE0ODczOCAxNi4wNzgyOTA2LDguNjkyNzMwODMgQzE2LjA2NDY3NjUsOC42NzkyNzQ1NiAxNi4wNjQ2NzY1LDguNjUyMzYyMDIgMTYuMDc4MjkwNiw4LjYyNTQ0OTQ5IEwxOS4zNTkzMDEsMy41Mzg5ODAyMiBDMTkuMzU5MzAxLDMuNTI1NTIzOTUgMTkuMzcyOTE1MSwzLjUxMjA2NzY4IDE5LjM4NjUyOTMsMy41MTIwNjc2OCBDMTkuNDAwMTQzNCwzLjUxMjA2NzY4IDE5LjQwMDE0MzQsMy41MTIwNjc2OCAxOS40MTM3NTc2LDMuNTI1NTIzOTUgTDIyLjMyNzE4NTgsNi40MTg2MjE1NSBDMjIuMzQwOCw2LjQzMjA3NzgyIDIyLjM0MDgsNi40NDU1MzQwOSAyMi4zNDA4LDYuNDU4OTkwMzUgTDIxLjU3ODQwNzYsMTEuMTgyMTQwNCBDMjEuNTc4NDA3NiwxMS4yMDkwNTI5IDIxLjU2NDc5MzQsMTEuMjIyNTA5MiAyMS41NTExNzkzLDExLjIyMjUwOTIgQzIxLjM3NDE5NTMsMTEuMjc2MzM0MyAyMS4yMTA4MjU1LDExLjM1NzA3MTkgMjEuMDc0Njg0LDExLjQ2NDcyMiBDMjEuMDc0Njg0LDExLjQ3ODE3ODMgMjEuMDYxMDY5OCwxMS40NzgxNzgzIDIxLjAzMzg0MTUsMTEuNDc4MTc4MyBMMTYuMzc3ODAxOSw5LjUwMDEwNjkgQzE2LjM2NDE4NzgsOS40ODY2NTA2MyAxNi4zNTA1NzM2LDkuNDczMTk0MzcgMTYuMzUwNTczNiw5LjQ1OTczODEgWiBNMjYuOTgzMTkwNywxMS4wMjA3NjY5IEwzMS45Nzk1Nzg4LDE1Ljk3MjY2NCBDMzIuMDA2ODA3MSwxNS45ODYxMjAyIDMyLjAwNjgwNzEsMTYuMDI2NDg4OSAzMS45Nzk1Nzg4LDE2LjAyNjQ4ODkgTDMxLjk1MjM1MDUsMTYuMDUzNDAxNCBDMzEuOTUyMzUwNSwxNi4wNjY4NTc3IDMxLjkzODczNjQsMTYuMDY2ODU3NyAzMS45MTE1MDgxLDE2LjA2Njg1NzcgTDIzLjU1MjQyODMsMTIuNTI3ODY2IEMyMy41Mzg4MTQxLDEyLjUyNzg2NiAyMy41MjUyLDEyLjUwMDk1MzUgMjMuNTI1MiwxMi40ODc0OTczIEMyMy41MjUyLDEyLjQ3NDA0MSAyMy41Mzg4MTQxLDEyLjQ2MDU4NDggMjMuNTUyNDI4MywxMi40NDcxMjg2IEwyNi45NTU5NjI0LDExLjAwNzMxMDcgQzI2Ljk1NTk2MjQsMTEuMDA3MzEwNyAyNi45Njk1NzY1LDExLjAwNzMxMDcgMjYuOTgzMTkwNywxMS4wMjA3NjY5IFogTTIzLjEzMDQzNjMsMTMuMzg5MDg4MSBMMzEuMTQ5MTg1OCwxNi43ODAwNzYxIEMzMS4xNjI4LDE2Ljc5MzUzMjQgMzEuMTYyOCwxNi44MDY5ODg3IDMxLjE2MjgsMTYuODIwNDQ1IEMzMS4xNjI4LDE2LjgzMzkwMTMgMzEuMTYyOCwxNi44NDczNTc2IDMxLjE0OTE4NTgsMTYuODYwODEzOSBMMjYuNzEwOTY0NSwyMS4yNjEwMjQ1IEMyNi43MTA5NjQ1LDIxLjI3NDQ4MDggMjYuNjk3MzUwMywyMS4yNzQ0ODA4IDI2LjY3MDEyMiwyMS4yNzQ0ODA4IEwyMS44MjM0NzU0LDIwLjI2NTI1ODIgQzIxLjc5NjI0NywyMC4yNjUyNTgyIDIxLjc4MjYzMjksMjAuMjUxODAxOSAyMS43ODI2MzI5LDIwLjIyNDg4OTMgQzIxLjc0MTc5MDMsMTkuODQ4MTEyOCAyMS41NjQ4MDYsMTkuNTExNzA1MyAyMS4yNjUyOTQyLDE5LjI4Mjk0ODEgQzIxLjI1MTY4LDE5LjI2OTQ5MTggMjEuMjUxNjgsMTkuMjU2MDM1NSAyMS4yNTE2OCwxOS4yNDI1NzkyIEwyMi4xMDkzNzMxLDEzLjk4MTE2NTMgQzIyLjEwOTM3MzEsMTMuOTU0MjUyNyAyMi4xMzY2MDE0LDEzLjk0MDc5NjQgMjIuMTUwMjE1NiwxMy45NDA3OTY0IEMyMi41MzE0MTI1LDEzLjg4Njk3MTIgMjIuODU4MTUyNywxMy42OTg1ODMgMjMuMDc1OTc5NiwxMy40MDI1NDQ0IEMyMy4wODk1OTM3LDEzLjM4OTA4ODEgMjMuMTAzMjA3OSwxMy4zODkwODgxIDIzLjEzMDQzNjMsMTMuMzg5MDg4MSBaIE0xNi4xNDYzNzksMTAuNDI4Njg1OSBMMjAuNTMwMTMxNywxMi4yODU2NTMyIEMyMC41NDM3NDU5LDEyLjI5OTEwOTUgMjAuNTU3MzYsMTIuMzEyNTY1OCAyMC41NTczNiwxMi4zMzk0NzgzIEMyMC41NDM3NDU5LDEyLjQwNjc1OTggMjAuNTMwMTMxNywxMi40ODc0OTc1IDIwLjUzMDEzMTcsMTIuNTY4MjM1MiBMMjAuNTMwMTMxNywxMi42MzU1MTY2IEwyMC41MzAxMzE3LDEyLjY4OTM0MTcgQzIwLjUzMDEzMTcsMTIuNzAyNzk4IDIwLjUxNjUxNzYsMTIuNzE2MjU0MyAyMC41MDI5MDM0LDEyLjcyOTcxMDYgQzIwLjUwMjkwMzQsMTIuNzI5NzEwNiAxMC44Nzc3MDcyLDE2LjgzMzg3NzUgMTAuODY0MDkzLDE2LjgzMzg3NzUgQzEwLjg1MDQ3ODksMTYuODMzODc3NSAxMC44MzY4NjQ3LDE2LjgzMzg3NzUgMTAuODIzMjUwNiwxNi44MjA0MjEyIEMxMC44MDk2MzY1LDE2LjgwNjk2NDkgMTAuODA5NjM2NSwxNi43ODAwNTI0IDEwLjgyMzI1MDYsMTYuNzY2NTk2MSBMMTQuNDMwOTk3NCwxMS4xODIyMzc4IEMxNC40NDQ2MTE2LDExLjE2ODc4MTUgMTQuNDU4MjI1NywxMS4xNTUzMjUzIDE0LjQ4NTQ1NCwxMS4xNTUzMjUzIEMxNC41ODA3NTMsMTEuMTY4NzgxNSAxNC42NjI0Mzc4LDExLjE4MjIzNzggMTQuNzQ0MTIyNiwxMS4xODIyMzc4IEMxNS4yODg2ODgyLDExLjE4MjIzNzggMTUuNzkyNDExMywxMC45MTMxMTIxIDE2LjA5MTkyMjQsMTAuNDU1NTk4NCBDMTYuMTA1NTM2NSwxMC40NDIxNDIyIDE2LjExOTE1MDcsMTAuNDI4Njg1OSAxNi4xNDYzNzksMTAuNDI4Njg1OSBaIE0yMS41NTExNDI5LDIxLjE4MDI0MzMgTDI1LjgxMjM3MTcsMjIuMDU0OTA1MyBDMjUuODI1OTg1OSwyMi4wNTQ5MDUzIDI1LjgzOTYsMjIuMDY4MzYxNiAyNS44Mzk2LDIyLjEwODczMDcgQzI1LjgzOTYsMjIuMTIyMTg3IDI1LjgzOTYsMjIuMTM1NjQzMyAyNS44MjU5ODU5LDIyLjE0OTA5OTcgTDE5LjkxNzQ0NDksMjguMDAyNjA3MiBDMTkuOTE3NDQ0OSwyOC4wMTYwNjM2IDE5LjkwMzgzMDcsMjguMDE2MDYzNiAxOS44OTAyMTY2LDI4LjAxNjA2MzYgTDE5Ljg2Mjk4ODMsMjguMDE2MDYzNiBDMTkuODQ5Mzc0MSwyOC4wMDI2MDcyIDE5LjgzNTc2LDI3Ljk4OTE1MDkgMTkuODM1NzYsMjcuOTYyMjM4MiBMMjAuODU2ODIxMiwyMS42OTE1ODQxIEMyMC44NTY4MjEyLDIxLjY3ODEyNzggMjAuODcwNDM1NCwyMS42NTEyMTUxIDIwLjg4NDA0OTUsMjEuNjUxMjE1MSBDMjEuMTI5MTA0MiwyMS41NTcwMjA4IDIxLjMzMzMxNjUsMjEuMzk1NTQ0NyAyMS40OTY2ODYzLDIxLjE5MzY5OTYgQzIxLjUxMDMwMDQsMjEuMTkzNjk5NiAyMS41MjM5MTQ2LDIxLjE4MDI0MzMgMjEuNTUxMTQyOSwyMS4xODAyNDMzIFogTTE5LjA0NjE2NzksMjAuNjgyNDAzIEMxOS4xNTUwODE0LDIxLjA5OTU0ODcgMTkuNDU0NTkzMywyMS40NjI4NjkyIDE5Ljg2MzAxODcsMjEuNjI0MzQ0OSBDMTkuODkwMjQ3MSwyMS42Mzc4MDEyIDE5Ljg5MDI0NzEsMjEuNjY0NzEzOSAxOS44NjMwMTg3LDIxLjY2NDcxMzkgQzE5Ljg2MzAxODcsMjEuNjY0NzEzOSAxOC42MjQxMjgzLDI5LjIxMzcwNTQgMTguNjI0MTI4MywyOS4yMjcxNjE3IEwxOC4xODg0NzQ2LDI5LjY1Nzc2MzcgQzE4LjE4ODQ3NDYsMjkuNjcxMjIwMSAxOC4xNzQ4NjA0LDI5LjY3MTIyMDEgMTguMTYxMjQ2MiwyOS42NzEyMjAxIEMxOC4xNDc2MzIsMjkuNjcxMjIwMSAxOC4xNDc2MzIsMjkuNjcxMjIwMSAxOC4xMzQwMTc4LDI5LjY1Nzc2MzcgTDEwLjk0NTczMDYsMTkuMjY5NDkwMSBDMTAuOTMyMTE2NSwxOS4yNTYwMzM4IDEwLjkzMjExNjUsMTkuMjI5MTIxMiAxMC45NDU3MzA2LDE5LjIxNTY2NDkgQzEwLjk4NjU3MzIsMTkuMTYxODM5NiAxMS4wMTM4MDE1LDE5LjEwODAxNDQgMTEuMDU0NjQ0MSwxOS4wNDA3MzI4IEMxMS4wNjgyNTgzLDE5LjAyNzI3NjUgMTEuMDgxODcyNCwxOS4wMTM4MjAyIDExLjEwOTEwMDgsMTkuMDEzODIwMiBMMTkuMDA1MzI1NCwyMC42NDIwMzQxIEMxOS4wMzI1NTM3LDIwLjY1NTQ5MDQgMTkuMDQ2MTY3OSwyMC42Njg5NDY3IDE5LjA0NjE2NzksMjAuNjgyNDAzIFogTTExLjMxMzM2NDcsMTguMDk4NzI4NiBDMTEuMjg2MTM2NSwxOC4wOTg3Mjg2IDExLjI3MjUyMjQsMTguMDg1MjcyNCAxMS4yNzI1MjI0LDE4LjA1ODM1OTggQzExLjI3MjUyMjQsMTcuOTUwNzA5NiAxMS4yNDUyOTQxLDE3Ljg1NjUxNTcgMTEuMjMxNjgsMTcuNzQ4ODY1NCBDMTEuMjMxNjgsMTcuNzIxOTUyOSAxMS4yMzE2OCwxNy43MDg0OTY2IDExLjI1ODkwODIsMTcuNjk1MDQwMyBDMTEuMjU4OTA4MiwxNy42OTUwNDAzIDIwLjkzODU0NTksMTMuNTYzOTYzNSAyMC45NTIxNiwxMy41NjM5NjM1IEMyMC45NTIxNiwxMy41NjM5NjM1IDIwLjk2NTc3NDEsMTMuNTYzOTYzNSAyMC45NzkzODgyLDEzLjU3NzQxOTcgQzIxLjA0NzQ1ODgsMTMuNjQ0NzAxMSAyMS4xMDE5MTUzLDEzLjY4NTA2OTkgMjEuMTU2MzcxOCwxMy43MjU0Mzg4IEMyMS4xODM2LDEzLjcyNTQzODggMjEuMTgzNiwxMy43NTIzNTEzIDIxLjE4MzYsMTMuNzY1ODA3NiBMMjAuMzM5NTI0NywxOC45NDY0NzQxIEMyMC4zMzk1MjQ3LDE4Ljk3MzM4NjYgMjAuMzI1OTEwNiwxOC45ODY4NDI5IDIwLjI5ODY4MjQsMTguOTg2ODQyOSBDMTkuODM1ODAyNCwxOS4wMTM3NTU0IDE5LjQyNzM3ODgsMTkuMjgyODgxIDE5LjE5NTkzODgsMTkuNjg2NTY5MyBDMTkuMTgyMzI0NywxOS43MDAwMjU1IDE5LjE2ODcxMDYsMTkuNzEzNDgxOCAxOS4xNDE0ODI0LDE5LjcxMzQ4MTggTDExLjMxMzM2NDcsMTguMDk4NzI4NiBaIE03Ljg2ODk3NzU4LDE5LjE4ODcyOTEgQzcuOTA5ODIwMywxOS4yNTYwMTExIDcuOTUwNjYzMDMsMTkuMzA5ODM2NyA3Ljk5MTUwNTc2LDE5LjM2MzY2MjMgQzguMDA1MTIsMTkuMzc3MTE4NyA4LjAwNTEyLDE5LjM5MDU3NTEgOC4wMDUxMiwxOS4zOTA1NzUxIEw2LjEzOTk2ODc5LDIyLjI4MzcwMDcgQzYuMTI2MzU0NTUsMjIuMjk3MTU3MSA2LjExMjc0MDMsMjIuMzEwNjEzNSA2LjA5OTEyNjA2LDIyLjMxMDYxMzUgQzYuMDk5MTI2MDYsMjIuMzEwNjEzNSA2LjA4NTUxMTgyLDIyLjMxMDYxMzUgNi4wNzE4OTc1OCwyMi4yOTcxNTcxIEw0LjQyNDU3NDI0LDIwLjY2ODkzMjkgQzQuNDEwOTYsMjAuNjU1NDc2NSA0LjQxMDk2LDIwLjY0MjAyMDEgNC40MTA5NiwyMC42Mjg1NjM3IEM0LjQxMDk2LDIwLjYxNTEwNzMgNC40MjQ1NzQyNCwyMC42MDE2NTA5IDQuNDM4MTg4NDgsMjAuNjAxNjUwOSBMNy44MTQ1MjA2MSwxOS4xNjE4MTYzIEw3LjgyODEzNDg1LDE5LjE2MTgxNjMgQzcuODQxNzQ5MDksMTkuMTYxODE2MyA3Ljg1NTM2MzMzLDE5LjE3NTI3MjcgNy44Njg5Nzc1OCwxOS4xODg3MjkxIFogTTEwLjE4MzMxOTEsMTkuODYxNTU3OSBDMTAuMTk2OTMzMiwxOS44NjE1NTc5IDEwLjIxMDU0NzMsMTkuODc1MDE0MiAxMC4yMjQxNjE0LDE5Ljg4ODQ3MDYgTDE3LjQzOTYyOTQsMzAuMzU3NDg3OCBDMTcuNDUzMjQzNSwzMC4zNzA5NDQxIDE3LjQ1MzI0MzUsMzAuMzk3ODU2NyAxNy40Mzk2Mjk0LDMwLjQxMTMxMzEgTDE1Ljg2MDM5NDksMzEuOTg1NzAyNSBDMTUuODYwMzk0OSwzMS45OTkxNTg5IDE1Ljg0Njc4MDgsMzEuOTk5MTU4OSAxNS44MDU5Mzg2LDMxLjk4NTcwMjUgTDYuNzkzNDEwNTcsMjMuMDY0MTYyMiBDNi43Nzk3OTY0OCwyMy4wNTA3MDU4IDYuNzc5Nzk2NDgsMjMuMDIzNzkzMiA2LjgwNzAyNDY2LDIyLjk5Njg4MDYgTDguNzY3NDUzNzEsMTkuOTU1NzUyMiBDOC43ODEwNjc4LDE5Ljk0MjI5NTggOC43OTQ2ODE4OSwxOS45Mjg4Mzk1IDguODIxOTEwMDcsMTkuOTI4ODM5NSBDOS4wMjYxMjE0MywxOS45OTYxMjExIDkuMjE2NzE4NywyMC4wMjMwMzM4IDkuNDIwOTMwMDYsMjAuMDIzMDMzOCBDOS42Nzk1OTc3OCwyMC4wMjMwMzM4IDkuOTI0NjUxNDEsMTkuOTY5MjA4NSAxMC4xODMzMTkxLDE5Ljg2MTU1NzkgWiBNOC45OTg5MTg1NiwxNi40MDMyMzIyIEM4Ljk4NTMwNDM5LDE2LjQwMzIzMjIgOC45NzE2OTAyMiwxNi4zODk3NzU5IDguOTU4MDc2MDQsMTYuMzc2MzE5NiBMNS4wOTE2NTA2MywxMC43MzgxMzg4IEM1LjA3ODAzNjQ2LDEwLjcyNDY4MjUgNS4wNzgwMzY0NiwxMC42OTc3NyA1LjA5MTY1MDYzLDEwLjY4NDMxMzcgTDguNTYzMjY1LDcuMjM5NTA2MzMgQzguNTYzMjY1LDcuMjI2MDUwMDYgOC41NzY4NzkxNyw3LjIyNjA1MDA2IDguNjA0MTA3NTIsNy4yMjYwNTAwNiBDOC42MDQxMDc1Miw3LjIzOTUwNjMzIDEyLjcwMTk3MzksOC45NjE5MTAwMiAxMy4xNjQ4NTU4LDkuMTYzNzU0MiBDMTMuMTc4NDcsOS4xNzcyMTA0OCAxMy4xOTIwODQyLDkuMTkwNjY2NzYgMTMuMTkyMDg0Miw5LjIxNzU3OTMyIEMxMy4xNjQ4NTU4LDkuMzM4Njg1ODMgMTMuMTUxMjQxNiw5LjQ1OTc5MjM0IDEzLjE1MTI0MTYsOS41ODA4OTg4NCBDMTMuMTUxMjQxNiw5Ljk5ODA0MzQ5IDEzLjMxNDYxMTcsMTAuMzg4Mjc1NiAxMy42MDA1MDk0LDEwLjY4NDMxMzcgQzEzLjYxNDEyMzUsMTAuNjk3NzcgMTMuNjE0MTIzNSwxMC43MjQ2ODI1IDEzLjYwMDUwOTQsMTAuNzM4MTM4OCBMOS45NTE5MTA3NCwxNi4zODk3NzU5IEM5LjkzODI5NjU3LDE2LjQwMzIzMjIgOS45MjQ2ODIzOSwxNi40MTY2ODg1IDkuODk3NDU0MDUsMTYuNDE2Njg4NSBDOS43NDc2OTgxMywxNi4zNzYzMTk2IDkuNTg0MzI4MDQsMTYuMzQ5NDA3MSA5LjQzNDU3MjEzLDE2LjM0OTQwNzEgQzkuMjk4NDMwMzksMTYuMzQ5NDA3MSA5LjE0ODY3NDQ4LDE2LjM3NjMxOTYgOC45OTg5MTg1NiwxNi40MDMyMzIyIFogTTEzLjY2ODYwMTksOC4zNTY0MjAzNCBDMTMuNDkxNjE4Niw4LjI3NTY4MTk4IDkuMzUyOTMzMjQsNi41MjYzNTA4MyA5LjM1MjkzMzI0LDYuNTI2MzUwODMgQzkuMzM5MzE5MTQsNi41MTI4OTQ0NCA5LjMyNTcwNTA1LDYuNTEyODk0NDQgOS4zMzkzMTkxNCw2LjQ4NTk4MTY1IEM5LjMzOTMxOTE0LDYuNDcyNTI1MjYgOS4zMzkzMTkxNCw2LjQ1OTA2ODg2IDkuMzUyOTMzMjQsNi40NDU2MTI0NyBMMTUuODMzMjQzMiwwLjAxMzQ1NjM5MzUgQzE1LjgzMzI0MzIsMCAxNS44NDY4NTczLDAgMTUuODYwNDcxNCwwIEMxNS44NzQwODU1LDAgMTUuODc0MDg1NSwwIDE1Ljg4NzY5OTYsMC4wMTM0NTYzOTM1IEwxOC42Nzg1ODk0LDIuNzcyMDE3MDUgQzE4LjY5MjIwMzUsMi43ODU0NzM0NSAxOC42OTIyMDM1LDIuODEyMzg2MjMgMTguNjc4NTg5NCwyLjgyNTg0MjYzIEwxNS4zMTU5MDc2LDguMDMzNDY2OSBDMTUuMzAyMjkzNSw4LjA0NjkyMzI5IDE1LjI4ODY3OTQsOC4wNjAzNzk2OSAxNS4yNjE0NTEyLDguMDYwMzc5NjkgQzE1LjA4NDQ2NzksOC4wMDY1NTQxMSAxNC45MDc0ODQ3LDcuOTc5NjQxMzMgMTQuNzMwNTAxNCw3Ljk3OTY0MTMzIEMxNC4zNjI5MjA4LDcuOTc5NjQxMzMgMTMuOTk1MzQwMiw4LjExNDIwNTI2IDEzLjcwOTQ0NDIsOC4zNDI5NjM5NSBDMTMuNjk1ODMwMSw4LjM1NjQyMDM0IDEzLjY5NTgzMDEsOC4zNTY0MjAzNCAxMy42Njg2MDE5LDguMzU2NDIwMzQgWiBNNy43ODcyODk5NSwxNy4zMzE3NTExIEM3Ljc3MzY3NTgxLDE3LjM0NTIwNzQgNy43NjAwNjE2NywxNy4zNTg2NjM3IDcuNzQ2NDQ3NTIsMTcuMzU4NjYzNyBMMC4wNDA4NDI0Mjk4LDE1Ljc0MzkwOCBDMC4wMTM2MTQxNDMzLDE1Ljc0MzkwOCAwLDE1LjczMDQ1MTcgMCwxNS43MTY5OTU0IEMwLDE1LjcwMzUzOTEgMCwxNS42OTAwODI4IDAuMDEzNjE0MTQzMywxNS42NzY2MjY1IEw0LjMxNTY4MzQyLDExLjQyNDQzNjMgQzQuMzE1NjgzNDIsMTEuNDEwOTgwMSA0LjMyOTI5NzU2LDExLjQxMDk4MDEgNC4zNDI5MTE3MSwxMS40MTA5ODAxIEM0LjM3MDEzOTk5LDExLjQyNDQzNjMgNC4zNzAxMzk5OSwxMS40MjQ0MzYzIDQuMzgzNzU0MTMsMTEuNDM3ODkyNiBDNC4zODM3NTQxMywxMS40NTEzNDg5IDguMDczMTg2OTYsMTYuNzgwMDQyOSA4LjExNDAyOTM5LDE2LjgzMzg2ODEgQzguMTI3NjQzNTQsMTYuODQ3MzI0NCA4LjEyNzY0MzU0LDE2Ljg3NDIzNyA4LjExNDAyOTM5LDE2Ljg4NzY5MzMgQzcuOTkxNTAyMSwxNy4wMjIyNTYzIDcuODY4OTc0ODEsMTcuMTcwMjc1NSA3Ljc4NzI4OTk1LDE3LjMzMTc1MTEgWiBNNy4zNTE1NTc4MywxOC4yNDY3NDY0IEM3LjM3ODc4NTk0LDE4LjI0Njc0NjQgNy4zOTI0LDE4LjI2MDIwMjcgNy4zOTI0LDE4LjI4NzExNTEgQzcuMzkyNCwxOC4zMDA1NzEzIDcuMzc4Nzg1OTQsMTguMzE0MDI3NSA3LjM1MTU1NzgzLDE4LjM0MDkzOTkgTDMuNjM0OTIsMTkuOTE1MzE2NSBDMy42MzQ5MiwxOS45MTUzMTY1IDMuNjIxMzA1OTQsMTkuOTE1MzE2NSAzLjYwNzY5MTg4LDE5LjkwMTg2MDMgTDAuNjI2MjEzMTg1LDE2Ljk0MTQ5NDEgQzAuNjEyNTk5MTI3LDE2LjkyODAzNzggMC41OTg5ODUwNjksMTYuOTAxMTI1NCAwLjYxMjU5OTEyNywxNi44ODc2NjkyIEMwLjYyNjIxMzE4NSwxNi44NzQyMTMgMC42Mzk4MjcyNDMsMTYuODYwNzU2OCAwLjY2NzA1NTM1OSwxNi44NjA3NTY4IEw3LjM1MTU1NzgzLDE4LjI0Njc0NjQgWiIvPjwvc3ZnPg==);\n}\n\n.visuallyHidden {\n  border: 0;\n  clip: rect(0 0 0 0);\n  height: 1px;\n  margin: -1px;\n  overflow: hidden;\n  padding: 0;\n  position: absolute;\n  width: 1px;\n  #fff-space: nowrap;\n}\n\n.subheader {\n  margin-top: 2em;\n  border-top: 1px solid rgb(14, 30, 37);\n}\n\n.subheader h3 {\n    padding-top: 1em;\n    text-align: center;\n  }\n',"",{version:3,sources:["modal.css"],names:[],mappings:"AAiBA;EACE,wBAAwB;EACxB,cAA0B;EAC1B,gBAAgB;AAClB;;AACA;EACE,gBAAgB;EAChB,cAA0B;EAC1B,gBAAgB;AAClB;;AACA;EACE,WAAW;EACX,cAA0B;EAC1B,gBAAgB;AAClB;;AACA;EACE,gBAAgB;EAChB,cAA0B;EAC1B,gBAAgB;AAClB;;AAEA;EACE,kBAAkB;EAClB,MAAM;EACN,OAAO;EACP,WAAW;EACX,gBAAgB;EAChB,kBAAkB;EAClB,gBAAgB;EAChB,8BAAsB;UAAtB,sBAAsB;EACtB;+EAA8B;EAC9B,eAAe;EACf,gBAAgB;EAChB,oBAAa;EAAb,oBAAa;EAAb,aAAa;EACb,4BAAsB;EAAtB,6BAAsB;MAAtB,0BAAsB;UAAtB,sBAAsB;EACtB,yBAAmB;MAAnB,sBAAmB;UAAnB,mBAAmB;EACnB,cAAc;AAChB;;AAEA;EACE,WAAW;EACX,cAAc;EACd,eAAe;EACf,MAAM;EACN,SAAS;EACT,OAAO;EACP,QAAQ;EACR,sBAAsB;EACtB,WAAW;AACb;;AAEA;EACE,mBAAY;MAAZ,oBAAY;UAAZ,YAAY;EACZ,oBAAa;EAAb,oBAAa;EAAb,aAAa;EACb,4BAAsB;EAAtB,6BAAsB;MAAtB,0BAAsB;UAAtB,sBAAsB;EACtB,WAAW;AACb;;AAEA;EACE,kBAAkB;EAClB,aAA2B;EAC3B,UAAU;EACV,4CAAoC;UAApC,oCAAoC;EACpC,gBAAgB;AAMlB;;AAJE;IACE,2EAAmE;YAAnE,mEAAmE;IACnE,qCAA6B;YAA7B,6BAA6B;EAC/B;;AAGF;EACE;IACE,UAAU;IACV,8CAAsC;YAAtC,sCAAsC;EACxC;;EAEA;IACE,UAAU;IACV,yCAAiC;YAAjC,iCAAiC;EACnC;AACF;;AAVA;EACE;IACE,UAAU;IACV,8CAAsC;YAAtC,sCAAsC;EACxC;;EAEA;IACE,UAAU;IACV,yCAAiC;YAAjC,iCAAiC;EACnC;AACF;;AAEA;EACE;IACE,iCAAkC;IAClC,sCAA8B;YAA9B,8BAA8B;IAC9B,qCAA6B;YAA7B,6BAA6B;EAC/B;;EAEA;IACE,gBAAgB;IAChB,wBAAuB;QAAvB,qBAAuB;YAAvB,uBAAuB;EACzB;;EAEA;IACE,gBAAgB;IAChB;wCACqC;YADrC;wCACqC;IACrC,kBAAkB;IAClB,gBAA8B;EAChC;AACF;;AAEA;EACE;IACE,UAAU;EACZ;;EAEA;IACE,aAAa;EACf;AACF;;AARA;EACE;IACE,UAAU;EACZ;;EAEA;IACE,aAAa;EACf;AACF;;AAEA;EACE,kBAAkB;EAClB,sBAAuB;EACvB,gBAAgB;EAChB,eAAe;EACf,yBAAyB;EACzB,YAAY;EACZ,kBAAkB;EAClB,YAAY;EACZ,uCAA+B;EAA/B,+BAA+B;AACjC;;AAEA;;EAEE,UAAU;AACZ;;AAEA;EACE,cAAwB;EACxB,yBAAyB;EACzB,UAAU;AACZ;;AAEA;EACE,WAAW;EACX,qBAAqB;EACrB,kBAAkB;EAClB,QAAQ;EACR,iBAAiB;EACjB,WAAW;EACX,YAAY;EACZ,mCAAmC;EACnC,yzCAAyzC;AAC3zC;;AAEA;AACA;;AAEA;EACE,aAAa;EACb,oBAAoB;AACtB;;AAEA;EACE,kBAAkB;EAClB,cAAc;AAChB;;AAEA;EACE,eAAe;EACf,gBAAgB;AAClB;;AAEA;EACE,y2CAAy2C;EACz2C,2BAA2B;EAC3B,wBAAwB;EACxB,6BAA6B;EAC7B,0BAA0B;EAC1B,8CAAsC;UAAtC,sCAAsC;EACtC,oBAAoB;AACtB;;AAEA;EACE,YAAY;AACd;;AAEA;EACE;IACE,0BAA0B;EAC5B;;EAEA;IACE,4BAA4B;EAC9B;AACF;;AARA;EACE;IACE,0BAA0B;EAC5B;;EAEA;IACE,4BAA4B;EAC9B;AACF;;AAEA;EACE,cAAc;EACd,kBAAkB;EAClB,WAAW;EACX,YAAY;EACZ,gBAAgB;EAChB,YAAY;EACZ,UAAU;EACV,eAAe;EACf,iCAAkC;EAClC,kBAAkB;EAClB,yBAAyB;EACzB,WAAW;EACX,8CAAsC;EAAtC,sCAAsC;EACtC;+EAA8B;EAC9B,eAAe;EACf,gBAAgB;EAChB,iBAAiB;EACjB,kBAAkB;EAClB,qBAAqB;EACrB,mBAAmB;AACrB;;AAEA;;EAEE,iCAAkC;EAClC,qBAAqB;AACvB;;AAEA;EACE,kBAAkB;EAClB,MAAM;EACN,QAAQ;EACR,SAAS;EACT,UAAU;EACV,SAAS;EACT,WAAW;EACX,YAAY;EACZ,kBAAkB;EAClB,WAAW;EACX,gBAAgB;EAChB,cAA0B;AAC5B;;AAEA;EACE,YAAY;EACZ,eAAe;EACf,gBAAgB;AAClB;;AAEA;;EAEE,mBAAmB;EACnB,sBAAuB;AACzB;;AAEA;EACE,oBAAa;EAAb,oBAAa;EAAb,aAAa;EACb,gBAAgB;EAChB,mBAAiC;AACnC;;AAEA;EACE,eAAe;EACf,iBAAiB;EACjB,gBAAgB;EAChB,cAA0B;EAC1B,SAAS;EACT,gCAAgC;EAChC,0BAA0B;EAC1B,SAAS;AACX;;AAEA;;EAEE,gBAAgB;EAChB,sBAAuB;EACvB,6BAA8B;EAC9B,gBAAgB;AAClB;;AAEA;EACE,yBAAyB;EACzB,sBAAuB;AACzB;;AAEA;EACE,YAAY;AACd;;AAEA;EACE,cAAc;EACd,kBAAkB;EAClB,WAAW;EACX,YAAY;EACZ,mBAAmB;EACnB,YAAY;EACZ,iBAAiB;EACjB,UAAU;EACV,eAAe;EACf,sBAAuB;EACvB,YAAY;EACZ,gCAAgC;EAChC,gBAAgB;EAChB,yBAAyB;EACzB,0CAAkC;EAAlC,kCAAkC;EAClC;+EAA8B;EAC9B,eAAe;EACf,gBAAgB;EAChB,iBAAiB;EACjB,kBAAkB;EAClB,mBAAmB;AACrB;;AAEA;;EAEE,yBAAyB;EACzB,qBAAiC;AACnC;;AAEA;AACA;;AAEA;EACE,kBAAkB;EAClB,gBAAgB;AAClB;;AAEA;EACE,8BAAsB;UAAtB,sBAAsB;EACtB,cAAc;EACd,WAAW;EACX,YAAY;EACZ,SAAS;EACT,0BAA0B;EAC1B,yBAAyB;EACzB,kBAAkB;EAClB,gBAAgB;EAChB,sBAAuB;EACvB,wBAAgB;UAAhB,gBAAgB;EAChB,eAAe;EACf,gBAAgB;EAChB,iBAAiB;EACjB,wDAAwC;EAAxC,gDAAwC;EAAxC,wCAAwC;EAAxC,8EAAwC;EACxC,wBAAwB;EACxB,qBAAqB;AACvB;;AAEA;EACE,kBAAkB;EAClB,SAAS;EACT,UAAU;EACV,qBAAqB;EACrB,WAAW;EACX,YAAY;EACZ,4BAA4B;EAC5B,2BAA2B;EAC3B,oBAAoB;AACtB;;AAEA;EACE,6jBAA6jB;AAC/jB;;AAEA;EACE,65DAA65D;AAC/5D;;AAEA;EACE,qkEAAqkE;AACvkE;;AAEA;EACE,yyCAAyyC;AAC3yC;;AAEA;AACA;;AAEA;EACE,SAAS;EACT,6BAA6B;EAC7B,mBAAiC;EACjC,kBAAkB;EAClB,iBAAiB;AACnB;;AAEA;EACE,aAAa;EACb,kBAAkB;EAClB,qBAAqB;EACrB,eAAe;EACf,gBAAgB;EAChB,cAAc;EACd,yBAAyB;EACzB,sBAAsB;EACtB,sBAAuB;EACvB,YAAY;EACZ,UAAU;AACZ;;AAEA;EACE,kBAAkB;EAClB,mBAAmB;AACrB;;AAEA;EACE,WAAW;EACX,kBAAkB;EAClB,qBAAqB;EACrB,sBAAsB;EACtB,WAAW;EACX,YAAY;EACZ,4BAA4B;EAC5B,gCAAgC;EAChC,SAAS;EACT,UAAU;AACZ;;AAEA;EACE,yBAA4C;EAC5C,qBAA2C;AAC7C;;AAEA;;EAEE,yBAA+C;AACjD;;AAEA;EACE,sBAA4C;EAC5C,kBAA2C;AAC7C;;AAEA;;EAEE,sBAA+C;AACjD;;AAEA;EACE,yBAA4C;EAC5C,qBAA2C;AAC7C;;AAEA;;EAEE,yBAA+C;AACjD;;AAEA;EACE,yBAA+C;EAC/C,qBAA8C;AAChD;;AAEA;;EAEE,yBAAkD;AACpD;;AAEA;EACE,i9DAAi9D;AACn9D;;AAEA;EACE,ikKAAikK;AACnkK;;AAEA;EACE,imDAAimD;AACnmD;;AAEA;EACE,y2FAAy2F;AAC32F;;AAEA;EACE,cAAc;EACd,aAA2B;EAC3B,eAAe;EACf,gBAAgB;EAChB,qBAAqB;EACrB,cAA0B;EAC1B,kBAAkB;AACpB;;AAEA;EACE,aAAa;EACb,iCAAyB;EAAzB,yBAAyB;AAC3B;;AAEA;EACE,UAAU;AACZ;;AAEA;EACE,cAAc;EACd,YAAY;EACZ,WAAW;EACX,YAAY;EACZ,kBAAkB;EAClB,qlYAAqlY;AACvlY;;AAEA;EACE,SAAS;EACT,mBAAmB;EACnB,WAAW;EACX,YAAY;EACZ,gBAAgB;EAChB,UAAU;EACV,kBAAkB;EAClB,UAAU;EACV,kBAAkB;AACpB;;AAEA;EACE,eAAe;EACf,qCAAqC;AAMvC;;AAJE;IACE,gBAAgB;IAChB,kBAAkB;EACpB",file:"modal.css",sourcesContent:[':root {\n  --baseColor: rgb(14, 30, 37);\n  --subduedColor: #a3a9ac;\n  --errorColor: #fa3946;\n  --providerColorGoogle: #4285f4;\n  --providerAltColorGoogle: #366dc7;\n  --providerColorGitHub: #333;\n  --providerAltColorGitHub: #000;\n  --providerColorGitLab: #e24329;\n  --providerAltColorGitLab: #b03320;\n  --providerColorBitbucket: #205081;\n  --providerAltColorBitbucket: #14314f;\n  --fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,\n    Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";\n  --basePadding: 32px;\n}\n\n::-webkit-input-placeholder {\n  /* Chrome/Opera/Safari */\n  color: var(--subduedColor);\n  font-weight: 500;\n}\n::-moz-placeholder {\n  /* Firefox 19+ */\n  color: var(--subduedColor);\n  font-weight: 500;\n}\n:-ms-input-placeholder {\n  /* IE 10+ */\n  color: var(--subduedColor);\n  font-weight: 500;\n}\n:-moz-placeholder {\n  /* Firefox 18- */\n  color: var(--subduedColor);\n  font-weight: 500;\n}\n\n.modalContainer {\n  position: absolute;\n  top: 0;\n  left: 0;\n  width: 100%;\n  min-height: 100%;\n  overflow-x: hidden;\n  overflow-y: auto;\n  box-sizing: border-box;\n  font-family: var(--fontFamily);\n  font-size: 14px;\n  line-height: 1.5;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  z-index: 99999;\n}\n\n.modalContainer::before {\n  content: "";\n  display: block;\n  position: fixed;\n  top: 0;\n  bottom: 0;\n  left: 0;\n  right: 0;\n  background-color: #fff;\n  z-index: -1;\n}\n\n.modalDialog {\n  flex-grow: 1;\n  display: flex;\n  flex-direction: column;\n  width: 100%;\n}\n\n.modalContent {\n  position: relative;\n  padding: var(--basePadding);\n  opacity: 0;\n  transform: translateY(10px) scale(1);\n  background: #fff;\n\n  [aria-hidden="false"] & {\n    animation: bouncyEntrance 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28);\n    animation-fill-mode: forwards;\n  }\n}\n\n@keyframes bouncyEntrance {\n  0% {\n    opacity: 0;\n    transform: translateY(10px) scale(0.9);\n  }\n\n  100% {\n    opacity: 1;\n    transform: translateY(0) scale(1);\n  }\n}\n\n@media (min-width: 480px) {\n  .modalContainer::before {\n    background-color: var(--baseColor);\n    animation: fadeIn 0.1s ease-in;\n    animation-fill-mode: forwards;\n  }\n\n  .modalDialog {\n    max-width: 364px;\n    justify-content: center;\n  }\n\n  .modalContent {\n    background: #fff;\n    box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.07),\n      0 12px 32px 0 rgba(14, 30, 37, 0.1);\n    border-radius: 8px;\n    margin-top: var(--basePadding);\n  }\n}\n\n@keyframes fadeIn {\n  0% {\n    opacity: 0;\n  }\n\n  100% {\n    opacity: 0.67;\n  }\n}\n\n.flashMessage {\n  text-align: center;\n  color: var(--baseColor);\n  font-weight: 500;\n  font-size: 14px;\n  background-color: #f2f3f3;\n  padding: 6px;\n  border-radius: 4px;\n  opacity: 0.7;\n  transition: opacity 0.2s linear;\n}\n\n.flashMessage:hover,\n.flashMessage:focus {\n  opacity: 1;\n}\n\n.error {\n  color: var(--errorColor);\n  background-color: #fceef0;\n  opacity: 1;\n}\n\n.error span::before {\n  content: "";\n  display: inline-block;\n  position: relative;\n  top: 3px;\n  margin-right: 4px;\n  width: 16px;\n  height: 16px;\n  background: no-repeat center center;\n  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE2IDE2Ij4KICA8cGF0aCBmaWxsPSIjRkEzOTQ2IiBkPSJNOCwxLjMzMzMzMzMzIEMxMS42NzYsMS4zMzMzMzMzMyAxNC42NjY2NjY3LDQuMzI0IDE0LjY2NjY2NjcsOCBDMTQuNjY2NjY2NywxMS42NzYgMTEuNjc2LDE0LjY2NjY2NjcgOCwxNC42NjY2NjY3IEM0LjMyNCwxNC42NjY2NjY3IDEuMzMzMzMzMzMsMTEuNjc2IDEuMzMzMzMzMzMsOCBDMS4zMzMzMzMzMyw0LjMyNCA0LjMyNCwxLjMzMzMzMzMzIDgsMS4zMzMzMzMzMyBaIE04LDAgQzMuNTgyLDAgMCwzLjU4MiAwLDggQzAsMTIuNDE4IDMuNTgyLDE2IDgsMTYgQzEyLjQxOCwxNiAxNiwxMi40MTggMTYsOCBDMTYsMy41ODIgMTIuNDE4LDAgOCwwIFogTTcuMTI2NjY2NjcsNS4wMTczMzMzMyBDNy4wNjA2NjY2Nyw0LjQ3OTMzMzMzIDcuNDc4NjY2NjcsNCA4LjAyNTMzMzMzLDQgQzguNTM5MzMzMzMsNCA4Ljk0MzMzMzMzLDQuNDUwNjY2NjcgOC44Nzg2NjY2Nyw0Ljk2NzMzMzMzIEw4LjM3NCw5LjAwMjY2NjY3IEM4LjM1MDY2NjY3LDkuMTkxMzMzMzMgOC4xOSw5LjMzMzMzMzMzIDgsOS4zMzMzMzMzMyBDNy44MSw5LjMzMzMzMzMzIDcuNjQ5MzMzMzMsOS4xOTEzMzMzMyA3LjYyNTMzMzMzLDkuMDAyNjY2NjcgTDcuMTI2NjY2NjcsNS4wMTczMzMzMyBMNy4xMjY2NjY2Nyw1LjAxNzMzMzMzIFogTTgsMTIuMTY2NjY2NyBDNy41NCwxMi4xNjY2NjY3IDcuMTY2NjY2NjcsMTEuNzkzMzMzMyA3LjE2NjY2NjY3LDExLjMzMzMzMzMgQzcuMTY2NjY2NjcsMTAuODczMzMzMyA3LjU0LDEwLjUgOCwxMC41IEM4LjQ2LDEwLjUgOC44MzMzMzMzMywxMC44NzMzMzMzIDguODMzMzMzMzMsMTEuMzMzMzMzMyBDOC44MzMzMzMzMywxMS43OTMzMzMzIDguNDYsMTIuMTY2NjY2NyA4LDEyLjE2NjY2NjcgWiIvPgo8L3N2Zz4K);\n}\n\n.success {\n}\n\n.disabled {\n  opacity: 0.38;\n  pointer-events: none;\n}\n\n.infoText {\n  text-align: center;\n  margin: 32px 0;\n}\n\n.infoTextEmail {\n  font-size: 16px;\n  font-weight: 500;\n}\n\n.saving {\n  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABQCAMAAACeYYN3AAAAxlBMVEUAAAD////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////DTx3aAAAAQnRSTlMAAQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8wMTIzNDU2Nzg5Ojs8PT4/QEGgjKRfAAACk0lEQVR4AYXQDXP5WhAG8CUhiSQqSv4RRRMVL1Fa1VZf3PL9v9Tde9wc9M8+P8/M7s6czJiHgNIvVCJO6YiAMlAiWckASiQrm4bJMZTDrmbBIEC9qpgVjp6n4B+oyEwCzKrMQBVaQIlkpmXZln1dhQB+49gOh5dLexlV6MhsAqyazEQVugCqsOK5nsQmwPWZ53ucvyczSGb4l9T9OsdnLgFOXVZFFd4AqEKrIasR4AdBI2hw1GR6VzMwSWY2A60ZNDl6KnUC3KbMRhXeAqhCpyXzCAjarNVucdqXVEhWaRfCdsj5vQcE1EOZQ7Jy+EcUlklWi2Q3BLQ6nagTcTra2Y0qrHZirRN3OOezTUAjvq4bd7suqpDfSGJUoXcnCwiIerIqqlC96vf6HD1ZsUcE3PYH/QGnrx3uYnqoQn4l6aMK/XtZi4BuIrNIZqVJkiapkhx37Y6AcDgcpsNU44Nz3OuoQn4jSVGFNw+ykID+SGaTzM5G2YiTFVM73AMConE2zjhj7XAXs4EqHE/4d12GKgwmsoiAZCpzSObMptPZdHZVSkCc5/ksnym8cPRUmiQzpvNcmedzTl4o7qlBsuZc1iVg9ChDFdYWshEBveV/FssFZ/l7Z7eowsfl0/JJ4UXj43A/ogpbT7IeAZNnWQ1VuJJNCBi8HKxeVhw9tRaq8JkfrV/WHDULxb1CFbbX7HX9yllfck9A/ipzSea+yeYEJO+yEFX4tim8b94VXjj/zzdU4Z/NmY/NB+fkTglYfMg8knmfsiUBD1+yCFX4+X309f3FOds/UYVR8fH2e6vwovExIuB5K/NJ5v8jWxGQ/chiVOF2d+pn98M5zt3WJFm83+/2O4UXjprabkzAWn+o56k9qvBfX4hMaM+SxOMAAAAASUVORK5CYII=);\n  background-repeat: repeat-x;\n  background-size: contain;\n  background-origin: border-box;\n  background-position: 0% 0%;\n  animation: loading 20s linear infinite;\n  pointer-events: none;\n}\n\n.saving::after {\n  content: "…";\n}\n\n@keyframes loading {\n  0% {\n    background-position: 0% 0%;\n  }\n\n  100% {\n    background-position: 700% 0%;\n  }\n}\n\n.btn {\n  display: block;\n  position: relative;\n  width: 100%;\n  height: auto;\n  margin: 14px 0 0;\n  padding: 6px;\n  outline: 0;\n  cursor: pointer;\n  border: 2px solid var(--baseColor);\n  border-radius: 4px;\n  background-color: #2d3b41;\n  color: #fff;\n  transition: background-color 0.2s ease;\n  font-family: var(--fontFamily);\n  font-size: 14px;\n  font-weight: 500;\n  line-height: 24px;\n  text-align: center;\n  text-decoration: none;\n  white-space: nowrap;\n}\n\n.btn:hover,\n.btn:focus {\n  background-color: var(--baseColor);\n  text-decoration: none;\n}\n\n.btnClose {\n  position: absolute;\n  top: 0;\n  right: 0;\n  margin: 0;\n  padding: 0;\n  border: 0;\n  width: 24px;\n  height: 24px;\n  border-radius: 50%;\n  margin: 6px;\n  background: #fff;\n  color: var(--subduedColor);\n}\n\n.btnClose::before {\n  content: "×";\n  font-size: 25px;\n  line-height: 9px;\n}\n\n.btnClose:hover,\n.btnClose:focus {\n  background: #e9ebeb;\n  color: var(--baseColor);\n}\n\n.header {\n  display: flex;\n  margin-top: -8px;\n  margin-bottom: var(--basePadding);\n}\n\n.btnHeader {\n  font-size: 16px;\n  line-height: 24px;\n  background: #fff;\n  color: var(--subduedColor);\n  border: 0;\n  border-bottom: 2px solid #e9ebeb;\n  border-radius: 4px 4px 0 0;\n  margin: 0;\n}\n\n.btnHeader:focus,\n.btnHeader.active {\n  background: #fff;\n  color: var(--baseColor);\n  border-color: var(--baseColor);\n  font-weight: 700;\n}\n\n.btnHeader:not(:only-child):hover {\n  background-color: #e9ebeb;\n  color: var(--baseColor);\n}\n\n.btnHeader:only-child {\n  cursor: auto;\n}\n\n.btnLink {\n  display: block;\n  position: relative;\n  width: auto;\n  height: auto;\n  margin: 14px auto 0;\n  padding: 6px;\n  padding-bottom: 0;\n  outline: 0;\n  cursor: pointer;\n  color: var(--baseColor);\n  border: none;\n  border-bottom: 2px solid #e9ebeb;\n  border-radius: 0;\n  background-color: inherit;\n  transition: border-color 0.2s ease;\n  font-family: var(--fontFamily);\n  font-size: 14px;\n  font-weight: 500;\n  line-height: 24px;\n  text-align: center;\n  white-space: nowrap;\n}\n\n.btnLink:hover,\n.btnLink:focus {\n  background-color: inherit;\n  border-color: var(--subduedColor);\n}\n\n.form {\n}\n\n.formGroup {\n  position: relative;\n  margin-top: 14px;\n}\n\n.formControl {\n  box-sizing: border-box;\n  display: block;\n  width: 100%;\n  height: 40px;\n  margin: 0;\n  padding: 6px 12px 6px 34px;\n  border: 2px solid #e9ebeb;\n  border-radius: 4px;\n  background: #fff;\n  color: var(--baseColor);\n  box-shadow: none;\n  font-size: 16px;\n  font-weight: 500;\n  line-height: 24px;\n  transition: box-shadow ease-in-out 0.15s;\n  -webkit-appearance: none;\n  -moz-appearance: none;\n}\n\n.inputFieldIcon {\n  position: absolute;\n  top: 12px;\n  left: 12px;\n  display: inline-block;\n  width: 16px;\n  height: 16px;\n  background-repeat: no-repeat;\n  background-position: center;\n  pointer-events: none;\n}\n\n.inputFieldName {\n  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNCIgaGVpZ2h0PSIxNCIgdmlld0JveD0iMCAwIDE0IDE0Ij4gIDxwYXRoIGZpbGw9IiNBM0E5QUMiIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTgsNyBDNi4zNDMxNDU3NSw3IDUsNS42NTY4NTQyNSA1LDQgQzUsMi4zNDMxNDU3NSA2LjM0MzE0NTc1LDEgOCwxIEM5LjY1Njg1NDI1LDEgMTEsMi4zNDMxNDU3NSAxMSw0IEMxMSw1LjY1Njg1NDI1IDkuNjU2ODU0MjUsNyA4LDcgWiBNOCwxNSBMMS41LDE1IEMxLjUsMTEuMTM0MDA2OCA0LjQxMDE0OTEzLDggOCw4IEMxMS41ODk4NTA5LDggMTQuNSwxMS4xMzQwMDY4IDE0LjUsMTUgTDgsMTUgWiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTEgLTEpIi8+PC9zdmc+);\n}\n\n.inputFieldEmail {\n  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxMSIgdmlld0JveD0iMCAwIDE2IDExIj4gIDxwYXRoIGZpbGw9IiNBM0E5QUMiIGQ9Ik0xLjE3MDczMTcxLDMgQzAuNTIyMTQ2MzQxLDMgMy45MDI0NTk4N2UtMDgsMy41NDUxMTA4MSAzLjkwMjQ1OTg3ZS0wOCw0LjIyMjIyMTU0IEwzLjkwMjQ1OTg3ZS0wOCwxMi43Nzc3Nzg1IEMzLjkwMjQ1OTg3ZS0wOCwxMy40NTQ4ODkyIDAuNTIyMTQ2MzQxLDE0IDEuMTcwNzMxNzEsMTQgTDE0LjgyOTI2ODMsMTQgQzE1LjQ3Nzg1MzcsMTQgMTYsMTMuNDU0ODg5MiAxNiwxMi43Nzc3Nzg1IEwxNiw0LjIyMjIyMTU0IEMxNiwzLjU0NTExMDgxIDE1LjQ3Nzg1MzcsMyAxNC44MjkyNjgzLDMgTDEuMTcwNzMxNzEsMyBaIE0yLjMzNzQyMTE5LDUuMDAxODY1NjYgQzIuNDU3NTExNzUsNC45ODk1NTIxNCAyLjU2MDcxNDU3LDUuMDM5MzM5OCAyLjYzNjM1OTg1LDUuMTE3Mjg0MzcgTDcuNDgyNjA2MTcsMTAuMTEzMjU0NSBDNy43ODQ0ODgyMiwxMC40MjQ3NDU1IDguMjAzMjc4MjksMTAuNDI0NzY2IDguNTA1ODk2MTksMTAuMTEzMjU0NSBMMTMuMzYzNjQwMiw1LjExNzI4NDM3IEMxMy41MDUxMjU1LDQuOTcxMjA0OTkgMTMuNzUyOTc3OSw0Ljk4MTg5NzIzIDEzLjg4MzkyMjIsNS4xMzk3MzYwMiBDMTQuMDE0ODY2NSw1LjI5NzU3NDgxIDE0LjAwNTI4MjEsNS41NzQwNzQ4OCAxMy44NjM3OTY3LDUuNzIwMTU0MjYgTDExLjExNTg2MDYsOC41NDg0MTE1MiBMMTMuODU4MDU3MSwxMS4yNjc2NDY5IEMxNC4wMjE3ODM1LDExLjQwMzE5ODIgMTQuMDQ4OTM2MywxMS43MDE0OTMyIDEzLjkxMjk4ODIsMTEuODcwOTg4OCBDMTMuNzc3MDQwMSwxMi4wNDA1MDQ5IDEzLjUwODI4OTcsMTIuMDQzNDE5MSAxMy4zNjkzOTgyLDExLjg3Njk0MDQgTDEwLjU3NTQ3MTUsOS4xMDYzOTg2MiBMOS4wMDYwNTI3NSwxMC43MTYxMjQ0IEM4LjQzNDk0MTk1LDExLjMwNDAzMzQgNy41NTMzMDI4NiwxMS4zMDUxNjIxIDYuOTgyNDY4LDEwLjcxNjEyNDQgTDUuNDI0NTI4NSw5LjEwNjM5ODYyIEwyLjYzMDYwMTgzLDExLjg3Njk0MDQgQzIuNDkxNzEwMzMsMTIuMDQzNDM5NyAyLjIyMjk1OTg4LDEyLjA0MDUyNTUgMi4wODcwMTE3OCwxMS44NzA5ODg4IEMxLjk1MTA2MzY3LDExLjcwMTQ5MzIgMS45NzgyMTY1LDExLjQwMzE5ODIgMi4xNDE5NDI5LDExLjI2NzY0NjkgTDQuODg0MTM5MzksOC41NDg0MTE1MiBMMi4xMzYyMDMyOCw1LjcyMDE1NDI2IEMyLjAyODcxNDE0LDUuNjE2MjI4MTYgMS45ODM1NTE0MSw1LjQzODk1NDUzIDIuMDI1OTkxNSw1LjI4NzQ5ODI1IEMyLjA2ODQxMzE5LDUuMTM2MDYyNDkgMi4xOTYwMjc4MSw1LjAxOTAyMjQ5IDIuMzM3NDIxMTksNS4wMDE4NjU2NiBaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwIC0zKSIvPjwvc3ZnPg==);\n}\n\n.inputFieldPassword {\n  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMiIgaGVpZ2h0PSIxNCIgdmlld0JveD0iMCAwIDEyIDE0Ij4gIDxwYXRoIGZpbGw9IiNBM0E5QUMiIGQ9Ik0yLjQ0NTkxMDQ1LDMuNjQzMDg0MjcgQzIuNDQ1OTEwMzgsMi42NzY2MjEzNyAyLjgxODk3NTQ2LDEuNzQ5NzYzOTMgMy40ODI5OTUxOCwxLjA2NjUxMDUyIEM0LjE0NzAxNDksMC4zODMyNTcxMTEgNS4wNDc1NjY0MywtMC4wMDAzOTMwNDg2MTggNS45ODY0NDEwNSwzLjAyMTc0MDY5ZS0wNyBMNi4xMTc1MTg0NywzLjAyMTc0MDY5ZS0wNyBDOC4wNjkyOTIwNSwwLjAwMjQ1Mjc4Mzg0IDkuNjUwNzAwMTMsMS42MzA5OTI4MyA5LjY1MjI4NzQyLDMuNjQwMTE4NzkgTDkuNjUyMjg3NDIsNC42NzgwMzQ0NSBDOS4xMzk1MDEwNSw0LjcwMzI0MDk4IDguNjM2Nzk3NTYsNC43NDYyNDAzNCA4LjEzMTIxMzI1LDQuODAxMTAxNiBMOC4xMzEyMTMyNSwzLjY0MzA4NDI3IEM4LjEzMTIxMzI1LDIuNDk2NjM0MjkgNy4yMjgzNjE2LDEuNTY3MjUyOTUgNi4xMTQ2Mzc2NCwxLjU2NzI1Mjk1IEw1Ljk4MzU2MDIzLDEuNTY3MjUyOTUgQzQuODY5ODM2MjgsMS41NjcyNTI5NSAzLjk2Njk4NDYyLDIuNDk2NjM0MjkgMy45NjY5ODQ2MiwzLjY0MzA4NDI3IEwzLjk2Njk4NDYyLDMuOTYwMzg5OTEgQzMuOTY3NTc5ODgsNC4zNTY0OTE4MiAzLjY3NzAzNTY1LDQuNjg4ODc1OTUgMy4yOTQzMTI2Miw0LjcyOTkzMDI0IEwzLjI3ODQ2ODEsNC43Mjk5MzAyNCBDMy4wNjYyNDA5Miw0Ljc1MzUwMjk2IDIuODU0MjgyODcsNC42ODMxMDg3IDIuNjk1NDU2MTMsNC41MzYzMDM3NiBDMi41MzY2Mjk0LDQuMzg5NDk4ODIgMi40NDU5MDUzMyw0LjE4MDEyMTMzIDIuNDQ1OTEwNDUsMy45NjAzODk5MSBMMi40NDU5MTA0NSwzLjY0MzA4NDI3IFogTTExLjQxNjY2Niw3LjExNTY1MzUyIEwxMS40MTY2NjYsMTIuNjkwNzQzMyBDMTEuNDE3MDQwOCwxMy4wODMxMTQzIDExLjE0NTkyMDMsMTMuNDIwMTM3MSAxMC43NzEzNjE4LDEzLjQ5MjkwMzkgTDEwLjI5MDI2NDQsMTMuNTg2MzE2MyBDOC44NzYwNzU2NCwxMy44NjE1OTU5IDcuNDM5OTcxMzMsMTQuMDAwMDkzNyA2LjAwMDcyMDA1LDEzLjk5OTk5OTggQzQuNTYwOTg3NTgsMTQuMDAwMTg2MiAzLjEyNDM5Njg0LDEzLjg2MTY4OCAxLjcwOTczNTI0LDEzLjU4NjMxNjMgTDEuMjI4NjM3OTIsMTMuNDkyOTAzOSBDMC44NTQwNzk0MDcsMTMuNDIwMTM3MSAwLjU4Mjk1ODg2NywxMy4wODMxMTQzIDAuNTgzMzMzNzIyLDEyLjY5MDc0MzMgTDAuNTgzMzMzNzIyLDcuMTE1NjUzNTIgQzAuNTgyOTU4ODY3LDYuNzIzMjgyNTYgMC44NTQwNzk0MDcsNi4zODYyNTk4MSAxLjIyODYzNzkyLDYuMzEzNDkyOTkgTDEuMjk5MjE4MDYsNi4zMDAxNDgzNiBDNC40MDU5OTg0Nyw1LjY5NTEyMTY3IDcuNTk1NDQxNjIsNS42OTUxMjE2NyAxMC43MDIyMjIsNi4zMDAxNDgzNiBMMTAuNzcyODAyMiw2LjMxMzQ5Mjk5IEMxMS4xNDY3ODgsNi4zODY4ODY0NSAxMS40MTcxNzE2LDYuNzIzNzQ1MTYgMTEuNDE2NjY2LDcuMTE1NjUzNTIgWiIvPjwvc3ZnPg==);\n}\n\n.inputFieldUrl {\n  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNCIgaGVpZ2h0PSIxNCIgdmlld0JveD0iMCAwIDE0IDE0Ij4gIDxwYXRoIGZpbGw9IiNBM0E5QUMiIGQ9Ik0xMCw1IEMxMCwzLjg5NTQzMDUgOS4xMDQ1Njk1LDMgOCwzIEM2Ljg5NTQzMDUsMyA2LDMuODk1NDMwNSA2LDUgTTQsMTAgTDQsMTEgTDYsMTEgTDYsMTAgQzYsOS40NDc3MTUyNSA1LjU1MjI4NDc1LDkgNSw5IEM0LjQ0NzcxNTI1LDkgNCw5LjQ0NzcxNTI1IDQsMTAgWiBNMTIsMTAgQzEyLDkuNDQ3NzE1MjUgMTEuNTUyMjg0Nyw5IDExLDkgQzEwLjQ0NzcxNTMsOSAxMCw5LjQ0NzcxNTI1IDEwLDEwIEwxMCwxMSBMMTIsMTEgTDEyLDEwIFogTTYsNiBMNiw1IEw0LDUgTDQsNiBDNCw2LjU1MjI4NDc1IDQuNDQ3NzE1MjUsNyA1LDcgQzUuNTUyMjg0NzUsNyA2LDYuNTUyMjg0NzUgNiw2IFogTTEwLDYgQzEwLDYuNTUyMjg0NzUgMTAuNDQ3NzE1Myw3IDExLDcgQzExLjU1MjI4NDcsNyAxMiw2LjU1MjI4NDc1IDEyLDYgTDEyLDUgTDEwLDUgTDEwLDYgWiBNNCw1IEM0LDIuNzkwODYxIDUuNzkwODYxLDEgOCwxIEMxMC4yMDkxMzksMSAxMiwyLjc5MDg2MSAxMiw1IEw0LDUgWiBNNCwxMSBMMTIsMTEgQzEyLDEzLjIwOTEzOSAxMC4yMDkxMzksMTUgOCwxNSBDNS43OTA4NjEsMTUgNCwxMy4yMDkxMzkgNCwxMSBaIE0xMCwxMSBMNiwxMSBDNiwxMi4xMDQ1Njk1IDYuODk1NDMwNSwxMyA4LDEzIEM5LjEwNDU2OTUsMTMgMTAsMTIuMTA0NTY5NSAxMCwxMSBaIE04LDExIEM3LjQ0NzcxNTI1LDExIDcsMTAuNTUyMjg0NyA3LDEwIEw3LDYgQzcsNS40NDc3MTUyNSA3LjQ0NzcxNTI1LDUgOCw1IEM4LjU1MjI4NDc1LDUgOSw1LjQ0NzcxNTI1IDksNiBMOSwxMCBDOSwxMC41NTIyODQ3IDguNTUyMjg0NzUsMTEgOCwxMSBaIiB0cmFuc2Zvcm09InJvdGF0ZSg0NSA4LjcwNyA2LjI5MykiLz48L3N2Zz4=);\n}\n\n.formLabel {\n}\n\n.hr {\n  border: 0;\n  border-top: 2px solid #e9ebeb;\n  margin: var(--basePadding) 0 -1px;\n  text-align: center;\n  overflow: visible;\n}\n\n.hr::before {\n  content: "or";\n  position: relative;\n  display: inline-block;\n  font-size: 12px;\n  font-weight: 800;\n  line-height: 1;\n  text-transform: uppercase;\n  background-color: #fff;\n  color: var(--baseColor);\n  padding: 4px;\n  top: -11px;\n}\n\n.btnProvider {\n  padding-left: 40px;\n  padding-right: 40px;\n}\n\n.btnProvider::before {\n  content: "";\n  position: absolute;\n  display: inline-block;\n  vertical-align: middle;\n  width: 32px;\n  height: 40px;\n  background-repeat: no-repeat;\n  background-position: left center;\n  top: -2px;\n  left: 14px;\n}\n\n.providerGoogle {\n  background-color: var(--providerColorGoogle);\n  border-color: var(--providerAltColorGoogle);\n}\n\n.providerGoogle:hover,\n.providerGoogle:focus {\n  background-color: var(--providerAltColorGoogle);\n}\n\n.providerGitHub {\n  background-color: var(--providerColorGitHub);\n  border-color: var(--providerAltColorGitHub);\n}\n\n.providerGitHub:hover,\n.providerGitHub:focus {\n  background-color: var(--providerAltColorGitHub);\n}\n\n.providerGitLab {\n  background-color: var(--providerColorGitLab);\n  border-color: var(--providerAltColorGitLab);\n}\n\n.providerGitLab:hover,\n.providerGitLab:focus {\n  background-color: var(--providerAltColorGitLab);\n}\n\n.providerBitbucket {\n  background-color: var(--providerColorBitbucket);\n  border-color: var(--providerAltColorBitbucket);\n}\n\n.providerBitbucket:hover,\n.providerBitbucket:focus {\n  background-color: var(--providerAltColorBitbucket);\n}\n\n.providerGoogle:before {\n  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMyIgaGVpZ2h0PSIxMiIgdmlld0JveD0iMCAwIDEzIDEyIj4gIDxnIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTEuNDg4IC0yKSI+ICAgIDxyZWN0IHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIvPiAgICA8cGF0aCBmaWxsPSIjRkZGRkZGIiBmaWxsLXJ1bGU9Im5vbnplcm8iIGQ9Ik0wLjY1MjczNDM3NSwzLjI5NTI4MjQ0IEMwLjIzNzk4NDM3NSw0LjEwNTgzMjA2IDIuODQyMTcwOTRlLTE0LDUuMDE2MDQ1OCAyLjg0MjE3MDk0ZS0xNCw1Ljk3OTM4OTMxIEMyLjg0MjE3MDk0ZS0xNCw2Ljk0MjczMjgyIDAuMjM3OTg0Mzc1LDcuODUyOTAwNzYgMC42NTI3MzQzNzUsOC42NjM0NTAzOCBDMS42NTkwNDY4NywxMC42MTY3MDIzIDMuNzI2MDkzNzUsMTEuOTU4Nzc4NiA2LjExOTUzMTI1LDExLjk1ODc3ODYgQzcuNzcxNzgxMjUsMTEuOTU4Nzc4NiA5LjE1ODg1OTM3LDExLjQyNzI1MTkgMTAuMTcyMDE1NiwxMC41MTA0NDI3IEMxMS4zMjc5MDYyLDkuNDY3MzU4NzggMTEuOTk0MjgxMiw3LjkzMjY0MTIyIDExLjk5NDI4MTIsNi4xMTIyNTk1NCBDMTEuOTk0MjgxMiw1LjYyMDYyNTk1IDExLjk1MzQ1MzEsNS4yNjE4NjI2IDExLjg2NTA5MzcsNC44ODk4MTY3OSBMNi4xMTk1MzEyNSw0Ljg4OTgxNjc5IEw2LjExOTUzMTI1LDcuMTA4ODA5MTYgTDkuNDkyMDQ2ODcsNy4xMDg4MDkxNiBDOS40MjQwNzgxMiw3LjY2MDI1OTU0IDkuMDU2OTA2MjUsOC40OTA3MzI4MiA4LjI0MDk1MzEyLDkuMDQ4Nzc4NjMgQzcuNzI0MjAzMTIsOS40MDA5MDA3NiA3LjAzMDY0MDYyLDkuNjQ2NzE3NTYgNi4xMTk1MzEyNSw5LjY0NjcxNzU2IEM0LjUwMTI2NTYyLDkuNjQ2NzE3NTYgMy4xMjc3ODEyNSw4LjYwMzY3OTM5IDIuNjM4MTcxODcsNy4xNjE5ODQ3MyBMMi42Mjg3MTIwNSw3LjE2Mjc2OTU5IEMyLjUwNTM0MTU4LDYuNzk3Mjk0NjggMi40MzQyMTg3NSw2LjM4MTEyMjg1IDIuNDM0MjE4NzUsNS45NzkzODkzMSBDMi40MzQyMTg3NSw1LjU2NzQ1MDM4IDIuNTA4OTg0MzgsNS4xNjg4Mzk2OSAyLjYzMTM3NSw0Ljc5Njc5Mzg5IEMzLjEyNzc4MTI1LDMuMzU1MDk5MjQgNC41MDEyNjU2MiwyLjMxMjAxNTI3IDYuMTE5NTMxMjUsMi4zMTIwMTUyNyBDNy4yNjg2MjUsMi4zMTIwMTUyNyA4LjA0Mzc1LDIuNzk3MDA3NjMgOC40ODU3MzQzNywzLjIwMjMwNTM0IEwxMC4yMTI3OTY5LDEuNTU0NjQxMjIgQzkuMTUyMTA5MzcsMC41OTEyOTc3MSA3Ljc3MTc4MTI1LDguODgxNzg0MmUtMTYgNi4xMTk1MzEyNSw4Ljg4MTc4NDJlLTE2IEMzLjcyNjA5Mzc1LDguODgxNzg0MmUtMTYgMS42NTkwNDY4NywxLjM0MjAzMDUzIDAuNjUyNzM0Mzc1LDMuMjk1MjgyNDQgTDAuNjUyNzM0Mzc1LDMuMjk1MjgyNDQgWiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMiAyKSIvPiAgPC9nPjwvc3ZnPg==);\n}\n\n.providerGitHub:before {\n  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE2IDE2Ij4gIDxnIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+ICAgIDxyZWN0IHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIvPiAgICA8cGF0aCBmaWxsPSIjRkZGRkZGIiBmaWxsLXJ1bGU9Im5vbnplcm8iIGQ9Ik04LjAwMDA2NjI1LDAgQzMuNTgyMzMwNzksMCAwLDMuNjcyMzE1ODUgMCw4LjIwMjUzNzczIEMwLDExLjgyNjYzMzggMi4yOTIyNjI0OCwxNC45MDEyOTUgNS40NzA5MzM1NiwxNS45ODU5MDIzIEM1Ljg3MDc1MTM5LDE2LjA2MTgzMTUgNi4wMTc1MzY3NSwxNS44MDc5NjQyIDYuMDE3NTM2NzUsMTUuNTkxMzE0NCBDNi4wMTc1MzY3NSwxNS4zOTU3MTgzIDYuMDEwMTE3OTksMTQuNzQ5NTcyMiA2LjAwNjY3MzU2LDE0LjA2NDE3MTEgQzMuNzgxMDQ3NDEsMTQuNTYwMzYwMiAzLjMxMTQxMzc5LDEzLjA5NjM3ODEgMy4zMTE0MTM3OSwxMy4wOTYzNzgxIEMyLjk0NzQ5NzQsMTIuMTQ4MjgwNiAyLjQyMzE1MDUsMTEuODk2MTc5IDIuNDIzMTUwNSwxMS44OTYxNzkgQzEuNjk3MzA0OTEsMTEuMzg3MDg2IDIuNDc3ODYzNzksMTEuMzk3NTQ0OSAyLjQ3Nzg2Mzc5LDExLjM5NzU0NDkgQzMuMjgxMjA4ODcsMTEuNDU1NDA4NyAzLjcwNDIxMDMxLDEyLjI0MjgxODcgMy43MDQyMTAzMSwxMi4yNDI4MTg3IEM0LjQxNzczNTQ3LDEzLjQ5NjgwNjcgNS41NzU3MjM0NiwxMy4xMzQyNzQ4IDYuMDMyMjQxNzgsMTIuOTI0Njg4MiBDNi4xMDQwNDQ3MiwxMi4zOTQ1NDE0IDYuMzExMzcyNDQsMTIuMDMyNjg4NyA2LjU0MDE2MTQ0LDExLjgyNzg1NjIgQzQuNzYzMjM3NDQsMTEuNjIwNDQyOCAyLjg5NTMwMTE5LDEwLjkxNzExMjEgMi44OTUzMDExOSw3Ljc3NDEyNzk5IEMyLjg5NTMwMTE5LDYuODc4NTk2ODggMy4yMDc4MTYxOCw2LjE0Njg3NzU3IDMuNzE5NTc3NzMsNS41NzI0NDk5OSBDMy42MzY1MTQxNyw1LjM2NTg1MTY2IDMuMzYyNjgyNjgsNC41MzE1ODAxNyAzLjc5NzA3NzIxLDMuNDAxNzQxMzMgQzMuNzk3MDc3MjEsMy40MDE3NDEzMyA0LjQ2ODg3MTg4LDMuMTgxMjg4MjcgNS45OTc2NjUwNyw0LjI0MjUzMjY3IEM2LjYzNTgxMDQ0LDQuMDYwNzkxMzQgNy4zMjAxOTA0NCwzLjk2OTY0OTAyIDguMDAwMDY2MjUsMy45NjY1MjQ5MiBDOC42Nzk5NDIwNiwzLjk2OTY0OTAyIDkuMzY0ODUyLDQuMDYwNzkxMzQgMTAuMDA0MTg5Niw0LjI0MjUzMjY3IEMxMS41MzExMjgxLDMuMTgxMjg4MjcgMTIuMjAxOTk1NCwzLjQwMTc0MTMzIDEyLjIwMTk5NTQsMy40MDE3NDEzMyBDMTIuNjM3NDQ5OCw0LjUzMTU4MDE3IDEyLjM2MzQ4NTgsNS4zNjU4NTE2NiAxMi4yODA0MjIzLDUuNTcyNDQ5OTkgQzEyLjc5MzM3NjEsNi4xNDY4Nzc1NyAxMy4xMDM3NzE0LDYuODc4NTk2ODggMTMuMTAzNzcxNCw3Ljc3NDEyNzk5IEMxMy4xMDM3NzE0LDEwLjkyNDU4MjggMTEuMjMyMjU4MywxMS42MTgyNjk2IDkuNDUwODMwMDYsMTEuODIxMzM2MyBDOS43Mzc3NzY4NywxMi4wNzU4ODI5IDkuOTkzNDU4ODcsMTIuNTc1MDYwMiA5Ljk5MzQ1ODg3LDEzLjM0MDMyOTggQzkuOTkzNDU4ODcsMTQuNDM3ODQxMSA5Ljk4NDE4NTUsMTUuMzIxMTQ3MyA5Ljk4NDE4NTUsMTUuNTkxMzE0NCBDOS45ODQxODU1LDE1LjgwOTU5NDIgMTAuMTI4MTg4NywxNi4wNjUzNjMxIDEwLjUzMzcwMzEsMTUuOTg0ODE1NiBDMTMuNzEwNjUyLDE0Ljg5ODk4NTggMTYsMTEuODI1NDExMyAxNiw4LjIwMjUzNzczIEMxNiwzLjY3MjMxNTg1IDEyLjQxODE5OTIsMCA4LjAwMDA2NjI1LDAgWiBNMi45OTYyODQ5NiwxMS42ODQ2ODgyIEMyLjk3ODY2NTQxLDExLjcyNTQzNzMgMi45MTYxMzU5MSwxMS43Mzc2NjIxIDIuODU5MTcwNDgsMTEuNzA5NjgxIEMyLjgwMTE0NTIyLDExLjY4MjkyMjMgMi43Njg1NTU3MSwxMS42MjczNjc2IDIuNzg3MzY3NTUsMTEuNTg2NDgyNyBDMi44MDQ1ODk2NSwxMS41NDQ1MTEgMi44NjcyNTE2MiwxMS41MzI4Mjk1IDIuOTI1MTQ0MzksMTEuNTYwOTQ2NSBDMi45ODMzMDIxNCwxMS41ODc3MDUxIDMuMDE2NDIxNTcsMTEuNjQzODAzMSAyLjk5NjI4NDk2LDExLjY4NDY4ODIgWiBNMy4zODk3OTkzMiwxMi4wNDQ3MDI0IEMzLjM1MTY0NTc0LDEyLjA4MDk2OTEgMy4yNzcwNjA3NywxMi4wNjQxMjYxIDMuMjI2NDU0MjYsMTIuMDA2ODA1NyBDMy4xNzQxMjU1NSwxMS45NDk2MjEgMy4xNjQzMjIyMSwxMS44NzMxNDg0IDMuMjAzMDA1NywxMS44MzYzMzgyIEMzLjI0MjM1MTU5LDExLjgwMDA3MTUgMy4zMTQ2ODQ0NSwxMS44MTcwNTAzIDMuMzY3MTQ1NjQsMTEuODc0MjM1IEMzLjQxOTQ3NDMyLDExLjkzMjA5ODggMy40Mjk2NzUxMiwxMi4wMDgwMjgxIDMuMzg5Nzk5MzIsMTIuMDQ0NzAyNCBaIE0zLjY1OTc2NTA4LDEyLjUwNTMyODMgQzMuNjEwNzQ4MzMsMTIuNTQwMjM2OCAzLjUzMDU5OTI5LDEyLjUwNzUwMTUgMy40ODEwNTI2MSwxMi40MzQ1NjA2IEMzLjQzMjAzNTgzLDEyLjM2MTYxOTUgMy40MzIwMzU4MywxMi4yNzQxNDQ2IDMuNDgyMTEyNDQsMTIuMjM5MTAwMyBDMy41MzE3OTE1NywxMi4yMDQwNTYgMy42MTA3NDgzMywxMi4yMzU1Njg4IDMuNjYwOTU3MzgsMTIuMzA3OTY2NSBDMy43MDk4NDE2OCwxMi4zODIxMjk5IDMuNzA5ODQxNjgsMTIuNDY5NjA0OCAzLjY1OTc2NTA4LDEyLjUwNTMyODMgWiBNNC4xMTYzMzQ5NSwxMy4wMzg3OTgxIEM0LjA3MjQ4NDgyLDEzLjA4ODM3NjQgMy45NzkwODgwMiwxMy4wNzUwNjUgMy45MTA3Mjk0OCwxMy4wMDc0MjE0IEMzLjg0MDc4MTI0LDEyLjk0MTI3MTggMy44MjEzMDcwMSwxMi44NDc0MTI5IDMuODY1Mjg5NjMsMTIuNzk3ODM0NyBDMy45MDk2Njk2NiwxMi43NDgxMjA3IDQuMDAzNTk2MzksMTIuNzYyMTExMyA0LjA3MjQ4NDgyLDEyLjgyOTIxMTYgQzQuMTQxOTAzMTYsMTIuODk1MjI1MyA0LjE2MzA5OTYsMTIuOTg5NzYzNCA0LjExNjMzNDk1LDEzLjAzODc5ODEgWiBNNC43MDY0MDcxOSwxMy4yMTg4OTE2IEM0LjY4NzA2NTQ2LDEzLjI4MzEzOTUgNC41OTcxMTMwNiwxMy4zMTIzNDMgNC41MDY0OTgyNywxMy4yODUwNDExIEM0LjQxNjAxNTk3LDEzLjI1NjkyNDIgNC4zNTY3OTg0MiwxMy4xODE2NzQxIDQuMzc1MDgwMzYsMTMuMTE2NzQ3IEM0LjM5Mzg5MjE5LDEzLjA1MjA5MTcgNC40ODQyNDIwMSwxMy4wMjE2NjU2IDQuNTc1NTE5MTgsMTMuMDUwODY5MiBDNC42NjU4NjkwMSwxMy4wNzg4NTAzIDQuNzI1MjE5MDUsMTMuMTUzNTU3MSA0LjcwNjQwNzE5LDEzLjIxODg5MTYgWiBNNS4zNzc5MzQxOSwxMy4yOTUyODI1IEM1LjM4MDE4NjI5LDEzLjM2MjkyNjEgNS4zMDMzNDkxOSwxMy40MTkwMjQxIDUuMjA4MjMwMTgsMTMuNDIwMjQ2NyBDNS4xMTI1ODEyNSwxMy40MjI0MiA1LjAzNTIxNDI1LDEzLjM2NzY4MDMgNS4wMzQxNTQ0MiwxMy4zMDExMjMyIEM1LjAzNDE1NDQyLDEzLjIzMjgwMDUgNS4xMDkyNjkzLDEzLjE3NzI0NTggNS4yMDQ5MTgyMywxMy4xNzU2MTU4IEM1LjMwMDAzNzI2LDEzLjE3MzcxNDIgNS4zNzc5MzQxOSwxMy4yMjgwNDY0IDUuMzc3OTM0MTksMTMuMjk1MjgyNSBaIE02LjAzNzYzNDE5LDEzLjI2OTM1NDggQzYuMDQ5MDI3MjksMTMuMzM1MzY4NSA1Ljk4MjkyMDg4LDEzLjQwMzE0NzkgNS44ODg0NjQyNSwxMy40MjEyMTM0IEM1Ljc5NTU5NzM2LDEzLjQzODU5OTcgNS43MDk2MTkyOSwxMy4zOTc4NTA1IDUuNjk3ODI4NzcsMTMuMzMyMzgwMiBDNS42ODYzMDMyMiwxMy4yNjQ3MzY1IDUuNzUzNjAxOTEsMTMuMTk2OTU3MSA1Ljg0NjMzNjMzLDEzLjE3OTQzNSBDNS45NDA5MjU0NCwxMy4xNjI1OTIgNi4wMjU1Nzg3MiwxMy4yMDIyNTQ1IDYuMDM3NjM0MTksMTMuMjY5MzU0OCBaIi8+ICA8L2c+PC9zdmc+);\n}\n\n.providerGitLab:before {\n  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNCIgaGVpZ2h0PSIxMyIgdmlld0JveD0iMCAwIDE0IDEzIj4gIDxnIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTEgLTIpIj4gICAgPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2Ii8+ICAgIDxwYXRoIGZpbGw9IiNGRkZGRkYiIGZpbGwtcnVsZT0ibm9uemVybyIgZD0iTTcuMDA0MDkzMzYsMTIuOTQ5MjQzMyBMNC40MjgwOTMzMyw0Ljk5NzI4MjU0IEw5LjU4MDA5MzM2LDQuOTk3MjgyNTQgTDcuMDA0MDkzMzYsMTIuOTQ5MjQzMyBaIE03LjAwNDA5MzM2LDEyLjk0OTIzIEwwLjgxNzg5MzMzMyw0Ljk5NzI2OTE3IEw0LjQyODA5MzMzLDQuOTk3MjY5MTcgTDcuMDA0MDkzMzYsMTIuOTQ5MjMgWiBNMC44MTc4OTk5OTksNC45OTcyODkyMyBMNy4wMDQwOTk5OCwxMi45NDkyNSBMMC4yMjg4MzMzMzMsOC4wMTE4ODA4IEMwLjA0MTksNy44NzU2NzE1MiAtMC4wMzYzLDcuNjM0MjEyNyAwLjAzNTEsNy40MTM4MTcxMiBMMC44MTc4OTk5OTksNC45OTcyODkyMyBaIE0wLjgxNzg5OTk5OSw0Ljk5NzI5NTkxIEwyLjM2OTM2NjY3LDAuMjA3OTA0NzE0IEMyLjQ0OTE2NjY3LC0wLjAzODUwMjM1ODggMi43OTY3NjY2NywtMC4wMzg1NjkyMjY1IDIuODc2NTY2NjcsMC4yMDc5MDQ3MTQgTDQuNDI4MSw0Ljk5NzI5NTkxIEwwLjgxNzg5OTk5OSw0Ljk5NzI5NTkxIFogTTcuMDA0MDkzMzYsMTIuOTQ5MjMgTDkuNTgwMDkzMzYsNC45OTcyNjkxNyBMMTMuMTkwMjkzMyw0Ljk5NzI2OTE3IEw3LjAwNDA5MzM2LDEyLjk0OTIzIFogTTEzLjE5MDI5MzMsNC45OTcyODkyMyBMMTMuOTczMDkzMyw3LjQxMzgxNzEyIEMxNC4wNDQ0OTMzLDcuNjM0MjEyNyAxMy45NjYyOTM0LDcuODc1NjcxNTIgMTMuNzc5MzYsOC4wMTE4ODA4IEw3LjAwNDA5MzM2LDEyLjk0OTI1IEwxMy4xOTAyOTMzLDQuOTk3Mjg5MjMgWiBNMTMuMTkwMjkzMyw0Ljk5NzI5NTkxIEw5LjU4MDA5MzM2LDQuOTk3Mjk1OTEgTDExLjEzMTYyNjcsMC4yMDc5MDQ3MTQgQzExLjIxMTQyNjcsLTAuMDM4NTY5MjI2NSAxMS41NTkwMjY3LC0wLjAzODUwMjM1ODggMTEuNjM4ODI2NywwLjIwNzkwNDcxNCBMMTMuMTkwMjkzMyw0Ljk5NzI5NTkxIFoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDEgMikiLz4gIDwvZz48L3N2Zz4=);\n}\n\n.providerBitbucket:before {\n  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNCIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE0IDE2Ij4gIDxnIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTEpIj4gICAgPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2Ii8+ICAgIDxnIGZpbGw9IiNGRkZGRkYiIGZpbGwtcnVsZT0ibm9uemVybyIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMSkiPiAgICAgIDxwYXRoIGQ9Ik03LDIuNDk4OTQxODdlLTA3IEw3LDIuNDk4OTQxODdlLTA3IEMzLjE1NzIxMjI5LDIuNDk4OTQxODdlLTA3IDAuMDAwNjM2NTM1NDM1LDEuMDIwODQ0MjQgMC4wMDA2MzY1MzU0MzUsMi4zMTM5MTM1OSBDMC4wMDA2MzY1MzU0MzUsMi42NTQxOTUxMyAwLjgyNDA5MTAyMyw3LjQ4NjE5MiAxLjE2NzE5NzE3LDkuMzkxNzY3NTkgQzEuMzA0NDM5MzcsMTAuMjc2NDk5OSAzLjU2ODkzOTUzLDExLjUwMTUxMyA3LDExLjUwMTUxMyBMNywxMS41MDE1MTMgQzEwLjQzMTA2MDIsMTEuNTAxNTEzIDEyLjYyNjkzODYsMTAuMjc2NDk5OSAxMi44MzI4MDMyLDkuMzkxNzY3NTkgQzEzLjE3NTkwODYsNy40ODYxOTIgMTMuOTk5MzYzMiwyLjY1NDE5NTEzIDEzLjk5OTM2MzIsMi4zMTM5MTM1OSBDMTMuOTMwNzQyMSwxLjAyMDg0NDI0IDEwLjg0Mjc4NzQsMi40OTg5NDE4N2UtMDcgNywyLjQ5ODk0MTg3ZS0wNyBMNywyLjQ5ODk0MTg3ZS0wNyBaIE03LDkuOTM2MjE4MzEgQzUuNzY0ODE4MjgsOS45MzYyMTgzMSA0LjgwNDEyMTI2LDguOTgzNDI5ODYgNC44MDQxMjEyNiw3Ljc1ODQxNjcxIEM0LjgwNDEyMTI2LDYuNTMzNDAzNTUgNS43NjQ4MTgyOCw1LjU4MDYxNTk3IDcsNS41ODA2MTU5NyBDOC4yMzUxODExMiw1LjU4MDYxNTk3IDkuMTk1ODc4NCw2LjUzMzQwMzU1IDkuMTk1ODc4NCw3Ljc1ODQxNjcxIEM5LjE5NTg3ODQsOC45MTUzNzM3MiA4LjIzNTE4MTEyLDkuOTM2MjE4MzEgNyw5LjkzNjIxODMxIEw3LDkuOTM2MjE4MzEgWiBNNywyLjk5NDQ3NjY3IEM0LjUyOTYzNjIyLDIuOTk0NDc2NjcgMi41Mzk2MjExLDIuNTg2MTM4OTUgMi41Mzk2MjExLDIuMDQxNjg4ODYgQzIuNTM5NjIxMSwxLjQ5NzIzODE1IDQuNTI5NjM2MjIsMS4wODg5MDA0MyA3LDEuMDg4OTAwNDMgQzkuNDcwMzYyODQsMS4wODg5MDA0MyAxMS40NjAzNzg2LDEuNDk3MjM4MTUgMTEuNDYwMzc4NiwyLjA0MTY4ODg2IEMxMS40NjAzNzg2LDIuNTg2MTM4OTUgOS40NzAzNjI4NCwyLjk5NDQ3NjY3IDcsMi45OTQ0NzY2NyBMNywyLjk5NDQ3NjY3IFoiLz4gICAgICA8cGF0aCBkPSJNMTIuMDY0NTA5NiwxMS4yMjkyODc2IEMxMS45MjcyNjY3LDExLjIyOTI4NzYgMTEuODU4NjQ1NywxMS4yOTczNDM4IDExLjg1ODY0NTcsMTEuMjk3MzQzOCBDMTEuODU4NjQ1NywxMS4yOTczNDM4IDEwLjE0MzExNTYsMTIuNjU4NDcgNy4wNTUxNjA5MywxMi42NTg0NyBDMy45NjcyMDY4NywxMi42NTg0NyAyLjI1MTY3NjE2LDExLjI5NzM0MzggMi4yNTE2NzYxNiwxMS4yOTczNDM4IEMyLjI1MTY3NjE2LDExLjI5NzM0MzggMi4xMTQ0MzM5NSwxMS4yMjkyODc2IDIuMDQ1ODEyODUsMTEuMjI5Mjg3NiBDMS45MDg1NzAwMiwxMS4yMjkyODc2IDEuNzcxMzI3ODEsMTEuMjk3MzQzOCAxLjc3MTMyNzgxLDExLjUwMTUxMyBMMS43NzEzMjc4MSwxMS41Njk1NjkyIEMyLjA0NTgxMjg1LDEyLjk5ODc1MTYgMi4yNTE2NzYxNiwxNC4wMTk1OTU2IDIuMjUxNjc2MTYsMTQuMTU1NzA3OSBDMi40NTc1NDAwOSwxNS4xNzY1NTI1IDQuNTE2MTc2MzIsMTUuOTkzMjI4IDYuOTg2NTM5ODIsMTUuOTkzMjI4IEw2Ljk4NjUzOTgyLDE1Ljk5MzIyOCBDOS40NTY5MDMzMSwxNS45OTMyMjggMTEuNTE1NTM5NSwxNS4xNzY1NTI1IDExLjcyMTQwMzUsMTQuMTU1NzA3OSBDMTEuNzIxNDAzNSwxNC4wMTk1OTU2IDExLjkyNzI2NjcsMTIuOTk4NzUxNiAxMi4yMDE3NTE4LDExLjU2OTU2OTIgTDEyLjIwMTc1MTgsMTEuNTAxNTEzIEMxMi4yNzAzNzI5LDExLjM2NTQgMTIuMjAxNzUxOCwxMS4yMjkyODc2IDEyLjA2NDUwOTYsMTEuMjI5Mjg3NiBMMTIuMDY0NTA5NiwxMS4yMjkyODc2IFoiLz4gICAgICA8ZWxsaXBzZSBjeD0iNyIgY3k9IjcuNjkiIHJ4PSIxLjA5OCIgcnk9IjEuMDg5Ii8+ICAgIDwvZz4gIDwvZz48L3N2Zz4=);\n}\n\n.callOut {\n  display: block;\n  padding: var(--basePadding);\n  font-size: 14px;\n  font-weight: 500;\n  text-decoration: none;\n  color: var(--subduedColor);\n  text-align: center;\n}\n\n.callOut:after {\n  content: " ♥";\n  transition: color 4s ease;\n}\n\n.callOut:hover:after {\n  color: red;\n}\n\n.callOut .netlifyLogo {\n  display: block;\n  margin: auto;\n  width: 32px;\n  height: 32px;\n  margin-bottom: 8px;\n  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj4gIDxkZWZzPiAgICA8cmFkaWFsR3JhZGllbnQgaWQ9ImEiIGN5PSIwJSIgcj0iMTAwJSIgZng9IjUwJSIgZnk9IjAlIiBncmFkaWVudFRyYW5zZm9ybT0ibWF0cml4KDAgMSAtMS4xNTE4NSAwIC41IC0uNSkiPiAgICAgIDxzdG9wIHN0b3AtY29sb3I9IiMyMEM2QjciIG9mZnNldD0iMCUiLz4gICAgICA8c3RvcCBzdG9wLWNvbG9yPSIjNEQ5QUJGIiBvZmZzZXQ9IjEwMCUiLz4gICAgPC9yYWRpYWxHcmFkaWVudD4gIDwvZGVmcz4gIDxwYXRoIGZpbGw9InVybCgjYSkiIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTIyLjk4MDYyMywxMS42MjYyMzc3IEMyMi44NzE3MTA3LDExLjUwNTEzMDYgMjIuNzM1NTcwNCwxMS4zOTc0Nzk4IDIyLjU3MjIwMjEsMTEuMzE2NzQxOCBDMjIuNTU4NTg4MSwxMS4zMTY3NDE4IDIyLjU0NDk3NCwxMS4yODk4MjkxIDIyLjUzMTM2LDExLjI3NjM3MjcgTDIzLjE3MTIxOTQsNy4zNjA1NzY2MSBDMjMuMTcxMjE5NCw3LjMzMzY2MzkyIDIzLjE4NDgzMzQsNy4zMjAyMDc1OCAyMy4xOTg0NDc1LDcuMzIwMjA3NTggTDIzLjIxMjA2MTUsNy4zMjAyMDc1OCBDMjMuMjEyMDYxNSw3LjMyMDIwNzU4IDIzLjIyNTY3NTUsNy4zMjAyMDc1OCAyMy4yMzkyODk2LDcuMzMzNjYzOTIgTDI2LjE2NjMwNiwxMC4yMjY3Nzc5IEMyNi4xNzk5MiwxMC4yNDAyMzQzIDI2LjE3OTkyLDEwLjI1MzY5MDYgMjYuMTc5OTIsMTAuMjY3MTQ2OSBDMjYuMTc5OTIsMTAuMjgwNjAzMyAyNi4xNjYzMDYsMTAuMjk0MDU5NiAyNi4xNTI2OTE5LDEwLjMwNzUxNiBMMjMuMDIxNDY1MSwxMS42Mzk2OTQgTDIzLjAwNzg1MSwxMS42Mzk2OTQgQzIyLjk5NDIzNywxMS42Mzk2OTQgMjIuOTk0MjM3LDExLjYzOTY5NCAyMi45ODA2MjMsMTEuNjI2MjM3NyBaIE0xNi4zNTA1NzM2LDkuNDU5NzM4MSBDMTYuMzIzMzQ1Myw5LjE5MDYxMjc0IDE2LjIyODA0NjMsOC45MjE0ODczOCAxNi4wNzgyOTA2LDguNjkyNzMwODMgQzE2LjA2NDY3NjUsOC42NzkyNzQ1NiAxNi4wNjQ2NzY1LDguNjUyMzYyMDIgMTYuMDc4MjkwNiw4LjYyNTQ0OTQ5IEwxOS4zNTkzMDEsMy41Mzg5ODAyMiBDMTkuMzU5MzAxLDMuNTI1NTIzOTUgMTkuMzcyOTE1MSwzLjUxMjA2NzY4IDE5LjM4NjUyOTMsMy41MTIwNjc2OCBDMTkuNDAwMTQzNCwzLjUxMjA2NzY4IDE5LjQwMDE0MzQsMy41MTIwNjc2OCAxOS40MTM3NTc2LDMuNTI1NTIzOTUgTDIyLjMyNzE4NTgsNi40MTg2MjE1NSBDMjIuMzQwOCw2LjQzMjA3NzgyIDIyLjM0MDgsNi40NDU1MzQwOSAyMi4zNDA4LDYuNDU4OTkwMzUgTDIxLjU3ODQwNzYsMTEuMTgyMTQwNCBDMjEuNTc4NDA3NiwxMS4yMDkwNTI5IDIxLjU2NDc5MzQsMTEuMjIyNTA5MiAyMS41NTExNzkzLDExLjIyMjUwOTIgQzIxLjM3NDE5NTMsMTEuMjc2MzM0MyAyMS4yMTA4MjU1LDExLjM1NzA3MTkgMjEuMDc0Njg0LDExLjQ2NDcyMiBDMjEuMDc0Njg0LDExLjQ3ODE3ODMgMjEuMDYxMDY5OCwxMS40NzgxNzgzIDIxLjAzMzg0MTUsMTEuNDc4MTc4MyBMMTYuMzc3ODAxOSw5LjUwMDEwNjkgQzE2LjM2NDE4NzgsOS40ODY2NTA2MyAxNi4zNTA1NzM2LDkuNDczMTk0MzcgMTYuMzUwNTczNiw5LjQ1OTczODEgWiBNMjYuOTgzMTkwNywxMS4wMjA3NjY5IEwzMS45Nzk1Nzg4LDE1Ljk3MjY2NCBDMzIuMDA2ODA3MSwxNS45ODYxMjAyIDMyLjAwNjgwNzEsMTYuMDI2NDg4OSAzMS45Nzk1Nzg4LDE2LjAyNjQ4ODkgTDMxLjk1MjM1MDUsMTYuMDUzNDAxNCBDMzEuOTUyMzUwNSwxNi4wNjY4NTc3IDMxLjkzODczNjQsMTYuMDY2ODU3NyAzMS45MTE1MDgxLDE2LjA2Njg1NzcgTDIzLjU1MjQyODMsMTIuNTI3ODY2IEMyMy41Mzg4MTQxLDEyLjUyNzg2NiAyMy41MjUyLDEyLjUwMDk1MzUgMjMuNTI1MiwxMi40ODc0OTczIEMyMy41MjUyLDEyLjQ3NDA0MSAyMy41Mzg4MTQxLDEyLjQ2MDU4NDggMjMuNTUyNDI4MywxMi40NDcxMjg2IEwyNi45NTU5NjI0LDExLjAwNzMxMDcgQzI2Ljk1NTk2MjQsMTEuMDA3MzEwNyAyNi45Njk1NzY1LDExLjAwNzMxMDcgMjYuOTgzMTkwNywxMS4wMjA3NjY5IFogTTIzLjEzMDQzNjMsMTMuMzg5MDg4MSBMMzEuMTQ5MTg1OCwxNi43ODAwNzYxIEMzMS4xNjI4LDE2Ljc5MzUzMjQgMzEuMTYyOCwxNi44MDY5ODg3IDMxLjE2MjgsMTYuODIwNDQ1IEMzMS4xNjI4LDE2LjgzMzkwMTMgMzEuMTYyOCwxNi44NDczNTc2IDMxLjE0OTE4NTgsMTYuODYwODEzOSBMMjYuNzEwOTY0NSwyMS4yNjEwMjQ1IEMyNi43MTA5NjQ1LDIxLjI3NDQ4MDggMjYuNjk3MzUwMywyMS4yNzQ0ODA4IDI2LjY3MDEyMiwyMS4yNzQ0ODA4IEwyMS44MjM0NzU0LDIwLjI2NTI1ODIgQzIxLjc5NjI0NywyMC4yNjUyNTgyIDIxLjc4MjYzMjksMjAuMjUxODAxOSAyMS43ODI2MzI5LDIwLjIyNDg4OTMgQzIxLjc0MTc5MDMsMTkuODQ4MTEyOCAyMS41NjQ4MDYsMTkuNTExNzA1MyAyMS4yNjUyOTQyLDE5LjI4Mjk0ODEgQzIxLjI1MTY4LDE5LjI2OTQ5MTggMjEuMjUxNjgsMTkuMjU2MDM1NSAyMS4yNTE2OCwxOS4yNDI1NzkyIEwyMi4xMDkzNzMxLDEzLjk4MTE2NTMgQzIyLjEwOTM3MzEsMTMuOTU0MjUyNyAyMi4xMzY2MDE0LDEzLjk0MDc5NjQgMjIuMTUwMjE1NiwxMy45NDA3OTY0IEMyMi41MzE0MTI1LDEzLjg4Njk3MTIgMjIuODU4MTUyNywxMy42OTg1ODMgMjMuMDc1OTc5NiwxMy40MDI1NDQ0IEMyMy4wODk1OTM3LDEzLjM4OTA4ODEgMjMuMTAzMjA3OSwxMy4zODkwODgxIDIzLjEzMDQzNjMsMTMuMzg5MDg4MSBaIE0xNi4xNDYzNzksMTAuNDI4Njg1OSBMMjAuNTMwMTMxNywxMi4yODU2NTMyIEMyMC41NDM3NDU5LDEyLjI5OTEwOTUgMjAuNTU3MzYsMTIuMzEyNTY1OCAyMC41NTczNiwxMi4zMzk0NzgzIEMyMC41NDM3NDU5LDEyLjQwNjc1OTggMjAuNTMwMTMxNywxMi40ODc0OTc1IDIwLjUzMDEzMTcsMTIuNTY4MjM1MiBMMjAuNTMwMTMxNywxMi42MzU1MTY2IEwyMC41MzAxMzE3LDEyLjY4OTM0MTcgQzIwLjUzMDEzMTcsMTIuNzAyNzk4IDIwLjUxNjUxNzYsMTIuNzE2MjU0MyAyMC41MDI5MDM0LDEyLjcyOTcxMDYgQzIwLjUwMjkwMzQsMTIuNzI5NzEwNiAxMC44Nzc3MDcyLDE2LjgzMzg3NzUgMTAuODY0MDkzLDE2LjgzMzg3NzUgQzEwLjg1MDQ3ODksMTYuODMzODc3NSAxMC44MzY4NjQ3LDE2LjgzMzg3NzUgMTAuODIzMjUwNiwxNi44MjA0MjEyIEMxMC44MDk2MzY1LDE2LjgwNjk2NDkgMTAuODA5NjM2NSwxNi43ODAwNTI0IDEwLjgyMzI1MDYsMTYuNzY2NTk2MSBMMTQuNDMwOTk3NCwxMS4xODIyMzc4IEMxNC40NDQ2MTE2LDExLjE2ODc4MTUgMTQuNDU4MjI1NywxMS4xNTUzMjUzIDE0LjQ4NTQ1NCwxMS4xNTUzMjUzIEMxNC41ODA3NTMsMTEuMTY4NzgxNSAxNC42NjI0Mzc4LDExLjE4MjIzNzggMTQuNzQ0MTIyNiwxMS4xODIyMzc4IEMxNS4yODg2ODgyLDExLjE4MjIzNzggMTUuNzkyNDExMywxMC45MTMxMTIxIDE2LjA5MTkyMjQsMTAuNDU1NTk4NCBDMTYuMTA1NTM2NSwxMC40NDIxNDIyIDE2LjExOTE1MDcsMTAuNDI4Njg1OSAxNi4xNDYzNzksMTAuNDI4Njg1OSBaIE0yMS41NTExNDI5LDIxLjE4MDI0MzMgTDI1LjgxMjM3MTcsMjIuMDU0OTA1MyBDMjUuODI1OTg1OSwyMi4wNTQ5MDUzIDI1LjgzOTYsMjIuMDY4MzYxNiAyNS44Mzk2LDIyLjEwODczMDcgQzI1LjgzOTYsMjIuMTIyMTg3IDI1LjgzOTYsMjIuMTM1NjQzMyAyNS44MjU5ODU5LDIyLjE0OTA5OTcgTDE5LjkxNzQ0NDksMjguMDAyNjA3MiBDMTkuOTE3NDQ0OSwyOC4wMTYwNjM2IDE5LjkwMzgzMDcsMjguMDE2MDYzNiAxOS44OTAyMTY2LDI4LjAxNjA2MzYgTDE5Ljg2Mjk4ODMsMjguMDE2MDYzNiBDMTkuODQ5Mzc0MSwyOC4wMDI2MDcyIDE5LjgzNTc2LDI3Ljk4OTE1MDkgMTkuODM1NzYsMjcuOTYyMjM4MiBMMjAuODU2ODIxMiwyMS42OTE1ODQxIEMyMC44NTY4MjEyLDIxLjY3ODEyNzggMjAuODcwNDM1NCwyMS42NTEyMTUxIDIwLjg4NDA0OTUsMjEuNjUxMjE1MSBDMjEuMTI5MTA0MiwyMS41NTcwMjA4IDIxLjMzMzMxNjUsMjEuMzk1NTQ0NyAyMS40OTY2ODYzLDIxLjE5MzY5OTYgQzIxLjUxMDMwMDQsMjEuMTkzNjk5NiAyMS41MjM5MTQ2LDIxLjE4MDI0MzMgMjEuNTUxMTQyOSwyMS4xODAyNDMzIFogTTE5LjA0NjE2NzksMjAuNjgyNDAzIEMxOS4xNTUwODE0LDIxLjA5OTU0ODcgMTkuNDU0NTkzMywyMS40NjI4NjkyIDE5Ljg2MzAxODcsMjEuNjI0MzQ0OSBDMTkuODkwMjQ3MSwyMS42Mzc4MDEyIDE5Ljg5MDI0NzEsMjEuNjY0NzEzOSAxOS44NjMwMTg3LDIxLjY2NDcxMzkgQzE5Ljg2MzAxODcsMjEuNjY0NzEzOSAxOC42MjQxMjgzLDI5LjIxMzcwNTQgMTguNjI0MTI4MywyOS4yMjcxNjE3IEwxOC4xODg0NzQ2LDI5LjY1Nzc2MzcgQzE4LjE4ODQ3NDYsMjkuNjcxMjIwMSAxOC4xNzQ4NjA0LDI5LjY3MTIyMDEgMTguMTYxMjQ2MiwyOS42NzEyMjAxIEMxOC4xNDc2MzIsMjkuNjcxMjIwMSAxOC4xNDc2MzIsMjkuNjcxMjIwMSAxOC4xMzQwMTc4LDI5LjY1Nzc2MzcgTDEwLjk0NTczMDYsMTkuMjY5NDkwMSBDMTAuOTMyMTE2NSwxOS4yNTYwMzM4IDEwLjkzMjExNjUsMTkuMjI5MTIxMiAxMC45NDU3MzA2LDE5LjIxNTY2NDkgQzEwLjk4NjU3MzIsMTkuMTYxODM5NiAxMS4wMTM4MDE1LDE5LjEwODAxNDQgMTEuMDU0NjQ0MSwxOS4wNDA3MzI4IEMxMS4wNjgyNTgzLDE5LjAyNzI3NjUgMTEuMDgxODcyNCwxOS4wMTM4MjAyIDExLjEwOTEwMDgsMTkuMDEzODIwMiBMMTkuMDA1MzI1NCwyMC42NDIwMzQxIEMxOS4wMzI1NTM3LDIwLjY1NTQ5MDQgMTkuMDQ2MTY3OSwyMC42Njg5NDY3IDE5LjA0NjE2NzksMjAuNjgyNDAzIFogTTExLjMxMzM2NDcsMTguMDk4NzI4NiBDMTEuMjg2MTM2NSwxOC4wOTg3Mjg2IDExLjI3MjUyMjQsMTguMDg1MjcyNCAxMS4yNzI1MjI0LDE4LjA1ODM1OTggQzExLjI3MjUyMjQsMTcuOTUwNzA5NiAxMS4yNDUyOTQxLDE3Ljg1NjUxNTcgMTEuMjMxNjgsMTcuNzQ4ODY1NCBDMTEuMjMxNjgsMTcuNzIxOTUyOSAxMS4yMzE2OCwxNy43MDg0OTY2IDExLjI1ODkwODIsMTcuNjk1MDQwMyBDMTEuMjU4OTA4MiwxNy42OTUwNDAzIDIwLjkzODU0NTksMTMuNTYzOTYzNSAyMC45NTIxNiwxMy41NjM5NjM1IEMyMC45NTIxNiwxMy41NjM5NjM1IDIwLjk2NTc3NDEsMTMuNTYzOTYzNSAyMC45NzkzODgyLDEzLjU3NzQxOTcgQzIxLjA0NzQ1ODgsMTMuNjQ0NzAxMSAyMS4xMDE5MTUzLDEzLjY4NTA2OTkgMjEuMTU2MzcxOCwxMy43MjU0Mzg4IEMyMS4xODM2LDEzLjcyNTQzODggMjEuMTgzNiwxMy43NTIzNTEzIDIxLjE4MzYsMTMuNzY1ODA3NiBMMjAuMzM5NTI0NywxOC45NDY0NzQxIEMyMC4zMzk1MjQ3LDE4Ljk3MzM4NjYgMjAuMzI1OTEwNiwxOC45ODY4NDI5IDIwLjI5ODY4MjQsMTguOTg2ODQyOSBDMTkuODM1ODAyNCwxOS4wMTM3NTU0IDE5LjQyNzM3ODgsMTkuMjgyODgxIDE5LjE5NTkzODgsMTkuNjg2NTY5MyBDMTkuMTgyMzI0NywxOS43MDAwMjU1IDE5LjE2ODcxMDYsMTkuNzEzNDgxOCAxOS4xNDE0ODI0LDE5LjcxMzQ4MTggTDExLjMxMzM2NDcsMTguMDk4NzI4NiBaIE03Ljg2ODk3NzU4LDE5LjE4ODcyOTEgQzcuOTA5ODIwMywxOS4yNTYwMTExIDcuOTUwNjYzMDMsMTkuMzA5ODM2NyA3Ljk5MTUwNTc2LDE5LjM2MzY2MjMgQzguMDA1MTIsMTkuMzc3MTE4NyA4LjAwNTEyLDE5LjM5MDU3NTEgOC4wMDUxMiwxOS4zOTA1NzUxIEw2LjEzOTk2ODc5LDIyLjI4MzcwMDcgQzYuMTI2MzU0NTUsMjIuMjk3MTU3MSA2LjExMjc0MDMsMjIuMzEwNjEzNSA2LjA5OTEyNjA2LDIyLjMxMDYxMzUgQzYuMDk5MTI2MDYsMjIuMzEwNjEzNSA2LjA4NTUxMTgyLDIyLjMxMDYxMzUgNi4wNzE4OTc1OCwyMi4yOTcxNTcxIEw0LjQyNDU3NDI0LDIwLjY2ODkzMjkgQzQuNDEwOTYsMjAuNjU1NDc2NSA0LjQxMDk2LDIwLjY0MjAyMDEgNC40MTA5NiwyMC42Mjg1NjM3IEM0LjQxMDk2LDIwLjYxNTEwNzMgNC40MjQ1NzQyNCwyMC42MDE2NTA5IDQuNDM4MTg4NDgsMjAuNjAxNjUwOSBMNy44MTQ1MjA2MSwxOS4xNjE4MTYzIEw3LjgyODEzNDg1LDE5LjE2MTgxNjMgQzcuODQxNzQ5MDksMTkuMTYxODE2MyA3Ljg1NTM2MzMzLDE5LjE3NTI3MjcgNy44Njg5Nzc1OCwxOS4xODg3MjkxIFogTTEwLjE4MzMxOTEsMTkuODYxNTU3OSBDMTAuMTk2OTMzMiwxOS44NjE1NTc5IDEwLjIxMDU0NzMsMTkuODc1MDE0MiAxMC4yMjQxNjE0LDE5Ljg4ODQ3MDYgTDE3LjQzOTYyOTQsMzAuMzU3NDg3OCBDMTcuNDUzMjQzNSwzMC4zNzA5NDQxIDE3LjQ1MzI0MzUsMzAuMzk3ODU2NyAxNy40Mzk2Mjk0LDMwLjQxMTMxMzEgTDE1Ljg2MDM5NDksMzEuOTg1NzAyNSBDMTUuODYwMzk0OSwzMS45OTkxNTg5IDE1Ljg0Njc4MDgsMzEuOTk5MTU4OSAxNS44MDU5Mzg2LDMxLjk4NTcwMjUgTDYuNzkzNDEwNTcsMjMuMDY0MTYyMiBDNi43Nzk3OTY0OCwyMy4wNTA3MDU4IDYuNzc5Nzk2NDgsMjMuMDIzNzkzMiA2LjgwNzAyNDY2LDIyLjk5Njg4MDYgTDguNzY3NDUzNzEsMTkuOTU1NzUyMiBDOC43ODEwNjc4LDE5Ljk0MjI5NTggOC43OTQ2ODE4OSwxOS45Mjg4Mzk1IDguODIxOTEwMDcsMTkuOTI4ODM5NSBDOS4wMjYxMjE0MywxOS45OTYxMjExIDkuMjE2NzE4NywyMC4wMjMwMzM4IDkuNDIwOTMwMDYsMjAuMDIzMDMzOCBDOS42Nzk1OTc3OCwyMC4wMjMwMzM4IDkuOTI0NjUxNDEsMTkuOTY5MjA4NSAxMC4xODMzMTkxLDE5Ljg2MTU1NzkgWiBNOC45OTg5MTg1NiwxNi40MDMyMzIyIEM4Ljk4NTMwNDM5LDE2LjQwMzIzMjIgOC45NzE2OTAyMiwxNi4zODk3NzU5IDguOTU4MDc2MDQsMTYuMzc2MzE5NiBMNS4wOTE2NTA2MywxMC43MzgxMzg4IEM1LjA3ODAzNjQ2LDEwLjcyNDY4MjUgNS4wNzgwMzY0NiwxMC42OTc3NyA1LjA5MTY1MDYzLDEwLjY4NDMxMzcgTDguNTYzMjY1LDcuMjM5NTA2MzMgQzguNTYzMjY1LDcuMjI2MDUwMDYgOC41NzY4NzkxNyw3LjIyNjA1MDA2IDguNjA0MTA3NTIsNy4yMjYwNTAwNiBDOC42MDQxMDc1Miw3LjIzOTUwNjMzIDEyLjcwMTk3MzksOC45NjE5MTAwMiAxMy4xNjQ4NTU4LDkuMTYzNzU0MiBDMTMuMTc4NDcsOS4xNzcyMTA0OCAxMy4xOTIwODQyLDkuMTkwNjY2NzYgMTMuMTkyMDg0Miw5LjIxNzU3OTMyIEMxMy4xNjQ4NTU4LDkuMzM4Njg1ODMgMTMuMTUxMjQxNiw5LjQ1OTc5MjM0IDEzLjE1MTI0MTYsOS41ODA4OTg4NCBDMTMuMTUxMjQxNiw5Ljk5ODA0MzQ5IDEzLjMxNDYxMTcsMTAuMzg4Mjc1NiAxMy42MDA1MDk0LDEwLjY4NDMxMzcgQzEzLjYxNDEyMzUsMTAuNjk3NzcgMTMuNjE0MTIzNSwxMC43MjQ2ODI1IDEzLjYwMDUwOTQsMTAuNzM4MTM4OCBMOS45NTE5MTA3NCwxNi4zODk3NzU5IEM5LjkzODI5NjU3LDE2LjQwMzIzMjIgOS45MjQ2ODIzOSwxNi40MTY2ODg1IDkuODk3NDU0MDUsMTYuNDE2Njg4NSBDOS43NDc2OTgxMywxNi4zNzYzMTk2IDkuNTg0MzI4MDQsMTYuMzQ5NDA3MSA5LjQzNDU3MjEzLDE2LjM0OTQwNzEgQzkuMjk4NDMwMzksMTYuMzQ5NDA3MSA5LjE0ODY3NDQ4LDE2LjM3NjMxOTYgOC45OTg5MTg1NiwxNi40MDMyMzIyIFogTTEzLjY2ODYwMTksOC4zNTY0MjAzNCBDMTMuNDkxNjE4Niw4LjI3NTY4MTk4IDkuMzUyOTMzMjQsNi41MjYzNTA4MyA5LjM1MjkzMzI0LDYuNTI2MzUwODMgQzkuMzM5MzE5MTQsNi41MTI4OTQ0NCA5LjMyNTcwNTA1LDYuNTEyODk0NDQgOS4zMzkzMTkxNCw2LjQ4NTk4MTY1IEM5LjMzOTMxOTE0LDYuNDcyNTI1MjYgOS4zMzkzMTkxNCw2LjQ1OTA2ODg2IDkuMzUyOTMzMjQsNi40NDU2MTI0NyBMMTUuODMzMjQzMiwwLjAxMzQ1NjM5MzUgQzE1LjgzMzI0MzIsMCAxNS44NDY4NTczLDAgMTUuODYwNDcxNCwwIEMxNS44NzQwODU1LDAgMTUuODc0MDg1NSwwIDE1Ljg4NzY5OTYsMC4wMTM0NTYzOTM1IEwxOC42Nzg1ODk0LDIuNzcyMDE3MDUgQzE4LjY5MjIwMzUsMi43ODU0NzM0NSAxOC42OTIyMDM1LDIuODEyMzg2MjMgMTguNjc4NTg5NCwyLjgyNTg0MjYzIEwxNS4zMTU5MDc2LDguMDMzNDY2OSBDMTUuMzAyMjkzNSw4LjA0NjkyMzI5IDE1LjI4ODY3OTQsOC4wNjAzNzk2OSAxNS4yNjE0NTEyLDguMDYwMzc5NjkgQzE1LjA4NDQ2NzksOC4wMDY1NTQxMSAxNC45MDc0ODQ3LDcuOTc5NjQxMzMgMTQuNzMwNTAxNCw3Ljk3OTY0MTMzIEMxNC4zNjI5MjA4LDcuOTc5NjQxMzMgMTMuOTk1MzQwMiw4LjExNDIwNTI2IDEzLjcwOTQ0NDIsOC4zNDI5NjM5NSBDMTMuNjk1ODMwMSw4LjM1NjQyMDM0IDEzLjY5NTgzMDEsOC4zNTY0MjAzNCAxMy42Njg2MDE5LDguMzU2NDIwMzQgWiBNNy43ODcyODk5NSwxNy4zMzE3NTExIEM3Ljc3MzY3NTgxLDE3LjM0NTIwNzQgNy43NjAwNjE2NywxNy4zNTg2NjM3IDcuNzQ2NDQ3NTIsMTcuMzU4NjYzNyBMMC4wNDA4NDI0Mjk4LDE1Ljc0MzkwOCBDMC4wMTM2MTQxNDMzLDE1Ljc0MzkwOCAwLDE1LjczMDQ1MTcgMCwxNS43MTY5OTU0IEMwLDE1LjcwMzUzOTEgMCwxNS42OTAwODI4IDAuMDEzNjE0MTQzMywxNS42NzY2MjY1IEw0LjMxNTY4MzQyLDExLjQyNDQzNjMgQzQuMzE1NjgzNDIsMTEuNDEwOTgwMSA0LjMyOTI5NzU2LDExLjQxMDk4MDEgNC4zNDI5MTE3MSwxMS40MTA5ODAxIEM0LjM3MDEzOTk5LDExLjQyNDQzNjMgNC4zNzAxMzk5OSwxMS40MjQ0MzYzIDQuMzgzNzU0MTMsMTEuNDM3ODkyNiBDNC4zODM3NTQxMywxMS40NTEzNDg5IDguMDczMTg2OTYsMTYuNzgwMDQyOSA4LjExNDAyOTM5LDE2LjgzMzg2ODEgQzguMTI3NjQzNTQsMTYuODQ3MzI0NCA4LjEyNzY0MzU0LDE2Ljg3NDIzNyA4LjExNDAyOTM5LDE2Ljg4NzY5MzMgQzcuOTkxNTAyMSwxNy4wMjIyNTYzIDcuODY4OTc0ODEsMTcuMTcwMjc1NSA3Ljc4NzI4OTk1LDE3LjMzMTc1MTEgWiBNNy4zNTE1NTc4MywxOC4yNDY3NDY0IEM3LjM3ODc4NTk0LDE4LjI0Njc0NjQgNy4zOTI0LDE4LjI2MDIwMjcgNy4zOTI0LDE4LjI4NzExNTEgQzcuMzkyNCwxOC4zMDA1NzEzIDcuMzc4Nzg1OTQsMTguMzE0MDI3NSA3LjM1MTU1NzgzLDE4LjM0MDkzOTkgTDMuNjM0OTIsMTkuOTE1MzE2NSBDMy42MzQ5MiwxOS45MTUzMTY1IDMuNjIxMzA1OTQsMTkuOTE1MzE2NSAzLjYwNzY5MTg4LDE5LjkwMTg2MDMgTDAuNjI2MjEzMTg1LDE2Ljk0MTQ5NDEgQzAuNjEyNTk5MTI3LDE2LjkyODAzNzggMC41OTg5ODUwNjksMTYuOTAxMTI1NCAwLjYxMjU5OTEyNywxNi44ODc2NjkyIEMwLjYyNjIxMzE4NSwxNi44NzQyMTMgMC42Mzk4MjcyNDMsMTYuODYwNzU2OCAwLjY2NzA1NTM1OSwxNi44NjA3NTY4IEw3LjM1MTU1NzgzLDE4LjI0Njc0NjQgWiIvPjwvc3ZnPg==);\n}\n\n.visuallyHidden {\n  border: 0;\n  clip: rect(0 0 0 0);\n  height: 1px;\n  margin: -1px;\n  overflow: hidden;\n  padding: 0;\n  position: absolute;\n  width: 1px;\n  #fff-space: nowrap;\n}\n\n.subheader {\n  margin-top: 2em;\n  border-top: 1px solid rgb(14, 30, 37);\n\n  h3 {\n    padding-top: 1em;\n    text-align: center;\n  }\n}\n']}]),t.default=o;}]).default}));
    //# sourceMappingURL=netlify-identity.js.map
    });

    var netlifyIdentity$1 = /*@__PURE__*/getDefaultExportFromCjs(netlifyIdentity);

    function _makeUser(netlifyUser) {
      const { user_metadata, email, token } = netlifyUser;

      return {
        name: user_metadata.full_name,
        email,
        accessToken: token.access_token,
        expiresAt: token.expires_at,
        refreshToken: token.refresh_token,
        tokeType: token.tokenType,
      };
    }

    function createUser() {
      const localUser = JSON.parse(localStorage.getItem("gotrue.user"));

      const { subscribe, set } = writable(localUser ? _makeUser(localUser) : null);

      return {
        subscribe,
        login(user) {
          set(_makeUser(user));
        },
        logout() {
          set(null);
        },
      };
    }

    const user = createUser();

    function initializeIdentity() {
      netlifyIdentity$1.init();

      // Netlify identity event hooks
      netlifyIdentity$1.on("login", (_user) => {
        user.login(_user);
        netlifyIdentity$1.close();
        navigate("/tasks");
      });

      netlifyIdentity$1.on("logout", () => {
        user.logout();
        const client = getClient();
        client.clearStore();
        navigate("/");
      });
    }

    function handleLogin() {
      netlifyIdentity$1.open("login");
    }

    function handleLogout() {
      netlifyIdentity$1.logout();
    }

    /* src/components/Navbar.svelte generated by Svelte v3.38.2 */
    const file$4 = "src/components/Navbar.svelte";

    // (14:2) {#if isLoggedIn}
    function create_if_block_1$1(ctx) {
    	let div;
    	let a;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			a = element("a");
    			a.textContent = "Tasks";
    			attr_dev(a, "href", "/tasks");
    			attr_dev(a, "class", "svelte-1mcg0oq");
    			add_location(a, file$4, 15, 6, 346);
    			attr_dev(div, "class", "nav-item svelte-1mcg0oq");
    			add_location(div, file$4, 14, 4, 317);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, a);

    			if (!mounted) {
    				dispose = action_destroyer(link.call(null, a));
    				mounted = true;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(14:2) {#if isLoggedIn}",
    		ctx
    	});

    	return block;
    }

    // (28:2) {:else}
    function create_else_block$1(ctx) {
    	let div1;
    	let div0;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "Login";
    			add_location(div0, file$4, 29, 6, 716);
    			attr_dev(div1, "class", "nav-item svelte-1mcg0oq");
    			add_location(div1, file$4, 28, 4, 687);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			if (!mounted) {
    				dispose = listen_dev(div0, "click", handleLogin, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(28:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (21:2) {#if isLoggedIn}
    function create_if_block$1(ctx) {
    	let div0;
    	let a0;
    	let t0_value = /*$user*/ ctx[0].name.split(" ")[0] + "";
    	let t0;
    	let t1;
    	let div1;
    	let a1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			a0 = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			a1 = element("a");
    			a1.textContent = "Logout";
    			attr_dev(a0, "href", "/profile");
    			attr_dev(a0, "class", "svelte-1mcg0oq");
    			add_location(a0, file$4, 22, 6, 512);
    			attr_dev(div0, "class", "nav-item svelte-1mcg0oq");
    			add_location(div0, file$4, 21, 4, 474);
    			attr_dev(a1, "href", "/");
    			attr_dev(a1, "class", "svelte-1mcg0oq");
    			add_location(a1, file$4, 25, 6, 615);
    			attr_dev(div1, "class", "nav-item svelte-1mcg0oq");
    			add_location(div1, file$4, 24, 4, 586);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, a0);
    			append_dev(a0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, a1);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(link.call(null, a0)),
    					listen_dev(a1, "click", handleLogout, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$user*/ 1 && t0_value !== (t0_value = /*$user*/ ctx[0].name.split(" ")[0] + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(21:2) {#if isLoggedIn}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let nav;
    	let div0;
    	let a;
    	let t1;
    	let t2;
    	let div1;
    	let t3;
    	let mounted;
    	let dispose;
    	let if_block0 = /*isLoggedIn*/ ctx[1] && create_if_block_1$1(ctx);

    	function select_block_type(ctx, dirty) {
    		if (/*isLoggedIn*/ ctx[1]) return create_if_block$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block1 = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			div0 = element("div");
    			a = element("a");
    			a.textContent = "Home";
    			t1 = space();
    			if (if_block0) if_block0.c();
    			t2 = space();
    			div1 = element("div");
    			t3 = space();
    			if_block1.c();
    			attr_dev(a, "href", "/");
    			attr_dev(a, "class", "svelte-1mcg0oq");
    			add_location(a, file$4, 11, 4, 255);
    			attr_dev(div0, "class", "nav-item svelte-1mcg0oq");
    			add_location(div0, file$4, 10, 2, 228);
    			attr_dev(div1, "class", "flex-spacer svelte-1mcg0oq");
    			add_location(div1, file$4, 18, 2, 403);
    			attr_dev(nav, "class", "svelte-1mcg0oq");
    			add_location(nav, file$4, 8, 0, 199);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, div0);
    			append_dev(div0, a);
    			append_dev(nav, t1);
    			if (if_block0) if_block0.m(nav, null);
    			append_dev(nav, t2);
    			append_dev(nav, div1);
    			append_dev(nav, t3);
    			if_block1.m(nav, null);

    			if (!mounted) {
    				dispose = action_destroyer(link.call(null, a));
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*isLoggedIn*/ ctx[1]) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_1$1(ctx);
    					if_block0.c();
    					if_block0.m(nav, t2);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(nav, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			if (if_block0) if_block0.d();
    			if_block1.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let isLoggedIn;
    	let $user;
    	validate_store(user, "user");
    	component_subscribe($$self, user, $$value => $$invalidate(0, $user = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Navbar", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Navbar> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		handleLogin,
    		handleLogout,
    		user,
    		link,
    		isLoggedIn,
    		$user
    	});

    	$$self.$inject_state = $$props => {
    		if ("isLoggedIn" in $$props) $$invalidate(1, isLoggedIn = $$props.isLoggedIn);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$user*/ 1) {
    			$$invalidate(1, isLoggedIn = Boolean($user));
    		}
    	};

    	return [$user, isLoggedIn];
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/routes/Home.svelte generated by Svelte v3.38.2 */

    const file$3 = "src/routes/Home.svelte";

    function create_fragment$3(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let h2;
    	let t3;
    	let p;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Netlify/Svelte";
    			t1 = space();
    			h2 = element("h2");
    			h2.textContent = "Todo Application";
    			t3 = space();
    			p = element("p");
    			p.textContent = "An application using Svelte for fontend and Netlify for hosting/serverless\n    API.";
    			add_location(h1, file$3, 1, 2, 9);
    			add_location(h2, file$3, 2, 2, 35);
    			add_location(p, file$3, 3, 2, 63);
    			attr_dev(main, "class", "svelte-177t831");
    			add_location(main, file$3, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, h2);
    			append_dev(main, t3);
    			append_dev(main, p);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Home", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/routes/Tasks.svelte generated by Svelte v3.38.2 */

    const { console: console_1 } = globals;
    const file$2 = "src/routes/Tasks.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i].done;
    	child_ctx[13] = list[i].text;
    	child_ctx[14] = list[i].id;
    	return child_ctx;
    }

    // (71:0) {:else}
    function create_else_block(ctx) {
    	let section;
    	let t0;
    	let hr;
    	let t1;
    	let div;
    	let form;
    	let input;
    	let t2;
    	let button;
    	let mounted;
    	let dispose;
    	let each_value = /*$todos*/ ctx[1].data.todos;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			section = element("section");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			hr = element("hr");
    			t1 = space();
    			div = element("div");
    			form = element("form");
    			input = element("input");
    			t2 = space();
    			button = element("button");
    			button.textContent = "Add";
    			attr_dev(hr, "class", "svelte-wk4cok");
    			add_location(hr, file$2, 86, 4, 1770);
    			attr_dev(input, "class", "task-name svelte-wk4cok");
    			attr_dev(input, "type", "text");
    			add_location(input, file$2, 89, 8, 1885);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "svelte-wk4cok");
    			add_location(button, file$2, 90, 8, 1962);
    			attr_dev(form, "action", "submit");
    			attr_dev(form, "class", "svelte-wk4cok");
    			add_location(form, file$2, 88, 6, 1810);
    			attr_dev(div, "class", "task-row svelte-wk4cok");
    			add_location(div, file$2, 87, 4, 1781);
    			attr_dev(section, "class", "task-display svelte-wk4cok");
    			add_location(section, file$2, 71, 2, 1330);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(section, null);
    			}

    			append_dev(section, t0);
    			append_dev(section, hr);
    			append_dev(section, t1);
    			append_dev(section, div);
    			append_dev(div, form);
    			append_dev(form, input);
    			set_input_value(input, /*createTodoInput*/ ctx[0]);
    			append_dev(form, t2);
    			append_dev(form, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[6]),
    					listen_dev(form, "submit", prevent_default(/*handleCreateTodo*/ ctx[4]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$todos, handleTaskUpdate*/ 10) {
    				each_value = /*$todos*/ ctx[1].data.todos;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(section, t0);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*createTodoInput*/ 1 && input.value !== /*createTodoInput*/ ctx[0]) {
    				set_input_value(input, /*createTodoInput*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(71:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (68:23) 
    function create_if_block_1(ctx) {
    	let t0;
    	let t1_value = console.log(/*$todos*/ ctx[1].error) + "";
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text("Error\n  ");
    			t1 = text(t1_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$todos*/ 2 && t1_value !== (t1_value = console.log(/*$todos*/ ctx[1].error) + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(68:23) ",
    		ctx
    	});

    	return block;
    }

    // (66:0) {#if $todos.loading}
    function create_if_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Loading...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(66:0) {#if $todos.loading}",
    		ctx
    	});

    	return block;
    }

    // (80:12) {:else}
    function create_else_block_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Not Done");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(80:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (78:12) {#if done}
    function create_if_block_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Done");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(78:12) {#if done}",
    		ctx
    	});

    	return block;
    }

    // (73:4) {#each $todos.data.todos as { done, text, id }}
    function create_each_block(ctx) {
    	let div2;
    	let div0;
    	let t0_value = /*text*/ ctx[13] + "";
    	let t0;
    	let t1;
    	let div1;
    	let button;
    	let mounted;
    	let dispose;

    	function select_block_type_1(ctx, dirty) {
    		if (/*done*/ ctx[12]) return create_if_block_2;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	function click_handler() {
    		return /*click_handler*/ ctx[5](/*id*/ ctx[14], /*text*/ ctx[13], /*done*/ ctx[12]);
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			button = element("button");
    			if_block.c();
    			attr_dev(div0, "class", "task-name svelte-wk4cok");
    			add_location(div0, file$2, 74, 8, 1461);
    			attr_dev(button, "class", "svelte-wk4cok");
    			add_location(button, file$2, 76, 10, 1543);
    			attr_dev(div1, "class", "task-complete svelte-wk4cok");
    			add_location(div1, file$2, 75, 8, 1505);
    			attr_dev(div2, "class", "task-row svelte-wk4cok");
    			toggle_class(div2, "done", /*done*/ ctx[12]);
    			add_location(div2, file$2, 73, 6, 1419);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, button);
    			if_block.m(button, null);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*$todos*/ 2 && t0_value !== (t0_value = /*text*/ ctx[13] + "")) set_data_dev(t0, t0_value);

    			if (current_block_type !== (current_block_type = select_block_type_1(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(button, null);
    				}
    			}

    			if (dirty & /*$todos*/ 2) {
    				toggle_class(div2, "done", /*done*/ ctx[12]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(73:4) {#each $todos.data.todos as { done, text, id }}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let h1;
    	let t1;
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*$todos*/ ctx[1].loading) return create_if_block;
    		if (/*$todos*/ ctx[1].error) return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Tasks";
    			t1 = space();
    			if_block.c();
    			if_block_anchor = empty();
    			add_location(h1, file$2, 64, 0, 1209);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $todos;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tasks", slots, []);
    	let createTodoInput;

    	const GET_TODOS = gql$1`
    query Todos {
      todos {
        id
        text
        done
      }
    }
  `;

    	const UPDATE_TODO = gql$1`
    mutation UpdateTodo($id: ID!, $text: String!, $done: Boolean!) {
      updateTodo(id: $id, text: $text, done: $done) {
        id
        text
        done
      }
    }
  `;

    	const CREATE_TODO = gql$1`
    mutation CreateTodo($text: String!) {
      addTodo(text: $text) {
        id
        text
        done
      }
    }
  `;

    	const todos = query(GET_TODOS);
    	validate_store(todos, "todos");
    	component_subscribe($$self, todos, value => $$invalidate(1, $todos = value));
    	const updateTodo = mutation(UPDATE_TODO);
    	const createTodo = mutation(CREATE_TODO);

    	async function handleTaskUpdate(id, text, done) {
    		try {
    			await updateTodo({ variables: { id, text, done } });
    		} catch(error) {
    			console.log(error);
    		}
    	}

    	async function handleCreateTodo(text) {
    		try {
    			await createTodo({ variables: { text: createTodoInput } });
    			$$invalidate(0, createTodoInput = null);
    			todos.refetch();
    		} catch(error) {
    			console.log(error);
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Tasks> was created with unknown prop '${key}'`);
    	});

    	const click_handler = (id, text, done) => handleTaskUpdate(id, text, !done);

    	function input_input_handler() {
    		createTodoInput = this.value;
    		$$invalidate(0, createTodoInput);
    	}

    	$$self.$capture_state = () => ({
    		gql: gql$1,
    		mutation,
    		query,
    		text,
    		createTodoInput,
    		GET_TODOS,
    		UPDATE_TODO,
    		CREATE_TODO,
    		todos,
    		updateTodo,
    		createTodo,
    		handleTaskUpdate,
    		handleCreateTodo,
    		$todos
    	});

    	$$self.$inject_state = $$props => {
    		if ("createTodoInput" in $$props) $$invalidate(0, createTodoInput = $$props.createTodoInput);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		createTodoInput,
    		$todos,
    		todos,
    		handleTaskUpdate,
    		handleCreateTodo,
    		click_handler,
    		input_input_handler
    	];
    }

    class Tasks extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tasks",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/routes/User.svelte generated by Svelte v3.38.2 */
    const file$1 = "src/routes/User.svelte";

    function create_fragment$1(ctx) {
    	let h1;
    	let t1;
    	let div;
    	let p0;
    	let t2;
    	let t3_value = /*$user*/ ctx[0].email + "";
    	let t3;
    	let t4;
    	let p1;
    	let t5;
    	let t6_value = /*$user*/ ctx[0].name + "";
    	let t6;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "User Profile";
    			t1 = space();
    			div = element("div");
    			p0 = element("p");
    			t2 = text("Email: ");
    			t3 = text(t3_value);
    			t4 = space();
    			p1 = element("p");
    			t5 = text("Name: ");
    			t6 = text(t6_value);
    			add_location(h1, file$1, 4, 0, 55);
    			add_location(p0, file$1, 6, 2, 106);
    			add_location(p1, file$1, 7, 2, 136);
    			attr_dev(div, "class", "profile-card svelte-18bczak");
    			add_location(div, file$1, 5, 0, 77);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, p0);
    			append_dev(p0, t2);
    			append_dev(p0, t3);
    			append_dev(div, t4);
    			append_dev(div, p1);
    			append_dev(p1, t5);
    			append_dev(p1, t6);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$user*/ 1 && t3_value !== (t3_value = /*$user*/ ctx[0].email + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*$user*/ 1 && t6_value !== (t6_value = /*$user*/ ctx[0].name + "")) set_data_dev(t6, t6_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $user;
    	validate_store(user, "user");
    	component_subscribe($$self, user, $$value => $$invalidate(0, $user = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("User", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<User> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ user, $user });
    	return [$user];
    }

    class User extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "User",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    const currentUser = () => get_store_value(user);

    const httpLink = createHttpLink({
      uri: "/.netlify/functions/graphql",
    });

    const authLink = setContext((_, { headers }) => {
      return {
        headers: {
          ...headers,
          Authorization: currentUser() ? `Bearer ${currentUser().accessToken}` : "",
        },
      };
    });

    const client = new ApolloClient({
      uri: "/.netlify/functions/graphql",
      link: authLink.concat(httpLink),
      cache: new InMemoryCache(),
    });

    /* src/App.svelte generated by Svelte v3.38.2 */
    const file = "src/App.svelte";

    // (33:4) <Route path="/">
    function create_default_slot_3(ctx) {
    	let home;
    	let current;
    	home = new Home({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(home.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(home, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(home.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(home.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(home, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(33:4) <Route path=\\\"/\\\">",
    		ctx
    	});

    	return block;
    }

    // (34:4) <Route path="/profile">
    function create_default_slot_2(ctx) {
    	let user_1;
    	let current;
    	user_1 = new User({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(user_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(user_1, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(user_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(user_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(user_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(34:4) <Route path=\\\"/profile\\\">",
    		ctx
    	});

    	return block;
    }

    // (35:4) <Route path="/tasks">
    function create_default_slot_1(ctx) {
    	let tasks;
    	let current;
    	tasks = new Tasks({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(tasks.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tasks, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tasks.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tasks.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tasks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(35:4) <Route path=\\\"/tasks\\\">",
    		ctx
    	});

    	return block;
    }

    // (28:0) <Router>
    function create_default_slot(ctx) {
    	let header;
    	let navbar;
    	let t0;
    	let main;
    	let route0;
    	let t1;
    	let route1;
    	let t2;
    	let route2;
    	let current;
    	navbar = new Navbar({ $$inline: true });

    	route0 = new Route({
    			props: {
    				path: "/",
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	route1 = new Route({
    			props: {
    				path: "/profile",
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	route2 = new Route({
    			props: {
    				path: "/tasks",
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			header = element("header");
    			create_component(navbar.$$.fragment);
    			t0 = space();
    			main = element("main");
    			create_component(route0.$$.fragment);
    			t1 = space();
    			create_component(route1.$$.fragment);
    			t2 = space();
    			create_component(route2.$$.fragment);
    			add_location(header, file, 28, 2, 833);
    			attr_dev(main, "class", "svelte-1812w6w");
    			add_location(main, file, 31, 2, 871);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			mount_component(navbar, header, null);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			mount_component(route0, main, null);
    			append_dev(main, t1);
    			mount_component(route1, main, null);
    			append_dev(main, t2);
    			mount_component(route2, main, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const route0_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				route0_changes.$$scope = { dirty, ctx };
    			}

    			route0.$set(route0_changes);
    			const route1_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				route1_changes.$$scope = { dirty, ctx };
    			}

    			route1.$set(route1_changes);
    			const route2_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				route2_changes.$$scope = { dirty, ctx };
    			}

    			route2.$set(route2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			transition_in(route0.$$.fragment, local);
    			transition_in(route1.$$.fragment, local);
    			transition_in(route2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(route0.$$.fragment, local);
    			transition_out(route1.$$.fragment, local);
    			transition_out(route2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			destroy_component(navbar);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(route0);
    			destroy_component(route1);
    			destroy_component(route2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(28:0) <Router>",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let t;
    	let router;
    	let current;

    	router = new Router({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			t = space();
    			create_component(router.$$.fragment);
    			document.title = "Netlify/Svelte Todo App";
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    			mount_component(router, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const router_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				router_changes.$$scope = { dirty, ctx };
    			}

    			router.$set(router_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    			destroy_component(router, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $user;
    	validate_store(user, "user");
    	component_subscribe($$self, user, $$value => $$invalidate(0, $user = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	setClient(client);
    	initializeIdentity();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		ApolloClient,
    		createHttpLink,
    		InMemoryCache,
    		apolloSetContext: setContext,
    		setClient,
    		Route,
    		Router,
    		Navbar,
    		Home,
    		Tasks,
    		User,
    		initializeIdentity,
    		user,
    		client,
    		$user
    	});

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$user*/ 1) {
    			(client.headers = {
    				Authorization: $user ? `Bearer ${$user.accessToken}` : ""
    			});
    		}
    	};

    	return [$user];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
      target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
