import { toProductionEntry } from '../../util/input.js';
import { join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import { getConfig, getDependencies } from './helpers.js';
const title = 'Expo';
const enablers = ['expo'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['app.json', 'app.config.{ts,js}'];
const production = ['app/**/*.{js,jsx,ts,tsx}', 'src/app/**/*.{js,jsx,ts,tsx}'];
export const docs = { production };
const resolveEntryPaths = async (localConfig, options) => {
    const { manifest } = options;
    const config = getConfig(localConfig, options);
    if (manifest.main === 'expo-router/entry') {
        let patterns = [...production];
        const normalizedPlugins = config.plugins?.map(plugin => (Array.isArray(plugin) ? plugin : [plugin])) ?? [];
        const expoRouterPlugin = normalizedPlugins.find(([plugin]) => plugin === 'expo-router');
        if (expoRouterPlugin) {
            const [, options] = expoRouterPlugin;
            if (typeof options?.root === 'string') {
                patterns = [join(options.root, '**/*.{js,jsx,ts,tsx}')];
            }
        }
        return patterns.map(entry => toProductionEntry(entry));
    }
    return production.map(entry => toProductionEntry(entry));
};
const resolveConfig = async (expoConfig, options) => getDependencies(expoConfig, options);
export default {
    title,
    enablers,
    isEnabled,
    config,
    resolveEntryPaths,
    resolveConfig,
};
