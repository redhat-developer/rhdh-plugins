"use strict";
// library code, any is fine
/* eslint-disable @typescript-eslint/no-explicit-any */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const _ = __importStar(require("lodash"));
class OpenAPIUtils {
    /**
     * Finds the value for a given key (status code) in an object,
     * based on the OpenAPI specification for patterned field.
     * Returns the value in the 'obj' argument for which the key matches the 'statusCode' argument,
     * based on pattern matching, or undefined otherwise.
     * @param {number} statusCode The status code representing the key to match in 'obj' argument.
     * @param {Object.<string, *>} obj The object containing values referenced by possibly patterned status code key.
     * @returns {*}
     */
    static findStatusCodeMatch(statusCode, obj) {
        let value = obj[statusCode];
        if (value !== undefined) {
            return value;
        }
        // The specification allows statusCode to be 1XX, 2XX, ...
        const strStatusCode = Math.floor(statusCode / 100) + 'XX';
        value = obj[strStatusCode];
        if (value !== undefined) {
            return value;
        }
        return obj['default'];
    }
    /**
     * Finds the default most appropriate value in an object, based on the following rule
     * 1. check for a 20X res
     * 2. check for a 2XX res
     * 3. check for the "default" res
     * 4. pick first res code in list
     * Returns the value in the 'obj' argument.
     * @param {Object.<string, *>} obj The object containing values referenced by possibly patterned status code key.
     * @returns {{status: string, res: *}}
     */
    static findDefaultStatusCodeMatch(obj) {
        // 1. check for a 20X response
        for (const ok of _.range(200, 204)) {
            if (obj[ok]) {
                return {
                    status: ok,
                    res: obj[ok],
                };
            }
        }
        // 2. check for a 2XX response
        if (obj['2XX']) {
            return {
                status: 200,
                res: obj['2XX'],
            };
        }
        // 3. check for the "default" response
        if (obj.default) {
            return {
                status: 200,
                res: obj.default,
            };
        }
        // 4. pick first response code in list
        const code = Object.keys(obj)[0];
        return {
            status: Number(code),
            res: obj[code],
        };
    }
    /**
     * Get operationId, (or generate one) for an operation
     *
     * @static
     * @param {Operation<D>} operation
     * @returns {string} OperationId of the given operation
     * @memberof OpenAPIUtils
     */
    static getOperationId(operation) {
        if (!(operation === null || operation === void 0 ? void 0 : operation.operationId)) {
            // TODO: generate a default substitute for operationId
            return `unknown`;
        }
        return operation.operationId;
    }
}
exports.default = OpenAPIUtils;
//# sourceMappingURL=utils.js.map