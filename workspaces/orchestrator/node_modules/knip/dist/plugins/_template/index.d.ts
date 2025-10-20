import type { IsPluginEnabled, ResolveConfig } from '../../types/config.js';
import type { PluginConfig } from './types.js';
declare const _default: {
    title: string;
    enablers: string[];
    isEnabled: IsPluginEnabled;
    config: string[];
    entry: string[];
    production: string[];
    resolveConfig: ResolveConfig<PluginConfig>;
};
export default _default;
