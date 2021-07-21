import { html, render as litRender, directive, NodePart, AttributePart, PropertyPart, isPrimitive } from './lit-html.js';

const isBrowser = typeof window !== 'undefined';
export { html, isBrowser };

// Taken from emotion
const murmur2 = (str) => {
  var h = 0;
  var k,
    i = 0,
    len = str.length;
  for (; len >= 4; ++i, len -= 4) {
    k = (str.charCodeAt(i) & 0xff) | ((str.charCodeAt(++i) & 0xff) << 8) | ((str.charCodeAt(++i) & 0xff) << 16) | ((str.charCodeAt(++i) & 0xff) << 24);
    k = (k & 0xffff) * 0x5bd1e995 + (((k >>> 16) * 0xe995) << 16);
    k ^= k >>> 24;
    h = ((k & 0xffff) * 0x5bd1e995 + (((k >>> 16) * 0xe995) << 16)) ^ ((h & 0xffff) * 0x5bd1e995 + (((h >>> 16) * 0xe995) << 16));
  }
  switch (len) {
    case 3:
      h ^= (str.charCodeAt(i + 2) & 0xff) << 16;
    case 2:
      h ^= (str.charCodeAt(i + 1) & 0xff) << 8;
    case 1:
      h ^= str.charCodeAt(i) & 0xff;
      h = (h & 0xffff) * 0x5bd1e995 + (((h >>> 16) * 0xe995) << 16);
  }
  h ^= h >>> 13;
  h = (h & 0xffff) * 0x5bd1e995 + (((h >>> 16) * 0xe995) << 16);
  return ((h ^ (h >>> 15)) >>> 0).toString(36);
};

const hyphenate = (s) => s.replace(/[A-Z]|^ms/g, '-$&').toLowerCase();

export const convertStyles = (prefix, obj, parentClassName, indent = '') => {
  const className = parentClassName || prefix + '-' + murmur2(JSON.stringify(obj)).toString(36);
  const cssText = Object.keys(obj).reduce((acc, key) => {
    const value = obj[key];
    if (typeof value === 'object') {
      acc += '\n  ' + indent + convertStyles(prefix, value, key, indent + '  ').cssText;
    } else {
      acc += '  ' + indent + hyphenate(key) + ': ' + value + ';\n';
    }
    return acc;
  }, `${parentClassName ? '' : '.'}${className} {\n`);
  return { className, cssText: cssText + `\n${indent}}` };
};

export const css = (obj) => {
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    const { className, cssText } = convertStyles(key, value);
    obj[key] = className;
    obj[className] = cssText;
  });
  obj.toString = () => {
    return Object.keys(obj).reduce((acc, key) => {
      acc += key.includes('-') ? obj[key] + '\n\n' : '';
      return acc;
    }, '');
  };
  return obj;
};

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

