import Astro from './astro.js';
import MDX from './mdx.js';
import Svelte from './svelte.js';
import Vue from './vue.js';
const isAsync = (fn) => (fn ? fn.constructor.name === 'AsyncFunction' : false);
const normalizeExt = (ext) => ext.replace(/^\.*/, '.');
export const partitionCompilers = (rawLocalConfig) => {
    const syncCompilers = {};
    const asyncCompilers = {};
    for (const extension in rawLocalConfig.compilers) {
        const ext = normalizeExt(extension);
        if (!rawLocalConfig.asyncCompilers?.[ext] && isAsync(rawLocalConfig.compilers[extension])) {
            asyncCompilers[ext] = rawLocalConfig.compilers[extension];
        }
        else {
            syncCompilers[ext] = rawLocalConfig.compilers[extension];
        }
    }
    for (const extension in rawLocalConfig.asyncCompilers) {
        const ext = normalizeExt(extension);
        asyncCompilers[ext] = rawLocalConfig.asyncCompilers[extension];
    }
    return { ...rawLocalConfig, syncCompilers, asyncCompilers };
};
const compilers = new Map([
    ['.astro', Astro],
    ['.mdx', MDX],
    ['.svelte', Svelte],
    ['.vue', Vue],
]);
export const getIncludedCompilers = (syncCompilers, asyncCompilers, dependencies) => {
    const hasDependency = (packageName) => dependencies.has(packageName);
    for (const [extension, { condition, compiler }] of compilers.entries()) {
        if (!syncCompilers.has(extension) && condition(hasDependency)) {
            syncCompilers.set(extension, compiler);
        }
    }
    return [syncCompilers, asyncCompilers];
};
export const getCompilerExtensions = (compilers) => [
    ...compilers[0].keys(),
    ...compilers[1].keys(),
];
