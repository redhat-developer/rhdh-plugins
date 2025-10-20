import { toDeferResolve, toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'Prettier';
const enablers = ['prettier'];
const isEnabled = ({ dependencies, config }) => hasDependency(dependencies, enablers) || 'prettier' in config;
const config = [
    '.prettierrc',
    '.prettierrc.{json,js,cjs,mjs,yml,yaml,toml,json5}',
    'prettier.config.{js,cjs,mjs}',
    'package.{json,yaml}',
];
const resolveConfig = config => {
    if (typeof config === 'string')
        return [toDeferResolve(config)];
    return Array.isArray(config.plugins)
        ? config.plugins.filter((plugin) => typeof plugin === 'string').map(id => toDependency(id))
        : [];
};
export default {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
};
