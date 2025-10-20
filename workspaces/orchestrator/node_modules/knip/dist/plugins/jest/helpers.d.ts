import type { PluginOptions } from '../../types/config.js';
import type { JestInitialOptions } from './types.js';
export declare const resolveExtensibleConfig: (configFilePath: string) => Promise<any>;
export declare const getReportersDependencies: (config: JestInitialOptions, options: PluginOptions) => string[];
