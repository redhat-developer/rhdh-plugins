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

import React from 'react';

import {
  renderInTestApp,
  TestApiProvider,
} from '@backstage/frontend-test-utils';

import { NotificationButton } from './NotificationButton';

describe('NotificationButton', () => {
  it('renders a button', async () => {
    const { getByRole } = await renderInTestApp(
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
  });
});
