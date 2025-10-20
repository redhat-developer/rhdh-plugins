export { _load as load } from './loader.js';
import type { Plugin, PluginOptions, RawPluginConfiguration } from '../types/config.js';
import { type Input } from './input.js';
export declare const hasDependency: (dependencies: Set<string>, values: (string | RegExp)[]) => boolean;
export declare const normalizePluginConfig: (pluginConfig: RawPluginConfiguration) => boolean | {
    config: string[] | null;
    entry: string[] | null;
    project: string[] | null;
};
export declare const loadConfigForPlugin: (configFilePath: string, plugin: Plugin, options: PluginOptions, pluginName: string) => Promise<any>;
export declare const getFinalEntryPaths: (plugin: Plugin, options: PluginOptions, configEntryPaths: Input[]) => Input[];
