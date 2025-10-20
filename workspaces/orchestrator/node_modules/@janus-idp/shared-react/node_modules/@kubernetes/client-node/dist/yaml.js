"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadYaml = loadYaml;
exports.loadAllYaml = loadAllYaml;
exports.dumpYaml = dumpYaml;
const tslib_1 = require("tslib");
const yaml = tslib_1.__importStar(require("js-yaml"));
function loadYaml(data, opts) {
    return yaml.load(data, opts);
}
function loadAllYaml(data, opts) {
    return yaml.loadAll(data, undefined, opts);
}
function dumpYaml(object, opts) {
    return yaml.dump(object, opts);
}
//# sourceMappingURL=yaml.js.map