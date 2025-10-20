import { toDeferResolve } from '../../util/input.js';
import { toCosmiconfig } from '../../util/plugin-config.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'Semantic Release';
const enablers = ['semantic-release'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const isRootOnly = true;
const packageJsonPath = 'release';
const config = ['package.json', ...toCosmiconfig('release')];
const excludePackages = [
    '@semantic-release/commit-analyzer',
    '@semantic-release/github',
    '@semantic-release/npm',
    '@semantic-release/release-notes-generator',
];
const resolveConfig = config => {
    const plugins = (config?.plugins ?? []).map(plugin => (Array.isArray(plugin) ? plugin[0] : plugin));
    return plugins.filter(plugin => !excludePackages.includes(plugin)).map(toDeferResolve);
};
export default {
    title,
    enablers,
    isEnabled,
    isRootOnly,
    packageJsonPath,
    config,
    resolveConfig,
};
