export type Config = {
  version: string
  url: string
  image: string
  author: string
  languages: Array<string>
  title: string
  description: string
  keywords: string
  categories: Array<any>
  tags: Array<any>
  strings: {[key: string]: any}
  themes: {[key: string]: any}
}

export type Location = {
  readonly ancestorOrigins: DOMStringList;
  hash: string;
  host: string;
  hostname: string;
  href: string;
  readonly origin: string;
  pathname: string;
  port: string;
  protocol: string;
  search: string;
  assign: (url: string | URL) => void;
  reload: () => void;
  replace: (url: string | URL) => void;
  toString: () => string;
}


export type Reducer<P, Q> = {
  getValue: () => P;
  subscribe: (fn: (v: P) => void) => void;
} & { actions: { [K in keyof Q]: (v: any) => void}}

export type Thunk = () => void | Promise<void>;
export type ReducerActions<P> = {[k: string]: (state: P, v: any) => P | Thunk };

export function createReducer<P, Q extends ReducerActions<P>>(props: { initial: P, reducer: Q }): Reducer<P, Q>;

export function useReducer<P, Q extends ReducerActions<P>>(props: Reducer<P, Q> | { initial: P, reducer: Q }) : P & Reducer<P, Q>;

export function createElement(meta: any, renderFn: any): any
export type Handler = (props: any) => string;
export function createPage(props: { head: Handler, body: Handler}): (props: { props: any, headScript: string, bodyScript: string }) => string;
