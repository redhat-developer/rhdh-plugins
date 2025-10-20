'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var runtimeCore = require('@module-federation/runtime-core');



exports.default = runtimeCore;
Object.prototype.hasOwnProperty.call(runtimeCore, '__proto__') &&
	!Object.prototype.hasOwnProperty.call(exports, '__proto__') &&
	Object.defineProperty(exports, '__proto__', {
		enumerable: true,
		value: runtimeCore['__proto__']
	});

Object.keys(runtimeCore).forEach(function (k) {
	if (k !== 'default' && !Object.prototype.hasOwnProperty.call(exports, k)) exports[k] = runtimeCore[k];
});
