import { type Options as FastGlobOptions } from 'fast-glob';
type Options = {
    gitignore: boolean;
    cwd: string;
};
type GlobOptions = {
    readonly gitignore: boolean;
    readonly cwd: string;
    readonly dir: string;
    label?: string;
} & FastGlobOptionsWithoutCwd;
type FastGlobOptionsWithoutCwd = Pick<FastGlobOptions, 'onlyDirectories' | 'ignore' | 'absolute' | 'dot'>;
export declare const convertGitignoreToPicomatchIgnorePatterns: (pattern: string) => {
    negated: boolean;
    patterns: string[];
};
export declare const parseAndConvertGitignorePatterns: (patterns: string, ancestor?: string) => {
    negated: boolean;
    patterns: string[];
}[];
export declare const findAndParseGitignores: (cwd: string) => Promise<{
    gitignoreFiles: string[];
    ignores: Set<string>;
    unignores: string[];
}>;
export declare function glob(patterns: string | string[], options: GlobOptions): Promise<string[]>;
export declare function getGitIgnoredHandler(options: Options): Promise<(path: string) => boolean>;
export {};
