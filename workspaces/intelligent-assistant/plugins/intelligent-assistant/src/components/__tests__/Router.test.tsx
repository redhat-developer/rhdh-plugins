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

import { Route, Routes } from 'react-router-dom';

import { configApiRef } from '@backstage/core-plugin-api';
import { usePermission } from '@backstage/plugin-permission-react';
import {
  mockApis,
  renderInTestApp,
  TestApiProvider,
} from '@backstage/test-utils';

import { screen, waitFor } from '@testing-library/react';

import { LIGHTSPEED_PATH } from '../../const';
import { Router } from '../Router';

const IntelligentAssistantRoutes = () => (
  <Routes>
    <Route path={`${LIGHTSPEED_PATH}/*`} element={<Router />} />
  </Routes>
);

jest.mock('../LightspeedPage', () => ({
  LightspeedPage: () => <>LightspeedPage</>,
}));

jest.mock('@backstage/plugin-permission-react', () => ({
  usePermission: jest.fn(),
}));

const mockUsePermission = usePermission as jest.MockedFunction<
  typeof usePermission
>;

const configApi = mockApis.config({
  data: {
    'intelligent-assistant.notebooks.enabled': true,
  },
});

describe('Router', () => {
  beforeEach(() => {
    mockUsePermission.mockImplementation(({ permission }) => {
      if (permission.name === 'intelligent-assistant.chat') {
        return { loading: false, allowed: true };
      }
      if (permission.name === 'intelligent-assistant.notebooks') {
        return { loading: false, allowed: true };
      }
      return { loading: false, allowed: false };
    });
  });

  it('redirects unknown paths to the plugin root when chat is allowed', async () => {
    await renderInTestApp(
      <TestApiProvider apis={[[configApiRef, configApi]]}>
        <IntelligentAssistantRoutes />
      </TestApiProvider>,
      { routeEntries: [`${LIGHTSPEED_PATH}/sdc`] },
    );

    await waitFor(() => {
      expect(screen.getByText('LightspeedPage')).toBeInTheDocument();
    });
  });

  it('shows 404 for unknown paths when chat is denied', async () => {
    mockUsePermission.mockImplementation(({ permission }) => {
      if (permission.name === 'intelligent-assistant.notebooks') {
        return { loading: false, allowed: true };
      }
      return { loading: false, allowed: false };
    });

    await renderInTestApp(
      <TestApiProvider apis={[[configApiRef, configApi]]}>
        <IntelligentAssistantRoutes />
      </TestApiProvider>,
      { routeEntries: [`${LIGHTSPEED_PATH}/sdc`] },
    );

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent(
        'ERROR 404: Page not found',
      );
    });
  });
});
