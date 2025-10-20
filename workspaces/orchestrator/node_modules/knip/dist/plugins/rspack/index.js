import { hasDependency } from '../../util/plugin.js';
import { findWebpackDependenciesFromConfig } from '../webpack/index.js';
const title = 'Rspack';
const enablers = ['@rspack/core'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['rspack.config*.{js,ts,mjs,cjs}'];
const resolveConfig = async (localConfig, options) => {
    const { cwd } = options;
    const inputs = await findWebpackDependenciesFromConfig({ config: localConfig, cwd });
    return Array.from(inputs).filter(input => !input.specifier.startsWith('builtin:'));
};
export default {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
};
