import * as fsStat from '@nodelib/fs.stat';
import * as fs from './adapters/fs';
export interface Options {
    followSymbolicLinks?: boolean;
    fs?: Partial<fs.FileSystemAdapter>;
    pathSegmentSeparator?: string;
    stats?: boolean;
    throwErrorOnBrokenSymbolicLink?: boolean;
}
export declare class Settings {
    readonly followSymbolicLinks: boolean;
    readonly fs: fs.FileSystemAdapter;
    readonly pathSegmentSeparator: string;
    readonly stats: boolean;
    readonly throwErrorOnBrokenSymbolicLink: boolean;
    readonly fsStatSettings: fsStat.Settings;
    constructor(options?: Options);
}
