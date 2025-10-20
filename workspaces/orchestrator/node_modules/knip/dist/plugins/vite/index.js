import { hasDependency } from '../../util/plugin.js';
import { resolveConfig, resolveEntryPaths } from '../vitest/index.js';
const title = 'Vite';
const enablers = ['vite', 'vitest'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
export const config = ['vite.config.{js,mjs,ts,cjs,mts,cts}'];
export default {
    title,
    enablers,
    isEnabled,
    config,
    resolveEntryPaths,
    resolveConfig,
};
