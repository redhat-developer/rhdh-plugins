import { Enforcer } from './enforcer';
export declare class CachedEnforcer extends Enforcer {
    private enableCache;
    private m;
    invalidateCache(): void;
    setEnableCache(enableCache: boolean): void;
    private static canCache;
    private static getCacheKey;
    private getCache;
    private setCache;
    enforce(...rvals: any[]): Promise<boolean>;
}
export declare function newCachedEnforcer(...params: any[]): Promise<CachedEnforcer>;
