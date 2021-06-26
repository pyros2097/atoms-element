import { html as litHtml, render as litRender, directive as litDirective, NodePart, AttributePart, PropertyPart, isPrimitive } from './lit-html.js';
import { html as litServerHtml, directive as litServerDirective, isNodePart, isAttributePart, unsafePrefixString, renderToString } from './lit-html-server.js';

export const registry = {};
const isBrowser = typeof window.alert !== "undefined";
export const html = isBrowser ? litHtml : litServerHtml;
export const render = isBrowser ? litRender : renderToString;
export const directive = isBrowser ? litDirective : litServerDirective;

const previousValues = new WeakMap();
export const unsafeHTML = directive((value) => (part) => {
  if (isBrowser) {
    if (!(part instanceof NodePart)) {
      throw new Error('unsafeHTML can only be used in text bindings');
    }
    const previousValue = previousValues.get(part);
    if (previousValue !== undefined && isPrimitive(value) &&
      value === previousValue.value && part.value === previousValue.fragment) {
      return;
    }
    const template = document.createElement('template');
    template.innerHTML = value; // innerHTML casts to string internally
    const fragment = document.importNode(template.content, true);
    part.setValue(fragment);
    previousValues.set(part, { value, fragment });
  } else {
    if (!isNodePart(part)) {
      throw Error('The `unsafeHTML` directive can only be used in text nodes');
    }
    part.setValue(`${unsafePrefixString}${value}`);
  }
});

const previousClassesCache = new WeakMap();
export const classMap = directive((classInfo) => (part) => {
  if (isBrowser) {
    if (!(part instanceof AttributePart) || (part instanceof PropertyPart) ||
      part.committer.name !== 'class' || part.committer.parts.length > 1) {
      throw new Error('The `classMap` directive must be used in the `class` attribute ' +
        'and must be the only part in the attribute.');
    }
    const { committer } = part;
    const { element } = committer;
    let previousClasses = previousClassesCache.get(part);
    if (previousClasses === undefined) {
      // Write static classes once
      // Use setAttribute() because className isn't a string on SVG elements
      element.setAttribute('class', committer.strings.join(' '));
      previousClassesCache.set(part, previousClasses = new Set());
    }
    const classList = element.classList;
    // Remove old classes that no longer apply
    // We use forEach() instead of for-of so that re don't require down-level
    // iteration.
    previousClasses.forEach((name) => {
      if (!(name in classInfo)) {
        classList.remove(name);
        previousClasses.delete(name);
      }
    });
    // Add or remove classes based on their classMap value
    for (const name in classInfo) {
      const value = classInfo[name];
      if (value != previousClasses.has(name)) {
        // We explicitly want a loose truthy check of `value` because it seems
        // more convenient that '' and 0 are skipped.
        if (value) {
          classList.add(name);
          previousClasses.add(name);
        }
        else {
          classList.remove(name);
          previousClasses.delete(name);
        }
      }
    }
    if (typeof classList.commit === 'function') {
      classList.commit();
    }
  } else {
    if (!isAttributePart(part) || part.name !== 'class') {
      throw Error('The `classMap` directive can only be used in the `class` attribute');
    }
    const classes = (classInfo);
    let value = '';
    for (const key in classes) {
      if (classes[key]) {
        value += `${value.length ? ' ' : ''}${key}`;
      }
    }
    part.setValue(value);
  }
});

let currentCursor;
let currentComponent;

export const logError = (msg) => {
  if (window.logError) {
    window.logError(msg);
  } else {
    console.warn(msg);
  }
}

const checkRequired = (context, data) => {
  if (data === null || typeof data === 'undefined') {
    logError(`'${context}' Field is required`);
  }
}

const checkPrimitive = (primitiveType) => {
  const common = {
    type: primitiveType,
    parse: (attr) => attr,
  }
  const validate = (context, data) => {
    if (data === null || typeof data === 'undefined') {
      return;
    }
    const dataType = typeof data;
    if (dataType !== primitiveType) {
      logError(`'${context}' Expected type '${primitiveType}' got type '${dataType}'`);
    }
  }
  return {
    validate,
    ...common,
    isRequired: {
      ...common,
      validate: (context, data) => {
        checkRequired(context, data);
        validate(context, data);
      }
    }
  }
}

