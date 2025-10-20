"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runtimePaths = exports.refreshRuntimeDirPath = exports.refreshUtilsPath = exports.reactRefreshEntryPath = exports.reactRefreshPath = void 0;
const node_path_1 = __importDefault(require("node:path"));
exports.reactRefreshPath = require.resolve('../client/reactRefresh.js');
exports.reactRefreshEntryPath = require.resolve('../client/reactRefreshEntry.js');
exports.refreshUtilsPath = require.resolve('../client/refreshUtils.js');
exports.refreshRuntimeDirPath = node_path_1.default.dirname(require.resolve('react-refresh', {
    paths: [exports.reactRefreshPath],
}));
exports.runtimePaths = [
    exports.reactRefreshEntryPath,
    exports.reactRefreshPath,
    exports.refreshUtilsPath,
    exports.refreshRuntimeDirPath,
];
