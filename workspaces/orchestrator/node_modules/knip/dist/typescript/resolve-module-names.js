import { existsSync } from 'node:fs';
import { isBuiltin } from 'node:module';
import ts from 'typescript';
import { DEFAULT_EXTENSIONS } from '../constants.js';
import { timerify } from '../util/Performance.js';
import { sanitizeSpecifier } from '../util/modules.js';
import { dirname, extname, isAbsolute, isInNodeModules, join } from '../util/path.js';
import { _resolveSync, createSyncResolver } from '../util/resolve.js';
import { isDeclarationFileExtension } from './ast-helpers.js';
const resolutionCache = new Map();
const fileExists = (name, containingFile) => {
    const resolvedFileName = isAbsolute(name) ? name : join(dirname(containingFile), name);
    if (existsSync(resolvedFileName)) {
        return {
            resolvedFileName,
            extension: extname(name),
            isExternalLibraryImport: false,
            resolvedUsingTsExtension: false,
        };
    }
};
export function createCustomModuleResolver(compilerOptions, customCompilerExtensions, toSourceFilePath, useCache = true, isSkipLibs = true) {
    const customCompilerExtensionsSet = new Set(customCompilerExtensions);
    const extensions = [...DEFAULT_EXTENSIONS, ...customCompilerExtensions];
    const resolveSync = customCompilerExtensionsSet.size === 0 ? _resolveSync : createSyncResolver(extensions);
    const virtualDeclarationFiles = new Map();
    const tsSys = {
        ...ts.sys,
        fileExists(path) {
            if (ts.sys.fileExists(path)) {
                return true;
            }
            const original = originalFromDeclarationPath(path);
            if (original && ts.sys.fileExists(original.path)) {
                virtualDeclarationFiles.set(path, original);
                return true;
            }
            return false;
        },
    };
    function resolveModuleNames(moduleNames, containingFile) {
        return moduleNames.map(moduleName => {
            if (!useCache)
                return resolveModuleName(moduleName, containingFile);
            const key = moduleName.startsWith('.')
                ? join(dirname(containingFile), moduleName)
                : `${containingFile}:${moduleName}`;
            if (resolutionCache.has(key))
                return resolutionCache.get(key);
            const resolvedModule = resolveModuleName(moduleName, containingFile);
            if (resolvedModule)
                resolutionCache.set(key, resolvedModule);
            return resolvedModule;
        });
    }
    function resolveModuleName(name, containingFile) {
        const sanitizedSpecifier = sanitizeSpecifier(name);
        if (isBuiltin(sanitizedSpecifier))
            return undefined;
        const resolvedFileName = isSkipLibs && resolveSync(sanitizedSpecifier, dirname(containingFile));
        if (resolvedFileName) {
            const ext = extname(resolvedFileName);
            if (!customCompilerExtensionsSet.has(ext)) {
                const srcFilePath = toSourceFilePath(resolvedFileName);
                if (srcFilePath) {
                    return {
                        resolvedFileName: srcFilePath,
                        extension: extname(srcFilePath),
                        isExternalLibraryImport: false,
                        resolvedUsingTsExtension: false,
                    };
                }
            }
            return {
                resolvedFileName,
                extension: customCompilerExtensionsSet.has(ext) ? ts.Extension.Js : ext,
                isExternalLibraryImport: isInNodeModules(resolvedFileName),
                resolvedUsingTsExtension: false,
            };
        }
        const tsResolvedModule = ts.resolveModuleName(sanitizedSpecifier, containingFile, compilerOptions, tsSys).resolvedModule;
        if (tsResolvedModule) {
            if (isDeclarationFileExtension(tsResolvedModule.extension)) {
                const srcFilePath = toSourceFilePath(tsResolvedModule.resolvedFileName);
                if (srcFilePath) {
                    return {
                        resolvedFileName: srcFilePath,
                        extension: extname(srcFilePath),
                        isExternalLibraryImport: false,
                        resolvedUsingTsExtension: false,
                    };
                }
            }
            const original = virtualDeclarationFiles.get(tsResolvedModule.resolvedFileName);
            if (original) {
                return {
                    ...tsResolvedModule,
                    resolvedFileName: original.path,
                    extension: customCompilerExtensionsSet.has(original.ext) ? ts.Extension.Js : original.ext,
                };
            }
            return tsResolvedModule;
        }
        const module = fileExists(sanitizedSpecifier, containingFile);
        if (module)
            return module;
        return undefined;
    }
    return timerify(resolveModuleNames);
}
const declarationPathRe = /^(.*)\.d(\.[^.]+)\.ts$/;
function originalFromDeclarationPath(path) {
    const match = declarationPathRe.exec(path);
    if (match) {
        return {
            path: match[1] + match[2],
            ext: match[2],
        };
    }
}
