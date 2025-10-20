import { hasDependency } from '../../util/plugin.js';
const title = 'Tailwind';
const enablers = ['tailwindcss'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const entry = ['tailwind.config.{js,cjs,mjs,ts}'];
export default {
    title,
    enablers,
    isEnabled,
    entry,
};
