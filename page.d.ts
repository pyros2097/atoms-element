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
export declare type Data = any;
export declare type Item = any;

export class Page {
  config: Config;
  data: Data;
  item: Item;
  route: () => string;
  styles: () => string;
  head: () => string;
  body: () => string;
}
