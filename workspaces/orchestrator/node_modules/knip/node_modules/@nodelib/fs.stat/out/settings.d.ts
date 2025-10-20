import * as fs from './adapters/fs';
export interface Options {
    followSymbolicLink?: boolean;
    fs?: Partial<fs.FileSystemAdapter>;
    markSymbolicLink?: boolean;
    throwErrorOnBrokenSymbolicLink?: boolean;
}
export declare class Settings {
    readonly followSymbolicLink: boolean;
    readonly fs: fs.FileSystemAdapter;
    readonly markSymbolicLink: boolean;
    readonly throwErrorOnBrokenSymbolicLink: boolean;
    constructor(options?: Options);
}
