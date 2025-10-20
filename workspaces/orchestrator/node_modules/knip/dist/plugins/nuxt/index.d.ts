import type { IsPluginEnabled, ResolveEntryPaths } from '../../types/config.js';
import type { NuxtConfig } from './types.js';
export declare const docs: {
    note: string;
};
declare const _default: {
    title: string;
    enablers: string[];
    isEnabled: IsPluginEnabled;
    entry: string[];
    production: string[];
    resolveEntryPaths: ResolveEntryPaths<NuxtConfig>;
};
export default _default;
