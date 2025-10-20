'use strict';

var polyfills = require('./polyfills.cjs.cjs');
var runtimeCore = require('@module-federation/runtime-core');
var utils = require('./utils.cjs.cjs');

var helpers = polyfills._extends({}, runtimeCore.helpers, {
    global: polyfills._extends({}, runtimeCore.helpers.global, {
        getGlobalFederationInstance: utils.getGlobalFederationInstance
    })
});

module.exports = helpers;
