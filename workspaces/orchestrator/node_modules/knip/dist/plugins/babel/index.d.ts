import type { IsPluginEnabled, ResolveConfig } from '../../types/config.js';
import { type Input } from '../../util/input.js';
import type { BabelConfig, BabelConfigObj } from './types.js';
export declare const getDependenciesFromConfig: (config: BabelConfigObj) => Input[];
declare const _default: {
    title: string;
    enablers: RegExp[];
    isEnabled: IsPluginEnabled;
    config: string[];
    resolveConfig: ResolveConfig<BabelConfig>;
};
export default _default;
