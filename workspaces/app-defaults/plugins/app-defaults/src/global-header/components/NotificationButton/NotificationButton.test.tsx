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

import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';

import { NotificationButton } from './NotificationButton';
import { useNotificationCount } from '../../hooks/useNotificationCount';

jest.mock('../../hooks/useNotificationCount', () => ({
  useNotificationCount: jest.fn(),
}));

const mockUseNotificationCount = jest.mocked(useNotificationCount);

describe('NotificationButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render a button when not available', async () => {
    mockUseNotificationCount.mockReturnValue({
      available: false,
      unreadCount: 0,
    });
    const { queryByRole } = await renderInTestApp(
      <TestApiProvider apis={[]}>
        <NotificationButton />
      </TestApiProvider>,
    );
    expect(queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders a button without unread count when available but unread count is 0', async () => {
    mockUseNotificationCount.mockReturnValue({
      available: true,
      unreadCount: 0,
    });
    const { getByRole, queryByRole } = await renderInTestApp(
      <TestApiProvider apis={[]}>
        <NotificationButton />
      </TestApiProvider>,
    );
    expect(getByRole('link')).toBeInTheDocument();
    expect(getByRole('link').getAttribute('aria-label')).toEqual(
      'Notifications',
    );
    expect(getByRole('link').getAttribute('href')).toEqual('/notifications');
    expect(getByRole('link').getAttribute('target')).not.toEqual('_blank');
    expect(queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders a button with unread count when available and unread count is greater than 0', async () => {
    mockUseNotificationCount.mockReturnValue({
      available: true,
      unreadCount: 5,
    });
    const { getByRole, getByText } = await renderInTestApp(
      <TestApiProvider apis={[]}>
        <NotificationButton />
      </TestApiProvider>,
    );
    expect(getByRole('link')).toBeInTheDocument();
    expect(getByText('5')).toBeInTheDocument();
  });
});
