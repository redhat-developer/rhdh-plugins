import type { IsPluginEnabled, ResolveConfig, ResolveEntryPaths } from '../../types/config.js';
import { DummyEleventyConfig } from './helpers.js';
import type { EleventyConfig } from './types.js';
type T = Partial<EleventyConfig> | ((arg: DummyEleventyConfig) => Promise<Partial<EleventyConfig>>);
declare const _default: {
    title: string;
    enablers: string[];
    isEnabled: IsPluginEnabled;
    config: string[];
    production: string[];
    resolveEntryPaths: ResolveEntryPaths<T>;
    resolveConfig: ResolveConfig<T>;
};
export default _default;
