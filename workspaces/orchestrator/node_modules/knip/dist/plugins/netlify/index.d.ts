import type { IsPluginEnabled, ResolveConfig, ResolveEntryPaths } from '../../types/config.js';
import type { NetlifyConfig } from './types.js';
declare const _default: {
    title: string;
    enablers: (string | RegExp)[];
    isEnabled: IsPluginEnabled;
    config: string[];
    production: string[];
    resolveEntryPaths: ResolveEntryPaths<NetlifyConfig>;
    resolveConfig: ResolveConfig<NetlifyConfig>;
};
export default _default;
