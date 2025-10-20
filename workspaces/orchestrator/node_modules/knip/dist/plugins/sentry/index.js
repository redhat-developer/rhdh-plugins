import { hasDependency } from '../../util/plugin.js';
const title = 'Sentry';
const enablers = [/^@sentry\//];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const entry = ['sentry.{client,server,edge}.config.{js,ts}'];
export default {
    title,
    enablers,
    isEnabled,
    entry,
};
