import createElement, { html, css, object, number, string } from '../element.js';

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
    fontSize: '24px',
    marginBottom: '0.5rem',
  },
  container: {
    display: 'flex',
    flex: 1,
    flexDirection: 'row',
    fontSize: '32px',
    color: 'gray',
  },
  mx: {
    marginLeft: '40px',
    marginRight: '40px',
  },
  button: {
    // margin: 0,
    // padding: 0,
    // cursor: 'pointer',
    // backgroundImage: 'none',
    // '-webkitAppearance': 'button',
    // textTransform: 'none',
    // fontSize: '100%',
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
  const { name } = attrs;
  const { count, setCount } = state;
  const { sum } = computed;

  return html`
    <div>
      <div class=${styles.title}>Counter: ${name}</div>
      <div class=${styles.container}>
        <button class=${styles.button} @click=${() => setCount((v) => v - 1)}>-</button>
        <div class=${styles.mx}>
          <h1>${count}</h1>
          <h1>${sum}</h1>
        </div>
        <button class=${styles.button} @click=${() => setCount((v) => v + 1)}>+</button>
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
