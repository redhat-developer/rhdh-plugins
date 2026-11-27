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

import { mockApis } from '@backstage/test-utils';

import {
  applyDefaultSidebarPinState,
  SIDEBAR_PIN_STATE_STORAGE_KEY,
} from './applyDefaultSidebarPinState';

describe('applyDefaultSidebarPinState', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('does nothing when the config key is unset', () => {
    applyDefaultSidebarPinState(mockApis.config({ data: {} }));

    expect(
      window.localStorage.getItem(SIDEBAR_PIN_STATE_STORAGE_KEY),
    ).toBeNull();
  });

  it('seeds localStorage with false from app.sidebar.defaultPinned', () => {
    applyDefaultSidebarPinState(
      mockApis.config({
        data: { app: { sidebar: { defaultPinned: false } } },
      }),
    );

    expect(window.localStorage.getItem(SIDEBAR_PIN_STATE_STORAGE_KEY)).toBe(
      'false',
    );
  });

  it('seeds localStorage with true from app.sidebar.defaultPinned', () => {
    applyDefaultSidebarPinState(
      mockApis.config({
        data: { app: { sidebar: { defaultPinned: true } } },
      }),
    );

    expect(window.localStorage.getItem(SIDEBAR_PIN_STATE_STORAGE_KEY)).toBe(
      'true',
    );
  });

  it('does not overwrite an existing saved preference', () => {
    window.localStorage.setItem(SIDEBAR_PIN_STATE_STORAGE_KEY, 'true');

    applyDefaultSidebarPinState(
      mockApis.config({
        data: { app: { sidebar: { defaultPinned: false } } },
      }),
    );

    expect(window.localStorage.getItem(SIDEBAR_PIN_STATE_STORAGE_KEY)).toBe(
      'true',
    );
  });

  it('leaves localStorage unset when reading the config value throws', () => {
    const configApi = mockApis.config({ data: {} });
    jest.spyOn(configApi, 'getOptionalBoolean').mockImplementation(() => {
      throw new Error(
        'Invalid type in config for key app.sidebar.defaultPinned',
      );
    });

    expect(() => applyDefaultSidebarPinState(configApi)).not.toThrow();
    expect(
      window.localStorage.getItem(SIDEBAR_PIN_STATE_STORAGE_KEY),
    ).toBeNull();
  });
});
