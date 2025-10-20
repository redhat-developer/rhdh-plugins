import { isBuiltin } from 'node:module';
import { PackageJsonPeeker } from './PackageJsonPeeker.js';
import { DT_SCOPE, IGNORED_DEPENDENCIES, IGNORED_GLOBAL_BINARIES, IGNORED_RUNTIME_DEPENDENCIES, IGNORE_DEFINITELY_TYPED, ROOT_WORKSPACE_NAME, } from './constants.js';
import { getDependencyMetaData } from './manifest/index.js';
import { getDefinitelyTypedFor, getPackageFromDefinitelyTyped, getPackageNameFromModuleSpecifier, isDefinitelyTyped, } from './util/modules.js';
import { findMatch, toRegexOrString } from './util/regex.js';
export class DependencyDeputy {
    isProduction;
    isStrict;
    _manifests = new Map();
    referencedDependencies;
    referencedBinaries;
    hostDependencies;
    installedBinaries;
    hasTypesIncluded;
    constructor({ isProduction, isStrict }) {
        this.isProduction = isProduction;
        this.isStrict = isStrict;
        this.referencedDependencies = new Map();
        this.referencedBinaries = new Map();
        this.hostDependencies = new Map();
        this.installedBinaries = new Map();
        this.hasTypesIncluded = new Map();
    }
    addWorkspace({ name, cwd, dir, manifestPath, manifestStr, manifest, ignoreDependencies, ignoreBinaries, ignoreUnresolved, }) {
        const dependencies = Object.keys(manifest.dependencies ?? {});
        const peerDependencies = Object.keys(manifest.peerDependencies ?? {});
        const optionalDependencies = Object.keys(manifest.optionalDependencies ?? {});
        const optionalPeerDependencies = manifest.peerDependenciesMeta
            ? peerDependencies.filter(peerDependency => manifest.peerDependenciesMeta &&
                peerDependency in manifest.peerDependenciesMeta &&
                manifest.peerDependenciesMeta[peerDependency].optional)
            : [];
        const devDependencies = Object.keys(manifest.devDependencies ?? {});
        const allDependencies = [...dependencies, ...devDependencies, ...peerDependencies, ...optionalDependencies];
        const packageNames = [
            ...dependencies,
            ...(this.isStrict ? peerDependencies : []),
            ...(this.isProduction ? [] : devDependencies),
        ];
        const { hostDependencies, installedBinaries, hasTypesIncluded } = getDependencyMetaData({
            packageNames,
            dir,
            cwd,
        });
        this.setHostDependencies(name, hostDependencies);
        this.setInstalledBinaries(name, installedBinaries);
        this.setHasTypesIncluded(name, hasTypesIncluded);
        this._manifests.set(name, {
            workspaceDir: dir,
            manifestPath,
            manifestStr,
            ignoreDependencies: ignoreDependencies.map(toRegexOrString),
            ignoreBinaries: ignoreBinaries.map(toRegexOrString),
            ignoreUnresolved: ignoreUnresolved.map(toRegexOrString),
            usedIgnoreDependencies: new Set(),
            usedIgnoreBinaries: new Set(),
            usedIgnoreUnresolved: new Set(),
            dependencies,
            devDependencies,
            peerDependencies: new Set(peerDependencies),
            optionalPeerDependencies,
            allDependencies: new Set(allDependencies),
        });
    }
    getWorkspaceManifest(workspaceName) {
        return this._manifests.get(workspaceName);
    }
    getProductionDependencies(workspaceName) {
        const manifest = this._manifests.get(workspaceName);
        if (!manifest)
            return [];
        if (this.isStrict)
            return [...manifest.dependencies, ...manifest.peerDependencies];
        return manifest.dependencies;
    }
    getDevDependencies(workspaceName) {
        return this._manifests.get(workspaceName)?.devDependencies ?? [];
    }
    getDependencies(workspaceName) {
        const manifest = this._manifests.get(workspaceName);
        if (!manifest)
            return new Set();
        return new Set([...manifest.dependencies, ...manifest.devDependencies]);
    }
    setInstalledBinaries(workspaceName, installedBinaries) {
        this.installedBinaries.set(workspaceName, installedBinaries);
    }
    getInstalledBinaries(workspaceName) {
        return this.installedBinaries.get(workspaceName);
    }
    setHasTypesIncluded(workspaceName, hasTypesIncluded) {
        this.hasTypesIncluded.set(workspaceName, hasTypesIncluded);
    }
    getHasTypesIncluded(workspaceName) {
        return this.hasTypesIncluded.get(workspaceName);
    }
    addReferencedDependency(workspaceName, packageName) {
        if (!this.referencedDependencies.has(workspaceName)) {
            this.referencedDependencies.set(workspaceName, new Set());
        }
        this.referencedDependencies.get(workspaceName)?.add(packageName);
    }
    addReferencedBinary(workspaceName, binaryName) {
        if (!this.referencedBinaries.has(workspaceName)) {
            this.referencedBinaries.set(workspaceName, new Set());
        }
        this.referencedBinaries.get(workspaceName)?.add(binaryName);
    }
    setHostDependencies(workspaceName, hostDependencies) {
        this.hostDependencies.set(workspaceName, hostDependencies);
    }
    getHostDependenciesFor(workspaceName, dependency) {
        return this.hostDependencies.get(workspaceName)?.get(dependency) ?? [];
    }
    getOptionalPeerDependencies(workspaceName) {
        const manifest = this._manifests.get(workspaceName);
        if (!manifest)
            return [];
        return manifest.optionalPeerDependencies;
    }
    maybeAddReferencedExternalDependency(workspace, packageName) {
        if (isBuiltin(packageName))
            return true;
        if (IGNORED_RUNTIME_DEPENDENCIES.has(packageName))
            return true;
        if (packageName === workspace.pkgName)
            return true;
        const workspaceNames = this.isStrict ? [workspace.name] : [workspace.name, ...[...workspace.ancestors].reverse()];
        const closestWorkspaceName = workspaceNames.find(name => this.isInDependencies(name, packageName));
        const typesPackageName = !isDefinitelyTyped(packageName) && getDefinitelyTypedFor(packageName);
        const closestWorkspaceNameForTypes = typesPackageName && workspaceNames.find(name => this.isInDependencies(name, typesPackageName));
        if (closestWorkspaceName || closestWorkspaceNameForTypes) {
            if (closestWorkspaceName)
                this.addReferencedDependency(closestWorkspaceName, packageName);
            if (closestWorkspaceNameForTypes && !this.hasTypesIncluded.get(closestWorkspaceNameForTypes)?.has(packageName))
                this.addReferencedDependency(closestWorkspaceNameForTypes, typesPackageName);
            return true;
        }
        this.addReferencedDependency(workspace.name, packageName);
        return false;
    }
    maybeAddReferencedBinary(workspace, binaryName) {
        if (IGNORED_GLOBAL_BINARIES.has(binaryName))
            return true;
        this.addReferencedBinary(workspace.name, binaryName);
        const workspaceNames = this.isStrict ? [workspace.name] : [workspace.name, ...[...workspace.ancestors].reverse()];
        for (const name of workspaceNames) {
            const binaries = this.getInstalledBinaries(name);
            if (binaries?.has(binaryName)) {
                const dependencies = binaries.get(binaryName);
                if (dependencies?.size) {
                    for (const dependency of dependencies)
                        this.addReferencedDependency(name, dependency);
                    return true;
                }
            }
        }
        return false;
    }
    isInDependencies(workspaceName, packageName) {
        const manifest = this._manifests.get(workspaceName);
        if (!manifest)
            return false;
        if (this.isStrict)
            return this.getProductionDependencies(workspaceName).includes(packageName);
        return manifest.allDependencies.has(packageName);
    }
    settleDependencyIssues() {
        const dependencyIssues = [];
        const devDependencyIssues = [];
        const optionalPeerDependencyIssues = [];
        for (const [workspace, { manifestPath: filePath, manifestStr }] of this._manifests.entries()) {
            const referencedDependencies = this.referencedDependencies.get(workspace);
            const hasTypesIncluded = this.getHasTypesIncluded(workspace);
            const peeker = new PackageJsonPeeker(manifestStr);
            const peerDepRecs = {};
            const isReferencedDependency = (dependency, isPeerDep) => {
                if (referencedDependencies?.has(dependency))
                    return true;
                if (isPeerDep && peerDepRecs[dependency])
                    return false;
                const [scope, typedDependency] = dependency.split('/');
                if (scope === DT_SCOPE) {
                    const typedPackageName = getPackageFromDefinitelyTyped(typedDependency);
                    if (IGNORE_DEFINITELY_TYPED.has(typedPackageName))
                        return true;
                    if (hasTypesIncluded?.has(typedPackageName))
                        return false;
                    const hostDependencies = [
                        ...this.getHostDependenciesFor(workspace, dependency),
                        ...this.getHostDependenciesFor(workspace, typedPackageName),
                    ];
                    if (hostDependencies.length)
                        return !!hostDependencies.find(host => isReferencedDependency(host.name, true));
                    if (!referencedDependencies?.has(dependency))
                        return false;
                    return referencedDependencies.has(typedPackageName);
                }
                const hostDependencies = this.getHostDependenciesFor(workspace, dependency);
                for (const { name } of hostDependencies) {
                    if (!peerDepRecs[name])
                        peerDepRecs[name] = 1;
                    else
                        peerDepRecs[name]++;
                }
                return hostDependencies.some(hostDependency => (isPeerDep === false || !hostDependency.isPeerOptional) && isReferencedDependency(hostDependency.name, true));
            };
            const isNotReferencedDependency = (dependency) => !isReferencedDependency(dependency, false);
            for (const symbol of this.getProductionDependencies(workspace).filter(isNotReferencedDependency)) {
                const position = peeker.getLocation('dependencies', symbol);
                dependencyIssues.push({ type: 'dependencies', workspace, filePath, symbol, ...position });
            }
            for (const symbol of this.getDevDependencies(workspace).filter(isNotReferencedDependency)) {
                const position = peeker.getLocation('devDependencies', symbol);
                devDependencyIssues.push({ type: 'devDependencies', filePath, workspace, symbol, ...position });
            }
            for (const symbol of this.getOptionalPeerDependencies(workspace).filter(d => isReferencedDependency(d))) {
                const pos = peeker.getLocation('optionalPeerDependencies', symbol);
                optionalPeerDependencyIssues.push({ type: 'optionalPeerDependencies', filePath, workspace, symbol, ...pos });
            }
        }
        return { dependencyIssues, devDependencyIssues, optionalPeerDependencyIssues };
    }
    handleIgnoredDependencies(issues, counters, type) {
        for (const key in issues[type]) {
            const issueSet = issues[type][key];
            for (const issueKey in issueSet) {
                const issue = issueSet[issueKey];
                const packageName = getPackageNameFromModuleSpecifier(issue.symbol);
                if (!packageName)
                    continue;
                if (IGNORED_DEPENDENCIES.has(packageName)) {
                    delete issueSet[issueKey];
                    counters[type]--;
                }
                else {
                    const manifest = this.getWorkspaceManifest(issue.workspace);
                    if (manifest) {
                        const ignoreItem = findMatch(manifest.ignoreDependencies, packageName);
                        if (ignoreItem) {
                            delete issueSet[issueKey];
                            counters[type]--;
                            manifest.usedIgnoreDependencies.add(ignoreItem);
                        }
                        else if (issue.workspace !== ROOT_WORKSPACE_NAME) {
                            const manifest = this.getWorkspaceManifest(ROOT_WORKSPACE_NAME);
                            if (manifest) {
                                const ignoreItem = findMatch(manifest.ignoreDependencies, packageName);
                                if (ignoreItem) {
                                    delete issueSet[issueKey];
                                    counters[type]--;
                                    manifest.usedIgnoreDependencies.add(ignoreItem);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    handleIgnoredBinaries(issues, counters, type) {
        for (const key in issues[type]) {
            const issueSet = issues[type][key];
            for (const issueKey in issueSet) {
                const issue = issueSet[issueKey];
                if (IGNORED_GLOBAL_BINARIES.has(issue.symbol)) {
                    delete issueSet[issueKey];
                    counters[type]--;
                    continue;
                }
                const manifest = this.getWorkspaceManifest(issue.workspace);
                if (manifest) {
                    const ignoreItem = findMatch(manifest.ignoreBinaries, issue.symbol);
                    if (ignoreItem) {
                        delete issueSet[issueKey];
                        counters[type]--;
                        manifest.usedIgnoreBinaries.add(ignoreItem);
                    }
                    else {
                        const manifest = this.getWorkspaceManifest(ROOT_WORKSPACE_NAME);
                        if (manifest) {
                            const ignoreItem = findMatch(manifest.ignoreBinaries, issue.symbol);
                            if (ignoreItem) {
                                delete issueSet[issueKey];
                                counters[type]--;
                                manifest.usedIgnoreBinaries.add(ignoreItem);
                            }
                        }
                    }
                }
            }
        }
    }
    handleIgnoredUnresolved(issues, counters) {
        for (const key in issues.unresolved) {
            const issueSet = issues.unresolved[key];
            for (const issueKey in issueSet) {
                const issue = issueSet[issueKey];
                const manifest = this.getWorkspaceManifest(issue.workspace);
                if (manifest) {
                    const ignoreItem = findMatch(manifest.ignoreUnresolved, issue.symbol);
                    if (ignoreItem) {
                        delete issueSet[issueKey];
                        counters.unresolved--;
                        manifest.usedIgnoreUnresolved.add(ignoreItem);
                    }
                }
            }
        }
    }
    removeIgnoredIssues({ issues, counters }) {
        this.handleIgnoredDependencies(issues, counters, 'dependencies');
        this.handleIgnoredDependencies(issues, counters, 'devDependencies');
        this.handleIgnoredDependencies(issues, counters, 'optionalPeerDependencies');
        this.handleIgnoredDependencies(issues, counters, 'unlisted');
        this.handleIgnoredDependencies(issues, counters, 'unresolved');
        this.handleIgnoredBinaries(issues, counters, 'binaries');
        this.handleIgnoredUnresolved(issues, counters);
    }
    getConfigurationHints() {
        const configurationHints = new Set();
        for (const [workspaceName, manifest] of this._manifests.entries()) {
            for (const identifier of manifest.ignoreDependencies) {
                if (!manifest.usedIgnoreDependencies.has(identifier)) {
                    configurationHints.add({ workspaceName, identifier, type: 'ignoreDependencies' });
                }
            }
            for (const identifier of manifest.ignoreBinaries) {
                if (!manifest.usedIgnoreBinaries.has(identifier)) {
                    configurationHints.add({ workspaceName, identifier, type: 'ignoreBinaries' });
                }
            }
            for (const identifier of manifest.ignoreUnresolved) {
                if (!manifest.usedIgnoreUnresolved.has(identifier)) {
                    configurationHints.add({ workspaceName, identifier, type: 'ignoreUnresolved' });
                }
            }
        }
        return configurationHints;
    }
}
