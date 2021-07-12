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
export declare type Iteam = any;

export type Props = {
  config: Config;
  data: Data;
  item: Data;
}
export class Page {
  route: (props: Props) => string;
  styles: (props: Props) => string;
  head: (props: Props) => string;
  body: (props: Props) => string;
}
