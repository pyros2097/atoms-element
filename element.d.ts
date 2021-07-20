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

export default class AtomsElement {
  static register(): () => void;
  static observedAttributes: Array<string>;
  static getElement: (name: string) => AtomsElement | undefined;
  config: Config;
  location: Location;
  attrs: {[key: string]: any};
  state: {[key: string]: any};
  computed: {[key: string]: any};
  styles: () => string;
}

// declare type Colors = 'red' | 'purple' | 'blue' | 'green';
// declare type Luminance = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
// declare type BgColor = `bg-${Colors}-${Luminance}`;
// declare type Distance = 0.5 | 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
// declare type Breakpoints = 'xs:' | 'sm:' | 'md:' | 'lg:' | 'xl:' | '';
// declare type Space = `${Breakpoints}space-${'x' | 'y'}-${Distance}`;
// declare type ValidClass = Space | BgColor;
// declare type Tailwind<S> = S extends `${infer Class} ${infer Rest}` ? Class extends ValidClass ? `${Class} ${Tailwind<Rest>}` : never : S extends `${infer Class}` ? Class extends ValidClass ? S : never : never;
// declare function doSomethingWithTwClass<S>(cls: Tailwind<S>): Tailwind<S>;
// declare const bad: never;
// declare const bad2: never;
// declare const bad3: never;
// declare const bad4: never;
// declare const good: "bg-red-400 space-x-4 md:space-x-8";
// declare const good2: "bg-red-400 space-x-4";
// declare const good3: "space-x-1.5 bg-blue-200";