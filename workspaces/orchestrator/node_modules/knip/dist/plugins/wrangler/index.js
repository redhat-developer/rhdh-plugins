import { toProductionEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'Wrangler';
const enablers = ['wrangler'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['wrangler.{json,toml}'];
const resolveEntryPaths = async (config) => {
    return (config.main ? [config.main] : []).map(id => toProductionEntry(id));
};
export default {
    title,
    enablers,
    isEnabled,
    config,
    resolveEntryPaths,
};
