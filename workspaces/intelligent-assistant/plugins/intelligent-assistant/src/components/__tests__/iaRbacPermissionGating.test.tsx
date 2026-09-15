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
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { lightspeedApiRef } from '../../api/api';
import { notebooksApiRef } from '../../api/notebooksApi';
import { useConversations, useNotebookSessions } from '../../hooks';
import { useAllModels } from '../../hooks/useAllModels';
import { useIaChatPermission } from '../../hooks/useIaChatPermission';
import { useIaNotebooksPermission } from '../../hooks/useIaNotebooksPermission';
import { useLightspeedDrawerContext } from '../../hooks/useLightspeedDrawerContext';
import { mockUseTranslation } from '../../test-utils/mockTranslations';
import FileAttachmentContextProvider from '../AttachmentContext';
import { LightspeedChat } from '../LightSpeedChat';
import { LightspeedChatContainer } from '../LightspeedChatContainer';
import { LightspeedFAB } from '../LightspeedFAB';
import { NotebookStreamProvider } from '../notebooks/NotebookStreamProvider';

type IaPermissionMatrix = {
  chat: boolean;
  notebooks: boolean;
  mcp: boolean;
};

const SCENARIOS: Record<string, IaPermissionMatrix> = {
  '1-both-chat-and-notebooks': { chat: true, notebooks: true, mcp: false },
  '2-chat-only': { chat: true, notebooks: false, mcp: false },
  '3-notebooks-only': { chat: false, notebooks: true, mcp: false },
  '4-no-permission': { chat: false, notebooks: false, mcp: false },
  '5-mcp-settings': { chat: true, notebooks: true, mcp: true },
  '6-mcp-denied': { chat: true, notebooks: true, mcp: false },
};

const PERMISSION_NAMES = {
  chat: 'intelligent-assistant.chat',
  notebooks: 'intelligent-assistant.notebooks',
  mcp: 'intelligent-assistant.mcp.tools',
} as const;

const identityApi = {
  async getCredentials() {
    return { token: 'test-token' };
  },
  getBackstageIdentity: jest
    .fn()
    .mockReturnValue({ userEntityRef: 'user:test' }),
  getProfileInfo: jest.fn().mockResolvedValue({ displayName: 'Test User' }),
} as unknown as IdentityApi;

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

jest.mock('../../hooks/useIaChatPermission', () => ({
  useIaChatPermission: jest.fn(),
}));

jest.mock('../../hooks/useIaNotebooksPermission', () => ({
  useIaNotebooksPermission: jest.fn(),
}));

jest.mock('../../hooks/useAllModels', () => ({
  useAllModels: jest.fn(),
}));

