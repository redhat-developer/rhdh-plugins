"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Settings = exports.statSync = exports.stat = void 0;
var stat_1 = require("./stat");
Object.defineProperty(exports, "stat", { enumerable: true, get: function () { return stat_1.stat; } });
Object.defineProperty(exports, "statSync", { enumerable: true, get: function () { return stat_1.statSync; } });
var settings_1 = require("./settings");
Object.defineProperty(exports, "Settings", { enumerable: true, get: function () { return settings_1.Settings; } });
