export interface Logger {
    enableLog(enable: boolean): void;
    isEnable(): boolean;
    print(...v: any[]): void;
    printf(format: string, ...v: any[]): void;
}
