import { hasDependency } from '../../util/plugin.js';
const title = 'Rsbuild';
const enablers = ['@rsbuild/core'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['rsbuild*.config.{mjs,ts,js,cjs,mts,cts}'];
const resolveConfig = async () => {
    return [];
};
export default {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
};
