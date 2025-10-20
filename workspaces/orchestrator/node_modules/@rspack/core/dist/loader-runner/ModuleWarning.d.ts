import WebpackError from "../lib/WebpackError";
export default class ModuleWarning extends WebpackError {
    error?: Error;
    constructor(err: Error, { from }?: {
        from?: string;
    });
}
