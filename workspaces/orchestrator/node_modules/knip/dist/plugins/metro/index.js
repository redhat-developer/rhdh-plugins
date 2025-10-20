import { compact } from '../../util/array.js';
import { toDeferResolve, toProductionEntry } from '../../util/input.js';
import { join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
const title = 'Metro';
const enablers = ['metro', 'react-native'];
const isEnabled = options => hasDependency(options.dependencies, enablers);
const config = ['metro.config.{js,cjs,json}', 'package.json'];
const DEFAULT_PLATFORMS = ['ios', 'android', 'windows', 'web'];
const PLATFORMS = [...DEFAULT_PLATFORMS, 'native', 'default'];
const DEFAULT_EXTENSIONS = ['js', 'jsx', 'json', 'ts', 'tsx'];
const production = [`src/**/*.{${PLATFORMS.join(',')}}.{${DEFAULT_EXTENSIONS.join(',')}}`];
const resolveEntryPaths = async (config) => {
    const platformEntryPatterns = compact(PLATFORMS.concat(config.resolver?.platforms ?? []));
    const sourceExts = config.resolver?.sourceExts ?? DEFAULT_EXTENSIONS;
    const pattern = `src/**/*.{${platformEntryPatterns.join(',')}}.{${sourceExts.join(',')}}`;
    if (!config.projectRoot)
        return [toProductionEntry(pattern)];
    const entryFilePattern = 'index.{js,jsx,ts,tsx}';
    const entryFilePath = join(config.projectRoot, entryFilePattern);
    const entryFilePaths = join(config.projectRoot, pattern);
    return [toProductionEntry(entryFilePath), toProductionEntry(entryFilePaths)];
};
const resolveConfig = async (config) => {
    const { transformerPath, transformer } = config;
    const inputs = [];
    if (transformerPath)
        inputs.push(transformerPath);
    if (transformer?.assetPlugins)
        inputs.push(...transformer.assetPlugins);
    if (transformer?.minifierPath)
        inputs.push(transformer.minifierPath);
    if (transformer?.babelTransformerPath)
        inputs.push(transformer.babelTransformerPath);
    return [...inputs].map(toDeferResolve);
};
const note = `False positives for platform-specific unused files?
Override the default \`entry\` patterns to match platforms and extensions.`;
export const docs = { note, production };
export default {
    title,
    enablers,
    isEnabled,
    config,
    resolveEntryPaths,
    resolveConfig,
};
