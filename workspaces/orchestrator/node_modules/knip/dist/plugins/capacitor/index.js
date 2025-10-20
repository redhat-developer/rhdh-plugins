import { isFile } from '../../util/fs.js';
import { toDependency } from '../../util/input.js';
import { join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'Capacitor';
const enablers = [/^@capacitor\//];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['capacitor.config.{json,ts}'];
const resolveConfig = async (config, { configFileDir }) => {
    const exists = (filePath) => isFile(join(configFileDir, filePath));
    const plugins = config.includePlugins ?? [];
    const android = (await exists('android/capacitor.settings.gradle')) ? ['@capacitor/android'] : [];
    const ios = (await exists('ios/App/Podfile')) ? ['@capacitor/ios'] : [];
    return [...plugins, ...android, ...ios].map(id => toDependency(id));
};
export default {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
};
