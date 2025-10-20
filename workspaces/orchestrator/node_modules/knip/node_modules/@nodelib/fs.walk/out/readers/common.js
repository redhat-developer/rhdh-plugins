"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFatalError = isFatalError;
exports.isAppliedFilter = isAppliedFilter;
exports.replacePathSegmentSeparator = replacePathSegmentSeparator;
exports.joinPathSegments = joinPathSegments;
function isFatalError(settings, error) {
    if (settings.errorFilter === null) {
        return true;
    }
    return !settings.errorFilter(error);
}
function isAppliedFilter(filter, value) {
    return filter === null || filter(value);
}
function replacePathSegmentSeparator(filepath, separator) {
    return filepath.split(/[/\\]/).join(separator);
}
function joinPathSegments(a, b, separator) {
    if (a === '') {
        return b;
    }
    /**
     * The correct handling of cases when the first segment is a root (`/`, `C:/`) or UNC path (`//?/C:/`).
     */
    if (a.endsWith(separator)) {
        return a + b;
    }
    return a + separator + b;
}