const checkComplex = (complexType, validate) => {
  const common = {
    type: complexType,
    parse: (attr) => attr ? JSON.parse(attr.replace(/'/g, `"`)) : null
  };
  return (innerType) => {
    return {
      ...common,
      validate: (context, data) => {
        if (!data) {
          return;
        }
        validate(innerType, context, data)
      },
      isRequired: {
        ...common,
        validate: (context, data) => {
          checkRequired(context, data);
          validate(innerType, context, data);
        }
      },
    }
  }
}

export const number = checkPrimitive('number');
export const string = checkPrimitive('string');
export const boolean = checkPrimitive('boolean');
export const object = checkComplex('object', (innerType, context, data) => {
  if (data.constructor !== Object) {
    logError(`'${context}' Expected object literal '{}' got '${typeof data}'`);
  }
  for (const key of Object.keys(innerType)) {
    const fieldValidator = innerType[key];
    const item = data[key];
    fieldValidator.validate(`${context}.${key}`, item)
  }
});
export const array = checkComplex('array', (innerType, context, data) => {
  if (!Array.isArray(data)) {
    logError(`Expected Array got ${data}`);
  }
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    innerType.validate(`${context}[${i}]`, item)
  }
});
export const func = checkComplex('function', (innerType, context, data) => {
});

export const hooks = (config) => {
  const h = currentComponent.hooks;
  const c = currentComponent;
  const index = currentCursor++;
  if (h.values.length <= index && config.oncreate) {
    h.values[index] = config.oncreate(h, c, index);
  }
  if (config.onupdate) {
    h.values[index] = config.onupdate(h, c, index);
  }
  return h.values[index];
}

export const defaultHooks = () => ({
  values: [],
  deps: [],
  effects: [],
  layoutEffects: [],
  cleanup: []
});

export const __setCurrent__ = (c) => {
  currentComponent = c;
  currentCursor = 0;
}

export const useDispatchEvent = (name) => hooks({
  oncreate: (_, c) => (data) => c.dispatchEvent(new CustomEvent(name, data))
});
export const useRef = (initialValue) => hooks({
  oncreate: (_h, _c) => ({ current: initialValue })
});
export const useState = (initialState) => hooks({
  oncreate: (h, c, i) => [
    typeof initialState === "function"
      ? initialState()
      : initialState,
    function setState(nextState) {
      const state = h.values[i][0];
      if (typeof nextState === "function") {
        nextState = nextState(state);
      }
      if (!Object.is(state, nextState)) {
        h.values[i][0] = nextState;
        c.update();
      }
    }
  ]
});
export const useReducer = (reducer, initialState) => hooks({
  oncreate: (h, c, i) => [
    initialState,
    function dispatch(action) {
      const state = h.values[i][0];
      const nextState = reducer(state, action);
      if (!Object.is(state, nextState)) {
        h.values[i][0] = nextState;
        c.update();
      }
    }
  ]
});
const depsChanged = (prev, next) => prev == null || next.some((f, i) => !Object.is(f, prev[i]));
export const useEffect = (handler, deps) => hooks({
  onupdate(h, _, i) {
    if (!deps || depsChanged(h.deps[i], deps)) {
      h.deps[i] = deps || [];
      h.effects[i] = handler;
    }
  }
});
export const useLayoutEffect = (handler, deps) => hooks({
  onupdate(h, _, i) {
    if (!deps || depsChanged(h.deps[i], deps)) {
      h.deps[i] = deps || [];
      h.layoutEffects[i] = handler;
    }
  }
});
export const useMemo = (fn, deps) => hooks({
  onupdate(h, _, i) {
    let value = h.values[i];
    if (!deps || depsChanged(h.deps[i], deps)) {
      h.deps[i] = deps || [];
      value = fn();
    }
    return value;
  }
});
export const useCallback = (callback, deps) => useMemo(() => callback, deps);

const batch = (runner, pick, callback) => {
  const q = [];
  const flush = () => {
    let p;
    while ((p = pick(q)))
      callback(p);
  };
  const run = runner(flush);
  return (c) => q.push(c) === 1 && run();
};
const fifo = (q) => q.shift();
const filo = (q) => q.pop();
const microtask = (flush) => {
  return () => queueMicrotask(flush);
};
const task = (flush) => {
  if (isBrowser) {
    const ch = new MessageChannel();
    ch.port1.onmessage = flush;
    return () => ch.port2.postMessage(null);
  }
  else {
    return () => setImmediate(flush);
  }
};
const enqueueLayoutEffects = batch(microtask, filo, c => c._flushEffects("layoutEffects"));
const enqueueEffects = batch(task, filo, c => c._flushEffects("effects"));
const enqueueUpdate = batch(microtask, fifo, c => c._performUpdate());

export function defineElement(name, fn, propTypes = {}) {
  registry[name] = fn;
  const keys = Object.keys(propTypes);
  const funcKeys = keys.filter((key) => propTypes[key].type === 'function');
  const attributes = keys.filter((key) => propTypes[key].type !== 'function').reduce((acc, key) => {
    acc[key.toLowerCase()] = {
      propName: key,
      propType: propTypes[key],
    };
    return acc;
  }, {});
  if (isBrowser) {
    if (customElements.get(name)) {
      return;
    }
    customElements.define(name, class extends HTMLElement {
      constructor() {
        super(...arguments);
        this._dirty = false;
        this._connected = false;
        this.hooks = defaultHooks();
        this.props = {};
        this.renderer = fn;
      }
      connectedCallback() {
        this._connected = true;
        this.update();
      }
      disconnectedCallback() {
        this._connected = false;
        let cleanup;
        while ((cleanup = this.hooks.cleanup.shift())) {
          cleanup();
        }
      }

      static get observedAttributes() {
        return Object.keys(attributes);
      }

      attributeChangedCallback(key, oldValue, newValue) {
        const attr = attributes[key];
        const data = attr.propType.parse(newValue);
        attr.propType.validate(`<${name}> ${key}`, data);
        this.props[attr.propName] = data;
        if (this._connected) {
          this.update();
        }
      }

      update() {
        if (this._dirty) {
          return;
        }
        this._dirty = true;
        enqueueUpdate(this);
      }
      _performUpdate() {
        if (!this._connected) {
          return;
        }
        __setCurrent__(this);
        this.render();
        enqueueLayoutEffects(this);
        enqueueEffects(this);
        this._dirty = false;
      }
      _flushEffects(effectKey) {
        const effects = this.hooks[effectKey];
        const cleanups = this.hooks.cleanup;
        for (let i = 0, len = effects.length; i < len; i++) {
          if (effects[i]) {
            cleanups[i] && cleanups[i]();
            const cleanup = effects[i]();
            if (cleanup) {
              cleanups[i] = cleanup;
            }
            delete effects[i];
          }
        }
      }

      render() {
        funcKeys.forEach((key) => {
          this.props[key] = this[key]
        })
        render(this.renderer(this.props), this);
      }
    });
  }
}

export const getElement = (name) => registry[name];