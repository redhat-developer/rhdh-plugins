import type { IAsyncReader } from '../readers';
import type { Entry, ErrnoException } from '../types';
export type AsyncCallback = (error: ErrnoException | null, entries: Entry[]) => void;
export declare class AsyncProvider {
    #private;
    constructor(reader: IAsyncReader);
    read(root: string, callback: AsyncCallback): void;
}