const validator = (type, validate) => (innerType) => {
  const isPrimitiveType = ['number', 'string', 'boolean'].includes(type);
  const common = {
    type: type,
    parse: isPrimitiveType ? (attr) => attr : (attr) => (attr ? JSON.parse(attr.replace(/'/g, `"`)) : null),
    validate: (context, data) => {
      if (data === null || typeof data === 'undefined') {
        if (common.__required) {
          logError(`'${context}' Field is required`);
        }
        return;
      }
      if (!isPrimitiveType) {
        validate(innerType, context, data);
      } else {
        const dataType = typeof data;
        if (dataType !== type) {
          logError(`'${context}' Expected type '${type}' got type '${dataType}'`);
        }
      }
    },
  };
  common.required = () => {
    common.__required = true;
    return common;
  };
  common.default = (fnOrValue) => {
    common.__default = fnOrValue;
    return common;
  };
  common.compute = (...args) => {
    const fn = args[args.length - 1];
    const deps = args.slice(0, args.length - 1);
    common.__compute = {
      fn,
      deps,
    };
    return common;
  };
  return common;
};

export const number = validator('number');
export const string = validator('string');
export const boolean = validator('boolean');
export const object = validator('object', (innerType, context, data) => {
  if (data.constructor !== Object) {
    logError(`'${context}' Expected object literal '{}' got '${typeof data}'`);
  }
  for (const key of Object.keys(innerType)) {
    const fieldValidator = innerType[key];
    const item = data[key];
    fieldValidator.validate(`${context}.${key}`, item);
  }
});
export const array = validator('array', (innerType, context, data) => {
  if (!Array.isArray(data)) {
    logError(`Expected Array got ${data}`);
  }
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    innerType.validate(`${context}[${i}]`, item);
  }
});

const fifo = (q) => q.shift();
const filo = (q) => q.pop();
const microtask = (flush) => () => queueMicrotask(flush);
const task = (flush) => {
  if (isBrowser) {
    const ch = new window.MessageChannel();
    ch.port1.onmessage = flush;
    return () => ch.port2.postMessage(null);
  } else {
    return () => setImmediate(flush);
  }
};

const registry = {};
const BaseElement = isBrowser ? window.HTMLElement : class {};

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

  static get observedAttributes() {
    if (!this.attrTypes) {
      return [];
    }
    return Object.keys(this.attrTypes).map((k) => k.toLowerCase());
  }

  constructor(ssrAttributes) {
    super();
    this._dirty = false;
    this._connected = false;
    this._state = {};
    this.ssrAttributes = ssrAttributes;
    this.config = isBrowser ? window.config : global.config;
    this.location = isBrowser ? window.location : global.location;
    this.stylesMounted = false;
  }

  connectedCallback() {
    this._connected = true;
    if (isBrowser) {
      this.update();
    }
  }
  disconnectedCallback() {
    this._connected = false;
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
    this.enqueueUpdate();
  }

  _performUpdate() {
    if (!this._connected) {
      return;
    }
    this.renderTemplate();
    this._dirty = false;
  }

  batch(runner, pick, callback) {
    const q = [];
    const flush = () => {
      let p;
      while ((p = pick(q))) callback(p);
    };
    const run = runner(flush);
    q.push(this) === 1 && run();
  }

  enqueueUpdate() {
    this.batch(microtask, fifo, () => this._performUpdate());
  }

  get attrs() {
    return Object.keys(this.constructor.attrTypes).reduceRight((acc, key) => {
      const attrType = this.constructor.attrTypes[key];
      const newValue = isBrowser ? this.getAttribute(key.toLowerCase()) : this.ssrAttributes.find((item) => item.name === key.toLowerCase())?.value;
      const data = attrType.parse(newValue);
      attrType.validate(`<${this.constructor.name}> ${key}`, data);
      acc[key] = data;
      return acc;
    }, {});
  }

  get state() {
    return Object.keys(this.constructor.stateTypes).reduceRight((acc, key) => {
      const stateType = this.constructor.stateTypes[key];
      if (!this._state[key] && typeof stateType.__default !== 'undefined') {
        this._state[key] = typeof stateType.__default === 'function' ? stateType.__default(this.attrs, this._state) : stateType.__default;
      }
      acc[key] = this._state[key];
      acc[`set${key[0].toUpperCase()}${key.slice(1)}`] = (v) => {
        // TODO: check type on set
        this._state[key] = typeof v === 'function' ? v(this._state[key]) : v;
        this.update();
      };
      return acc;
    }, {});
  }

  get computed() {
    return Object.keys(this.constructor.computedTypes).reduceRight((acc, key) => {
      const type = this.constructor.computedTypes[key];
      const state = this.state;
      const values = type.__compute.deps.reduce((acc, key) => {
        if (typeof state[key] !== undefined) {
          acc.push(state[key]);
        }
        return acc;
      }, []);
      acc[key] = type.__compute.fn(...values);
      return acc;
    }, {});
  }

  renderTemplate() {
    const template = this.render();
    const result = render(template, this);
    if (isBrowser) {
      if (!this.stylesMounted) {
        this.appendChild(document.createElement('style')).textContent = this.constructor.styles.toString();
        this.stylesMounted = true;
      }
    } else {
      return `
        ${result}
        <style>
        ${this.constructor.styles.toString()}
        </style>
      `;
    }
  }
}
export const getConfig = () => (isBrowser ? window.config : global.config);
export const getLocation = () => (isBrowser ? window.location : global.location);

export const createElement = ({ name, attrTypes, stateTypes, computedTypes, styles, render }) => {
  const Element = class extends AtomsElement {
    static name = name();

    static attrTypes = attrTypes();

    static stateTypes = stateTypes();

    static computedTypes = computedTypes();

    static styles = styles;

    constructor(ssrAttributes) {
      super(ssrAttributes);
    }
    render() {
      return render({
        attrs: this.attrs,
        state: this.state,
        computed: this.computed,
      });
    }
  };
  Element.register();
  return { name, attrTypes, stateTypes, computedTypes, styles, render };
};
