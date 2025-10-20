import type { IsPluginEnabled, ResolveConfig, ResolveEntryPaths } from '../../types/config.js';
import type { MetroConfig } from './types.js';
export declare const docs: {
    note: string;
    production: string[];
};
declare const _default: {
    title: string;
    enablers: string[];
    isEnabled: IsPluginEnabled;
    config: string[];
    resolveEntryPaths: ResolveEntryPaths<MetroConfig>;
    resolveConfig: ResolveConfig<MetroConfig>;
};
export default _default;
