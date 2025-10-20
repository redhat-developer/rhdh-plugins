import { toDeferResolve } from '../../util/input.js';
import { toCosmiconfig } from '../../util/plugin-config.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'Stylelint';
const enablers = ['stylelint'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['package.json', ...toCosmiconfig('stylelint')];
const resolve = (config) => {
    const extend = config.extends ?? [];
    const plugins = config.plugins ?? [];
    const customSyntax = typeof config.customSyntax === 'string' ? [config.customSyntax] : [];
    const overrideConfigs = 'overrides' in config ? config.overrides.flatMap(resolve) : [];
    return [...[extend, plugins, customSyntax].flat().map(toDeferResolve), ...overrideConfigs];
};
const resolveConfig = config => resolve(config);
export default {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
};
