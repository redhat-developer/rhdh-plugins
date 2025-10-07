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

import { test, expect } from '@playwright/test';
import {
  models as fakeModels,
  conversations,
  contents,
  demoChatContent,
  botResponse,
  moreConversations,
} from './fixtures/responses';
import {
  openLightspeed,
  sendMessage,
  verifyFeedbackButtons,
  submitFeedback,
  assertClipboardContains,
} from './utils/testHelper';
import {
  uploadFiles,
  uploadAndAssertDuplicate,
  supportedFileTypes,
  validateFailedUpload,
  assertVisibilityState,
} from './utils/fileUpload';
import {
  assertChatDialogInitialState,
  closeChatDrawer,
  openChatDrawer,
  assertDrawerState,
  verifySidePanelConversation,
} from './utils/sidebar';
import { login } from './utils/login';
import {
  mockChatHistory,
  mockConversations,
  mockFeedbackStatus,
  mockModels,
  mockQuery,
  mockShields,
} from './utils/devMode';

const botQuery = 'Please respond';
const devMode = !process.env.PLAYWRIGHT_URL;
let models = fakeModels;

if (!devMode) {
  test.beforeAll(async () => {
    const response = await fetch(`${process.env.LIGHTSPEED_URL}/models`, {
      headers: {
        Authorization: `Bearer ${process.env.LIGHTSPEED_API_KEY}`,
      },
    });
    models = (await response.json()).data;
  });
}

test.beforeEach(async ({ page }) => {
  if (devMode) {
    await mockModels(page, models);
    await mockConversations(page);
    await mockChatHistory(page);
    await mockQuery(page, botQuery, conversations);
    await mockShields(page, mockShields);
  }

  await page.goto('/');
  await login(page, process.env.RHDH_USER, process.env.RHDH_PASSWORD);
  await openLightspeed(page);
});

test('Lightspeed is available', async ({ page }) => {
  expect(page.url()).toContain('/lightspeed');
  if (devMode) {
    expect(await page.title()).toContain('Developer Lightspeed');
  }

  const headings = page.getByRole('heading');
  await expect(headings.first()).toContainText('Developer Lightspeed');
  await expect(
    headings.filter({ has: page.locator('.pf-chatbot__question') }),
  ).toContainText('How can I help');
});

test('Models are available', async ({ page }) => {
  const model = models[1].provider_resource_id;
  const dropdown = page.locator('button[aria-label="Chatbot selector"]');
  await expect(dropdown).toHaveText(models[0].provider_resource_id);

  await dropdown.click();
  await page.getByText(model).click();
  await expect(dropdown).toHaveText(model);
});

test('Verify sidebar: initial state, close and reopen', async ({ page }) => {
  await test.step('Verify initial state of sidebar', async () => {
    await assertChatDialogInitialState(page);
  });

  await test.step('Close the sidebar and verify elements are hidden', async () => {
    await closeChatDrawer(page);
    await assertDrawerState(page, 'closed');
  });

  await test.step('Reopen the sidebar and verify elements are visible again', async () => {
    await openChatDrawer(page);
    await assertDrawerState(page, 'open');
  });
});

test('verify default prompts are visible', async ({ page }) => {
  await expect(page.getByLabel('Scrollable message log')).toMatchAriaSnapshot(`
    - heading /Hello, .+ How can I help you today?/ [level=1]
    - button 
    - text: ''
    - button 
    - text: ''
    - button 
    - text: ''
  `);
  const messageLog = page.locator('div.pf-v6-c-card__title-text');
  const textContents = await messageLog.allTextContents();

  const nonEmptyTexts = textContents.filter(text => text.trim().length > 0);

  expect(nonEmptyTexts.length).toBe(3);
});
test.describe('File Attachment Validation', () => {
  const testFiles = [
    { path: '../../package.json', name: 'package.json' },
    { path: __filename, name: 'fileAttachment.spec.ts' },
  ];

  for (const { path, name } of testFiles) {
    test(`should validate file: ${name}`, async ({ page }) => {
      const fileExtension = `.${name.split('.').pop()}`;
      await uploadFiles(page, [path]);

      if (supportedFileTypes.includes(fileExtension)) {
        await uploadAndAssertDuplicate(page, path, name);
      } else {
        await validateFailedUpload(page);
        // Unsupported files will not be available to preview.
        const filePreview = page
          .locator('span', { hasText: name.split('.')[0] })
          .first();

        await expect(filePreview).not.toBeVisible();
      }
    });
  }

  test(`Multiple file upload`, async ({ page }) => {
    const file1 = testFiles[0].path;
    const file2 = 'backstage.json';
    await uploadFiles(page, [file1, file2]);

    const heading = page.getByRole('heading', {
      name: 'Danger alert: File upload',
    });
    const text = page.getByText('Uploaded more than one file.');
    const closeBtn = page.getByRole('button', { name: 'Close Danger alert:' });

    await assertVisibilityState('visible', heading, text, closeBtn);

    await closeBtn.click();

    await assertVisibilityState('hidden', heading, text, closeBtn);
  });
});

