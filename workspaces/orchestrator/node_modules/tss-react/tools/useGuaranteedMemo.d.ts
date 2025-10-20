/// <reference types="react" />
/** Like react's useMemo but with guarantee that the fn
 * won't be invoked again if deps hasn't change */
export declare function useGuaranteedMemo<T>(fn: () => T, deps: React.DependencyList): T;
