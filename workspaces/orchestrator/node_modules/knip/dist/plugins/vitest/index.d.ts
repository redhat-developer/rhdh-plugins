import type { IsPluginEnabled, ResolveConfig, ResolveEntryPaths } from '../../types/config.js';
import type { ViteConfigOrFn, VitestWorkspaceConfig } from './types.js';
export declare const resolveEntryPaths: ResolveEntryPaths<ViteConfigOrFn | VitestWorkspaceConfig>;
export declare const resolveConfig: ResolveConfig<ViteConfigOrFn | VitestWorkspaceConfig>;
declare const _default: {
    title: string;
    enablers: string[];
    isEnabled: IsPluginEnabled;
    config: string[];
    entry: string[];
    resolveEntryPaths: ResolveEntryPaths<ViteConfigOrFn | VitestWorkspaceConfig>;
    resolveConfig: ResolveConfig<ViteConfigOrFn | VitestWorkspaceConfig>;
    args: {
        config: boolean;
    };
};
export default _default;
