export declare type MatchingFunction = (...arg: any[]) => boolean | number | string | Promise<boolean> | Promise<number> | Promise<string>;
export declare class FunctionMap {
    private functions;
    /**
     * constructor is the constructor for FunctionMap.
     */
    constructor();
    static loadFunctionMap(): FunctionMap;
    addFunction(name: string, func: MatchingFunction): void;
    getFunctions(): any;
}
