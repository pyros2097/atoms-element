export declare type Destructor = () => void | undefined;
export declare type EffectCallback = () => (void | Destructor);
export declare type SetStateAction<S> = S | ((prevState: S) => S);
export declare type Dispatch<A> = (value: A) => void;
export declare type DispatchWithoutAction = () => void;
export declare type DependencyList = ReadonlyArray<any>;
export declare type Reducer<S, A> = (prevState: S, action: A) => S;
export declare type ReducerWithoutAction<S> = (prevState: S) => S;
export declare type ReducerState<R extends Reducer<any, any>> = R extends Reducer<infer S, any> ? S : never;
export declare type ReducerAction<R extends Reducer<any, any>> = R extends Reducer<any, infer A> ? A : never;
export declare type ReducerStateWithoutAction<R extends ReducerWithoutAction<any>> = R extends ReducerWithoutAction<infer S> ? S : never;
export declare interface MutableRefObject<T> {
  current: T | null | undefined;
}
export declare type Config = {
  version: string
  url: string
  image: string
  author: string
  languages: Array<string>
  title: string
  description: string
  keywords: string
  categories: Array<string>
  tags: Array<string>
  strings: {[key: string]: string}
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

export declare const useState: <S>(initialState: S | (() => S)) => [S, Dispatch<SetStateAction<S>>];
export declare const useEffect: (effect: EffectCallback, deps?: DependencyList) => void;
export declare const useLayoutEffect: (effect: EffectCallback, deps?: DependencyList) => void;
export declare const useReducer: <R extends ReducerWithoutAction<any>, I>(
  reducer: R,
  initializerArg: I,
  initializer: (arg: I) => ReducerStateWithoutAction<R>
) => [ReducerStateWithoutAction<R>, DispatchWithoutAction];

export declare const useCallback: <T extends (...args: any[]) => any>(callback: T, deps: DependencyList) => T;
export declare const useMemo: <T>(factory: () => T, deps: DependencyList | undefined) => T;
// function useImperativeHandle<T, R extends T>(ref: Ref<T>|undefined, init: () => R, deps?: DependencyList): void;
export declare const useRef: <T>(initialValue: T | null | undefined) => MutableRefObject<T>;

export declare const useConfig: () => Config;
export declare const useLocation: () => Location;
