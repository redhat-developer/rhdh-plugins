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
 * Messages object containing all English translations.
 * This is our single source of truth for translations.
 * @alpha
 */
export const lightspeedMessages = {
  // Page titles and headers
  'page.title': 'Lightspeed',
  'page.subtitle': 'AI-powered development assistant',
  'tabs.ariaLabel': 'Lightspeed views',
  'tabs.chat': 'Chat',
  'tabs.notebooks': 'Notebooks',
  'tabs.notebooks.empty': 'Notebooks content goes here.',
  'notebooks.title': 'My Notebooks',
  'notebooks.empty.title': 'No created notebooks',
  'notebooks.empty.description':
    'Start a new notebook to organize your sources and generate AI-powered insights.',
  'notebooks.empty.action': 'Create a new notebook',
  'notebooks.documents': 'Documents',
  'notebooks.actions.rename': 'Rename',
  'notebooks.actions.delete': 'Delete',
  'notebooks.rename.title': 'Rename {{name}}?',
  'notebooks.rename.description':
    'Please input the new name for this notebook and click submit to proceed.',
  'notebooks.rename.label': 'New name',
  'notebooks.rename.placeholder': 'New name',
  'notebooks.rename.action': 'Submit',
  'notebooks.delete.title': 'Delete {{name}}?',
  'notebooks.delete.message':
    "You'll no longer see this notebook here. This will also delete related activity like prompts, responses, and feedback from your Lightspeed Activity.",
  'notebooks.delete.action': 'Delete',
  'notebooks.delete.toast': 'Notebook deleted!',
  'notebooks.updated.today': 'Updated today',
  'notebooks.updated.yesterday': 'Updated 1 day ago',
  'notebooks.updated.days': 'Updated {{days}} days ago',
  'notebooks.updated.on': 'Updated on',

  // Notebook view
  'notebook.view.title': 'Untitled notebook',
  'notebook.view.close': 'Close notebook',
  'notebook.view.documents.count': '{{count}} Documents',
  'notebook.view.documents.add': 'Add',
  'notebook.view.upload.heading': 'Upload a resource to get started',
  'notebook.view.upload.action': 'Upload a resource',
  'notebook.view.input.placeholder': 'Ask about your documents...',
  'notebook.view.input.disabledTooltip':
    'Select at least one loaded resource to start chatting',
  'notebook.view.sidebar.collapse': 'Collapse sidebar',
  'notebook.view.sidebar.expand': 'Expand sidebar',
  'notebook.view.sidebar.resize': 'Resize sidebar',
  'notebook.view.documents.uploading': 'Uploading document',
  'notebook.view.documents.maxReached':
    'Maximum 10 documents are allowed. Delete a document to upload a new document.',
  'notebook.upload.success': '{{fileName}} Successfully Uploaded.',
  'notebook.upload.failed': '{{fileName}} Upload Failed.',

  // Notebook upload modal
  'notebook.upload.modal.title': 'Add a document to Notebook',
  'notebook.upload.modal.dragDropTitle': 'Drag and drop files here',
  'notebook.upload.modal.browseButton': 'Upload',
  'notebook.upload.modal.separator': 'or',
  'notebook.upload.modal.infoText':
    'Accepted file types: .md, .txt, .pdf, .json, .yaml, .log',
  'notebook.upload.modal.selectedFiles': '{{count}} of {{max}} files selected',
  'notebook.upload.modal.addButton': 'Add ({{count}})',
  'notebook.upload.modal.removeFile': 'Remove {{fileName}}',
  'notebook.upload.error.unsupportedType':
    'Upload error: Unsupported file type(s) found. Please upload only supported file types.',
  'notebook.upload.error.fileTooLarge':
    'Upload error: File size exceeds 25 MB limit.',
  'notebook.upload.error.tooManyFiles':
    'Upload error: Maximum of {{max}} files allowed.',

  // Notebook overwrite modal
  'notebook.overwrite.modal.title': 'Overwrite Files?',
  'notebook.overwrite.modal.description':
    'The following files already exist in this notebook. Do you want to overwrite them with the new versions?',
  'notebook.overwrite.modal.action': 'Overwrite',
  'notebook.document.delete': 'Delete',

  // Sample prompts - General Development
  'prompts.codeReadability.title': 'Get Help On Code Readability',
  'prompts.codeReadability.message':
    'Can you suggest techniques I can use to make my code more readable and maintainable?',
  'prompts.debugging.title': 'Get Help With Debugging',
  'prompts.debugging.message':
    'My application is throwing an error when trying to connect to the database. Can you help me identify the issue?',
  'prompts.developmentConcept.title': 'Explain a Development Concept',
  'prompts.developmentConcept.message':
    'Can you explain how microservices architecture works and its advantages over a monolithic design?',
  'prompts.codeOptimization.title': 'Suggest Code Optimizations',
  'prompts.codeOptimization.message':
    'Can you suggest common ways to optimize code to achieve better performance?',
  'prompts.documentation.title': 'Documentation Summary',
  'prompts.documentation.message':
    'Can you summarize the documentation for implementing OAuth 2.0 authentication in a web app?',
  'prompts.gitWorkflows.title': 'Workflows With Git',
  'prompts.gitWorkflows.message':
    'I want to make changes to code on another branch without losing my existing work. What is the procedure to do this using Git?',
  'prompts.testingStrategies.title': 'Suggest Testing Strategies',
  'prompts.testingStrategies.message':
    'Can you recommend some common testing strategies that will make my application robust and error-free?',
  'prompts.sortingAlgorithms.title': 'Demystify Sorting Algorithms',
  'prompts.sortingAlgorithms.message':
    'Can you explain the difference between a quicksort and a merge sort algorithm, and when to use each?',
  'prompts.eventDriven.title': 'Understand Event-Driven Architecture',
  'prompts.eventDriven.message':
    "Can you explain what event-driven architecture is and when it's beneficial to use it in software development?",

  // Sample prompts - RHDH Specific
  'prompts.tekton.title': 'Deploy With Tekton',
  'prompts.tekton.message':
    'Can you help me automate the deployment of my application using Tekton pipelines?',
  'prompts.openshift.title': 'Create An OpenShift Deployment',
  'prompts.openshift.message':
    'Can you guide me through creating a new deployment in OpenShift for a containerized application?',
  'prompts.rhdh.title': 'Getting Started with Red Hat Developer Hub',
  'prompts.rhdh.message':
    'Can you guide me through the first steps to start using Developer Hub as a developer, like exploring the Software Catalog and adding my service?',

  // Conversation history
  'conversation.delete.confirm.title': 'Delete chat?',
  'conversation.delete.confirm.message':
    "You'll no longer see this chat here. This will also delete related activity like prompts, responses, and feedback from your Lightspeed Activity.",
  'conversation.delete.confirm.action': 'Delete',
  'conversation.rename.confirm.title': 'Rename chat?',
  'conversation.rename.confirm.action': 'Rename',
  'conversation.rename.placeholder': 'Chat name',

  // Permissions
  'permission.required.title': 'Missing permissions',
  'permission.required.description':
    'To view <subject/>, contact your administrator to give the <permissions/> permission.',
  'permission.subject.plugin': 'the Lightspeed plugin',
  'permission.subject.notebooks': 'the Lightspeed notebooks',
  'permission.notebooks.goBack': 'Go back',

  // LCORE / LLM (no models registered)
  'lcore.notConfigured.title': 'Connect an LLM to get started',
  'lcore.notConfigured.description':
    "Lightspeed requires a registered LLM. Contact your organization's platform administrator to complete the setup.",
  'lcore.notConfigured.developerLightspeedDocs':
    'Configuring Developer Lightspeed',
  'lcore.notConfigured.backendDocs': 'Lightspeed Backend Setup',
  'lcore.loadError.title': 'Could not load models',
  'lcore.loadError.description':
    'The Lightspeed backend did not return a model list. Check that the service is running and reachable, then try again.',

  // Disclaimers
  'disclaimer.withValidation':
    "This feature uses AI technology. Do not include any personal information or any other sensitive information in your input. Interactions may be used to improve Red Hat's products or services.",
  'disclaimer.withoutValidation':
    "This feature uses AI technology. Do not include any personal information or any other sensitive information in your input. Interactions may be used to improve Red Hat's products or services.",

  // Footer and feedback
  'footer.accuracy.label': 'Always review AI generated content prior to use.',

  // Common actions
  'common.cancel': 'Cancel',
  'common.close': 'Close',
  'common.readMore': 'Read more',
  'common.retry': 'Try again',
  'common.loading': 'Loading',
  'common.noSearchResults': 'No result matches the search',

  // Menu items
  'menu.newConversation': 'New Chat',

  // Chat-specific UI elements
  'chatbox.header.title': 'Developer Lightspeed',
  'chatbox.search.placeholder': 'Search',
  'chatbox.provider.other': 'Other',
  'chatbox.emptyState.noPinnedChats': 'No pinned chats',
  'chatbox.emptyState.noRecentChats': 'No recent chats',
  'chatbox.emptyState.noResults.title': 'No results found',
  'chatbox.emptyState.noResults.body':
    'Adjust your search query and try again. Check your spelling or try a more general term.',
  'chatbox.welcome.greeting': 'Hello, {{userName}}',
  'chatbox.welcome.description': 'How can I help you today?',
  'chatbox.message.placeholder': 'Enter a prompt for Lightspeed',
  'chatbox.fileUpload.failed': 'File upload failed',
  'chatbox.fileUpload.infoText':
    'Supported file types are: .txt, .yaml, and .json. The maximum file size is 25 MB.',

  // Accessibility and ARIA labels
  'aria.chatbotSelector': 'Chatbot selector',
  'aria.important': 'Important',
  'aria.chatHistoryMenu': 'Chat history menu',
  'aria.closeDrawerPanel': 'Close drawer panel',
  'aria.search.placeholder': 'Search',
  'aria.searchPreviousConversations': 'Search previous conversations',
  'aria.resize': 'Resize',
  'aria.options.label': 'Options',
  'aria.scroll.down': 'Back to bottom',
  'aria.scroll.up': 'Back to top',
  'aria.settings.label': 'Chatbot options',
  'aria.close': 'Close chatbot',

  // Modal actions
  'modal.edit': 'Edit',
  'modal.save': 'Save',
  'modal.close': 'Close',
  'modal.cancel': 'Cancel',

  // Conversation actions
  'conversation.delete': 'Delete',
  'conversation.rename': 'Rename',
  'conversation.addToPinnedChats': 'Pin',
  'conversation.removeFromPinnedChats': 'Unpin',
  'conversation.announcement.userMessage':
    'Message from User: {{prompt}}. Message from Bot is loading.',
  'conversation.announcement.responseStopped': 'Response stopped.',

  // User states
  'user.guest': 'Guest',
  'user.loading': '...',

  // Button tooltips and labels
  'tooltip.attach': 'Attach',
  'tooltip.send': 'Send',
  'tooltip.microphone.active': 'Stop listening',
  'tooltip.microphone.inactive': 'Use microphone',
  'tooltip.expandHistoryPanel': 'Expand chat history',
  'tooltip.collapseHistoryPanel': 'Collapse chat history',
  'tooltip.quickNewChat': 'New chat',
  'button.newChat': 'New chat',
  'tooltip.chatHistoryMenu': 'Chat history menu',
  'tooltip.responseRecorded': 'Response recorded',
  'tooltip.backToTop': 'Back to top',
  'tooltip.backToBottom': 'Back to bottom',
  'tooltip.settings': 'Chatbot options',
  'tooltip.close': 'Close',
  'tooltip.fab.open': 'Open Lightspeed',
  'tooltip.fab.close': 'Close Lightspeed',

  // Attach menu
  'attach.menu.title': 'Attach',
  'attach.menu.description': 'Attach a JSON, YAML, TXT, or XML file',

  // History panel sections
  'history.section.pinned': 'Pinned',
  'history.section.recent': 'Recent',

  // Modal titles
  'modal.title.preview': 'Preview attachment',
  'modal.title.edit': 'Edit attachment',

  // Alt texts for icons
  'icon.lightspeed.alt': 'lightspeed icon',
  'icon.permissionRequired.alt': 'permission required icon',

  // Message utilities
  'message.options.label': 'Options',

  // File attachment errors
  'file.upload.error.alreadyExists': 'File already exists.',
  'file.upload.error.multipleFiles': 'Uploaded more than one file.',
  'file.upload.error.unsupportedType':
    'Unsupported file type. Supported types are: .txt, .yaml, and .json.',
  'file.upload.error.fileTooLarge':
    'Your file size is too large. Please ensure that your file is less than 25 MB.',
  'file.upload.error.readFailed': 'Failed to read file: {{errorMessage}}',

  // Developer error messages
  'error.context.fileAttachment':
    'useFileAttachmentContext must be within a FileAttachmentContextProvider',

  // Feedback actions
  'feedback.form.title': 'Why did you choose this rating?',
  'feedback.form.textAreaPlaceholder': 'Provide optional additional feedback',
  'feedback.form.submitWord': 'Submit',
  'feedback.tooltips.goodResponse': 'Good Response',
  'feedback.tooltips.badResponse': 'Bad Response',
  'feedback.tooltips.copied': 'Copied',
  'feedback.tooltips.copy': 'Copy',
  'feedback.tooltips.listening': 'Listening',
  'feedback.tooltips.listen': 'Listen',
  'feedback.quickResponses.positive.helpful': 'Helpful information',
  'feedback.quickResponses.positive.easyToUnderstand': 'Easy to understand',
  'feedback.quickResponses.positive.resolvedIssue': 'Resolved my issue',
  'feedback.quickResponses.negative.didntAnswer': "Didn't answer my question",
  'feedback.quickResponses.negative.hardToUnderstand': 'Hard to understand',
  'feedback.quickResponses.negative.notHelpful': 'Not Helpful',
  'feedback.completion.title': 'Feedback submitted',
  'feedback.completion.body':
    "We've received your response. Thank you for sharing your feedback!",

  // Conversation categorization
  'conversation.category.pinnedChats': 'Pinned',
  'conversation.category.recent': 'Recent',

  // lightspeed settings
  'settings.pinned.enable': 'Enable pinned chats',
  'settings.pinned.disable': 'Disable pinned chats',
  'settings.pinned.enabled.description': 'Pinned chats are currently enabled',
  'settings.pinned.disabled.description': 'Pinned chats are currently disabled',
  'settings.mcp.label': 'MCP settings',

  // MCP settings
  'mcp.settings.title': 'MCP servers',
  'mcp.settings.selectedCount': '{{selectedCount}} of {{totalCount}} selected',
  'mcp.settings.closeAriaLabel': 'Close MCP settings',
  'mcp.settings.readOnlyAccess': 'You have read-only access to MCP servers.',
  'mcp.settings.tableAriaLabel': 'MCP servers table',
  'mcp.settings.enabled': 'Enabled',
  'mcp.settings.name': 'Name',
  'mcp.settings.status': 'Status',
  'mcp.settings.edit': 'Edit',
  'mcp.settings.loading': 'Loading MCP servers...',
  'mcp.settings.noneAvailable': 'No MCP servers available.',
  'mcp.settings.status.disabled': 'Disabled',
  'mcp.settings.status.tokenRequired': 'Token required',
  'mcp.settings.status.failed': 'Failed',
  'mcp.settings.status.oneTool': '{{count}} tool',
  'mcp.settings.status.manyTools': '{{count}} tools',
  'mcp.settings.status.unknown': 'Unknown',
  'mcp.settings.toggleServerAriaLabel': 'Toggle {{serverName}}',
  'mcp.settings.editServerAriaLabel': 'Edit {{serverName}}',
  'mcp.settings.configureServerTitle': 'Configure {{serverName}} server',
  'mcp.settings.closeConfigureModalAriaLabel': 'Close configure modal',
  'mcp.settings.modalDescription':
    'Credentials are encrypted at rest and scoped to your profile. Lightspeed will operate with your exact permissions.',
  'mcp.settings.savedToken': 'Saved token',
  'mcp.settings.personalAccessToken': 'Personal Access Token',
  'mcp.settings.usingAdminCredential':
    'Using Administrator provided credential. Enter a personal token to override for your account.',
  'mcp.settings.enterToken': 'Enter your token',
  'mcp.settings.removePersonalToken': 'Remove personal token',
  'mcp.settings.token.clearAriaLabel': 'Clear token input',
  'mcp.settings.token.validating': 'Validating token...',
  'mcp.settings.token.savingAndValidating': 'Saving and validating token...',
  'mcp.settings.token.urlUnavailableForValidation':
    'Unable to validate token because server URL is not available.',
  'mcp.settings.token.invalidCredentials':
    'Invalid credentials. Check server URL and token.',
  'mcp.settings.token.validationFailed':
    'Validation failed. Check server URL and token.',
  'mcp.settings.token.connectionSuccessful': 'Connection successful',

  // Tool calling
  'toolCall.header': 'Tool response: {{toolName}}',
  'toolCall.thinking': 'Thought for {{seconds}} seconds',
  'toolCall.executionTime': 'Execution time: ',
  'toolCall.parameters': 'Parameters',
  'toolCall.response': 'Response',
  'toolCall.showMore': 'show more',
  'toolCall.showLess': 'show less',
  'toolCall.loading': 'Executing tool...',
  'toolCall.executing': 'Executing tool...',
  'toolCall.copyResponse': 'Copy response',
  'toolCall.summary': "Here's a summary of your response",
  'toolCall.mcpServer': 'MCP Server',
  // Display modes
  'settings.displayMode.label': 'Display mode',
  'settings.displayMode.overlay': 'Overlay',
  'settings.displayMode.docked': 'Dock to window',
  'settings.displayMode.fullscreen': 'Fullscreen',

  // Sort options
  'sort.label': 'Sort conversations',
  'sort.newest': 'Date (newest first)',
  'sort.oldest': 'Date (oldest first)',
  'sort.alphabeticalAsc': 'Name (A-Z)',
  'sort.alphabeticalDesc': 'Name (Z-A)',
  // Deep thinking
  'reasoning.thinking': 'Show thinking',
};

/**
 * Translation Reference for Developer Lightspeed
 * @alpha
 **/
export const lightspeedTranslationRef = createTranslationRef({
  id: 'plugin.lightspeed',
  messages: lightspeedMessages,
});
