# atoms-element

[![Version](https://img.shields.io/npm/v/atoms-element?style=flat-square&color=blue)](https://www.npmjs.com/package/atoms-element)
![Test](https://github.com/pyros2097/atoms-element/actions/workflows/main.yml/badge.svg)

A simple web component library for defining your custom elements. It works on both client and server. It supports hooks and follows the same
principles of react. Data props are attributes on the custom element by default so its easier to debug and functions/handlers are attached to the element.

I initially started researching if it was possible to server render web components but found out not one framework supported it. I liked using
[haunted](https://github.com/matthewp/haunted) as it was react like with hooks but was lost on how to implement server rendering. Libraries like
JSDOM couldn't be of use since it didn't support web components and I didn't want to use puppeteer for something like this.

After a year of thinking about it and researching it I found out this awesome framework [Tonic](https://github.com/optoolco/tonic).
That was the turning point I figured out how they implemented it using a simple html parser.

After going through all these libraries,

1. [lit-html](https://github.com/lit/lit)
2. [lit-html-server](https://github.com/popeindustries/lit-html-server)
3. [haunted](hhttps://github.com/matthewp/haunted)
4. [Tonic](https://github.com/optoolco/tonic)
5. [Atomico](https://github.com/atomicojs/atomico)
6. [fuco](https://github.com/wtnbass/fuco)

And figuring out how each one implemented their on custom elements I came up with atoms-element. It still doesn't have proper rehydration lit-html just replaces the DOM under the server rendered web component for now. Atomico has implemented proper SSR with hydration so I might need to look into that in the future or
use it instead of lit-html. Since I made a few modifications like json attributes and attrTypes I don't know if it will easy.

## Installation

```sh
npm i atoms-element
```

## Example

```js
import { createElement, html, css, object, number, string } from 'atoms-element/element.js';
import { ssr } from 'atoms-element/page.js';

const name = () => 'app-counter';

const attrTypes = () => ({
  name: string().required(),
  meta: object({
    start: number(),
  }),
});

const stateTypes = () => ({
  count: number()
    .required()
    .default((attrs) => attrs.meta?.start || 0),
});

const computedTypes = () => ({
  sum: number()
    .required()
    .compute('count', (count) => {
      return count + 10;
    }),
});

const styles = css({
  title: {
    fontSize: '20px',
    marginBottom: '0.5rem',
    textAlign: 'center',
  },
  span: {
    fontSize: '16px',
  },
  container: {
    display: 'flex',
    flex: 1,
    flexDirection: 'row',
    fontSize: '32px',
    color: 'rgba(55, 65, 81, 1)',
  },
  mx: {
    marginLeft: '5rem',
    marginRight: '5rem',
    fontSize: '30px',
    fontFamily: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace`,
  },
  button: {
    paddingTop: '0.5rem',
    paddingBottom: '0.5rem',
    paddingLeft: '1rem',
    paddingRight: '1rem',
    color: 'rgba(55, 65, 81, 1)',
    borderRadius: '0.25rem',
    backgroundColor: 'rgba(209, 213, 219, 1)',
  },
});

const render = ({ attrs, state, computed }) => {
  const { name, meta } = attrs;
  const { count, setCount } = state;
  const { sum } = computed;

  return html`
    <div>
      <div class=${styles.title}>
        Counter: ${name}
        <span class=${styles.span}>starts at ${meta?.start}</span>
      </div>
      <div class=${styles.container}>
        <button class=${styles.button} @click=${() => setCount((v) => v - 1)}>-</button>
        <div class=${styles.mx}>
          <h1>${count}</h1>
        </div>
        <button class=${styles.button} @click=${() => setCount((v) => v + 1)}>+</button>
      </div>
      <div class=${styles.mx}>
        <h1>Sum: ${sum}</h1>
      </div>
    </div>
  `;
};

export default createElement({
  name,
  attrTypes,
  stateTypes,
  computedTypes,
  styles,
  render,
});

console.log(ssr(html`<app-counter name="1"></app-counter>`));
```

This works in node, to make it work in the client side you need to either compile atoms-element using esintall or esbuild to an esm module and then
rewrite the path from 'atoms-element' to 'web_modules/atoms-element/index.js' or if you can host the node_modules in a web server and change the path to
the import 'atoms-element/element.js'
