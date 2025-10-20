"use strict";
// Copyright 2020 The Casbin Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.newCachedEnforcer = exports.CachedEnforcer = void 0;
const enforcer_1 = require("./enforcer");
// CachedEnforcer wraps Enforcer and provides decision cache
class CachedEnforcer extends enforcer_1.Enforcer {
    constructor() {
        super(...arguments);
        this.enableCache = true;
        this.m = new Map();
    }
    // invalidateCache deletes all the existing cached decisions.
    invalidateCache() {
        this.m = new Map();
    }
    // setEnableCache determines whether to enable cache on e nforce(). When enableCache is enabled, cached result (true | false) will be returned for previous decisions.
    setEnableCache(enableCache) {
        this.enableCache = enableCache;
    }
    static canCache(...rvals) {
        return rvals.every((n) => typeof n === 'string');
    }
    static getCacheKey(...rvals) {
        return rvals.join('$$');
    }
    getCache(key) {
        return this.m.get(key);
    }
    setCache(key, value) {
        this.m.set(key, value);
    }
    // enforce decides whether a "subject" can access a "object" with the operation "action", input parameters are usually: (sub, obj, act).
    // if rvals is not string , ingore the cache
    async enforce(...rvals) {
        if (!this.enableCache) {
            return super.enforce(...rvals);
        }
        let key = '';
        const cache = CachedEnforcer.canCache(...rvals);
        if (cache) {
            key = CachedEnforcer.getCacheKey(...rvals);
            const res = this.getCache(key);
            if (res !== undefined) {
                return res;
            }
        }
        const res = await super.enforce(...rvals);
        if (cache) {
            this.setCache(key, res);
        }
        return res;
    }
}
exports.CachedEnforcer = CachedEnforcer;
// newCachedEnforcer creates a cached enforcer via file or DB.
async function newCachedEnforcer(...params) {
    return enforcer_1.newEnforcerWithClass(CachedEnforcer, ...params);
}
exports.newCachedEnforcer = newCachedEnforcer;
