import { _ as _extends } from './polyfills.esm.js';
import { helpers as helpers$1 } from '@module-federation/runtime-core';
import { g as getGlobalFederationInstance } from './utils.esm.js';

var helpers = _extends({}, helpers$1, {
    global: _extends({}, helpers$1.global, {
        getGlobalFederationInstance
    })
});

export { helpers as default };
