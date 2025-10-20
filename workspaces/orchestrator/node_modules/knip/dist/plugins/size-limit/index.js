import { toLilconfig } from '../../util/plugin-config.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'size-limit';
const enablers = ['size-limit'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = [
    'package.json',
    ...toLilconfig('size-limit', { configDir: false, additionalExtensions: ['ts', 'mts', 'cts'], rcSuffix: '' }),
];
export default {
    title,
    enablers,
    isEnabled,
    config,
};
