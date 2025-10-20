import type { IsPluginEnabled, ResolveConfig, ResolveEntryPaths } from '../../types/config.js';
import type { AvaConfig } from './types.js';
declare const _default: {
    title: string;
    enablers: string[];
    isEnabled: IsPluginEnabled;
    config: string[];
    entry: string[];
    resolveEntryPaths: ResolveEntryPaths<AvaConfig>;
    resolveConfig: ResolveConfig<AvaConfig>;
};
export default _default;
