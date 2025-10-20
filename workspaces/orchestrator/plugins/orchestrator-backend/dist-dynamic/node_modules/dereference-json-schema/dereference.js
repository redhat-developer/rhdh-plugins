"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "dereferenceSync", {
    enumerable: true,
    get: function() {
        return dereferenceSync;
    }
});
var _klona = require("./klona");
var _resolveRef = require("./resolveRef");
var cache = new Map();
var dereferenceSync = function(schema) {
    if (cache.has(schema)) {
        return cache.get(schema);
    }
    var visitedNodes = new Set();
    var cloned = (0, _klona.klona)(schema);
    var resolve = function(current, path) {
        if (typeof current === "object" && current !== null) {
            // make sure we don't visit the same node twice
            if (visitedNodes.has(current)) {
                return current;
            }
            visitedNodes.add(current);
            if (Array.isArray(current)) {
                // array
                for(var index = 0; index < current.length; index++){
                    current[index] = resolve(current[index], "".concat(path, "/").concat(index));
                }
            } else {
                // object
                if ("$ref" in current && typeof current["$ref"] === "string") {
                    return (0, _resolveRef.resolveRefSync)(cloned, current["$ref"]);
                }
                for(var key in current){
                    current[key] = resolve(current[key], "".concat(path, "/").concat(key));
                }
            }
        }
        return current;
    };
    var result = resolve(cloned, "#");
    cache.set(schema, result);
    return result;
};
