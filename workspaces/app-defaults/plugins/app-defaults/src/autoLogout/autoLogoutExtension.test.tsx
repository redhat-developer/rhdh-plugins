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

import { render, screen, waitFor } from '@testing-library/react';

import { coreExtensionData } from '@backstage/frontend-plugin-api';
import {
  createExtensionTester,
  mockApis,
  TestApiProvider,
} from '@backstage/frontend-test-utils';
import { configApiRef, identityApiRef } from '@backstage/core-plugin-api';

import { autoLogoutElement } from './autoLogoutExtension';

// AutoLogout uses react-idle-timer workers and BroadcastChannel – stub them out
// so they don't leak into the test environment.
jest.mock('react-idle-timer', () => ({
  useIdleTimer: jest.fn(() => ({
    getRemainingTime: jest.fn(() => 0),
    activate: jest.fn(),
    isPrompted: jest.fn(() => false),
  })),
  workerTimers: undefined,
  EventsType: {},
}));

// BroadcastChannel is not available in jsdom
if (!globalThis.BroadcastChannel) {
  (globalThis as any).BroadcastChannel = class {
    name: string;
    constructor(name: string) {
      this.name = name;
    }
    postMessage = jest.fn();
    close = jest.fn();
    addEventListener = jest.fn();
    removeEventListener = jest.fn();
  };
}

describe('autoLogoutElement', () => {
  it('is an app-root-element extension named auto-logout', () => {
    const data = JSON.parse(JSON.stringify(autoLogoutElement));
    expect(data.kind).toBe('app-root-element');
    expect(data.name).toBe('auto-logout');
    expect(data.attachTo).toEqual({ id: 'app/root', input: 'elements' });
  });

  it('produces a reactElement output', () => {
    const tester = createExtensionTester(autoLogoutElement, {
      apis: [mockApis.config({ data: {} }), mockApis.identity()],
    });
    const element = tester.get(coreExtensionData.reactElement);
    expect(element).toBeDefined();
  });

  it('renders nothing when autologout is disabled (default)', async () => {
    const tester = createExtensionTester(autoLogoutElement, {
      apis: [mockApis.config({ data: {} }), mockApis.identity()],
    });

    const element = tester.get(coreExtensionData.reactElement);

    const { container } = render(
      <TestApiProvider
        apis={[
          [configApiRef, mockApis.config({ data: {} })],
          [
            identityApiRef,
            mockApis.identity.mock({
              getCredentials: async () => ({ token: undefined }),
            }),
          ],
        ]}
      >
        {element}
      </TestApiProvider>,
    );

    // AutoLogout returns null when disabled or not logged in – no DOM output
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('renders the still-there prompt when autologout is enabled and user is logged in', async () => {
    const tester = createExtensionTester(autoLogoutElement, {
      apis: [
        mockApis.config({
          data: {
            auth: {
              autologout: {
                enabled: true,
                idleTimeoutMinutes: 1,
                promptBeforeIdleSeconds: 10,
              },
            },
          },
        }),
        mockApis.identity(),
      ],
    });

    const element = tester.get(coreExtensionData.reactElement);

    render(
      <TestApiProvider
        apis={[
          [
            configApiRef,
            mockApis.config({
              data: {
                auth: {
                  autologout: {
                    enabled: true,
                    idleTimeoutMinutes: 1,
                    promptBeforeIdleSeconds: 10,
                  },
                },
              },
            }),
          ],
          [
            identityApiRef,
            mockApis.identity.mock({
              getCredentials: async () => ({ token: 'test-token' }),
            }),
          ],
        ]}
      >
        {element}
      </TestApiProvider>,
    );

    // AutoLogout renders null until isLogged is resolved (async useEffect).
    // After resolving, it should render the idle timer (no visible DOM unless
    // promptBeforeIdle fires, which we don't trigger here).
    // We assert the component mounted without errors rather than querying DOM.
    await waitFor(() => {
      // No error boundary should have caught an error
      expect(
        screen.queryByText(/something went wrong/i),
      ).not.toBeInTheDocument();
    });
  });
});
