import { toEntry } from '../../util/input.js';
import { join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import { configFiles, inputsFromFrameworks, inputsFromPlugins, loadConfig } from './helpers.js';
const title = 'Karma';
const enablers = ['karma'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = configFiles;
const entry = [];
const resolveConfig = async (localConfig, options) => {
    const inputs = new Set();
    const config = loadConfig(localConfig);
    if (!config)
        return [];
    if (config.frameworks) {
        inputsFromFrameworks(config.frameworks).forEach(inputs.add, inputs);
    }
    inputsFromPlugins(config.plugins, options.manifest.devDependencies).forEach(inputs.add, inputs);
    return Array.from(inputs);
};
const resolveEntryPaths = (localConfig, options) => {
    const inputs = new Set();
    const config = loadConfig(localConfig);
    if (!config)
        return [];
    const basePath = config.basePath ?? '';
    if (config.files) {
        for (const fileOrPatternObj of config.files) {
            const fileOrPattern = typeof fileOrPatternObj === 'string' ? fileOrPatternObj : fileOrPatternObj.pattern;
            inputs.add(toEntry(join(options.configFileDir, basePath, fileOrPattern)));
        }
    }
    if (config.exclude) {
        for (const fileOrPattern of config.exclude) {
            inputs.add(toEntry(`!${join(options.configFileDir, basePath, fileOrPattern)}`));
        }
    }
    return Array.from(inputs);
};
export default {
    title,
    enablers,
    isEnabled,
    config,
    entry,
    resolveConfig,
    resolveEntryPaths,
};
