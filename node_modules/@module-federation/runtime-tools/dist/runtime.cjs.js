'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var runtime = require('@module-federation/runtime');



Object.keys(runtime).forEach(function (k) {
	if (k !== 'default' && !exports.hasOwnProperty(k)) Object.defineProperty(exports, k, {
		enumerable: true,
		get: function () { return runtime[k]; }
	});
});
