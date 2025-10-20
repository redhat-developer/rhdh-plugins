import type { IsPluginEnabled, ResolveConfig, ResolveEntryPaths } from '../../types/config.js';
import type { MochaConfig } from './types.js';
declare const _default: {
    title: string;
    enablers: string[];
    isEnabled: IsPluginEnabled;
    config: string[];
    entry: string[];
    resolveConfig: ResolveConfig<MochaConfig>;
    resolveEntryPaths: ResolveEntryPaths<MochaConfig>;
    args: {
        nodeImportArgs: boolean;
    };
};
export default _default;
