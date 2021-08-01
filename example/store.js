import { createReducer } from '../index.js';

export const totalReducer = createReducer({
  initial: {
    total: 0,
  },
  reducer: {
    increment: (state) => ({ ...state, total: state.total + 1 }),
    decrement: (state) => ({ ...state, total: state.total - 1 }),
  },
});
