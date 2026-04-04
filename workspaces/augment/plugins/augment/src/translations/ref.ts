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
import { createTranslationRef } from '@backstage/core-plugin-api/alpha';

/**
 * Default English messages for the Augment plugin.
 * Organized by component/feature area.
 */
export const augmentMessages = {
  securityGate: {
    configurationRequired: 'Setup Needed',
    configurationErrors:
      '{{appName}} is not properly configured. Please fix the following issues:',
    configurationErrorLabel: 'Setup Issue',
    configurationHint:
      'After updating your configuration, restart the backend server.',
    accessDenied: 'Access Denied',
    accessDeniedMessage:
      'You do not have permission to access {{appName}}. Please contact your administrator to request access.',
  },
  adminOnboarding: {
    welcomeAdmin: 'Welcome, Admin',
    adminAccessMessage:
      'You have administrative access. How would you like to start?',
    continueToChat: 'Continue to Chat',
    continueToChatDescription: 'Use the AI assistant for conversations',
    openCommandCenter: 'Open Command Center',
    openCommandCenterDescription: 'Manage knowledge base, prompts & settings',
    switchHint:
      'You can switch between modes anytime using the Command Center button in the sidebar.',
  },
  commandCenter: {
    title: 'Command Center',
    backToChat: 'Back to Chat',
    platform: 'Model & Tools',
    agents: 'Agents',
    branding: 'Branding',
  },
  providerOffline: {
    title: 'Assistant Unavailable',
    backendUnreachable:
      "{{appName}} is temporarily unavailable. We'll keep trying.",
    modelUnreachable:
      'The AI model is currently unreachable. Messages may fail until the connection is restored.',
  },
  switchDialog: {
    title: 'Message in Progress',
    message:
      'A response is currently being generated. Switching conversations will cancel the in-progress response. Continue?',
    stay: 'Stay',
    switchAnyway: 'Switch Anyway',
  },
  chat: {
    disclaimer:
      'AI-generated responses may be inaccurate. Verify important information.',
    emptySessionTitle: 'Start a conversation',
    emptySessionHint: "Ask anything — I'm here to help.",
    messagesUnavailableTitle: 'Previous messages are no longer available',
    messagesUnavailableHint:
      'The conversation history may have expired. You can continue by sending a new message.',
    you: 'You',
    editMessage: 'Edit message',
    cancelEdit: 'Cancel edit',
    submitEdit: 'Submit edit',
    copiedToClipboard: 'Copied!',
    copyResponse: 'Copy response',
    regenerateResponse: 'Regenerate response',
  },
  chatInput: {
    newConversation: 'New conversation',
    newConversationShortcut: 'New conversation (⌘⇧O)',
    startNewConversation: 'Start new conversation',
    attachFile: 'Attach file',
    chatMessageInput: 'Chat message input',
    stopGeneration: 'Stop generation',
    stopMessageGeneration: 'Stop message generation',
    sendMessage: 'Send message',
    selectAgentPrompt:
      'Select an agent above or type to use the default',
  },
  welcomeScreen: {
    logoAlt: 'Application logo',
    emptyPromptHint: 'Type a question below to get started',
    logoError: 'Logo failed to load — check the URL in Branding settings',
  },
  conversationHistory: {
    title: '{{count}} conversation{{suffix}} • {{appName}}',
    refresh: 'Refresh',
    refreshAriaLabel: 'Refresh conversation history',
    noConversationsYet: 'Your conversations will appear here',
    startChatting: 'Start a conversation to get going',
    noMatchingConversations: 'No conversations matching "{{query}}"',
    deleteConversation: 'Delete conversation',
    delete: 'Delete',
    cancel: 'Cancel',
    searchPlaceholder: 'Search conversations...',
    clearSearch: 'Clear search',
    mine: 'Mine',
    allUsers: "All Users'",
    today: 'Today',
    yesterday: 'Yesterday',
    thisWeek: 'This week',
    older: 'Older',
  },
  rightPane: {
    commandCenter: 'Command Center',
    admin: 'Admin',
    openCommandCenter: 'Open Command Center',
    expand: 'Expand',
    collapse: 'Collapse',
    expandSidebar: 'Expand sidebar',
    collapseSidebar: 'Collapse sidebar',
    scrollToBottom: 'Scroll to bottom',
  },
  agentInfo: {
    title: 'Agent Info',
    connecting: 'Connecting...',
    ready: 'Ready',
    offline: 'Offline',
    team: 'Team ({{count}})',
    defaultAgent: 'Default agent',
    vectorRag: 'Vector RAG',
    vectorStoreUnavailable: 'Vector store unavailable (optional)',
    vectorStoreId: 'Vector store: {{id}}',
    mcpServers: 'MCP Servers ({{connected}}/{{total}})',
    mcpConnected: 'Connected: {{url}} · {{toolCount}} tools',
    mcpDisconnected: 'Disconnected',
  },
  toolApproval: {
    destructiveOperation: 'Destructive Operation',
    requiresApproval: 'Requires Approval',
    toolExecution: 'Tool Execution',
    approveHint: '↵ approve',
    rejectHint: 'esc reject',
    enterKey: 'Enter key',
    escapeKey: 'Escape key',
    reject: 'Reject',
    approve: 'Approve',
    running: 'Running...',
    invalidJson: 'Invalid JSON',
    editJson: 'Edit JSON',
    hideEditor: 'Hide editor',
    editArguments: 'Edit arguments',
  },
  streaming: {
    thinking: 'Thinking',
    working: 'Working',
    searching: 'Searching',
    executingTools: 'Working on it',
    needsApproval: 'Waiting for your OK',
    responding: 'Responding',
    done: 'Done',
    processing: 'Processing...',
    thoughtFor: 'Thought for {{seconds}} second{{suffix}}',
    thinkingEllipsis: 'Thinking...',
    connectingWith: 'Connecting you with {{agentName}}',
  },
  errors: {
    contentFiltered: 'Content Filtered',
    connectionError: 'Connection Error',
    error: 'Error',
    tryAgain: 'Try again',
    safetyHint:
      'This response was blocked by a safety policy. Try rephrasing your request.',
    networkHint:
      'The connection to the server was lost. Check your network and try again.',
    copyErrorDetails: 'Copy error details',
    copied: 'Copied!',
  },
  toolCalls: {
    usedTools: 'Used {{count}} tool(s)',
    collapseToolCalls: 'Collapse tool calls',
    expandToolCalls: 'Expand tool calls',
    arguments: 'Arguments',
    output: 'Output',
    collapseOutput: 'Collapse output',
    expandOutput: 'Expand output',
    copyOutput: 'Copy output',
    copiedToClipboard: 'Copied to clipboard',
    copy: 'Copy',
  },
  ragSources: {
    sourcesFromVectorRag: '{{count}} source(s) from Knowledge Base',
    unknownSource: 'Unknown source',
    collapseKnowledgeSources: 'Collapse knowledge base sources',
    expandKnowledgeSources: 'Expand knowledge base sources',
  },
  tokenUsage: {
    inputTokens: 'Input tokens: {{count}}',
    outputTokens: 'Output tokens: {{count}}',
    totalTokens: 'Total tokens: {{count}}',
    cached: 'Cached: {{count}}',
    reasoning: 'Reasoning: {{count}}',
    reportedBy: 'Token usage reported by inference server',
  },
  agentsPanel: {
    startingAgent: 'Starting Agent',
    maxTurns: 'Max Turns',
    basePrompt: 'Base Prompt',
    newAgent: 'New Agent',
    save: 'Save',
    saved: 'Saved',
    saveSuccess: 'Configuration saved.',
    reset: 'Reset',
    noAgentsTitle: 'No agents configured',
    noAgentsSubtitle:
      'Create your first agent to get started with multi-agent orchestration.',
    createFirstAgent: 'Create Your First Agent',
    selectAgent: 'Select an agent from the list',
    topology: 'Topology',
    transfers: 'transfers',
    delegates: 'delegates',
    outConnections: '{{count}} out',
    inConnections: '{{count}} in',
    instructions: 'Instructions',
    inheritBasePrompt: 'Inherit Base Prompt',
    agentInstructions: 'Agent Instructions',
    applyTemplate: 'Apply template:',
    capabilities: 'Capabilities',
    modelOverride: 'Model Override',
    modelOverrideHint: 'Leave empty for global model',
    mcpServers: 'MCP Servers',
    rag: 'Knowledge Base',
    webSearch: 'Web Search',
    codeInterpreter: 'Code Interpreter',
    connections: 'Connections',
    canTransferTo: 'Can Transfer To',
    canDelegateTo: 'Can Delegate To',
    advanced: 'Advanced',
    adminModified: 'Modified',
    deleteAgent: 'Delete agent',
    confirmRemoveTitle: 'Remove {{name}}?',
    confirmRemoveMessage:
      'This agent will be removed. Other agents referencing it will have those references cleared. Not saved until you click Save.',
    confirmRemoveButton: 'Remove',
    confirmResetTitle: 'Reset to defaults?',
    confirmResetMessage:
      'This will discard all admin customizations and restore defaults. This cannot be undone.',
    confirmResetButton: 'Reset',
    createModal: {
      title: 'Create New Agent',
      subtitle:
        'Give your agent a name and optionally pick a template to pre-fill settings.',
      displayName: 'Display Name',
      displayNamePlaceholder: 'e.g. Support Agent',
      agentId: 'Agent ID',
      agentIdHint: 'Auto-generated from name.',
      agentIdExists: 'This ID already exists.',
      templateTitle: 'Start from a template',
      createButton: 'Create Agent',
      cancel: 'Cancel',
    },
  },
  keyboardShortcuts: {
    title: 'Keyboard Shortcuts',
    close: 'Close',
    chatSection: 'Chat',
    approvalSection: 'Tool Approval',
    focusChatInput: 'Focus chat input',
    newConversation: 'New conversation',
    cancelStreaming: 'Cancel streaming response',
    showHelp: 'Show this help',
    approveTool: 'Approve tool execution',
    rejectTool: 'Reject tool execution',
  },
  confirmDialog: {
    confirm: 'Confirm',
    cancel: 'Cancel',
  },
  onboardingBanner: {
    dismissAriaLabel: 'Dismiss onboarding guide',
    title: 'Meet your AI agents',
    subtitle:
      "{{appName}} connects you with specialized AI agents. Here's how to get started:",
    step1Title: 'Choose an agent',
    step1Description: 'Pick an AI agent that fits your task',
    step2Title: 'Ask anything',
    step2Description: 'Describe what you need in natural language',
    step3Title: 'Get results',
    step3Description: 'Agents use tools and knowledge to deliver',
  },
  agentGallery: {
    heading: 'Agents',
    searchPlaceholder: 'Search agents...',
    searchAriaLabel: 'Search agents',
    tabAll: 'All',
    tabRecent: 'Recent',
    tabPinned: 'Pinned',
    listAriaLabel: 'Available agents',
    noMatchSearch: 'No agents match your search',
    noAgentsInCategory: 'No agents in this category',
    retry: 'Retry',
    noAgentsTitle: 'No agents available yet',
    noAgentsHint: 'Ask your administrator to deploy agents via Kagenti',
  },
  agentDetail: {
    closeAriaLabel: 'Close agent details',
    about: 'About',
    skillsWithCount: 'Skills ({{count}})',
    skillFallback: 'Skill {{n}}',
    capabilities: 'Capabilities',
    streaming: 'Streaming',
    nonStreaming: 'Non-streaming',
    a2aProtocol: 'A2A Protocol',
    details: 'Details',
    fieldNamespace: 'Namespace',
    fieldName: 'Name',
    fieldVersion: 'Version',
    fieldEndpoint: 'Endpoint',
    startConversation: 'Start Conversation',
  },
  formRequestCard: {
    inputRequired: 'Input Required',
    cancel: 'Cancel',
    submit: 'Submit',
  },
  authRequiredCard: {
    oauthTitle: 'Authentication Required',
    oauthSubtitle: 'This agent needs you to sign in to continue',
    signIn: 'Sign In',
    afterSignInHint: 'After signing in, click below to continue:',
    signedIn: "I've Signed In",
    noUrlHint: 'Please complete the authentication flow to proceed.',
    credentialsTitle: 'Credentials Required',
    credentialsSubtitle: 'This agent needs credentials to proceed',
    submitCredentials: 'Submit Credentials',
  },
  artifact: {
    defaultName: 'Artifact',
    expand: 'expand',
    collapse: 'collapse',
    headerAriaLabel: '{{name}} — {{action}}',
    streaming: 'Streaming...',
    copied: 'Copied',
    copyContent: 'Copy content',
    download: 'Download',
    downloadAriaLabel: 'Download',
  },
  citation: {
    sourcesWithCount: 'Sources ({{count}})',
    unnamedSource: 'Source {{n}}',
  },
  chatHeader: {
    changeAgent: 'Change',
  },
};

/**
 * Translation ref for the Augment plugin.
 * @public
 */
export const augmentTranslationRef = createTranslationRef({
  id: 'plugin.augment',
  messages: augmentMessages,
});
