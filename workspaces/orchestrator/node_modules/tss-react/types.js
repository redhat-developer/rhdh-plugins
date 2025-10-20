"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchCSSObject = void 0;
function matchCSSObject(arg) {
    return (arg instanceof Object &&
        !("styles" in arg) &&
        !("length" in arg) &&
        !("__emotion_styles" in arg));
}
exports.matchCSSObject = matchCSSObject;
