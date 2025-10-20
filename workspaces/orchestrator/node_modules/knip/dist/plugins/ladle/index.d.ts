import type { IsPluginEnabled, ResolveConfig, ResolveEntryPaths } from '../../types/config.js';
import type { LadleConfig } from './types.js';
declare const _default: {
    title: string;
    enablers: string[];
    isEnabled: IsPluginEnabled;
    config: string[];
    entry: string[];
    project: string[];
    resolveEntryPaths: ResolveEntryPaths<LadleConfig>;
    resolveConfig: ResolveConfig<LadleConfig>;
};
export default _default;