jest.mock('../../hooks/useQuestionValidation', () => ({
  useTopicRestrictionStatus: jest.fn().mockReturnValue({ data: false }),
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
  useDeleteConversation: jest.fn().mockResolvedValue({ data: [] }),
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

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

const mockUsePermission = usePermission as jest.MockedFunction<
  typeof usePermission
>;
const mockUseIaChatPermission = useIaChatPermission as jest.MockedFunction<
  typeof useIaChatPermission
>;
const mockUseIaNotebooksPermission =
  useIaNotebooksPermission as jest.MockedFunction<
    typeof useIaNotebooksPermission
  >;
const mockUseAllModels = useAllModels as jest.Mock;
const mockUseConversations = useConversations as jest.Mock;
const mockUseNotebookSessions = useNotebookSessions as jest.Mock;
const mockUseLightspeedDrawerContext =
  useLightspeedDrawerContext as jest.MockedFunction<
    typeof useLightspeedDrawerContext
  >;

const configApi = mockApis.config({
  data: {
    'intelligent-assistant': {
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

function mockPermissions(matrix: IaPermissionMatrix) {
  mockUsePermission.mockImplementation(({ permission }: any) => {
    const name = permission.name as string;
    if (name === PERMISSION_NAMES.chat) {
      return { loading: false, allowed: matrix.chat };
    }
    if (name === PERMISSION_NAMES.notebooks) {
      return { loading: false, allowed: matrix.notebooks };
    }
    if (name === PERMISSION_NAMES.mcp) {
      return { loading: false, allowed: matrix.mcp };
    }
    return { loading: false, allowed: false };
  });

  mockUseIaChatPermission.mockReturnValue({
    loading: false,
    allowed: matrix.chat,
  });
  mockUseIaNotebooksPermission.mockReturnValue({
    loading: false,
    allowed: matrix.notebooks,
  });
}

const fabContextValue = {
  isChatbotActive: false,
  toggleChatbot: jest.fn(),
  displayMode: ChatbotDisplayMode.default,
  setDisplayMode: jest.fn(),
  drawerWidth: 500,
  setDrawerWidth: jest.fn(),
  currentConversationId: undefined,
  setCurrentConversationId: jest.fn(),
  draftMessage: '',
  setDraftMessage: jest.fn(),
  draftFileContents: [],
  setDraftFileContents: jest.fn(),
  shellViewTab: 0,
  setShellViewTab: jest.fn(),
  activeNotebookId: undefined,
  setActiveNotebookId: jest.fn(),
};

const chatDrawerContextValue = {
  isChatbotActive: false,
  toggleChatbot: jest.fn(),
  displayMode: ChatbotDisplayMode.embedded,
  setDisplayMode: jest.fn(),
  drawerWidth: 500,
  setDrawerWidth: jest.fn(),
  currentConversationId: undefined,
  setCurrentConversationId: jest.fn(),
  draftMessage: '',
  setDraftMessage: jest.fn(),
  draftFileContents: [],
  setDraftFileContents: jest.fn(),
  consumePendingOverlayThreadHandoff: jest.fn(() => false),
  shellViewTab: 0,
  setShellViewTab: jest.fn(),
  activeNotebookId: undefined,
  setActiveNotebookId: jest.fn(),
};

const setupLightspeedChat = (initialPath = '/intelligent-assistant') => (
  <MemoryRouter initialEntries={[initialPath]}>
    <TestApiProvider
      apis={[
        [identityApiRef, identityApi],
        [configApiRef, configApi],
        [lightspeedApiRef, mockLightspeedApi],
        [notebooksApiRef, mockNotebooksApi],
      ]}
    >
      <FileAttachmentContextProvider>
        <QueryClientProvider client={queryClient}>
          <NotebookStreamProvider>
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
          </NotebookStreamProvider>
        </QueryClientProvider>
      </FileAttachmentContextProvider>
    </TestApiProvider>
  </MemoryRouter>
);

const setupLightspeedChatContainer = (
  initialPath = '/intelligent-assistant',
) => (
  <MemoryRouter initialEntries={[initialPath]}>
    <TestApiProvider
      apis={[
        [identityApiRef, identityApi],
        [configApiRef, configApi],
        [lightspeedApiRef, mockLightspeedApi],
        [notebooksApiRef, mockNotebooksApi],
      ]}
    >
      <LightspeedChatContainer />
    </TestApiProvider>
  </MemoryRouter>
);

describe('IA RBAC permission gating scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();

    mockUseAllModels.mockReturnValue({
      data: [
        {
          provider_resource_id: 'model-1',
          provider_id: 'provider-1',
          model_type: 'llm',
        },
      ],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });

    mockUseConversations.mockReturnValue({
      data: [],
      isRefetching: false,
      isLoading: false,
    });

    mockUseNotebookSessions.mockReturnValue({
      data: [],
      refetch: jest.fn(),
    });

    mockUseLightspeedDrawerContext.mockReturnValue(chatDrawerContextValue);
  });

  describe('Scenario 1: both chat and notebooks', () => {
    beforeEach(() => {
      mockPermissions(SCENARIOS['1-both-chat-and-notebooks']);
    });

    it('shows the FAB', () => {
      mockUseLightspeedDrawerContext.mockReturnValue(fabContextValue);
      render(<LightspeedFAB />);

      expect(screen.getByTestId('lightspeed-fab')).toBeInTheDocument();
    });

    it('shows Chat and Notebooks tabs', async () => {
      render(setupLightspeedChat());

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Chat' })).toBeInTheDocument();
        expect(
          screen.getByRole('tab', { name: 'Notebooks' }),
        ).toBeInTheDocument();
      });
    });

    it('enables chat and notebooks data hooks', async () => {
      render(setupLightspeedChat());

      await waitFor(() => {
        expect(mockUseConversations).toHaveBeenCalledWith(true);
        expect(mockUseNotebookSessions).toHaveBeenCalledWith(true);
      });
    });
  });

  describe('Scenario 2: chat only', () => {
    beforeEach(() => {
      mockPermissions(SCENARIOS['2-chat-only']);
    });

    it('shows the FAB', () => {
      mockUseLightspeedDrawerContext.mockReturnValue(fabContextValue);
      render(<LightspeedFAB />);

      expect(screen.getByTestId('lightspeed-fab')).toBeInTheDocument();
    });

    it('hides tabs and shows chat without notebooks', async () => {
      render(setupLightspeedChat());

      await waitFor(() => {
        expect(
          screen.getByText('Developer Hub Intelligent Assistant'),
        ).toBeInTheDocument();
      });

      expect(screen.queryByRole('tab')).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'New chat' }),
      ).toBeInTheDocument();
      expect(
        screen.queryByText('No created notebooks'),
      ).not.toBeInTheDocument();
    });

    it('enables chat hooks and disables notebooks hooks', async () => {
      render(setupLightspeedChat());

      await waitFor(() => {
        expect(mockUseConversations).toHaveBeenCalledWith(true);
        expect(mockUseNotebookSessions).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('Scenario 3: notebooks only', () => {
    beforeEach(() => {
      mockPermissions(SCENARIOS['3-notebooks-only']);
    });

    it('shows the FAB', () => {
      mockUseLightspeedDrawerContext.mockReturnValue(fabContextValue);
      render(<LightspeedFAB />);

      expect(screen.getByTestId('lightspeed-fab')).toBeInTheDocument();
    });

    it('hides tabs and shows notebooks without chat controls', async () => {
      render(setupLightspeedChat('/intelligent-assistant/notebooks'));

      await waitFor(() => {
        expect(
          screen.getByText('Developer Hub Intelligent Assistant'),
        ).toBeInTheDocument();
      });

      expect(screen.queryByRole('tab')).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'New chat' }),
      ).not.toBeInTheDocument();
      expect(screen.getByText('No created notebooks')).toBeInTheDocument();
    });

    it('disables chat hooks and enables notebooks hooks', async () => {
      render(setupLightspeedChat('/intelligent-assistant/notebooks'));

      await waitFor(() => {
        expect(mockUseConversations).toHaveBeenCalledWith(false);
        expect(mockUseNotebookSessions).toHaveBeenCalledWith(true);
      });
    });
  });

  describe('Scenario 4: no permission', () => {
    beforeEach(() => {
      mockPermissions(SCENARIOS['4-no-permission']);
    });

    it('hides the FAB', () => {
      mockUseLightspeedDrawerContext.mockReturnValue(fabContextValue);
      render(<LightspeedFAB />);

      expect(screen.queryByTestId('lightspeed-fab')).not.toBeInTheDocument();
    });

    it('renders nothing from the chat container', async () => {
      const { container } = render(setupLightspeedChatContainer());

      await waitFor(() => {
        expect(container).toBeEmptyDOMElement();
      });
    });
  });

  describe('Scenario 5: MCP settings allowed', () => {
    beforeEach(() => {
      mockPermissions(SCENARIOS['5-mcp-settings']);
    });

    it('shows MCP settings in the header menu', async () => {
      render(setupLightspeedChat());

      await waitFor(() => {
        expect(
          screen.getByText('Developer Hub Intelligent Assistant'),
        ).toBeInTheDocument();
      });

      await userEvent.click(screen.getByLabelText('Options'));
      expect(screen.getByText('MCP settings')).toBeInTheDocument();
    });
  });

  describe('Scenario 6: MCP denied', () => {
    beforeEach(() => {
      mockPermissions(SCENARIOS['6-mcp-denied']);
    });

    it('hides MCP settings from the header menu', async () => {
      render(setupLightspeedChat());

      await waitFor(() => {
        expect(
          screen.getByText('Developer Hub Intelligent Assistant'),
        ).toBeInTheDocument();
      });

      await userEvent.click(screen.getByLabelText('Options'));
      expect(screen.queryByText('MCP settings')).not.toBeInTheDocument();
    });
  });
});
