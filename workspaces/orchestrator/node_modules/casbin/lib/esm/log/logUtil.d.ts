import { Logger } from './logger';
declare function setLogger(l: Logger): void;
declare function getLogger(): Logger;
declare function logPrint(...v: any[]): void;
declare function logPrintf(format: string, ...v: any[]): void;
export { setLogger, getLogger, logPrint, logPrintf };
