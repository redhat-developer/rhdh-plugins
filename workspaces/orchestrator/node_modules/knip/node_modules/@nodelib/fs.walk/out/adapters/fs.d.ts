import * as fsScandir from '@nodelib/fs.scandir';
import type { AsyncCallback, Settings, Entry } from '@nodelib/fs.scandir';
type ScandirAsynchronousMethod = (root: string, settings: Settings, callback: AsyncCallback) => void;
type ScnadirSynchronousMethod = (root: string, settings: Settings) => Entry[];
export interface IFileSystemAdapter {
    scandir: ScandirAsynchronousMethod;
    scandirSync: ScnadirSynchronousMethod;
}
export declare class FileSystemAdapter implements IFileSystemAdapter {
    readonly scandir: typeof fsScandir.scandir;
    readonly scandirSync: typeof fsScandir.scandirSync;
}
export {};
