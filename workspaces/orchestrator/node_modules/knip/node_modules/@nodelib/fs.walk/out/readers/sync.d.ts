import type { IFileSystemAdapter } from '../adapters/fs';
import type { Settings } from '../settings';
import type { Entry } from '../types';
export interface ISyncReader {
    read: (root: string) => Entry[];
}
export declare class SyncReader implements ISyncReader {
    #private;
    constructor(fs: IFileSystemAdapter, settings: Settings);
    read(root: string): Entry[];
}
