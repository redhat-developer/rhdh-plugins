import type { Compiler } from '@rspack/core';
import type { TsCheckerRspackPluginState } from '../plugin-state';
import type { WatchFileSystem } from './watch-file-system';
export declare function createIsIgnored(ignored: string | RegExp | (string | RegExp)[] | undefined, excluded: string[]): (path: string) => boolean;
declare class InclusiveNodeWatchFileSystem implements WatchFileSystem {
    private watchFileSystem;
    private compiler;
    private pluginState;
    get watcher(): import("./watch-file-system").Watchpack | undefined;
    private readonly dirsWatchers;
    private paused;
    private deletedFiles;
    constructor(watchFileSystem: WatchFileSystem, compiler: Compiler, pluginState: TsCheckerRspackPluginState);
    watch: WatchFileSystem['watch'];
}
export { InclusiveNodeWatchFileSystem };