const describeFn = devMode ? test.describe : test.describe.serial;
describeFn('Conversation', () => {
  if (devMode) {
    test.beforeEach(async ({ page }) => {
      await mockConversations(page, conversations, true);
      await mockChatHistory(page, contents);
      await mockFeedbackStatus(page);
    });
  }

  test('Bot response, feedback submission, and copy to clipboard', async ({
    page,
  }) => {
    await sendMessage(botQuery, page);

    const userMessage = page.locator('.pf-chatbot__message--user');
    const botMessage = page.locator('.pf-chatbot__message--bot');
    const copyButton = page.getByRole('button', { name: 'Copy' });

    await expect(userMessage).toBeVisible();
    await expect(userMessage).toContainText(botQuery);

    const response = devMode
      ? botResponse
      : `I'm the Red Hat Developer Hub Lightspeed assistant`;

    await expect(botMessage).toBeVisible();
    await expect(botMessage).toContainText(response);
    await verifyFeedbackButtons(page);
    await submitFeedback(page, 'Good response', devMode);
    await submitFeedback(page, 'Bad response', devMode);
    await copyButton.click();
    await assertClipboardContains(page, response);
  });

  test('Conversation is created and shown in side panel', async ({ page }) => {
    await sendMessage('test', page);
    await verifySidePanelConversation(page);
  });

  test('Verify scroll controls in Conversation', async ({ page }) => {
    if (devMode) {
      await mockChatHistory(page, demoChatContent);
    }

    let message = demoChatContent[0].messages[0].content;
    if (!devMode) {
      message =
        (await page
          .locator('.pf-v6-c-card__body', { hasText: 'Tekton' })
          .textContent()) || '';
    }
    await sendMessage(message, page, false);

    const jumpTopButton = page.getByRole('button', { name: 'Back to top' });
    const jumpBottomButton = page.getByRole('button', {
      name: 'Back to bottom',
    });

    await expect(jumpTopButton).toBeVisible();
    await jumpTopButton.click();
    await page.waitForTimeout(500);
    await expect(
      page.locator('span').filter({ hasText: message }),
    ).toBeVisible();

    await verifySidePanelConversation(page);
    await expect(jumpBottomButton).toBeVisible();
    await jumpBottomButton.click();

    const responseText = devMode ? /OpenShift deployment/ : /Tekton/;
    const responseMessage = page
      .locator('div.pf-chatbot__message-response')
      .last();
    await expect(responseMessage).toHaveText(responseText);
  });

  test('Filter and switch conversations', async ({ page }) => {
    if (devMode) {
      await mockConversations(page, moreConversations);
    }
    await sendMessage('test', page);
    const sidePanel = page.locator('.pf-v6-c-drawer__panel-main');

    const currentChat = sidePanel.locator('li.pf-chatbot__menu-item--active');
    await expect(currentChat).toHaveText(
      devMode ? moreConversations[0].topic_summary : /<[\w\s]+topic[\w\s]*>/,
    );

    const chats = sidePanel.locator('li.pf-chatbot__menu-item');
    if (devMode) {
      await expect(chats).toHaveCount(2);
    } else {
      expect(await chats.count()).toBeGreaterThanOrEqual(1);
      await page.getByRole('button', { name: 'new chat' }).click();
      await sendMessage('tell me about Backstage', page);
      await verifySidePanelConversation(page);
    }

    const searchText = devMode
      ? moreConversations[1].topic_summary
      : 'Backstage';
    const searchBox = sidePanel.getByPlaceholder('Search previous chats...');
    await searchBox.fill(devMode ? 'new' : 'Backstage');
    for (const chat of await chats.all()) {
      expect(chat).toContainText(searchText);
    }
    await chats.first().click();

    const userMessage = page.locator('.pf-chatbot__message--user');
    const botMessage = page.locator('.pf-chatbot__message--bot');

    await expect(userMessage).toContainText(
      devMode ? contents[0].messages[0].content : 'tell me about Backstage',
    );
    await expect(botMessage).toContainText(
      devMode ? contents[0].messages[1].content : 'Backstage',
    );
  });
});
