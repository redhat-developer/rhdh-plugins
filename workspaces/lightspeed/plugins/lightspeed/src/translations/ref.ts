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
  'conversation.action.error': 'Error occured: {{error}}',

  // Permissions
  'permission.required.title': 'Missing permissions',
  'permission.required.description':
    'To view lightspeed plugin, contact your administrator to give the <b>lightspeed.chat.read</b> and <b>lightspeed.chat.create</b> permissions.',

  // Disclaimers
  'disclaimer.withValidation':
    "This feature uses AI technology. Do not include any personal information or any other sensitive information in your input. Interactions may be used to improve Red Hat's products or services.",
  'disclaimer.withoutValidation':
    "This feature uses AI technology. Do not include any personal information or any other sensitive information in your input. Interactions may be used to improve Red Hat's products or services.",

  // Footer and feedback
  'footer.accuracy.label': 'Always review AI generated content prior to use.',
  'footer.accuracy.popover.title': 'Verify accuracy',
  'footer.accuracy.popover.description':
    "While Developer Lightspeed strives for accuracy, there's always a possibility of errors. It's a good practice to verify critical information from reliable sources, especially if it's crucial for decision-making or actions.",
  'footer.accuracy.popover.image.alt': 'Example image for footnote popover',
  'footer.accuracy.popover.cta.label': 'Got it',
  'footer.accuracy.popover.link.label': 'Learn more',

  // Common actions
  'common.cancel': 'Cancel',
  'common.close': 'Close',
  'common.readMore': 'Read more',
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
  'chatbox.message.placeholder':
    'Send a message and optionally upload a JSON, YAML, or TXT file...',
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

  // User states
  'user.guest': 'Guest',
  'user.loading': '...',

  // Button tooltips and labels
  'tooltip.attach': 'Attach',
  'tooltip.send': 'Send',
  'tooltip.microphone.active': 'Stop listening',
  'tooltip.microphone.inactive': 'Use microphone',
  'button.newChat': 'New chat',
  'tooltip.chatHistoryMenu': 'Chat history menu',
  'tooltip.responseRecorded': 'Response recorded',
  'tooltip.backToTop': 'Back to top',
  'tooltip.backToBottom': 'Back to bottom',
  'tooltip.settings': 'Chatbot options',

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

  // Sort options
  'sort.label': 'Sort conversations',
  'sort.newest': 'Date (newest first)',
  'sort.oldest': 'Date (oldest first)',
  'sort.alphabeticalAsc': 'Name (A-Z)',
  'sort.alphabeticalDesc': 'Name (Z-A)',
};

/**
 * Translation Reference for Developer Lightspeed
 * @alpha
 **/
export const lightspeedTranslationRef = createTranslationRef({
  id: 'plugin.lightspeed',
  messages: lightspeedMessages,
});
