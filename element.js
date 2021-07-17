import { html, render as litRender, directive, NodePart, AttributePart, PropertyPart, isPrimitive } from './lit-html.js';

const isBrowser = typeof window !== 'undefined';
export { html, isBrowser };

const constructionToken = Symbol();

class CSSResult {
  constructor(cssText, safeToken) {
    if (safeToken !== constructionToken) {
      throw new Error('CSSResult is not constructable. Use `unsafeCSS` or `css` instead.');
    }
    this.cssText = cssText;
  }

  toString() {
    return this.cssText;
  }
}

/**
 * Wrap a value for interpolation in a [[`css`]] tagged template literal.
 *
 * This is unsafe because untrusted CSS text can be used to phone home
 * or exfiltrate data to an attacker controlled site. Take care to only use
 * this with trusted input.
 */
export const unsafeCSS = (value) => {
  return new CSSResult(String(value), constructionToken);
};

const textFromCSSResult = (value) => {
  if (value instanceof CSSResult) {
    return value.cssText;
  } else if (typeof value === 'number') {
    return value;
  } else {
    throw new Error(
      `Value passed to 'css' function must be a 'css' function result: ${value}. Use 'unsafeCSS' to pass non-literal values, but
            take care to ensure page security.`,
    );
  }
};

/**
 * Template tag which which can be used with LitElement's [[LitElement.styles |
 * `styles`]] property to set element styles. For security reasons, only literal
 * string values may be used. To incorporate non-literal values [[`unsafeCSS`]]
 * may be used inside a template string part.
 */
export const css = (strings, ...values) => {
  const cssText = values.reduce((acc, v, idx) => acc + textFromCSSResult(v) + strings[idx + 1], strings[0]);
  return new CSSResult(cssText, constructionToken);
};

// const cssSymbol = Symbol();
// const hasCSSSymbol = (value: unknown): value is HasCSSSymbol => {
//   return value && (value as HasCSSSymbol)[cssSymbol] != null;
// };
// const resolve = (value: unknown): string => {
//   if (typeof value === "number") return String(value);
//   if (hasCSSSymbol(value)) return value[cssSymbol];
//   throw new TypeError(`${value} is not supported type.`);
// };
// export const css = (strings: readonly string[], ...values: unknown[]) => ({
//   [cssSymbol]: strings
//     .slice(1)
//     .reduce((acc, s, i) => acc + resolve(values[i]) + s, strings[0]),
// });
// export const unsafeCSS = (css: string) => ({ [cssSymbol]: css });
// root.appendChild(document.createElement("style")).textContent = cssStyle;

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

// const depsChanged = (prev, next) => prev == null || next.some((f, i) => !Object.is(f, prev[i]));
// useEffect(handler, deps) {
//   const index = this.hooks.currentCursor++;
//   if (!deps || depsChanged(this.hooks.deps[index], deps)) {
//     this.hooks.deps[index] = deps || [];
//     this.hooks.effects[index] = handler;
//   }
// }

const normalizeCss = `html{line-height:1.15;-webkit-text-size-adjust:100%}body{margin:0}main{display:block}h1{font-size:2em;margin:.67em 0}hr{box-sizing:content-box;height:0;overflow:visible}pre{font-family:monospace,monospace;font-size:1em}a{background-color:transparent}abbr[title]{border-bottom:none;text-decoration:underline;text-decoration:underline dotted}b,strong{font-weight:bolder}code,kbd,samp{font-family:monospace,monospace;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}img{border-style:none}button,input,optgroup,select,textarea{font-family:inherit;font-size:100%;line-height:1.15;margin:0}button,input{overflow:visible}button,select{text-transform:none}[type=button],[type=reset],[type=submit],button{-webkit-appearance:button}[type=button]::-moz-focus-inner,[type=reset]::-moz-focus-inner,[type=submit]::-moz-focus-inner,button::-moz-focus-inner{border-style:none;padding:0}[type=button]:-moz-focusring,[type=reset]:-moz-focusring,[type=submit]:-moz-focusring,button:-moz-focusring{outline:1px dotted ButtonText}fieldset{padding:.35em .75em .625em}legend{box-sizing:border-box;color:inherit;display:table;max-width:100%;padding:0;white-space:normal}progress{vertical-align:baseline}textarea{overflow:auto}[type=checkbox],[type=radio]{box-sizing:border-box;padding:0}[type=number]::-webkit-inner-spin-button,[type=number]::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}[type=search]::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}details{display:block}summary{display:list-item}template{display:none}[hidden]{display:none}`;
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

export default class AtomsElement extends BaseElement {
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
    this._effects = {};
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
    // let cleanup;
    // while ((cleanup = this.hooks.cleanup.shift())) {
    //   cleanup();
    // }
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
    this.enqueueEffects();
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

  enqueueEffects() {
    this.batch(task, filo, () => this._flushEffects());
  }

  enqueueUpdate() {
    this.batch(microtask, fifo, () => this._performUpdate());
  }

  _flushEffects() {
    Object.keys(this.constructor.effects).forEach((key) => {
      const effect = this.constructor.effects[key];
      //  if (!effect.deps || depsChanged(, effect.deps)) {
      //  }
      effect.callback(this.attrs, this.state);
    });
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
      if (!this._state[key]) {
        this._state[key] = 0; // TODO: default
      }
      acc[key] = this._state[key];
      acc[`set${key[0].toUpperCase()}${key.slice(1)}`] = (v) => () => {
        this._state[key] = v;
        this.update();
      };
      return acc;
    }, {});
  }

  renderTemplate() {
    const template = this.render();
    const result = render(template, this);
    if (isBrowser) {
      if (!this.stylesMounted) {
        this.appendChild(document.createElement('style')).textContent = normalizeCss + '\n' + this.constructor.styles.toString();
        this.stylesMounted = true;
      }
    } else {
      // ${normalizeCss}
      return `
        ${result}
        <style>
        ${this.constructor.styles.toString()}
        </style>
      `;
    }
  }
}
