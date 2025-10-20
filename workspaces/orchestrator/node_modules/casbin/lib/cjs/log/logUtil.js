"use strict";
// Copyright 2019 The Casbin Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.logPrintf = exports.logPrint = exports.getLogger = exports.setLogger = void 0;
const defaultLogger_1 = require("./defaultLogger");
let logger = new defaultLogger_1.DefaultLogger();
// setLogger sets the current logger.
function setLogger(l) {
    logger = l;
}
exports.setLogger = setLogger;
// getLogger returns the current logger.
function getLogger() {
    return logger;
}
exports.getLogger = getLogger;
// logPrint prints the log.
function logPrint(...v) {
    logger.print(...v);
}
exports.logPrint = logPrint;
// logPrintf prints the log with the format.
function logPrintf(format, ...v) {
    logger.printf(format, ...v);
}
exports.logPrintf = logPrintf;
