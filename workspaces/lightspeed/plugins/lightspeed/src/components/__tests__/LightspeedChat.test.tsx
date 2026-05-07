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
import { MemoryRouter } from 'react-router-dom';

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
import { notebooksApiRef } from '../../api/notebooksApi';
import { useConversations, useNotebookSessions } from '../../hooks';
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

jest.mock('../../hooks/notebooks/useNotebookSessions', () => ({
  useNotebookSessions: jest.fn().mockReturnValue({
    data: [],
    refetch: jest.fn(),
  }),
}));

jest.mock('../../hooks/notebooks/useNotebookSession', () => ({
  useNotebookSession: jest.fn().mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
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

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockUseConversations = useConversations as jest.MockedFunction<
  typeof useConversations
>;
const mockUseNotebookSessions = useNotebookSessions as jest.Mock;
const mockUsePermission = usePermission as jest.MockedFunction<
  typeof usePermission
>;
const mockUseLightspeedDrawerContext =
  useLightspeedDrawerContext as jest.MockedFunction<
    typeof useLightspeedDrawerContext
  >;

const configAPi = mockApis.config({
  data: {
    lightspeed: {
      notebooks: {
        enabled: true,
        queryDefaults: {
          model: 'gpt-4',
          provider_id: 'openai',
        },
      },
    },
  },
});

const mockLightspeedApi = {
  getAllModels: jest.fn().mockResolvedValue([]),
  getConversationMessages: jest.fn().mockResolvedValue([]),
  createMessage: jest.fn().mockResolvedValue(new Response().body),
  deleteConversation: jest.fn().mockResolvedValue({ success: true }),
  renameConversation: jest.fn().mockResolvedValue({ success: true }),
  getConversations: jest.fn().mockResolvedValue([]),
  getNotebookConversationIds: jest.fn().mockResolvedValue([]),
  getFeedbackStatus: jest.fn().mockResolvedValue(false),
  captureFeedback: jest.fn().mockResolvedValue({ response: 'success' }),
  isTopicRestrictionEnabled: jest.fn().mockResolvedValue(false),
  stopMessage: jest.fn().mockResolvedValue({ success: true }),
};

const mockNotebooksApi = {
  createSession: jest.fn().mockResolvedValue({}),
  listSessions: jest.fn().mockResolvedValue([]),
  renameSession: jest.fn().mockResolvedValue(undefined),
  deleteSession: jest.fn().mockResolvedValue(undefined),
  uploadDocument: jest.fn().mockResolvedValue({}),
  listDocuments: jest.fn().mockResolvedValue([]),
  deleteDocument: jest.fn().mockResolvedValue(undefined),
  getDocumentStatus: jest.fn().mockResolvedValue({}),
  querySession: jest.fn().mockResolvedValue({
    read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
  }),
};

const setupLightspeedChat = (initialPath = '/lightspeed') => (
  <MemoryRouter initialEntries={[initialPath]}>
    <TestApiProvider
      apis={[
        [identityApiRef, identityApi],
        [configApiRef, configAPi],
        [lightspeedApiRef, mockLightspeedApi],
        [notebooksApiRef, mockNotebooksApi],
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
  </MemoryRouter>
);

describe('LightspeedChat', () => {
  const mockSetDisplayMode = jest.fn();
  const mockSetCurrentConversationId = jest.fn();

  beforeEach(() => {
    mockUsePermission.mockReturnValue({ loading: false, allowed: true });
    mockUseConversations.mockReturnValue({
      data: [],
      isRefetching: false,
      isLoading: false,
    } as Partial<ReturnType<typeof useConversations>> as ReturnType<
      typeof useConversations
    >);
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
      consumePendingOverlayThreadHandoff: jest.fn(() => false),
      shellViewTab: 0,
      setShellViewTab: jest.fn(),
    });

    localStorage.clear();
    jest.clearAllMocks();
    mockNavigate.mockClear();
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
    } as Partial<ReturnType<typeof useConversations>> as ReturnType<
      typeof useConversations
    >);

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

  describe('notebook updated labels', () => {
    const renderNotebooksTab = async () => {
      const user = userEvent.setup({
        advanceTimers: jest.advanceTimersByTime,
      });
      render(setupLightspeedChat());
      await waitFor(() => {
        expect(screen.getByText('Developer Lightspeed')).toBeInTheDocument();
      });
      const notebooksTab = screen.getByRole('tab', { name: 'Notebooks' });
      await user.click(notebooksTab);
      act(() => {
        jest.runOnlyPendingTimers();
      });
      await waitFor(() => {
        expect(screen.getByText('My Notebooks')).toBeInTheDocument();
      });
    };

    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2026-03-06T12:00:00.000Z'));
      mockUseNotebookSessions.mockReturnValue({
        data: [
          {
            session_id: 'today',
            user_id: 'user:test',
            name: 'Today Notebook',
            updated_at: '2026-03-06T02:00:00.000Z',
            created_at: '2026-03-06T02:00:00.000Z',
          },
          {
            session_id: 'yesterday',
            user_id: 'user:test',
            name: 'Yesterday Notebook',
            updated_at: '2026-03-05T02:00:00.000Z',
            created_at: '2026-03-05T02:00:00.000Z',
          },
          {
            session_id: 'days',
            user_id: 'user:test',
            name: 'Days Notebook',
            updated_at: '2026-03-03T02:00:00.000Z',
            created_at: '2026-03-03T02:00:00.000Z',
          },
          {
            session_id: 'invalid',
            user_id: 'user:test',
            name: 'Invalid Notebook',
            updated_at: 'not-a-date',
            created_at: '2026-03-01T02:00:00.000Z',
          },
        ],
        refetch: jest.fn(),
      });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('renders updated labels based on date difference', async () => {
      await renderNotebooksTab();

      expect(screen.getByText('Updated today')).toBeInTheDocument();
      expect(screen.getByText('Updated 1 day ago')).toBeInTheDocument();
      expect(screen.getByText('Updated 3 days ago')).toBeInTheDocument();
      expect(screen.getByText('not-a-date')).toBeInTheDocument();
    });
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
      } as Partial<ReturnType<typeof useConversations>> as ReturnType<
        typeof useConversations
      >);
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
      } as Partial<ReturnType<typeof useConversations>> as ReturnType<
        typeof useConversations
      >);

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

    it('should call setDisplayMode with default when leaving fullscreen from notebooks', async () => {
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
        consumePendingOverlayThreadHandoff: jest.fn(() => false),
        shellViewTab: 1,
        setShellViewTab: jest.fn(),
      });

      render(setupLightspeedChat('/lightspeed/notebooks'));

      await waitFor(() => {
        expect(screen.getByText('My Notebooks')).toBeInTheDocument();
      });

      const settingsButton = screen.getByLabelText('Chatbot options');
      await userEvent.click(settingsButton);

      await waitFor(() => {
        expect(screen.getByText('Overlay')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Overlay'));

      expect(mockSetDisplayMode).toHaveBeenCalledWith(
        ChatbotDisplayMode.default,
      );
    });

    it('should not render Chat/Notebooks tabs in overlay mode', async () => {
      mockUseLightspeedDrawerContext.mockReturnValue({
        isChatbotActive: true,
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
        consumePendingOverlayThreadHandoff: jest.fn(() => false),
        shellViewTab: 0,
        setShellViewTab: jest.fn(),
      });

      render(setupLightspeedChat());

      await waitFor(() => {
        expect(screen.getByLabelText('Chatbot options')).toBeInTheDocument();
      });

      expect(
        screen.queryByRole('tab', { name: 'Chat' }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('tab', { name: 'Notebooks' }),
      ).not.toBeInTheDocument();
    });

    it('should not render Chat/Notebooks tabs in docked mode', async () => {
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
        consumePendingOverlayThreadHandoff: jest.fn(() => false),
        shellViewTab: 0,
        setShellViewTab: jest.fn(),
      });

      render(setupLightspeedChat());

      await waitFor(() => {
        expect(screen.getByLabelText('Chatbot options')).toBeInTheDocument();
      });

      expect(
        screen.queryByRole('tab', { name: 'Chat' }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('tab', { name: 'Notebooks' }),
      ).not.toBeInTheDocument();
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
        consumePendingOverlayThreadHandoff: jest.fn(() => false),
        shellViewTab: 0,
        setShellViewTab: jest.fn(),
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
        consumePendingOverlayThreadHandoff: jest.fn(() => false),
        shellViewTab: 0,
        setShellViewTab: jest.fn(),
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
        consumePendingOverlayThreadHandoff: jest.fn(() => false),
        shellViewTab: 0,
        setShellViewTab: jest.fn(),
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

  describe('notebooks permission denied', () => {
    beforeEach(() => {
      mockUsePermission.mockImplementation((args: any) => {
        if (args.permission.name === 'lightspeed.notebooks.use') {
          return { loading: false, allowed: false };
        }
        return { loading: false, allowed: true };
      });
    });

    it('should show permission required state when notebooks permission is denied', async () => {
      render(setupLightspeedChat());

      await waitFor(() => {
        expect(screen.getByText('Developer Lightspeed')).toBeInTheDocument();
      });

      const notebooksTab = screen.getByRole('tab', { name: 'Notebooks' });
      await userEvent.click(notebooksTab);

      await waitFor(() => {
        expect(screen.getByText('Missing permissions')).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: 'Go back' }),
        ).toBeInTheDocument();
      });
    });

    it('should navigate back to chat tab when Go back is clicked', async () => {
      render(setupLightspeedChat());

      await waitFor(() => {
        expect(screen.getByText('Developer Lightspeed')).toBeInTheDocument();
      });

      const notebooksTab = screen.getByRole('tab', { name: 'Notebooks' });
      await userEvent.click(notebooksTab);

      await waitFor(() => {
        expect(screen.getByText('Missing permissions')).toBeInTheDocument();
      });

      const goBackButton = screen.getByRole('button', { name: 'Go back' });
      await userEvent.click(goBackButton);

      await waitFor(() => {
        expect(
          screen.queryByText('Missing permissions'),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('notebook tab routing', () => {
    beforeEach(() => {
      mockUsePermission.mockReturnValue({ loading: false, allowed: true });
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
        consumePendingOverlayThreadHandoff: jest.fn(() => false),
        shellViewTab: 0,
        setShellViewTab: jest.fn(),
      });
    });

    it('should initialize to chat tab when path is /lightspeed', async () => {
      render(setupLightspeedChat('/lightspeed'));

      await waitFor(() => {
        expect(screen.getByText('Developer Lightspeed')).toBeInTheDocument();
      });

      const chatTab = screen.getByRole('tab', { name: 'Chat' });
      expect(chatTab).toHaveAttribute('aria-selected', 'true');
      expect(
        screen.getByRole('button', { name: 'Chat history menu' }),
      ).toBeInTheDocument();
    });

    it('redirects /lightspeed to /lightspeed/notebooks in fullscreen when shellViewTab is 1', async () => {
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
        consumePendingOverlayThreadHandoff: jest.fn(() => false),
        shellViewTab: 1,
        setShellViewTab: jest.fn(),
      });

      render(setupLightspeedChat('/lightspeed'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/lightspeed/notebooks', {
          replace: true,
        });
      });
    });

    it('should initialize to notebooks tab when path is /lightspeed/notebooks', async () => {
      render(setupLightspeedChat('/lightspeed/notebooks'));

      await waitFor(() => {
        expect(screen.getByText('My Notebooks')).toBeInTheDocument();
      });

      const notebooksTab = screen.getByRole('tab', { name: 'Notebooks' });
      expect(notebooksTab).toHaveAttribute('aria-selected', 'true');
      expect(
        screen.queryByRole('button', { name: 'Chat history menu' }),
      ).not.toBeInTheDocument();
    });

    it('should navigate to /lightspeed/notebooks when clicking the Notebooks tab', async () => {
      render(setupLightspeedChat('/lightspeed'));

      await waitFor(() => {
        expect(screen.getByText('Developer Lightspeed')).toBeInTheDocument();
      });

      const notebooksTab = screen.getByRole('tab', { name: 'Notebooks' });
      await userEvent.click(notebooksTab);

      expect(mockNavigate).toHaveBeenCalledWith('/lightspeed/notebooks');
    });

    it('should navigate to /lightspeed when clicking Chat tab from notebooks view', async () => {
      render(setupLightspeedChat('/lightspeed/notebooks'));

      await waitFor(() => {
        expect(screen.getByText('My Notebooks')).toBeInTheDocument();
      });

      const chatTab = screen.getByRole('tab', { name: 'Chat' });
      await userEvent.click(chatTab);

      expect(mockNavigate).toHaveBeenCalledWith('/lightspeed');
    });

    it('should navigate to conversation URL when switching to chat tab with an active conversation', async () => {
      mockUseLightspeedDrawerContext.mockReturnValue({
        isChatbotActive: false,
        toggleChatbot: jest.fn(),
        displayMode: ChatbotDisplayMode.embedded,
        setDisplayMode: mockSetDisplayMode,
        drawerWidth: 500,
        setDrawerWidth: jest.fn(),
        currentConversationId: 'conv-123',
        setCurrentConversationId: mockSetCurrentConversationId,
        draftMessage: '',
        setDraftMessage: jest.fn(),
        draftFileContents: [],
        setDraftFileContents: jest.fn(),
        consumePendingOverlayThreadHandoff: jest.fn(() => false),
        shellViewTab: 0,
        setShellViewTab: jest.fn(),
      });

      render(setupLightspeedChat('/lightspeed/notebooks'));

      await waitFor(() => {
        expect(screen.getByText('My Notebooks')).toBeInTheDocument();
      });

      const chatTab = screen.getByRole('tab', { name: 'Chat' });
      await userEvent.click(chatTab);

      expect(mockNavigate).toHaveBeenCalledWith(
        '/lightspeed/conversation/conv-123',
      );
    });
  });
});
