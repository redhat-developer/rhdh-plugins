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

import { IdentityApi, identityApiRef } from '@backstage/core-plugin-api';
import { usePermission } from '@backstage/plugin-permission-react';
import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';

import { renderHook, screen, waitFor } from '@testing-library/react';

import { lightspeedApiRef } from '../../api/api';
import { useTranslation } from '../../hooks/useTranslation';
import { mockUseTranslation } from '../../test-utils/mockTranslations';
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

const mockLightspeedApi = {
  getAllModels: jest.fn().mockResolvedValue([]),
  getConversationMessages: jest.fn().mockResolvedValue([]),
  createMessage: jest.fn().mockResolvedValue(new Response().body),
  deleteConversation: jest.fn().mockResolvedValue({ success: true }),
  getConversations: jest.fn().mockResolvedValue([]),
  getFeedbackStatus: jest.fn().mockResolvedValue(false),
  captureFeedback: jest.fn().mockResolvedValue({ response: 'success' }),
  isTopicRestrictionEnabled: jest.fn().mockResolvedValue(false),
};

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

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => mockUseTranslation()),
}));

const mockUsePermission = usePermission as jest.MockedFunction<
  typeof usePermission
>;

describe('LightspeedPage', () => {
  it('should not display chatbot if permission checks are in loading phase', async () => {
    mockUsePermission.mockReturnValue({ loading: true, allowed: true });

    await renderInTestApp(
      <TestApiProvider
        apis={[
          [identityApiRef, identityApi],
          [lightspeedApiRef, mockLightspeedApi],
        ]}
      >
        <LightspeedPage />
      </TestApiProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByText('LightspeedChat')).not.toBeInTheDocument();
    });
  });

  it('should display missing permissions alert', async () => {
    mockUsePermission.mockReturnValue({ loading: false, allowed: false });

    await renderInTestApp(
      <TestApiProvider
        apis={[
          [identityApiRef, identityApi],
          [lightspeedApiRef, mockLightspeedApi],
        ]}
      >
        <LightspeedPage />
      </TestApiProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Missing permissions')).toBeInTheDocument();
    });
  });

  it('should display lightspeed chatbot', async () => {
    mockUsePermission.mockReturnValue({ loading: false, allowed: true });

    await renderInTestApp(
      <TestApiProvider
        apis={[
          [identityApiRef, identityApi],
          [lightspeedApiRef, mockLightspeedApi],
        ]}
      >
        <LightspeedPage />
      </TestApiProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('LightspeedChat')).toBeInTheDocument();
    });
  });

  it('should translate permission messages correctly', () => {
    const { result } = renderHook(() => useTranslation());

    expect(result.current.t('permission.required.title')).toBe(
      'Missing permissions',
    );
    expect(result.current.t('permission.required.description')).toBe(
      'To view lightspeed plugin, contact your administrator to give the <b>lightspeed.chat.read</b> and <b>lightspeed.chat.create</b> permissions.',
    );
  });

  it('should translate conversation messages correctly', () => {
    const { result } = renderHook(() => useTranslation());

    expect(result.current.t('conversation.history.confirm.title')).toBe(
      'Delete chat?',
    );
    expect(result.current.t('conversation.history.confirm.message')).toBe(
      "You'll no longer see this chat here. This will also delete related activity like prompts, responses, and feedback from your Lightspeed Activity.",
    );
  });
});
