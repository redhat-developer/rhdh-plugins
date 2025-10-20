import { Readable } from 'node:stream';
import type { IAsyncReader } from '../readers';
export declare class StreamProvider {
    #private;
    constructor(reader: IAsyncReader);
    read(root: string): Readable;
}
