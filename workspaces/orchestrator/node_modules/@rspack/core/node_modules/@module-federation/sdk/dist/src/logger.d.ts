declare class Logger {
    prefix: string;
    constructor(prefix: string);
    setPrefix(prefix: string): void;
    log(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
    success(...args: any[]): void;
    info(...args: any[]): void;
    ready(...args: any[]): void;
    debug(...args: any[]): void;
}
declare function createLogger(prefix: string): Logger;
declare const logger: Logger;
export { logger, createLogger };
export type { Logger };
