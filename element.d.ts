import { Config } from './page';

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
  config: Config;
  location: Location;
  styles(): string
  getAttrs(): {[key: string]: any};
  useState: <S>(initialState: S | (() => S)) => [S, Dispatch<SetStateAction<S>>];
  useEffect: (effect: EffectCallback, deps?: DependencyList) => void;
  useLayoutEffect: (effect: EffectCallback, deps?: DependencyList) => void;
  useReducer: <R extends ReducerWithoutAction<any>, I>(
    reducer: R,
    initializerArg: I,
    initializer: (arg: I) => ReducerStateWithoutAction<R>
  ) => [ReducerStateWithoutAction<R>, DispatchWithoutAction];
  useCallback: <T extends (...args: any[]) => any>(callback: T, deps: DependencyList) => T;
  useMemo: <T>(factory: () => T, deps: DependencyList | undefined) => T;
  useRef: <T>(initialValue: T | null | undefined) => MutableRefObject<T>;
}
