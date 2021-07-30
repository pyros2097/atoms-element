export declare type Config = {
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

export declare type Location = {
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

export declare type Data = any;
export declare type Item = any;

export class AtomsElement {
  static register(): () => void;
  static observedAttributes: Array<string>;
  static getElement: (name: string) => AtomsElement | undefined;
  attrs: {[key: string]: any};
  state: {[key: string]: any};
  computed: {[key: string]: any};
}
export const getConfig = () => Config;
export const getLocation = () => Location;

export type PageRenderProps = {
  props: any;
  headScript: string; 
  bodyScript: string;
}
export type Handler = (props: any) => string;

export function createPage(props: { head: Handler, body: Handler}): (props: PageRenderProps) => string;

export type State<P, Q> = {
  getValue: () => P;
  subscribe: (fn: (v: P) => void) => void;
} & { actions: { [K in keyof Q]: (v: any) => void}}

export function createState<P, Q extends {[k: string]: (state: P, v: any) => P}>(props: { state: P, reducer: Q }): State<P, Q>;

export type CreateElementProps<N, P, Q> = {
  name: string;
  attrs: N;
  state: P;
  reducer: Q
  render:  (props: { attrs: N, state: P, actions: { [K in keyof Q]: (v: any) => void;} }) => any
}

export function createElement<N, P, Q extends {[k: string]: (state: P, v: any) => P}>(props: CreateElementProps<N, P, Q>): CreateElementProps<N, P, Q>;
