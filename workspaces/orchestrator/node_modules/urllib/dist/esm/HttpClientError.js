export class HttpClientRequestError extends Error {
    status;
    headers;
    socket;
    res;
}
export class HttpClientRequestTimeoutError extends HttpClientRequestError {
    constructor(timeout, options) {
        const message = `Request timeout for ${timeout} ms`;
        super(message, options);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
export class HttpClientConnectTimeoutError extends HttpClientRequestError {
    code;
    constructor(message, code, options) {
        super(message, options);
        this.name = this.constructor.name;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
