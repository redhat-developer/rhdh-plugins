"use strict";
/*
 Copyright 2021 The CloudEvents Authors
 SPDX-License-Identifier: Apache-2.0
*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpTransport = void 0;
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
/**
 * httpTransport provides a simple HTTP Transport function, which can send a CloudEvent,
 * encoded as a Message to the endpoint. The returned function can be used with emitterFor()
 * to provide an event emitter, for example:
 *
 * const emitter = emitterFor(httpTransport("http://example.com"));
 * emitter.emit(myCloudEvent)
 *    .then(resp => console.log(resp));
 *
 * @param {string|URL} sink the destination endpoint for the event
 * @returns {TransportFunction} a function which can be used to send CloudEvents to _sink_
 */
function httpTransport(sink) {
    const url = new URL(sink);
    let base;
    if (url.protocol === "https:") {
        base = https_1.default;
    }
    else if (url.protocol === "http:") {
        base = http_1.default;
    }
    else {
        throw new TypeError(`unsupported protocol ${url.protocol}`);
    }
    return function (message, options) {
        return new Promise((resolve, reject) => {
            options = { ...options };
            // TODO: Callers should be able to set any Node.js RequestOptions
            const opts = {
                method: "POST",
                headers: { ...message.headers, ...options.headers },
            };
            try {
                const response = {
                    body: "",
                    headers: {},
                };
                const req = base.request(url, opts, (res) => {
                    res.setEncoding("utf-8");
                    response.headers = res.headers;
                    res.on("data", (chunk) => response.body += chunk);
                    res.on("end", () => { resolve(response); });
                });
                req.on("error", reject);
                req.write(message.body);
                req.end();
            }
            catch (err) {
                reject(err);
            }
        });
    };
}
exports.httpTransport = httpTransport;
