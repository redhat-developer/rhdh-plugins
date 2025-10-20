"use strict";
/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCloudEvent = void 0;
const validation_1 = require("./validation");
const cloudevent_1 = require("./cloudevent");
const v1_1 = __importDefault(require("../schema/v1"));
function validateCloudEvent(event) {
    if (event.specversion === cloudevent_1.V1) {
        if (!(0, v1_1.default)(event)) {
            throw new validation_1.ValidationError("invalid payload", v1_1.default.errors);
        }
    }
    else {
        return false;
    }
    // attribute names must all be [a-z|0-9]
    const validation = /^[a-z0-9]+$/;
    for (const key in event) {
        if (validation.test(key) === false && key !== "data_base64") {
            throw new validation_1.ValidationError(`invalid attribute name: "${key}"`);
        }
    }
    return true;
}
exports.validateCloudEvent = validateCloudEvent;
