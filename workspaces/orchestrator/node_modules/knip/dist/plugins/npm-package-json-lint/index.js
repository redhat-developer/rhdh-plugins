import { toDependency } from '../../util/input.js';
import { toCosmiconfig } from '../../util/plugin-config.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'npm-package-json-lint';
const enablers = ['npm-package-json-lint'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const packageJsonPath = 'npmpackagejsonlint';
const config = ['package.json', ...toCosmiconfig('npmpackagejsonlint')];
const resolveConfig = localConfig => {
    return localConfig?.extends ? [localConfig.extends].map(id => toDependency(id)) : [];
};
export default {
    title,
    enablers,
    isEnabled,
    packageJsonPath,
    config,
    resolveConfig,
};
