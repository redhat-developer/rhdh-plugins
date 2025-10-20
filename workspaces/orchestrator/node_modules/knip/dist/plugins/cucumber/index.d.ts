import type { IsPluginEnabled, ResolveConfig, ResolveEntryPaths } from '../../types/config.js';
import type { CucumberConfig } from './types.js';
declare const _default: {
    title: string;
    enablers: string[];
    isEnabled: IsPluginEnabled;
    config: string[];
    entry: string[];
    resolveEntryPaths: ResolveEntryPaths<CucumberConfig>;
    resolveConfig: ResolveConfig<CucumberConfig>;
};
export default _default;
