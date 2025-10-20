declare class Logger {
    enable: boolean;
    identifier: string;
    constructor(identifier?: string);
    info(msg: string, info?: any): void;
    logOriginalInfo(...args: unknown[]): void;
}
export { Logger };
