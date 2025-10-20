import type { IsPluginEnabled, ResolveConfig, ResolveEntryPaths } from '../../types/config.js';
import type { CypressConfig } from './types.js';
declare const _default: {
    title: string;
    enablers: string[];
    isEnabled: IsPluginEnabled;
    config: string[];
    entry: string[];
    resolveEntryPaths: ResolveEntryPaths;
    resolveConfig: ResolveConfig<CypressConfig>;
};
export default _default;
