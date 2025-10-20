import { hasDependency } from '../../util/plugin.js';
const title = 'simple-git-hooks';
const enablers = ['simple-git-hooks'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['.simple-git-hooks.{js,cjs,json}', 'simple-git-hooks.{js,cjs,json}', 'package.json'];
const resolveConfig = async (config, options) => {
    if (typeof config === 'function')
        config = config();
    if (!config)
        return [];
    const inputs = new Set();
    for (const hook of Object.values(config)) {
        for (const id of options.getInputsFromScripts(hook))
            inputs.add(id);
    }
    return Array.from(inputs);
};
export default {
    title,
    enablers,
    isEnabled,
    config,
    resolveConfig,
};
