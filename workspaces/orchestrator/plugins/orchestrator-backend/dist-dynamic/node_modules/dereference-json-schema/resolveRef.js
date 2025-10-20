"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "resolveRefSync", {
    enumerable: true,
    get: function() {
        return resolveRefSync;
    }
});
var cache = new Map();
var resolveRefSync = function(schema, ref) {
    if (!cache.has(schema)) {
        cache.set(schema, new Map());
    }
    var schemaCache = cache.get(schema);
    if (schemaCache.has(ref)) {
        return schemaCache.get(ref);
    }
    var path = ref.split("/").slice(1);
    var current = schema;
    var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
    try {
        for(var _iterator = path[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
            var segment = _step.value;
            if (!current || typeof current !== "object") {
                // we've reached a dead end
                current = null;
            }
            var _current_segment;
            current = (_current_segment = current[segment]) !== null && _current_segment !== void 0 ? _current_segment : null;
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally{
        try {
            if (!_iteratorNormalCompletion && _iterator.return != null) {
                _iterator.return();
            }
        } finally{
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }
    schemaCache.set(ref, current);
    return current;
};
