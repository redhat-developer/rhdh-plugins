"use strict";
/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parserByEncoding = exports.DateParser = exports.Base64Parser = exports.parserByContentType = exports.PassThroughParser = exports.JSONParser = exports.Parser = void 0;
const json_bigint_1 = __importDefault(require("json-bigint"));
const constants_1 = __importDefault(require("./constants"));
const validation_1 = require("./event/validation");
const __JSON = JSON;
class Parser {
}
exports.Parser = Parser;
class JSONParser {
    constructor(decorator) {
        this.decorator = decorator;
    }
    /**
     * Parses the payload with an optional decorator
     * @param {object|string} payload the JSON payload
     * @return {object} the parsed JSON payload.
     */
    parse(payload) {
        if (typeof payload === "string") {
            // This is kind of a hack, but the payload data could be JSON in the form of a single
            // string, such as "some data". But without the quotes in the string, JSON.parse blows
            // up. We can check for this scenario and add quotes. Not sure if this is ideal.
            if (!/^[[|{|"]/.test(payload)) {
                payload = `"${payload}"`;
            }
        }
        if (this.decorator) {
            payload = this.decorator.parse(payload);
        }
        (0, validation_1.isDefinedOrThrow)(payload, new validation_1.ValidationError("null or undefined payload"));
        (0, validation_1.isStringOrObjectOrThrow)(payload, new validation_1.ValidationError("invalid payload type, allowed are: string or object"));
        if (process.env[constants_1.default.USE_BIG_INT_ENV] === "true") {
            JSON = (0, json_bigint_1.default)(({ useNativeBigInt: true }));
        }
        else {
            JSON = __JSON;
        }
        const parseJSON = (v) => ((0, validation_1.isString)(v) ? JSON.parse(v) : v);
        return parseJSON(payload);
    }
}
exports.JSONParser = JSONParser;
class PassThroughParser extends Parser {
    parse(payload) {
        return payload;
    }
}
exports.PassThroughParser = PassThroughParser;
const jsonParser = new JSONParser();
exports.parserByContentType = {
    [constants_1.default.MIME_JSON]: jsonParser,
    [constants_1.default.MIME_CE_JSON]: jsonParser,
    [constants_1.default.DEFAULT_CONTENT_TYPE]: jsonParser,
    [constants_1.default.DEFAULT_CE_CONTENT_TYPE]: jsonParser,
    [constants_1.default.MIME_OCTET_STREAM]: new PassThroughParser(),
};
class Base64Parser {
    constructor(decorator) {
        this.decorator = decorator;
    }
    parse(payload) {
        let payloadToParse = payload;
        if (this.decorator) {
            payloadToParse = this.decorator.parse(payload);
        }
        return Buffer.from(payloadToParse, "base64").toString();
    }
}
exports.Base64Parser = Base64Parser;
class DateParser extends Parser {
    parse(payload) {
        let date = new Date(Date.parse(payload));
        if (date.toString() === "Invalid Date") {
            date = new Date();
        }
        return date.toISOString();
    }
}
exports.DateParser = DateParser;
exports.parserByEncoding = {
    base64: {
        [constants_1.default.MIME_CE_JSON]: new JSONParser(new Base64Parser()),
        [constants_1.default.MIME_OCTET_STREAM]: new PassThroughParser(),
    },
};
