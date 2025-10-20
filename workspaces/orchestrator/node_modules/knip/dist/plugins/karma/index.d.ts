import type { IsPluginEnabled, ResolveConfig, ResolveEntryPaths } from '../../types/config.js';
import { type ConfigFile } from './helpers.js';
declare const _default: {
    title: string;
    enablers: string[];
    isEnabled: IsPluginEnabled;
    config: string[];
    entry: string[];
    resolveConfig: ResolveConfig<ConfigFile>;
    resolveEntryPaths: ResolveEntryPaths<ConfigFile>;
};
export default _default;
