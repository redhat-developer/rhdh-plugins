import WebpackError from "../lib/WebpackError";
export default class ModuleError extends WebpackError {
    error?: Error;
    constructor(err: Error, { from }?: {
        from?: string;
    });
}
