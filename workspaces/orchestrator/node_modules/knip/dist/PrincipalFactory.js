import ts from 'typescript';
import { ProjectPrincipal } from './ProjectPrincipal.js';
import { debugLog } from './util/debug.js';
import { toAbsolute, toRelative } from './util/path.js';
const mapToAbsolutePaths = (paths, cwd) => Object.keys(paths).reduce((result, key) => {
    result[key] = paths[key].map(entry => toAbsolute(entry, cwd));
    return result;
}, {});
const mergePaths = (cwd, compilerOptions, paths = {}) => {
    const basePath = typeof compilerOptions.pathsBasePath === 'string' ? compilerOptions.pathsBasePath : cwd;
    const compilerPaths = !compilerOptions.baseUrl && compilerOptions.paths
        ? mapToAbsolutePaths(compilerOptions.paths, basePath)
        : compilerOptions.paths;
    const extraPaths = mapToAbsolutePaths(paths, cwd);
    compilerOptions.paths = { ...compilerPaths, ...extraPaths };
    return compilerOptions;
};
export class PrincipalFactory {
    principals = new Set();
    createPrincipal(options) {
        const { cwd, compilerOptions, isFile, paths, pkgName, isIsolateWorkspaces, compilers } = options;
        options.compilerOptions = mergePaths(cwd, compilerOptions, paths);
        if (isFile && compilerOptions.module !== ts.ModuleKind.CommonJS)
            compilerOptions.moduleResolution ??= ts.ModuleResolutionKind.Bundler;
        const principal = this.findReusablePrincipal(compilerOptions);
        if (!isIsolateWorkspaces && principal) {
            this.linkPrincipal(principal, cwd, compilerOptions, pkgName, compilers);
            return principal.principal;
        }
        return this.addNewPrincipal(options);
    }
    findReusablePrincipal(compilerOptions) {
        const workspacePaths = compilerOptions?.paths ? Object.keys(compilerOptions.paths) : [];
        const principal = Array.from(this.principals).find(principal => {
            if (compilerOptions.pathsBasePath && principal.principal.compilerOptions.pathsBasePath)
                return false;
            if (compilerOptions.baseUrl === principal.principal.compilerOptions.baseUrl) {
                return workspacePaths.every(p => !principal.pathKeys.has(p));
            }
            return !compilerOptions.baseUrl;
        });
        return principal;
    }
    linkPrincipal(principal, cwd, compilerOptions, pkgName, compilers) {
        const { pathsBasePath, paths } = compilerOptions;
        if (pathsBasePath)
            principal.principal.compilerOptions.pathsBasePath = pathsBasePath;
        principal.principal.compilerOptions.moduleResolution ??= compilerOptions.moduleResolution;
        for (const p of Object.keys(paths ?? {}))
            principal.pathKeys.add(p);
        principal.principal.addPaths(paths);
        principal.principal.addCompilers(compilers);
        principal.wsDirs.add(cwd);
        principal.pkgNames.add(pkgName);
    }
    addNewPrincipal(options) {
        const { cwd, compilerOptions, pkgName } = options;
        const pathKeys = new Set(Object.keys(compilerOptions?.paths ?? {}));
        const principal = new ProjectPrincipal(options);
        this.principals.add({ principal, wsDirs: new Set([cwd]), pathKeys, pkgNames: new Set([pkgName]) });
        return principal;
    }
    getPrincipals() {
        return Array.from(this.principals, p => p.principal).reverse();
    }
    getPrincipalByPackageName(packageName) {
        return Array.from(this.principals).find(principal => principal.pkgNames.has(packageName))?.principal;
    }
    deletePrincipal(principal) {
        const p = Array.from(this.principals).find(p => p.principal === principal);
        if (p) {
            debugLog('*', `Deleting principal at ${[...p.wsDirs].map(cwd => toRelative(cwd) || '.')} (${[...p.pkgNames]})`);
            this.principals.delete(p);
        }
    }
}
