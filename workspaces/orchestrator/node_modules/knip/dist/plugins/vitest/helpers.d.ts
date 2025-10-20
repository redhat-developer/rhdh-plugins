import type { ViteConfig } from './types.js';
export declare const getEnvPackageName: (env: string) => string;
export declare const getExternalReporters: (reporters?: ViteConfig["test"]["reporters"]) => string[];
