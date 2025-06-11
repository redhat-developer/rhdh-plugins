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
  configApiRef,
  IdentityApi,
  identityApiRef,
} from '@backstage/core-plugin-api';
import { usePermission } from '@backstage/plugin-permission-react';
import { mockApis, TestApiProvider } from '@backstage/test-utils';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';

import FileAttachmentContextProvider from '../AttachmentContext';
import { LightspeedChat } from '../LightSpeedChat';

const identityApi = {
  async getCredentials() {
    return { token: 'test-token' };
  },
  getBackstageIdentity: jest
    .fn()
    .mockReturnValue({ userEntityRef: 'user:test' }),
} as unknown as IdentityApi;

// Create a query client with no retries for test purposes
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      experimental_prefetchInRender: true,
    },
  },
});

jest.mock('@backstage/plugin-permission-react', () => ({
  usePermission: jest.fn(),
  RequirePermission: jest.fn(),
}));

jest.mock('../../hooks/useConversations', () => ({
  useConversations: jest.fn().mockReturnValue({
    data: [],
    isRefetching: false,
    isLoading: false,
  }),
}));
jest.mock('../../hooks/useDeleteConversation', () => ({
  useDeleteConversation: jest.fn().mockResolvedValue({
    data: [],
  }),
}));

jest.mock('../../hooks/useConversationMessages', () => ({
  useConversationMessages: jest.fn().mockReturnValue({
    conversationMessages: [],
  }),
}));

jest.mock('@patternfly/chatbot', () => {
  const actual = jest.requireActual('@patternfly/chatbot');
  return {
    ...actual,
    MessageBox: () => <>MessageBox</>,
  };
});

const mockUsePermission = usePermission as jest.MockedFunction<
  typeof usePermission
>;

const configAPi = mockApis.config({});

const setupLightspeedChat = () => (
  <TestApiProvider
    apis={[
      [identityApiRef, identityApi],
      [configApiRef, configAPi],
    ]}
  >
    <FileAttachmentContextProvider>
      <QueryClientProvider client={queryClient}>
        <LightspeedChat
          selectedModel="granite"
          profileLoading={false}
          handleSelectedModel={() => {}}
          models={[]}
          avatar="test"
          userName="user:test"
        />
      </QueryClientProvider>
    </FileAttachmentContextProvider>
  </TestApiProvider>
);

describe('LightspeedChat', () => {
  beforeEach(() => {
    mockUsePermission.mockReturnValue({ loading: true, allowed: true });
  });
  const localStorageKey = 'lastOpenedConversation';
  const mockUser = 'user:test';

  it('should render lightspeed chat', async () => {
    render(setupLightspeedChat());

    await waitFor(() => {
      expect(screen.getByText('Developer Hub Lightspeed')).toBeInTheDocument();
    });
  });

  it('should not reset localstorage if the conversations are available', async () => {
    jest.mock('../../hooks/useConversations', () => ({
      useConversations: jest.fn().mockReturnValue({
        data: [
          {
            conversation_id: 'test-conversation-id',
            topic_summary: 'Greetings',
            last_message_timestamp: 1749023603.806369,
          },
        ],
        isRefetching: false,
        isLoading: false,
      }),
    }));

    const storedData = JSON.stringify({ [mockUser]: 'test-conversation-id' });
    localStorage.setItem(localStorageKey, storedData);

    render(setupLightspeedChat());

    await waitFor(() => {
      expect(screen.getByText('Developer Hub Lightspeed')).toBeInTheDocument();

      expect(screen.queryByText('New chat')).not.toBeInTheDocument();
      expect(JSON.parse(localStorage.getItem(localStorageKey)!)).toEqual({});
    });
  });

  it('should reset localstorage if the conversations are empty', async () => {
    const storedData = JSON.stringify({ [mockUser]: 'test-conversation-id' });
    localStorage.setItem(localStorageKey, storedData);

    render(setupLightspeedChat());

    await waitFor(() => {
      expect(screen.getByText('Developer Hub Lightspeed')).toBeInTheDocument();

      expect(screen.queryByText('New chat')).not.toBeInTheDocument();
      expect(JSON.parse(localStorage.getItem(localStorageKey)!)).toEqual({});
    });
  });
});
