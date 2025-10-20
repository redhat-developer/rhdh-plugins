import type * as fsStat from '@nodelib/fs.stat';
import type { Dirent, ErrnoException } from '../types';
export type ReaddirAsynchronousMethod = (filepath: string, options: {
    withFileTypes: true;
}, callback: (error: ErrnoException | null, files: Dirent[]) => void) => void;
export type ReaddirSynchronousMethod = (filepath: string, options: {
    withFileTypes: true;
}) => Dirent[];
export type FileSystemAdapter = {
    readdir: ReaddirAsynchronousMethod;
    readdirSync: ReaddirSynchronousMethod;
} & fsStat.FileSystemAdapter;
export declare const FILE_SYSTEM_ADAPTER: FileSystemAdapter;
export declare function createFileSystemAdapter(fsMethods?: Partial<FileSystemAdapter>): FileSystemAdapter;
