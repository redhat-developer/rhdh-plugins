import { toDeferResolve, toEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import { resolveDependencies } from './helpers.js';
const title = 'Cypress';
const enablers = ['cypress'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['cypress.config.{js,ts,mjs,cjs}'];
const TEST_FILE_PATTERNS = ['cypress/e2e/**/*.cy.{js,jsx,ts,tsx}'];
const SUPPORT_FILE_PATTERNS = [
    'cypress/support/e2e.{js,jsx,ts,tsx}',
    'cypress/support/commands.{js,ts}',
    'cypress/support/component.{js,ts}',
    'cypress/plugins/index.js',
];
const entry = [...TEST_FILE_PATTERNS, ...SUPPORT_FILE_PATTERNS];
const resolveEntryPaths = async (localConfig) => {
    const specPatterns = [localConfig.e2e?.specPattern ?? [], localConfig.component?.specPattern ?? []].flat();
    const supportFiles = [localConfig.e2e?.supportFile || [], localConfig.component?.supportFile || []].flat();
    return [
        ...(specPatterns.length > 0 ? specPatterns : TEST_FILE_PATTERNS),
        ...(supportFiles.length > 0 ? supportFiles : SUPPORT_FILE_PATTERNS),
    ].map(toEntry);
};
const resolveConfig = async (config, options) => {
    const inputs = await resolveDependencies(config, options);
    return inputs.map(toDeferResolve);
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
