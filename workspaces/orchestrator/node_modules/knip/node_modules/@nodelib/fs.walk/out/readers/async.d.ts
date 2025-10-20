import type { IFileSystemAdapter } from '../adapters/fs';
import type { Settings } from '../settings';
import type { EndEventCallback, Entry, EntryEventCallback, ErrorEventCallback } from '../types';
export interface IAsyncReader {
    isDestroyed: boolean;
    onError: (callback: ErrorEventCallback) => void;
    onEntry: (callback: EntryEventCallback) => void;
    onEnd: (callback: EndEventCallback) => void;
    read: (root: string) => void;
    destroy: () => void;
}
declare class AsyncReaderEmitter {
    #private;
    onEntry(callback: EntryEventCallback): void;
    onError(callback: ErrorEventCallback): void;
    onEnd(callback: EndEventCallback): void;
    protected _emitEntry(entry: Entry): void;
    protected _emitEnd(): void;
    protected _emitError(error: Error): void;
}
export declare class AsyncReader extends AsyncReaderEmitter implements IAsyncReader {
    #private;
    constructor(fs: IFileSystemAdapter, settings: Settings);
    read(root: string): void;
    get isDestroyed(): boolean;
    destroy(): void;
}
export {};
