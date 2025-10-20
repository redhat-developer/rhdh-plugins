import { toEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'Mocha';
const enablers = ['mocha'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['.mocharc.{js,cjs,json,jsonc,yml,yaml}', 'package.json'];
const entry = ['**/test/*.{js,cjs,mjs}'];
const resolveEntryPaths = localConfig => {
    const entryPatterns = localConfig.spec ? [localConfig.spec].flat() : [];
    return [...entryPatterns].map(toEntry);
};
const resolveConfig = localConfig => {
    const require = localConfig.require ? [localConfig.require].flat() : [];
    return [...require].map(toEntry);
};
const args = {
    nodeImportArgs: true,
};
export default {
    title,
    enablers,
    isEnabled,
    config,
    entry,
    resolveConfig,
    resolveEntryPaths,
    args,
};
