import { Logger } from './logger';
export declare class DefaultLogger implements Logger {
    private enable;
    enableLog(enable: boolean): void;
    isEnable(): boolean;
    print(...v: any[]): void;
    printf(format: string, ...v: any[]): void;
}
