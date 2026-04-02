/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

/**
 * Same as jest-environment-jsdom, but does not forward jsdom CSS parse errors to
 * Jest's console. Those come from modern @backstage/ui CSS (@layer, etc.) that jsdom's
 * parser cannot handle; they are harmless for unit tests.
 *
 * Derived from jest-environment-jsdom@29.7.0 (MIT).
 */
function isString(value) {
  return typeof value === 'string';
}

function _jsdom() {
  const data = require('jsdom');
  _jsdom = function () {
    return data;
  };
  return data;
}
function _fakeTimers() {
  const data = require('@jest/fake-timers');
  _fakeTimers = function () {
    return data;
  };
  return data;
}
function _jestMock() {
  const data = require('jest-mock');
  _jestMock = function () {
    return data;
  };
  return data;
}
function _jestUtil() {
  const data = require('jest-util');
  _jestUtil = function () {
    return data;
  };
  return data;
}

class JSDOMEnvironmentSuppressCss {
  dom;
  fakeTimers;
  fakeTimersModern;
  global;
  errorEventListener;
  moduleMocker;
  customExportConditions = ['browser'];
  _configuredExportConditions;
  constructor(config, context) {
    const { projectConfig } = config;
    const virtualConsole = new (_jsdom().VirtualConsole)();
    // jsdom 21+ uses forwardTo; older stacks (jest-environment-jsdom 29 + jsdom 20) use sendTo.
    if (typeof virtualConsole.forwardTo === 'function') {
      virtualConsole.forwardTo(context.console, { jsdomErrors: 'none' });
    } else if (typeof virtualConsole.sendTo === 'function') {
      virtualConsole.sendTo(context.console, { omitJSDOMErrors: true });
    } else {
      throw new TypeError(
        'Unsupported jsdom VirtualConsole: expected forwardTo or sendTo',
      );
    }
    virtualConsole.on('jsdomError', error => {
      if (
        error &&
        typeof error.message === 'string' &&
        error.message.includes('Could not parse CSS stylesheet')
      ) {
        return;
      }
      context.console.error(error);
    });
    this.dom = new (_jsdom().JSDOM)(
      typeof projectConfig.testEnvironmentOptions.html === 'string'
        ? projectConfig.testEnvironmentOptions.html
        : '<!DOCTYPE html>',
      {
        pretendToBeVisual: true,
        resources:
          typeof projectConfig.testEnvironmentOptions.userAgent === 'string'
            ? new (_jsdom().ResourceLoader)({
                userAgent: projectConfig.testEnvironmentOptions.userAgent,
              })
            : undefined,
        runScripts: 'dangerously',
        url: 'http://localhost/',
        virtualConsole,
        ...projectConfig.testEnvironmentOptions,
      },
    );
    const global = (this.global = this.dom.window);
    if (global == null) {
      throw new TypeError('JSDOM did not return a Window object');
    }

    global.global = global;

    this.global.Error.stackTraceLimit = 100;
    (0, _jestUtil().installCommonGlobals)(global, projectConfig.globals);

    global.Buffer = Buffer;

    this.errorEventListener = event => {
      if (userErrorListenerCount === 0 && event.error != null) {
        process.emit('uncaughtException', event.error);
      }
    };
    global.addEventListener('error', this.errorEventListener);

    const originalAddListener = global.addEventListener.bind(global);
    const originalRemoveListener = global.removeEventListener.bind(global);
    let userErrorListenerCount = 0;
    global.addEventListener = function (...args) {
      if (args[0] === 'error') {
        userErrorListenerCount++;
      }
      return originalAddListener.apply(this, args);
    };
    global.removeEventListener = function (...args) {
      if (args[0] === 'error') {
        userErrorListenerCount--;
      }
      return originalRemoveListener.apply(this, args);
    };
    if ('customExportConditions' in projectConfig.testEnvironmentOptions) {
      const { customExportConditions } = projectConfig.testEnvironmentOptions;
      if (
        Array.isArray(customExportConditions) &&
        customExportConditions.every(isString)
      ) {
        this._configuredExportConditions = customExportConditions;
      } else {
        throw new TypeError(
          'Custom export conditions specified but they are not an array of strings',
        );
      }
    }
    this.moduleMocker = new (_jestMock().ModuleMocker)(global);
    this.fakeTimers = new (_fakeTimers().LegacyFakeTimers)({
      config: projectConfig,
      global: global,
      moduleMocker: this.moduleMocker,
      timerConfig: {
        idToRef: id => id,
        refToId: ref => ref,
      },
    });
    this.fakeTimersModern = new (_fakeTimers().ModernFakeTimers)({
      config: projectConfig,
      global: global,
    });
  }

  setup() {
    return Promise.resolve();
  }
  async teardown() {
    if (this.fakeTimers) {
      this.fakeTimers.dispose();
    }
    if (this.fakeTimersModern) {
      this.fakeTimersModern.dispose();
    }
    if (this.global != null) {
      if (this.errorEventListener) {
        this.global.removeEventListener('error', this.errorEventListener);
      }
      this.global.close();
    }
    this.errorEventListener = null;
    this.global = null;
    this.dom = null;
    this.fakeTimers = null;
    this.fakeTimersModern = null;
  }
  exportConditions() {
    return this._configuredExportConditions ?? this.customExportConditions;
  }
  getVmContext() {
    if (this.dom) {
      return this.dom.getInternalVMContext();
    }
    return null;
  }
}

module.exports = JSDOMEnvironmentSuppressCss;
module.exports.default = JSDOMEnvironmentSuppressCss;
module.exports.TestEnvironment = JSDOMEnvironmentSuppressCss;
