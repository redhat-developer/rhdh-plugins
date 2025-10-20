import type { Report } from '../types/issues.js';
export type CLIArguments = {
    includedIssueTypes: string[];
    excludedIssueTypes: string[];
    isDependenciesShorthand: boolean;
    isExportsShorthand: boolean;
    isFilesShorthand: boolean;
};
type Options = {
    isProduction?: boolean;
    include?: string[];
    exclude?: string[];
    dependencies?: boolean;
    exports?: boolean;
};
export declare const defaultExcludedIssueTypes: string[];
export declare const getIncludedIssueTypes: (cliArgs: CLIArguments, { include, exclude, isProduction }?: Options) => Report;
export {};
