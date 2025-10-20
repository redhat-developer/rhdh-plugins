import { toDeferResolve } from '../../util/input.js';
import { toCosmiconfig } from '../../util/plugin-config.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'LintHTML';
const packageJsonPath = 'linthtmlConfig';
const enablers = ['@linthtml/linthtml'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['package.json', ...toCosmiconfig('linthtml')];
const resolveConfig = config => {
    const extensions = config.extends ?? [];
    const plugins = config.plugins ?? [];
    return [extensions, plugins].flat().map(toDeferResolve);
};
export default {
    title,
    enablers,
    isEnabled,
    packageJsonPath,
    config,
    resolveConfig,
};
