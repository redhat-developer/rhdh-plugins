"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpClientConnectTimeoutError = exports.HttpClientRequestTimeoutError = exports.HttpClientRequestError = void 0;
class HttpClientRequestError extends Error {
    status;
    headers;
    socket;
    res;
}
exports.HttpClientRequestError = HttpClientRequestError;
class HttpClientRequestTimeoutError extends HttpClientRequestError {
    constructor(timeout, options) {
        const message = `Request timeout for ${timeout} ms`;
        super(message, options);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.HttpClientRequestTimeoutError = HttpClientRequestTimeoutError;
class HttpClientConnectTimeoutError extends HttpClientRequestError {
    code;
    constructor(message, code, options) {
        super(message, options);
        this.name = this.constructor.name;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.HttpClientConnectTimeoutError = HttpClientConnectTimeoutError;
