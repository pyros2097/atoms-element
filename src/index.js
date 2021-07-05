import { html, render as litRender, directive, NodePart, AttributePart, PropertyPart, isPrimitive } from './lit-html.js';

const registry = {};
const isBrowser = typeof window !== 'undefined';
export { html, isBrowser };

const lastAttributeNameRegex =
  // eslint-disable-next-line no-control-regex
  /([ \x09\x0a\x0c\x0d])([^\0-\x1F\x7F-\x9F "'>=/]+)([ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*))$/;

export const render = isBrowser
  ? litRender
  : (template) => {
      let js = '';
      template.strings.forEach((text, i) => {
        const value = template.values[i];
        // TODO: remove @click @mouseleave= .handleClick props
        // either here or in lit-html
        // console.log('text', text);
        const type = typeof value;
        if (value === null || !(type === 'object' || type === 'function' || type === 'undefined')) {
          js += text;
          js += type !== 'string' ? String(value) : value;
        } else if (Array.isArray(value)) {
          js += text;
          // Array of TemplateResult
          value.forEach((v) => {
            js += render(v);
          });
        } else if (type === 'object') {
          js += text;
          // TemplateResult
          if (value.strings && value.type === 'html') {
            js += render(value);
          } else {
            js += JSON.stringify(value).replace(/"/g, `'`);
          }
        } else if (type == 'function') {
          const matchName = lastAttributeNameRegex.exec(text);
          if (matchName) {
            let [, prefix, name, suffix] = matchName;
            js += text.replace(' ' + name + '=', '');
          } else {
            js += text;
            js += value();
          }
        } else if (type !== 'undefined') {
          js += text;
          js += value.toString();
        } else {
          js += text;
          // console.log('value', value);
        }
      });
      return js;
    };

const previousValues = new WeakMap();
export const unsafeHTML = isBrowser
  ? directive((value) => (part) => {
      if (!(part instanceof NodePart)) {
        throw new Error('unsafeHTML can only be used in text bindings');
      }
      const previousValue = previousValues.get(part);
      if (previousValue !== undefined && isPrimitive(value) && value === previousValue.value && part.value === previousValue.fragment) {
        return;
      }
      const template = document.createElement('template');
      template.innerHTML = value; // innerHTML casts to string internally
      const fragment = document.importNode(template.content, true);
      part.setValue(fragment);
      previousValues.set(part, { value, fragment });
    })
  : (value) => value;

const previousClassesCache = new WeakMap();
export const classMap = isBrowser
  ? directive((classInfo) => (part) => {
      if (!(part instanceof AttributePart) || part instanceof PropertyPart || part.committer.name !== 'class' || part.committer.parts.length > 1) {
        throw new Error('The `classMap` directive must be used in the `class` attribute ' + 'and must be the only part in the attribute.');
      }
      const { committer } = part;
      const { element } = committer;
      let previousClasses = previousClassesCache.get(part);
      if (previousClasses === undefined) {
        // Write static classes once
        // Use setAttribute() because className isn't a string on SVG elements
        element.setAttribute('class', committer.strings.join(' '));
        previousClassesCache.set(part, (previousClasses = new Set()));
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
          } else {
            classList.remove(name);
            previousClasses.delete(name);
          }
        }
      }
      if (typeof classList.commit === 'function') {
        classList.commit();
      }
    })
  : (classes) => {
      let value = '';
      for (const key in classes) {
        if (classes[key]) {
          value += `${value.length ? ' ' : ''}${key}`;
        }
      }
      return value;
    };

let currentCursor;
let currentComponent;
let logError = (msg) => {
  console.warn(msg);
};

export const setLogError = (fn) => {
  logError = fn;
};

const checkRequired = (context, data) => {
  if (data === null || typeof data === 'undefined') {
    logError(`'${context}' Field is required`);
  }
};

const checkPrimitive = (primitiveType) => {
  const common = {
    type: primitiveType,
    parse: (attr) => attr,
  };
  const validate = (context, data) => {
    if (data === null || typeof data === 'undefined') {
      return;
    }
    const dataType = typeof data;
    if (dataType !== primitiveType) {
      logError(`'${context}' Expected type '${primitiveType}' got type '${dataType}'`);
    }
  };
  return {
    validate,
    ...common,
    isRequired: {
      ...common,
      validate: (context, data) => {
        checkRequired(context, data);
        validate(context, data);
      },
    },
  };
};

const checkComplex = (complexType, validate) => {
  const common = {
    type: complexType,
    parse: (attr) => (attr ? JSON.parse(attr.replace(/'/g, `"`)) : null),
  };
  return (innerType) => {
    return {
      ...common,
      validate: (context, data) => {
        if (!data) {
          return;
        }
        validate(innerType, context, data);
      },
      isRequired: {
        ...common,
        validate: (context, data) => {
          checkRequired(context, data);
          validate(innerType, context, data);
        },
      },
    };
  };
};

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
    fieldValidator.validate(`${context}.${key}`, item);
  }
});
export const array = checkComplex('array', (innerType, context, data) => {
  if (!Array.isArray(data)) {
    logError(`Expected Array got ${data}`);
  }
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    innerType.validate(`${context}[${i}]`, item);
  }
});
export const func = checkComplex('function', (innerType, context, data) => {});

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
};

export const __setCurrent__ = (c) => {
  currentComponent = c;
  currentCursor = 0;
};

