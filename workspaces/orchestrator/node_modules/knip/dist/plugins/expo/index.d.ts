import type { IsPluginEnabled, ResolveConfig, ResolveEntryPaths } from '../../types/config.js';
import type { ExpoConfig } from './types.js';
export declare const docs: {
    production: string[];
};
declare const _default: {
    title: string;
    enablers: string[];
    isEnabled: IsPluginEnabled;
    config: string[];
    resolveEntryPaths: ResolveEntryPaths<ExpoConfig>;
    resolveConfig: ResolveConfig<ExpoConfig>;
};
export default _default;
