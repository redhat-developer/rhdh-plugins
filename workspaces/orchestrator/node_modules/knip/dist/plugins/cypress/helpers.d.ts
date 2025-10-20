import type { PluginOptions } from '../../types/config.js';
import type { CypressConfig } from './types.js';
export declare const resolveDependencies: (config: CypressConfig, options: PluginOptions) => Promise<string[]>;
