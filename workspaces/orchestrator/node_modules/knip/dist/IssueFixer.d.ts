import type { Fix, Fixes } from './types/exports.js';
import type { Issues } from './types/issues.js';
interface Fixer {
    isEnabled: boolean;
    cwd: string;
    fixTypes: string[];
    isRemoveFiles: boolean;
}
export declare class IssueFixer {
    isEnabled: boolean;
    cwd: string;
    isFixFiles: boolean;
    isFixDependencies: boolean;
    isFixUnusedTypes: boolean;
    isFixUnusedExports: boolean;
    unusedTypeNodes: Map<string, Set<Fix>>;
    unusedExportNodes: Map<string, Set<Fix>>;
    constructor({ isEnabled, cwd, fixTypes, isRemoveFiles }: Fixer);
    addUnusedTypeNode(filePath: string, fixes: Fixes | undefined): void;
    addUnusedExportNode(filePath: string, fixes: Fixes | undefined): void;
    fixIssues(issues: Issues): Promise<void>;
    private markExportFixed;
    private removeUnusedFiles;
    private removeUnusedExports;
    private removeUnusedDependencies;
}
export {};
