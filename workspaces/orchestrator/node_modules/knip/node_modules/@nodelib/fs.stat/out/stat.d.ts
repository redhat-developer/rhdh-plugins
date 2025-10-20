import { Settings } from './settings';
import type { Options } from './settings';
import type { AsyncCallback, Stats } from './types';
export declare function stat(path: string, callback: AsyncCallback): void;
export declare function stat(path: string, optionsOrSettings: Options | Settings, callback: AsyncCallback): void;
export declare namespace stat {
    function __promisify__(path: string, optionsOrSettings?: Options | Settings): Promise<Stats>;
}
export declare function statSync(path: string, optionsOrSettings?: Options | Settings): Stats;
