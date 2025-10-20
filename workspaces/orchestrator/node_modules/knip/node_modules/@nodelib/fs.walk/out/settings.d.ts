import * as fsScandir from '@nodelib/fs.scandir';
import type { Entry, ErrnoException } from './types';
export type FilterFunction<T> = (value: T) => boolean;
export type DeepFilterFunction = FilterFunction<Entry>;
export type EntryFilterFunction = FilterFunction<Entry>;
export type ErrorFilterFunction = FilterFunction<ErrnoException>;
export interface Options {
    basePath?: string;
    concurrency?: number;
    deepFilter?: DeepFilterFunction;
    entryFilter?: EntryFilterFunction;
    errorFilter?: ErrorFilterFunction;
    followSymbolicLinks?: boolean;
    fs?: Partial<fsScandir.FileSystemAdapter>;
    pathSegmentSeparator?: string;
    stats?: boolean;
    throwErrorOnBrokenSymbolicLink?: boolean;
    signal?: AbortSignal;
}
export declare class Settings {
    readonly basePath?: string;
    readonly concurrency: number;
    readonly deepFilter: DeepFilterFunction | null;
    readonly entryFilter: EntryFilterFunction | null;
    readonly errorFilter: ErrorFilterFunction | null;
    readonly pathSegmentSeparator: string;
    readonly fsScandirSettings: fsScandir.Settings;
    readonly signal?: AbortSignal;
    constructor(options?: Options);
}
