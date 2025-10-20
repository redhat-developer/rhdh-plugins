import type { IsPluginEnabled, ResolveConfig } from '../../types/config.js';
import type { GatsbyConfig, GatsbyNode } from './types.js';
declare const _default: {
    title: string;
    enablers: string[];
    isEnabled: IsPluginEnabled;
    config: string[];
    production: string[];
    resolveConfig: ResolveConfig<GatsbyConfig | GatsbyNode>;
};
export default _default;