export const useDispatchEvent = (name) =>
  hooks({
    oncreate: (_, c) => (data) => c.dispatchEvent(new CustomEvent(name, data)),
  });
export const useRef = (initialValue) =>
  hooks({
    oncreate: (_h, _c) => ({ current: initialValue }),
  });
export const useState = (initialState) =>
  hooks({
    oncreate: (h, c, i) => [
      typeof initialState === 'function' ? initialState() : initialState,
      function setState(nextState) {
        const state = h.values[i][0];
        if (typeof nextState === 'function') {
          nextState = nextState(state);
        }
        if (!Object.is(state, nextState)) {
          h.values[i][0] = nextState;
          c.update();
        }
      },
    ],
  });
export const useReducer = (reducer, initialState) =>
  hooks({
    oncreate: (h, c, i) => [
      initialState,
      function dispatch(action) {
        const state = h.values[i][0];
        const nextState = reducer(state, action);
        if (!Object.is(state, nextState)) {
          h.values[i][0] = nextState;
          c.update();
        }
      },
    ],
  });
const depsChanged = (prev, next) => prev == null || next.some((f, i) => !Object.is(f, prev[i]));
export const useEffect = (handler, deps) =>
  hooks({
    onupdate(h, _, i) {
      if (!deps || depsChanged(h.deps[i], deps)) {
        h.deps[i] = deps || [];
        h.effects[i] = handler;
      }
    },
  });
export const useLayoutEffect = (handler, deps) =>
  hooks({
    onupdate(h, _, i) {
      if (!deps || depsChanged(h.deps[i], deps)) {
        h.deps[i] = deps || [];
        h.layoutEffects[i] = handler;
      }
    },
  });
export const useMemo = (fn, deps) =>
  hooks({
    onupdate(h, _, i) {
      let value = h.values[i];
      if (!deps || depsChanged(h.deps[i], deps)) {
        h.deps[i] = deps || [];
        value = fn();
      }
      return value;
    },
  });
export const useCallback = (callback, deps) => useMemo(() => callback, deps);
export const useConfig = () => {
  if (isBrowser) {
    return window.config;
  }
  return global.config;
};
export const useLocation = () => {
  if (isBrowser) {
    return window.location;
  }
  return global.location;
};

const batch = (runner, pick, callback) => {
  const q = [];
  const flush = () => {
    let p;
    while ((p = pick(q))) callback(p);
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
    const ch = new window.MessageChannel();
    ch.port1.onmessage = flush;
    return () => ch.port2.postMessage(null);
  } else {
    return () => setImmediate(flush);
  }
};
const enqueueLayoutEffects = batch(microtask, filo, (c) => c._flushEffects('layoutEffects'));
const enqueueEffects = batch(task, filo, (c) => c._flushEffects('effects'));
const enqueueUpdate = batch(microtask, fifo, (c) => c._performUpdate());

const BaseElement = isBrowser ? window.HTMLElement : class {};

export class AtomsElement extends BaseElement {
  constructor() {
    super();
    this._dirty = false;
    this._connected = false;
    this.hooks = {
      values: [],
      deps: [],
      effects: [],
      layoutEffects: [],
      cleanup: [],
    };
    this.props = {};
    this.attrTypes = {};
    this.name = '';
    this.renderer = () => {};
    this.attrTypes = {};
    this.funcKeys = [];
    this.attrTypesMap = {};
  }
  connectedCallback() {
    this._connected = true;
    if (isBrowser) {
      this.update();
    } else {
      __setCurrent__(this);
    }
  }
  disconnectedCallback() {
    this._connected = false;
    let cleanup;
    while ((cleanup = this.hooks.cleanup.shift())) {
      cleanup();
    }
  }

  attributeChangedCallback(key, oldValue, newValue) {
    const attr = this.attrTypesMap[key];
    if (!attr) {
      return;
    }
    const data = attr.propType.parse(newValue);
    attr.propType.validate(`<${this.name}> ${key}`, data);
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
    if (isBrowser) {
      this.funcKeys.forEach((key) => {
        this.props[key] = this[key];
      });
      render(this.renderer(this.props), this);
    } else {
      __setCurrent__(this);
      return render(this.renderer(this.props), this);
    }
  }
}
export const getElement = (name) => registry[name];

export function defineElement(name, fn, attrTypes = {}) {
  const keys = Object.keys(attrTypes);
  registry[name] = {
    fn,
    attrTypes,
    clazz: class extends AtomsElement {
      constructor(attrs) {
        super();
        this.name = name;
        this.renderer = fn;
        this.attrTypes = attrTypes;
        this.funcKeys = keys.filter((key) => attrTypes[key].type === 'function');
        this.attrTypesMap = keys
          .filter((key) => attrTypes[key].type !== 'function')
          .reduce((acc, key) => {
            acc[key.toLowerCase()] = {
              propName: key,
              propType: attrTypes[key],
            };
            return acc;
          }, {});
        if (attrs) {
          attrs.forEach((item) => {
            this.attributeChangedCallback(item.name, null, item.value);
          });
        }
      }

      static get observedAttributes() {
        return keys;
      }
    },
  };
  if (isBrowser) {
    if (window.customElements.get(name)) {
      return;
    } else {
      window.customElements.define(name, registry[name].clazz);
    }
  }
}
