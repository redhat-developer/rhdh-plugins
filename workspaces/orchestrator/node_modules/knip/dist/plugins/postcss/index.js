import { toDeferResolve, toDependency } from '../../util/input.js';
import { toLilconfig } from '../../util/plugin-config.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'PostCSS';
const enablers = ['postcss', 'postcss-cli', 'next'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = [
    'package.json',
    'postcss.config.json',
    ...toLilconfig('postcss', { configDir: false, additionalExtensions: ['ts', 'mts', 'cts', 'yaml', 'yml'] }),
];
const resolveConfig = config => {
    const plugins = config.plugins
        ? (Array.isArray(config.plugins) ? config.plugins : Object.keys(config.plugins)).flatMap(plugin => {
            if (typeof plugin === 'string')
                return plugin;
            if (Array.isArray(plugin) && typeof plugin[0] === 'string')
                return plugin[0];
            return [];
        })
        : [];
    const inputs = plugins.map(toDeferResolve);
    return plugins.includes('tailwindcss') ? [...inputs, toDependency('postcss')] : inputs;
};
export default {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
};
