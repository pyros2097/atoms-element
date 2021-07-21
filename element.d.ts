import { Config } from './page';

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

export class AtomsElement {
  static register(): () => void;
  static observedAttributes: Array<string>;
  static getElement: (name: string) => AtomsElement | undefined;
  attrs: {[key: string]: any};
  state: {[key: string]: any};
  computed: {[key: string]: any};
  styles: {[key: string]: any};
}
export const getConfig = () => Config;
export const getLocation = () => Location;

export type CreateElementProps = {
  name: () => string;
  attrTypes?: () => {[key: string]: any};
  stateTypes?: () => {[key: string]: any};
  computedTypes?: () => {[key: string]: any};
  styles?: {[key: string]: any};
  render:  () => any
}

export const createElement = (props: CreateElementProps) => CreateElementProps;
