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

export type CreateElementProps = {
  name: () => string;
  attrTypes?: () => {[key: string]: any};
  stateTypes?: () => {[key: string]: any};
  computedTypes?: () => {[key: string]: any};
  render:  () => any
}

export const createElement = (props: CreateElementProps) => CreateElementProps;

export type HandlerProps = {
  config: Config;
  data: Data;
  item: Item;
}
export type Handler = (props: HandlerProps) => string;

export type CreatePageProps = {
  route: Handler;
  datapaths: Handler;
  head: Handler;
  body: Handler;
}

export type PageRenderProps = {
  config: Config;
  data: Data;
  item: Item; 
  headScript: string; 
  bodyScript: string;
}

export const createPage = (props: CreatePageProps) => (props: PageRenderProps) => string;