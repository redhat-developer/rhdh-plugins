import { toCosmiconfig } from '../../util/plugin-config.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'Syncpack';
const enablers = ['syncpack'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['package.json', ...toCosmiconfig('syncpack')];
export default {
    title,
    enablers,
    isEnabled,
    config,
};
