import { hasDependency } from '../../util/plugin.js';
const title = 'Plop';
const enablers = ['plop'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['plopfile.{cjs,mjs,js,ts}'];
export default {
    title,
    enablers,
    isEnabled,
    config,
};
