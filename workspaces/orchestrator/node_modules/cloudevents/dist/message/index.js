"use strict";
/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mode = void 0;
// reexport the protocol bindings
__exportStar(require("./http"), exports);
__exportStar(require("./kafka"), exports);
__exportStar(require("./mqtt"), exports);
/**
 * An enum representing the two transport modes, binary and structured
 * @interface
 */
var Mode;
(function (Mode) {
    Mode["BINARY"] = "binary";
    Mode["STRUCTURED"] = "structured";
    Mode["BATCH"] = "batch";
})(Mode = exports.Mode || (exports.Mode = {}));
