"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolve = exports.dereference = exports.parse = void 0;
const json_schema_ref_parser_1 = __importDefault(require("@apidevtools/json-schema-ref-parser"));
// fixes issue with newer typescript versions
// https://github.com/APIDevTools/json-schema-ref-parser/issues/139
json_schema_ref_parser_1.default.dereference = json_schema_ref_parser_1.default.dereference.bind(json_schema_ref_parser_1.default);
json_schema_ref_parser_1.default.resolve = json_schema_ref_parser_1.default.resolve.bind(json_schema_ref_parser_1.default);
json_schema_ref_parser_1.default.parse = json_schema_ref_parser_1.default.parse.bind(json_schema_ref_parser_1.default);
const { dereference, parse, resolve } = json_schema_ref_parser_1.default;
exports.dereference = dereference;
exports.parse = parse;
exports.resolve = resolve;
//# sourceMappingURL=refparser.js.map