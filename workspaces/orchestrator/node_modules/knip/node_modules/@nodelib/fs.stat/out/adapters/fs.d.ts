import * as fs from 'node:fs';
import type { ErrnoException } from '../types';
export type StatAsynchronousMethod = (path: string, callback: (error: ErrnoException | null, stats: fs.Stats) => void) => void;
export type StatSynchronousMethod = (path: string) => fs.Stats;
export interface FileSystemAdapter {
    lstat: StatAsynchronousMethod;
    stat: StatAsynchronousMethod;
    lstatSync: StatSynchronousMethod;
    statSync: StatSynchronousMethod;
}
export declare const FILE_SYSTEM_ADAPTER: FileSystemAdapter;
export declare function createFileSystemAdapter(fsMethods?: Partial<FileSystemAdapter>): FileSystemAdapter;
