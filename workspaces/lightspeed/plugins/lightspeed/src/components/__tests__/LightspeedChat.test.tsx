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
import {
  configApiRef,
  IdentityApi,
  identityApiRef,
} from '@backstage/core-plugin-api';
import { usePermission } from '@backstage/plugin-permission-react';
import { mockApis, TestApiProvider } from '@backstage/test-utils';

import { ChatbotDisplayMode } from '@patternfly/chatbot';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { lightspeedApiRef } from '../../api/api';
import { useConversations } from '../../hooks';
import { useLightspeedDrawerContext } from '../../hooks/useLightspeedDrawerContext';
import { mockUseTranslation } from '../../test-utils/mockTranslations';
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

jest.mock('../../hooks/useFeedbackActions', () => ({
  useFeedbackActions: jest.fn().mockReturnValue([]),
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

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => mockUseTranslation()),
}));

jest.mock('../../hooks/useLightspeedDrawerContext', () => ({
  useLightspeedDrawerContext: jest.fn(),
}));
jest.mock('../../hooks/usePinnedChatsSettings', () => ({
  usePinnedChatsSettings: jest.fn().mockReturnValue({
    isPinningChatsEnabled: true,
    pinnedChats: [],
    handlePinningChatsToggle: jest.fn(),
    pinChat: jest.fn(),
    unpinChat: jest.fn(),
  }),
}));

jest.mock('../../hooks/useSortSettings', () => ({
  useSortSettings: jest.fn().mockReturnValue({
    selectedSort: 'newest',
    handleSortChange: jest.fn(),
  }),
}));

jest.mock('@patternfly/chatbot', () => {
  const actual = jest.requireActual('@patternfly/chatbot');
  return {
    ...actual,
    MessageBox: () => <>MessageBox</>,
  };
});

const mockUseConversations = useConversations as jest.Mock;
const mockUsePermission = usePermission as jest.MockedFunction<
  typeof usePermission
>;
const mockUseLightspeedDrawerContext =
  useLightspeedDrawerContext as jest.MockedFunction<
    typeof useLightspeedDrawerContext
  >;

const configAPi = mockApis.config({});

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

const setupLightspeedChat = () => (
  <TestApiProvider
    apis={[
      [identityApiRef, identityApi],
      [configApiRef, configAPi],
      [lightspeedApiRef, mockLightspeedApi],
    ]}
  >
    <FileAttachmentContextProvider>
      <QueryClientProvider client={queryClient}>
        <LightspeedChat
          selectedModel="granite"
          profileLoading={false}
          handleSelectedModel={() => {}}
          topicRestrictionEnabled={false}
          selectedProvider="openai"
          models={[]}
          avatar="test"
          userName="user:test"
        />
      </QueryClientProvider>
    </FileAttachmentContextProvider>
  </TestApiProvider>
);

