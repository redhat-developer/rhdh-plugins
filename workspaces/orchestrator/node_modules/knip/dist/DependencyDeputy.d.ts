import type { Workspace } from './ConfigurationChief.js';
import type { ConfigurationHints, Counters, Issue, Issues, SymbolIssueType } from './types/issues.js';
import type { PackageJson } from './types/package-json.js';
import type { DependencyArray, DependencySet, HostDependencies, InstalledBinaries, WorkspaceManifests } from './types/workspace.js';
type Options = {
    isProduction: boolean;
    isStrict: boolean;
};
export declare class DependencyDeputy {
    isProduction: boolean;
    isStrict: boolean;
    _manifests: WorkspaceManifests;
    referencedDependencies: Map<string, Set<string>>;
    referencedBinaries: Map<string, Set<string>>;
    hostDependencies: Map<string, HostDependencies>;
    installedBinaries: Map<string, InstalledBinaries>;
    hasTypesIncluded: Map<string, Set<string>>;
    constructor({ isProduction, isStrict }: Options);
    addWorkspace({ name, cwd, dir, manifestPath, manifestStr, manifest, ignoreDependencies, ignoreBinaries, ignoreUnresolved, }: {
        name: string;
        cwd: string;
        dir: string;
        manifestPath: string;
        manifestStr: string;
        manifest: PackageJson;
        ignoreDependencies: (string | RegExp)[];
        ignoreBinaries: (string | RegExp)[];
        ignoreUnresolved: (string | RegExp)[];
    }): void;
    getWorkspaceManifest(workspaceName: string): {
        workspaceDir: string;
        manifestPath: string;
        manifestStr: string;
        dependencies: DependencyArray;
        devDependencies: DependencyArray;
        peerDependencies: DependencySet;
        optionalPeerDependencies: DependencyArray;
        allDependencies: DependencySet;
        ignoreDependencies: (string | RegExp)[];
        ignoreBinaries: (string | RegExp)[];
        ignoreUnresolved: (string | RegExp)[];
        usedIgnoreDependencies: Set<string | RegExp>;
        usedIgnoreBinaries: Set<string | RegExp>;
        usedIgnoreUnresolved: Set<string | RegExp>;
    } | undefined;
    getProductionDependencies(workspaceName: string): DependencyArray;
    getDevDependencies(workspaceName: string): DependencyArray;
    getDependencies(workspaceName: string): DependencySet;
    setInstalledBinaries(workspaceName: string, installedBinaries: Map<string, Set<string>>): void;
    getInstalledBinaries(workspaceName: string): InstalledBinaries | undefined;
    setHasTypesIncluded(workspaceName: string, hasTypesIncluded: Set<string>): void;
    getHasTypesIncluded(workspaceName: string): Set<string> | undefined;
    addReferencedDependency(workspaceName: string, packageName: string): void;
    addReferencedBinary(workspaceName: string, binaryName: string): void;
    setHostDependencies(workspaceName: string, hostDependencies: HostDependencies): void;
    getHostDependenciesFor(workspaceName: string, dependency: string): {
        name: string;
        isPeerOptional: boolean;
    }[];
    getOptionalPeerDependencies(workspaceName: string): DependencyArray;
    maybeAddReferencedExternalDependency(workspace: Workspace, packageName: string): boolean;
    maybeAddReferencedBinary(workspace: Workspace, binaryName: string): boolean;
    private isInDependencies;
    settleDependencyIssues(): {
        dependencyIssues: Issue[];
        devDependencyIssues: Issue[];
        optionalPeerDependencyIssues: Issue[];
    };
    handleIgnoredDependencies(issues: Issues, counters: Counters, type: SymbolIssueType): void;
    handleIgnoredBinaries(issues: Issues, counters: Counters, type: SymbolIssueType): void;
    handleIgnoredUnresolved(issues: Issues, counters: Counters): void;
    removeIgnoredIssues({ issues, counters }: {
        issues: Issues;
        counters: Counters;
    }): void;
    getConfigurationHints(): ConfigurationHints;
}
export {};
