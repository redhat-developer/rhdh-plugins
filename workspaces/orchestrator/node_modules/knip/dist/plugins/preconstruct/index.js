import { toEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'Preconstruct';
const enablers = ['@preconstruct/cli'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['package.json'];
const resolveEntryPaths = async (config) => {
    return (config.entrypoints ?? []).map(toEntry);
};
export default {
    title,
    enablers,
    isEnabled,
    config,
    resolveEntryPaths,
};
