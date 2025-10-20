"use strict";
/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.Protocol = void 0;
/**
 * An enum representing the transport protocols for an event
 */
var Protocol;
(function (Protocol) {
    Protocol[Protocol["HTTPBinary"] = 0] = "HTTPBinary";
    Protocol[Protocol["HTTPStructured"] = 1] = "HTTPStructured";
    Protocol[Protocol["HTTP"] = 2] = "HTTP";
})(Protocol = exports.Protocol || (exports.Protocol = {}));
