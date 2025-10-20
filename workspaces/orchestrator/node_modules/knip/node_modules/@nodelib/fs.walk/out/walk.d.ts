import { Settings } from './settings';
import type { Options } from './settings';
import type { AsyncCallback } from './providers';
import type { Readable } from 'node:stream';
import type { Entry } from './types';
export declare function walk(directory: string, callback: AsyncCallback): void;
export declare function walk(directory: string, options: Options | Settings, callback: AsyncCallback): void;
export declare namespace walk {
    function __promisify__(directory: string, optionsOrSettings?: Options | Settings): Promise<Entry[]>;
}
export declare function walkSync(directory: string, optionsOrSettings?: Options | Settings): Entry[];
export declare function walkStream(directory: string, optionsOrSettings?: Options | Settings): Readable;
