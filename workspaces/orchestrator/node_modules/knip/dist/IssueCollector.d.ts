import type { ConfigurationHint, Issue, Rules, TagHint } from './types/issues.js';
type Filters = Partial<{
    dir: string;
}>;
type IssueCollectorOptions = {
    cwd: string;
    rules: Rules;
    filters: Filters;
};
export declare class IssueCollector {
    private cwd;
    private rules;
    private filters;
    private issues;
    private counters;
    private referencedFiles;
    private configurationHints;
    private tagHints;
    private ignorePatterns;
    private isMatch;
    constructor({ cwd, rules, filters }: IssueCollectorOptions);
    addIgnorePatterns(patterns: string[]): void;
    addFileCounts({ processed, unused }: {
        processed: number;
        unused: number;
    }): void;
    addFilesIssues(filePaths: string[]): void;
    addIssue(issue: Issue): Issue | undefined;
    addConfigurationHint(issue: ConfigurationHint): void;
    addTagHint(issue: TagHint): void;
    purge(): import("./types/issues.js").IssueSet;
    getIssues(): {
        issues: import("./types/issues.js").Issues;
        counters: import("./types/issues.js").Counters;
        tagHints: Set<TagHint>;
        configurationHints: Set<ConfigurationHint>;
    };
}
export {};
