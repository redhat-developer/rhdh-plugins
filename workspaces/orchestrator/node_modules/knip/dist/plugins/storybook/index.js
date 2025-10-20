import { toDeferResolve, toDependency, toEntry } from '../../util/input.js';
import { join, relative } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'Storybook';
const enablers = [/^@storybook\//, '@nrwl/storybook'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['.storybook/{main,test-runner}.{js,ts}'];
const stories = ['**/*.@(mdx|stories.@(mdx|js|jsx|mjs|ts|tsx))'];
const restEntry = ['.storybook/{manager,preview}.{js,jsx,ts,tsx}'];
const entry = [...restEntry, ...stories];
const project = ['.storybook/**/*.{js,jsx,ts,tsx}'];
const resolveEntryPaths = async (localConfig, options) => {
    const { cwd, configFileDir } = options;
    const strs = typeof localConfig?.stories === 'function' ? await localConfig.stories(stories) : localConfig?.stories;
    const relativePatterns = strs?.map(pattern => {
        if (typeof pattern === 'string')
            return relative(cwd, join(configFileDir, pattern));
        return relative(cwd, join(configFileDir, pattern.directory, pattern.files ?? stories[0]));
    });
    const patterns = [...restEntry, ...(relativePatterns && relativePatterns.length > 0 ? relativePatterns : stories)];
    return patterns.map(toEntry);
};
const resolveConfig = async (localConfig) => {
    const addons = localConfig.addons?.map(addon => (typeof addon === 'string' ? addon : addon.name)) ?? [];
    const builder = localConfig?.core?.builder &&
        (typeof localConfig.core.builder === 'string' ? localConfig.core.builder : localConfig.core.builder.name);
    const builderPackages = builder
        ? builder.startsWith('webpack')
            ? [`@storybook/builder-${builder}`, `@storybook/manager-${builder}`]
            : [builder]
        : [];
    const framework = typeof localConfig.framework === 'string' ? localConfig.framework : localConfig.framework?.name;
    const frameworks = framework ? [framework] : [];
    return [
        ...addons.map(toDeferResolve),
        ...builderPackages.map(id => toDependency(id)),
        ...frameworks.map(id => toDependency(id)),
    ];
};
export default {
    title,
    enablers,
    isEnabled,
    config,
    entry,
    project,
    resolveEntryPaths,
    resolveConfig,
};
