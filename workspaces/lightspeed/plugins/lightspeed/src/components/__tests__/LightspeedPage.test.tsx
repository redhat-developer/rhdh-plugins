/*
 * Copyright 2024 The Backstage Authors
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

import { IdentityApi, identityApiRef } from '@backstage/core-plugin-api';
import { usePermission } from '@backstage/plugin-permission-react';
import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';

import { screen, waitFor } from '@testing-library/react';

import { LightspeedPage } from '../LightspeedPage';

jest.mock('../LightSpeedChat', () => ({
  LightspeedChat: () => <>LightspeedChat</>,
}));

jest.mock('@backstage/plugin-permission-react', () => ({
  usePermission: jest.fn(),
  RequirePermission: jest.fn(),
}));

const identityApi = {
  async getCredentials() {
    return { token: 'test-token' };
  },
} as IdentityApi;

jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  makeStyles: () => () => {
    return {
      container: 'container',
    };
  },
}));

jest.mock('../../hooks/useAllModels', () => ({
  useAllModels: jest.fn().mockResolvedValue({
    data: [],
  }),
}));

const mockUsePermission = usePermission as jest.MockedFunction<
  typeof usePermission
>;

describe('LightspeedPage', () => {
  it('should not display chatbot if permission checks are in loading phase', async () => {
    mockUsePermission.mockReturnValue({ loading: true, allowed: true });

    await renderInTestApp(
      <TestApiProvider apis={[[identityApiRef, identityApi]]}>
        <LightspeedPage />
      </TestApiProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByText('LightspeedChat')).not.toBeInTheDocument();
    });
  });

  it('should display permission required alert', async () => {
    mockUsePermission.mockReturnValue({ loading: false, allowed: false });

    await renderInTestApp(
      <TestApiProvider apis={[[identityApiRef, identityApi]]}>
        <LightspeedPage />
      </TestApiProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Permission required')).toBeInTheDocument();
    });
  });

  it('should display lightspeed chatbot', async () => {
    mockUsePermission.mockReturnValue({ loading: false, allowed: true });

    await renderInTestApp(
      <TestApiProvider apis={[[identityApiRef, identityApi]]}>
        <LightspeedPage />
      </TestApiProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('LightspeedChat')).toBeInTheDocument();
    });
  });
});
