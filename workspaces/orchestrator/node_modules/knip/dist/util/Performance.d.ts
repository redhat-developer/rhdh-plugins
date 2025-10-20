import { type PerformanceEntry, PerformanceObserver } from 'node:perf_hooks';
import { memoryUsage } from 'node:process';
export declare const timerify: <T extends (...params: any[]) => any>(fn: T, name?: string) => T;
declare class Performance {
    isEnabled: boolean;
    startTime: number;
    endTime: number;
    entries: PerformanceEntry[];
    instanceId?: number;
    fnObserver?: PerformanceObserver;
    gcObserver?: PerformanceObserver;
    memoryUsageStart?: ReturnType<typeof memoryUsage>;
    constructor(isEnabled: boolean);
    private setMark;
    private clearMark;
    private flush;
    private getEntriesByName;
    getTable(): string;
    getCurrentDurationInMs(startTime?: number): number;
    getMemHeapUsage(): number;
    getCurrentMemUsageInMb(): number;
    finalize(): Promise<void>;
    reset(): void;
}
export declare const perfObserver: Performance;
export {};
