import { createElement, html, css, object, number, string } from '../element.js';

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
