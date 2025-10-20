import type { ISyncReader } from '../readers';
import type { Entry } from '../types';
export declare class SyncProvider {
    #private;
    constructor(reader: ISyncReader);
    read(root: string): Entry[];
}
