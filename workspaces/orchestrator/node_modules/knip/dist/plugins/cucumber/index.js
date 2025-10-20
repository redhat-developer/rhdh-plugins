import { toDeferResolve, toEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'Cucumber';
const enablers = ['@cucumber/cucumber'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['cucumber.{json,yaml,yml,js,cjs,mjs}'];
const entry = ['features/**/*.@(js|cjs|mjs)'];
const resolveEntryPaths = config => {
    return (config?.import ? config.import : []).map(toEntry);
};
const resolveConfig = config => {
    const formatters = config?.format ? config.format : [];
    const requires = config?.require ? config.require : [];
    return [...formatters, ...requires].map(toDeferResolve);
};
export default {
    title,
    enablers,
    isEnabled,
    config,
    entry,
    resolveEntryPaths,
    resolveConfig,
};
