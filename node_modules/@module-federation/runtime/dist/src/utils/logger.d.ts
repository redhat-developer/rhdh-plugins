export declare function assert(condition: any, msg: string): asserts condition;
export declare function error(msg: string | Error | unknown): never;
export declare function warn(msg: Parameters<typeof console.warn>[0]): void;
