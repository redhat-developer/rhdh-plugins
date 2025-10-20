"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scandir = scandir;
exports.scandirSync = scandirSync;
const settings_1 = require("./settings");
const async = require("./providers/async");
const sync = require("./providers/sync");
function scandir(path, optionsOrSettingsOrCallback, callback) {
    if (typeof optionsOrSettingsOrCallback === 'function') {
        async.read(path, getSettings(), optionsOrSettingsOrCallback);
        return;
    }
    async.read(path, getSettings(optionsOrSettingsOrCallback), callback);
}
function scandirSync(path, optionsOrSettings) {
    const settings = getSettings(optionsOrSettings);
    return sync.read(path, settings);
}
function getSettings(settingsOrOptions = {}) {
    if (settingsOrOptions instanceof settings_1.Settings) {
        return settingsOrOptions;
    }
    return new settings_1.Settings(settingsOrOptions);
}
