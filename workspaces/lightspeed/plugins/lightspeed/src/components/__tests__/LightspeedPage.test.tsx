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
  beforeEach(() => {
    localStorage.clear();
  });

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

    expect(result.current.t('conversation.delete.confirm.title')).toBe(
      'Delete chat?',
    );
    expect(result.current.t('conversation.delete.confirm.message')).toBe(
      "You'll no longer see this chat here. This will also delete related activity like prompts, responses, and feedback from your Lightspeed Activity.",
    );
  });

  describe('localStorage model persistence', () => {
    const LAST_SELECTED_MODEL_KEY = 'lastSelectedModel';
    const mockModels = [
      {
        provider_resource_id: 'model-1',
        provider_id: 'provider-1',
        model_type: 'llm',
      },
      {
        provider_resource_id: 'model-2',
        provider_id: 'provider-2',
        model_type: 'llm',
      },
      {
        provider_resource_id: 'model-3',
        provider_id: 'provider-3',
        model_type: 'llm',
      },
    ];

    beforeEach(() => {
      mockUsePermission.mockReturnValue({ loading: false, allowed: true });
      const { useAllModels } = require('../../hooks/useAllModels');
      (useAllModels as jest.Mock).mockReturnValue({
        data: mockModels,
        isLoading: false,
        isError: false,
        error: null,
      });
    });

    it('should load last selected model from localStorage on mount', async () => {
      const storedData = JSON.stringify({
        model: 'model-2',
        provider: 'provider-2',
      });
      localStorage.setItem(LAST_SELECTED_MODEL_KEY, storedData);

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

      // Verify the stored model was loaded
      const storedValue = localStorage.getItem(LAST_SELECTED_MODEL_KEY);
      expect(storedValue).toBe(storedData);
    });

    it('should fallback to first model if stored model does not exist', async () => {
      const storedData = JSON.stringify({
        model: 'non-existent-model',
        provider: 'non-existent-provider',
      });
      localStorage.setItem(LAST_SELECTED_MODEL_KEY, storedData);

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

      // Should fallback to first model and save it
      await waitFor(() => {
        const storedValue = localStorage.getItem(LAST_SELECTED_MODEL_KEY);
        const parsed = storedValue ? JSON.parse(storedValue) : null;
        expect(parsed?.model).toBe('model-1');
        expect(parsed?.provider).toBe('provider-1');
      });
    });

    it('should save model to localStorage when model is selected', async () => {
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

      // Should save first model by default
      await waitFor(() => {
        const storedValue = localStorage.getItem(LAST_SELECTED_MODEL_KEY);
        const parsed = storedValue ? JSON.parse(storedValue) : null;
        expect(parsed?.model).toBe('model-1');
        expect(parsed?.provider).toBe('provider-1');
      });
    });

    it('should handle localStorage errors gracefully when loading', async () => {
      // Mock localStorage.getItem to throw an error for the specific key
      const originalGetItem = localStorage.getItem;
      const getItemSpy = jest.fn((key: string) => {
        if (key === LAST_SELECTED_MODEL_KEY) {
          throw new Error('localStorage error');
        }
        return originalGetItem.call(localStorage, key);
      });
      localStorage.getItem = getItemSpy;

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

      // Restore before checking localStorage
      localStorage.getItem = originalGetItem;

      // Should still render and fallback to first model (saved after error)
      // This verifies that the component handles the error gracefully
      await waitFor(() => {
        const storedValue = localStorage.getItem(LAST_SELECTED_MODEL_KEY);
        const parsed = storedValue ? JSON.parse(storedValue) : null;
        expect(parsed?.model).toBe('model-1');
        expect(parsed?.provider).toBe('provider-1');
      });
    });

    it('should handle localStorage errors gracefully when saving', async () => {
      // Mock localStorage.setItem to throw an error for the specific key
      const originalSetItem = localStorage.setItem;
      const setItemSpy = jest.fn((key: string, value: string) => {
        if (key === LAST_SELECTED_MODEL_KEY) {
          throw new Error('localStorage setItem error');
        }
        return originalSetItem.call(localStorage, key, value);
      });
      localStorage.setItem = setItemSpy;

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

      // Should still render despite save error
      // This verifies that the component handles the error gracefully
      expect(screen.getByText('LightspeedChat')).toBeInTheDocument();

      // Restore
      localStorage.setItem = originalSetItem;
    });

    it('should use first model when localStorage is empty', async () => {
      localStorage.removeItem(LAST_SELECTED_MODEL_KEY);

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

      // Should save first model
      await waitFor(() => {
        const storedValue = localStorage.getItem(LAST_SELECTED_MODEL_KEY);
        const parsed = storedValue ? JSON.parse(storedValue) : null;
        expect(parsed?.model).toBe('model-1');
        expect(parsed?.provider).toBe('provider-1');
      });
    });
  });
});
