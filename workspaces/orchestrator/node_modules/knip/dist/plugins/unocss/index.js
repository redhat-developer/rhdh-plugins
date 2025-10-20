import { toUnconfig } from '../../util/plugin-config.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'UnoCSS';
const enablers = ['unocss'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = [...toUnconfig('uno.config'), ...toUnconfig('unocss.config')];
export default {
    title,
    enablers,
    isEnabled,
    config,
};
