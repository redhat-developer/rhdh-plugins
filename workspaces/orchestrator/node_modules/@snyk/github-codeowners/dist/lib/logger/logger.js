"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Logger {
    error(msg, error) {
        // tslint:disable-next-line:no-console
        console.error(msg, error);
    }
    warn(msg, obj) {
        // tslint:disable-next-line:no-console
        console.warn(msg, obj);
    }
}
exports.log = new Logger();
//# sourceMappingURL=logger.js.map