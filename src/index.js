import { html, render as litRender, directive, NodePart, AttributePart, PropertyPart, isPrimitive } from './lit-html.js';

const isBrowser = typeof window !== 'undefined';
export { html, isBrowser };

const lastAttributeNameRegex =
  /([ \x09\x0a\x0c\x0d])([^\0-\x1F\x7F-\x9F "'>=/]+)([ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*))$/;

const wrapAttribute = (attrName, suffix, text, v) => {
  let buffer = text;
  const hasQuote = suffix && suffix.includes(`="`);
  if (attrName && !hasQuote) {
    buffer += `"`;
  }
  buffer += v;
  if (attrName && !hasQuote) {
    buffer += `"`;
  }
  return buffer;
};

export const render = isBrowser
  ? litRender
  : (template) => {
      let js = '';
      template.strings.forEach((text, i) => {
        const value = template.values[i];
        const type = typeof value;
        let attrName, suffix;
        const matchName = lastAttributeNameRegex.exec(text);
        if (matchName) {
          attrName = matchName[2];
          suffix = matchName[3];
        }
        if (value === null || !(type === 'object' || type === 'function' || type === 'undefined')) {
          js += wrapAttribute(attrName, suffix, text, type !== 'string' ? String(value) : value);
        } else if (Array.isArray(value) && value.find((item) => item && item.strings && item.type === 'html')) {
          js += text;
          value.forEach((v) => {
            js += render(v);
          });
        } else if (type === 'object') {
          // TemplateResult
          if (value.strings && value.type === 'html') {
            js += text;
            js += render(value);
          } else {
            js += wrapAttribute(attrName, suffix, text, JSON.stringify(value).replace(/"/g, `'`));
          }
        } else if (type == 'function') {
          if (attrName) {
            js += text.replace(' ' + attrName + '=', '');
          } else {
            // js += text;
            // js += value();
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

const logError = (msg) => {
  if (isBrowser ? window.__DEV__ : global.__DEV) {
    console.warn(msg);
  }
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

// export const useReducer = (reducer, initialState) =>
//   hooks({
//     oncreate: (h, c, i) => [
//       initialState,
//       function dispatch(action) {
//         const state = h.values[i][0];
//         const nextState = reducer(state, action);
//         if (!Object.is(state, nextState)) {
//           h.values[i][0] = nextState;
//           c.update();
//         }
//       },
//     ],
//   });
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

// createHooks(config) {
//   const index = this.currentCursor++;
//   if (this.hooks.values.length <= index && config.oncreate) {
//     this.hooks.values[index] = config.oncreate(this.hooks, this, index);
//   }
//   if (config.onupdate) {
//     this.hooks.values[index] = config.onupdate(this.hooks, this, index);
//   }
//   return this.hooks.values[index];
// }
//
// export const useLayoutEffect = (handler, deps) =>
//   hooks({
//     onupdate(h, _, i) {
//       if (!deps || depsChanged(h.deps[i], deps)) {
//         h.deps[i] = deps || [];
//         h.layoutEffects[i] = handler;
//       }
//     },
//   });
// export const useMemo = (fn, deps) =>
//   hooks({
//     onupdate(h, _, i) {
//       let value = h.values[i];
//       if (!deps || depsChanged(h.deps[i], deps)) {
//         h.deps[i] = deps || [];
//         value = fn();
//       }
//       return value;
//     },
//   });
// export const useCallback = (callback, deps) => useMemo(() => callback, deps);

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
const count = [0];
const registry = {};
export class AtomsElement extends BaseElement {
  static register() {
    registry[this.name] = this;
    if (isBrowser) {
      if (window.customElements.get(this.name)) {
        return;
      } else {
        window.customElements.define(this.name, registry[this.name]);
      }
    }
  }

  static getElement(name) {
    return registry[name];
  }

  static getNextIndex() {
    count[0] = count[0] + 1;
    return count[0];
  }

  static get observedAttributes() {
    if (!this.attrTypes) {
      return [];
    }
    return Object.keys(this.attrTypes)
      .filter((key) => this.attrTypes[key].type !== 'function')
      .map((k) => k.toLowerCase());
  }

  constructor(attrs) {
    super();
    this._id = `atoms:${this.constructor.getNextIndex()}`;
    this._dirty = false;
    this._connected = false;
    this.hooks = {
      currentCursor: 0,
      values: [],
      deps: [],
      effects: [],
      layoutEffects: [],
      cleanup: [],
    };
    this.attrs = attrs;
    this.config = isBrowser ? window.config : global.config;
    this.location = isBrowser ? window.location : global.location;
  }

  connectedCallback() {
    this._connected = true;
    if (isBrowser) {
      this.update();
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
    this.hooks.currentCursor = 0;
    render(this.render(), this);
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

  useState(initialState) {
    const index = this.hooks.currentCursor++;
    if (this.hooks.values.length <= index) {
      this.hooks.values[index] = [
        typeof initialState === 'function' ? initialState() : initialState,
        (nextState) => {
          const state = this.hooks.values[index][0];
          if (typeof nextState === 'function') {
            nextState = nextState(state);
          }
          if (!Object.is(state, nextState)) {
            this.hooks.values[index][0] = nextState;
            this.update();
          }
        },
      ];
    }
    return this.hooks.values[index];
  }

  useRef() {
    const index = this.currentCursor++;
    if (this.hooks.values.length <= index) {
      this.hooks.values[index] = { current: initialValue };
    }
    return this.hooks.values[index];
  }

  getAttrs() {
    return Object.keys(this.constructor.attrTypes)
      .filter((key) => this.constructor.attrTypes[key].type !== 'function')
      .reduceRight((acc, key) => {
        const attrType = this.constructor.attrTypes[key];
        const newValue = isBrowser ? this.getAttribute(key.toLowerCase()) : this.attrs.find((item) => item.name === key.toLowerCase()).value;
        const data = attrType.parse(newValue);
        attrType.validate(`<${this.constructor.name}> ${key}`, data);
        acc[key] = data;
        return acc;
      }, {});
  }
}
