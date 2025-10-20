"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactRefreshRspackPlugin = void 0;
const node_path_1 = __importDefault(require("node:path"));
const options_1 = require("./options");
const paths_1 = require("./paths");
const getAdditionalEntries_1 = require("./utils/getAdditionalEntries");
const getSocketIntegration_1 = require("./utils/getSocketIntegration");
const getIntegrationEntry_1 = require("./utils/getIntegrationEntry");
function addEntry(entry, compiler) {
    new compiler.webpack.EntryPlugin(compiler.context, entry, {
        name: undefined,
    }).apply(compiler);
}
function addSocketEntry(sockIntegration, compiler) {
    const integrationEntry = (0, getIntegrationEntry_1.getIntegrationEntry)(sockIntegration);
    if (integrationEntry) {
        addEntry(integrationEntry, compiler);
    }
}
const PLUGIN_NAME = 'ReactRefreshRspackPlugin';
class ReactRefreshRspackPlugin {
    constructor(options = {}) {
        this.options = (0, options_1.normalizeOptions)(options);
    }
    apply(compiler) {
        if (
        // Webpack do not set process.env.NODE_ENV, so we need to check for mode.
        // Ref: https://github.com/webpack/webpack/issues/7074
        (compiler.options.mode !== 'development' ||
            // We also check for production process.env.NODE_ENV,
            // in case it was set and mode is non-development (e.g. 'none')
            (process.env.NODE_ENV && process.env.NODE_ENV === 'production')) &&
            !this.options.forceEnable) {
            return;
        }
        const addEntries = (0, getAdditionalEntries_1.getAdditionalEntries)({
            devServer: compiler.options.devServer,
            options: this.options,
        });
        if (this.options.injectEntry) {
            for (const entry of addEntries.prependEntries) {
                addEntry(entry, compiler);
            }
        }
        if (this.options.overlay !== false &&
            this.options.overlay.sockIntegration) {
            addSocketEntry(this.options.overlay.sockIntegration, compiler);
        }
        for (const entry of addEntries.overlayEntries) {
            addEntry(entry, compiler);
        }
        new compiler.webpack.ProvidePlugin({
            $ReactRefreshRuntime$: paths_1.reactRefreshPath,
        }).apply(compiler);
        if (this.options.injectLoader) {
            compiler.options.module.rules.unshift({
                test: this.options.test,
                // biome-ignore lint: exists
                include: this.options.include,
                exclude: {
                    // biome-ignore lint: exists
                    or: [this.options.exclude, [...paths_1.runtimePaths]].filter(Boolean),
                },
                resourceQuery: this.options.resourceQuery,
                dependency: {
                    // `new URL("static/sdk.js", import.meta.url)` the sdk.js is an asset module
                    // we shoudn't inject react refresh for asset module
                    not: ['url'],
                },
                use: ReactRefreshRspackPlugin.loader,
            });
        }
        const definedModules = {
            // For Multiple Instance Mode
            __react_refresh_library__: JSON.stringify(compiler.webpack.Template.toIdentifier(this.options.library ||
                compiler.options.output.uniqueName ||
                compiler.options.output.library)),
            __reload_on_runtime_errors__: this.options.reloadOnRuntimeErrors,
        };
        const providedModules = {
            __react_refresh_utils__: paths_1.refreshUtilsPath,
        };
        if (this.options.overlay === false) {
            // Stub errorOverlay module so their calls can be erased
            definedModules.__react_refresh_error_overlay__ = false;
            definedModules.__react_refresh_socket__ = false;
        }
        else {
            if (this.options.overlay.module) {
                providedModules.__react_refresh_error_overlay__ = require.resolve(this.options.overlay.module);
            }
            if (this.options.overlay.sockIntegration) {
                providedModules.__react_refresh_socket__ = (0, getSocketIntegration_1.getSocketIntegration)(this.options.overlay.sockIntegration);
            }
        }
        new compiler.webpack.DefinePlugin(definedModules).apply(compiler);
        new compiler.webpack.ProvidePlugin(providedModules).apply(compiler);
        const refreshPath = node_path_1.default.dirname(require.resolve('react-refresh'));
        compiler.options.resolve.alias = {
            'react-refresh': refreshPath,
            ...compiler.options.resolve.alias,
        };
        compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
            compilation.hooks.additionalTreeRuntimeRequirements.tap(PLUGIN_NAME, (_, runtimeRequirements) => {
                runtimeRequirements.add(compiler.rspack.RuntimeGlobals.moduleCache);
            });
        });
    }
}
exports.ReactRefreshRspackPlugin = ReactRefreshRspackPlugin;
ReactRefreshRspackPlugin.deprecated_runtimePaths = paths_1.runtimePaths;
ReactRefreshRspackPlugin.loader = 'builtin:react-refresh-loader';
exports.default = ReactRefreshRspackPlugin;
