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

import { render, screen } from '@testing-library/react';
import { TestApiProvider } from '@backstage/test-utils';
import { notificationsApiRef } from '@backstage/plugin-notifications';
import { SidebarNotifications } from './SidebarNotifications';

jest.mock('@backstage/plugin-notifications', () => ({
  ...jest.requireActual('@backstage/plugin-notifications'),
  NotificationsSidebarItem: () => <div data-testid="notifications-item" />,
}));

const mockNotificationsApi = {} as any;

describe('SidebarNotifications', () => {
  it('renders the notifications item when the notifications API is available', () => {
    render(
      <TestApiProvider apis={[[notificationsApiRef, mockNotificationsApi]]}>
        <SidebarNotifications />
      </TestApiProvider>,
    );
    expect(screen.getByTestId('notifications-item')).toBeInTheDocument();
  });

  it('renders nothing when the notifications API is not available', () => {
    render(
      <TestApiProvider apis={[]}>
        <SidebarNotifications />
      </TestApiProvider>,
    );
    expect(screen.queryByTestId('notifications-item')).not.toBeInTheDocument();
  });
});
