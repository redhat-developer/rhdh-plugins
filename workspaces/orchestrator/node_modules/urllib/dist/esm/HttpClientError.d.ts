import type { RawResponseWithMeta, SocketInfo } from './Response.js';
import type { IncomingHttpHeaders } from './IncomingHttpHeaders.js';
interface ErrorOptions {
    cause?: Error;
}
export declare class HttpClientRequestError extends Error {
    status?: number;
    headers?: IncomingHttpHeaders;
    socket?: SocketInfo;
    res?: RawResponseWithMeta;
}
export declare class HttpClientRequestTimeoutError extends HttpClientRequestError {
    constructor(timeout: number, options: ErrorOptions);
}
export declare class HttpClientConnectTimeoutError extends HttpClientRequestError {
    code: string;
    constructor(message: string, code: string, options: ErrorOptions);
}
export {};
