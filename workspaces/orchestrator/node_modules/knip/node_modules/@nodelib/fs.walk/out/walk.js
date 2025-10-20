"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walk = walk;
exports.walkSync = walkSync;
exports.walkStream = walkStream;
const providers_1 = require("./providers");
const settings_1 = require("./settings");
const readers_1 = require("./readers");
const fs_1 = require("./adapters/fs");
const fs = new fs_1.FileSystemAdapter();
function walk(directory, options, callback) {
    const optionsIsCallback = typeof options === 'function';
    const callback_ = optionsIsCallback ? options : callback;
    const settings = optionsIsCallback ? getSettings() : getSettings(options);
    const reader = new readers_1.AsyncReader(fs, settings);
    const provider = new providers_1.AsyncProvider(reader);
    provider.read(directory, callback_);
}
function walkSync(directory, optionsOrSettings) {
    const settings = getSettings(optionsOrSettings);
    const reader = new readers_1.SyncReader(fs, settings);
    const provider = new providers_1.SyncProvider(reader);
    return provider.read(directory);
}
function walkStream(directory, optionsOrSettings) {
    const settings = getSettings(optionsOrSettings);
    const reader = new readers_1.AsyncReader(fs, settings);
    const provider = new providers_1.StreamProvider(reader);
    return provider.read(directory);
}
function getSettings(settingsOrOptions = {}) {
    if (settingsOrOptions instanceof settings_1.Settings) {
        return settingsOrOptions;
    }
    return new settings_1.Settings(settingsOrOptions);
}
