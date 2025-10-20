"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const paths = {
    files: path_1.default.resolve(__dirname, 'files.json'),
    codeowners: path_1.default.resolve(__dirname, 'owners'),
    gitignores: [],
};
exports.invalidOwnerFixtures = Object.assign(Object.assign({}, paths), { codeowners: path_1.default.resolve(__dirname, 'owners-invalid-format') });
exports.default = paths;
//# sourceMappingURL=index.js.map