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

export type find = (node: any) => void;
export type ssr = (template: any) => string;

export type Props = {
  config: Config;
  data: Data;
  item: Item;
}
export type Handler = (props: Props) => string;
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
