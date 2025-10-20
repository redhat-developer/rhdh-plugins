import { Settings } from './settings';
import type { Options } from './settings';
import type { AsyncCallback, Entry } from './types';
export declare function scandir(path: string, callback: AsyncCallback): void;
export declare function scandir(path: string, optionsOrSettings: Options | Settings, callback: AsyncCallback): void;
export declare namespace scandir {
    function __promisify__(path: string, optionsOrSettings?: Options | Settings): Promise<Entry[]>;
}
export declare function scandirSync(path: string, optionsOrSettings?: Options | Settings): Entry[];
