import { toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'Changesets';
const enablers = ['@changesets/cli'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const isRootOnly = true;
const config = ['.changeset/config.json'];
const resolveConfig = config => {
    return (Array.isArray(config.changelog)
        ? [config.changelog[0]]
        : typeof config.changelog === 'string'
            ? [config.changelog]
            : []).map(id => toDependency(id));
};
export default {
    title,
    enablers,
    isEnabled,
    isRootOnly,
    config,
    resolveConfig,
};