describe('LightspeedChat', () => {
  const mockSetDisplayMode = jest.fn();
  const mockSetCurrentConversationId = jest.fn();

  beforeEach(() => {
    mockUsePermission.mockReturnValue({ loading: true, allowed: true });
    mockUseConversations.mockReturnValue({
      data: [],
      isRefetching: false,
      isLoading: false,
    });
    mockUseLightspeedDrawerContext.mockReturnValue({
      isChatbotActive: false,
      toggleChatbot: jest.fn(),
      displayMode: ChatbotDisplayMode.embedded,
      setDisplayMode: mockSetDisplayMode,
      drawerWidth: 500,
      setDrawerWidth: jest.fn(),
      currentConversationId: undefined,
      setCurrentConversationId: mockSetCurrentConversationId,
      draftMessage: '',
      setDraftMessage: jest.fn(),
      draftFileContents: [],
      setDraftFileContents: jest.fn(),
    });

    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const localStorageKey = 'lastOpenedConversation';
  const mockUser = 'user:test';

  it('should render lightspeed chat', async () => {
    render(setupLightspeedChat());

    await waitFor(() => {
      expect(screen.getByText('Developer Lightspeed')).toBeInTheDocument();
    });
  });

  it('should not reset localstorage if the conversations are available', async () => {
    mockUseConversations.mockReturnValue({
      data: [
        {
          conversation_id: 'test-conversation-id',
          topic_summary: 'Greetings',
          last_message_timestamp: 1749023603.806369,
        },
      ],
      isRefetching: false,
      isLoading: false,
    });

    const storedData = JSON.stringify({ [mockUser]: 'test-conversation-id' });
    localStorage.setItem(localStorageKey, storedData);

    render(setupLightspeedChat());

    await waitFor(() => {
      expect(screen.getByText('Developer Lightspeed')).toBeInTheDocument();

      expect(screen.queryByText('New chat')).toBeInTheDocument();

      expect(JSON.parse(localStorage.getItem(localStorageKey)!)).toEqual({
        'user:test': 'test-conversation-id',
      });
    });
  });

  it('should reset localstorage if the conversations are empty', async () => {
    const initialData = JSON.stringify({ [mockUser]: 'test-conversation-id' });
    localStorage.setItem(localStorageKey, initialData);

    render(setupLightspeedChat());

    await waitFor(() => {
      expect(screen.getByText('Developer Lightspeed')).toBeInTheDocument();

      expect(screen.queryByText('New chat')).not.toBeInTheDocument();
      expect(JSON.parse(localStorage.getItem(localStorageKey)!)).toEqual({});
    });
  });

  it('should set correct accept attribute on file input', async () => {
    render(setupLightspeedChat());

    await userEvent.click(screen.getByRole('button', { name: 'Attach' }));
    const input = screen.getByTestId('attachment-input') as HTMLInputElement;
    expect(input).toHaveAttribute(
      'accept',
      'text/plain,.txt,application/json,.json,application/yaml,.yaml,.yml',
    );
  });

  it('should show an alert when unsupported file types are dropped', async () => {
    render(setupLightspeedChat());

    const fileDropzone = screen.getByText('MessageBox')
      .parentElement as HTMLElement;

    const invalidFile = new File(['dummy'], 'file.pdf', {
      type: 'application/pdf',
    });

    const dataTransfer = {
      files: [invalidFile],
      items: [
        {
          kind: 'file',
          type: 'application/pdf',
          getAsFile: () => invalidFile,
        },
      ],
      types: ['Files'],
    };
    await act(async () => {
      fireEvent.drop(fileDropzone, {
        dataTransfer,
      });
    });

    expect(
      screen.getByText(
        'Unsupported file type. Supported types are: .txt, .yaml, and .json.',
      ),
    ).toBeInTheDocument();
  });

  describe('filterConversations', () => {
    beforeEach(() => {
      mockUseConversations.mockReturnValue({
        data: [
          {
            conversation_id: 'pinned-1',
            topic_summary: 'Pinned Chat One',
            last_message_timestamp: Date.now() / 1000,
          },
          {
            conversation_id: 'pinned-2',
            topic_summary: 'Pinned Chat Two',
            last_message_timestamp: (Date.now() - 1000) / 1000,
          },
          {
            conversation_id: 'recent-1',
            topic_summary: 'Recent Chat One',
            last_message_timestamp: (Date.now() - 2000) / 1000,
          },
          {
            conversation_id: 'recent-2',
            topic_summary: 'Recent Chat Two',
            last_message_timestamp: (Date.now() - 3000) / 1000,
          },
        ],
        isRefetching: false,
        isLoading: false,
      });
    });

    it('should filter conversations by search term and show matching results', async () => {
      render(setupLightspeedChat());

      await waitFor(() => {
        expect(screen.getByText('Developer Lightspeed')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search');
      expect(searchInput).toBeInTheDocument();

      await userEvent.type(searchInput, 'Pinned Chat One');

      expect(searchInput).toHaveValue('Pinned Chat One');
    });

    it('should return empty object when search filters out all items from both sections', async () => {
      render(setupLightspeedChat());

      await waitFor(() => {
        expect(screen.getByText('Developer Lightspeed')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search');

      await userEvent.type(searchInput, 'NonExistentSearchTerm12345');

      expect(searchInput).toHaveValue('NonExistentSearchTerm12345');
    });

    it('should show empty state messages when sections are empty and there were no original items', async () => {
      mockUseConversations.mockReturnValue({
        data: [],
        isRefetching: false,
        isLoading: false,
      });

      render(setupLightspeedChat());

      await waitFor(() => {
        expect(screen.getByText('Developer Lightspeed')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search');
      expect(searchInput).toBeInTheDocument();
    });

    it('should show pinned chats section when pinning is enabled', async () => {
      render(setupLightspeedChat());

      await waitFor(() => {
        expect(screen.getByText('Developer Lightspeed')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search');
      expect(searchInput).toBeInTheDocument();
    });

    it('should not show pinned chats section when pinning is disabled', async () => {
      render(setupLightspeedChat());

      await waitFor(() => {
        expect(screen.getByText('Developer Lightspeed')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search');
      expect(searchInput).toBeInTheDocument();
    });

    it('should return empty object when both sections have search results but are filtered out', async () => {
      render(setupLightspeedChat());

      await waitFor(() => {
        expect(screen.getByText('Developer Lightspeed')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search');

      await userEvent.type(searchInput, 'xyz123nonexistent');

      expect(searchInput).toHaveValue('xyz123nonexistent');
    });
  });

  describe('displayMode selection from settings dropdown', () => {
    it('should open settings dropdown when clicking the settings button', async () => {
      render(setupLightspeedChat());

      const settingsButton = screen.getByLabelText('Chatbot options');
      expect(settingsButton).toBeInTheDocument();

      await userEvent.click(settingsButton);

      // Verify dropdown is open with display mode options
      await waitFor(() => {
        expect(screen.getByText('Display mode')).toBeInTheDocument();
      });
    });

    it('should show all display mode options in the dropdown', async () => {
      render(setupLightspeedChat());

      const settingsButton = screen.getByLabelText('Chatbot options');
      await userEvent.click(settingsButton);

      await waitFor(() => {
        expect(screen.getByText('Display mode')).toBeInTheDocument();
        expect(screen.getByText('Overlay')).toBeInTheDocument();
        expect(screen.getByText('Dock to window')).toBeInTheDocument();
        expect(screen.getByText('Fullscreen')).toBeInTheDocument();
      });
    });

    it('should call setDisplayMode with default when clicking Overlay option', async () => {
      render(setupLightspeedChat());

      const settingsButton = screen.getByLabelText('Chatbot options');
      await userEvent.click(settingsButton);

      await waitFor(() => {
        expect(screen.getByText('Overlay')).toBeInTheDocument();
      });

      const overlayOption = screen.getByText('Overlay');
      await userEvent.click(overlayOption);

      expect(mockSetDisplayMode).toHaveBeenCalledWith(
        ChatbotDisplayMode.default,
      );
    });

    it('should call setDisplayMode with docked when clicking Dock to window option', async () => {
      render(setupLightspeedChat());

      const settingsButton = screen.getByLabelText('Chatbot options');
      await userEvent.click(settingsButton);

      await waitFor(() => {
        expect(screen.getByText('Dock to window')).toBeInTheDocument();
      });

      const dockedOption = screen.getByText('Dock to window');
      await userEvent.click(dockedOption);

      expect(mockSetDisplayMode).toHaveBeenCalledWith(
        ChatbotDisplayMode.docked,
      );
    });

    it('should call setDisplayMode with embedded when clicking Fullscreen option', async () => {
      render(setupLightspeedChat());

      const settingsButton = screen.getByLabelText('Chatbot options');
      await userEvent.click(settingsButton);

      await waitFor(() => {
        expect(screen.getByText('Fullscreen')).toBeInTheDocument();
      });

      const fullscreenOption = screen.getByText('Fullscreen');
      await userEvent.click(fullscreenOption);

      expect(mockSetDisplayMode).toHaveBeenCalledWith(
        ChatbotDisplayMode.embedded,
      );
    });

    it('should show current display mode as selected in full-screen mode', async () => {
      mockUseLightspeedDrawerContext.mockReturnValue({
        isChatbotActive: false,
        toggleChatbot: jest.fn(),
        displayMode: ChatbotDisplayMode.embedded,
        setDisplayMode: mockSetDisplayMode,
        drawerWidth: 500,
        setDrawerWidth: jest.fn(),
        currentConversationId: undefined,
        setCurrentConversationId: mockSetCurrentConversationId,
        draftMessage: '',
        setDraftMessage: jest.fn(),
        draftFileContents: [],
        setDraftFileContents: jest.fn(),
      });

      render(setupLightspeedChat());

      const settingsButton = screen.getByLabelText('Chatbot options');
      await userEvent.click(settingsButton);

      await waitFor(() => {
        expect(screen.getByText('Fullscreen')).toBeInTheDocument();
      });

      const fullscreenOption = screen
        .getByText('Fullscreen')
        .closest('button, li, [role="menuitem"]');
      expect(fullscreenOption).toHaveClass('pf-m-selected');
    });

    it('should show current display mode as selected in docked mode', async () => {
      mockUseLightspeedDrawerContext.mockReturnValue({
        isChatbotActive: true,
        toggleChatbot: jest.fn(),
        displayMode: ChatbotDisplayMode.docked,
        setDisplayMode: mockSetDisplayMode,
        drawerWidth: 500,
        setDrawerWidth: jest.fn(),
        currentConversationId: undefined,
        setCurrentConversationId: mockSetCurrentConversationId,
        draftMessage: '',
        setDraftMessage: jest.fn(),
        draftFileContents: [],
        setDraftFileContents: jest.fn(),
      });

      render(setupLightspeedChat());

      const settingsButton = screen.getByLabelText('Chatbot options');
      await userEvent.click(settingsButton);

      await waitFor(() => {
        expect(screen.getByText('Dock to window')).toBeInTheDocument();
      });

      const dockedOption = screen
        .getByText('Dock to window')
        .closest('button, li, [role="menuitem"]');
      expect(dockedOption).toHaveClass('pf-m-selected');
    });

    it('should show current display mode as selected in overlay mode', async () => {
      mockUseLightspeedDrawerContext.mockReturnValue({
        isChatbotActive: false,
        toggleChatbot: jest.fn(),
        displayMode: ChatbotDisplayMode.default,
        setDisplayMode: mockSetDisplayMode,
        drawerWidth: 500,
        setDrawerWidth: jest.fn(),
        currentConversationId: undefined,
        setCurrentConversationId: mockSetCurrentConversationId,
        draftMessage: '',
        setDraftMessage: jest.fn(),
        draftFileContents: [],
        setDraftFileContents: jest.fn(),
      });

      render(setupLightspeedChat());

      const settingsButton = screen.getByLabelText('Chatbot options');
      await userEvent.click(settingsButton);

      await waitFor(() => {
        expect(screen.getByText('Overlay')).toBeInTheDocument();
      });

      const overlayOption = screen
        .getByText('Overlay')
        .closest('button, li, [role="menuitem"]');
      expect(overlayOption).toHaveClass('pf-m-selected');
    });
  });
});
