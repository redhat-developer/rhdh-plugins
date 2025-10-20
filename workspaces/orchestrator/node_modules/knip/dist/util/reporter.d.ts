import type { ReporterOptions } from '../types/issues.js';
export declare const runPreprocessors: (processors: string[], data: ReporterOptions) => Promise<ReporterOptions>;
export declare const runReporters: (reporter: string[], options: ReporterOptions) => Promise<void>;
