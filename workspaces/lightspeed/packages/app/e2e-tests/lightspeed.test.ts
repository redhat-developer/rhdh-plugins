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
  modelBaseUrl,
  models,
  defaultConversation,
  conversations,
  contents,
  demoChatContent,
  generateQueryResponse,
  botResponse,
  moreConversations,
} from './fixtures/responses';
import { openLightspeed, sendMessage } from './utils/testHelper';
import {
  uploadFile,
  uploadAndAssertDuplicate,
  validateFailedUpload,
  supportedFileTypes,
} from './utils/fileUpload';
import {
  assertChatDialogInitialState,
  closeChatDrawer,
  openChatDrawer,
  assertDrawerState,
  verifySidePanelConversation,
} from './utils/sidebar';

const botQuery = 'Please respond';

test.beforeEach(async ({ page }) => {
  await page.route(`${modelBaseUrl}/v1/models`, async route => {
    const json = { object: 'list', data: models };
    await route.fulfill({ json });
  });
  await page.route(`${modelBaseUrl}/conversations`, async route => {
    if (route.request().method() === 'GET') {
      const json = [];
      await route.fulfill({ json });
    }
  });
  await page.route(`${modelBaseUrl}/conversations/user*`, async route => {
    const json = [];
    await route.fulfill({ json });
  });
  await page.route(`${modelBaseUrl}/v1/query`, async route => {
    const payload = route.request().postDataJSON();

    const body = generateQueryResponse(
      payload.query === botQuery
        ? (conversations[1].conversation_id = payload.conversation_id)
        : conversations[0].conversation_id,
    );
    await route.fulfill({ body });
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Enter' }).click();
  await openLightspeed(page);
});

test('Lightspeed is available', async ({ page }) => {
  expect(page.url()).toContain('/lightspeed');
  expect(await page.title()).toContain('RHDH Lightspeed');

  const headings = page.getByRole('heading');
  await expect(headings.first()).toContainText('Developer Hub Lightspeed');
  await expect(headings.last()).toContainText('How can I help');
});

test('Models are available', async ({ page }) => {
  const model = models[1].id;
  const dropdown = page.locator('button[aria-label="Chatbot selector"]');
  await expect(dropdown).toHaveText(models[0].id);

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
    - heading "Hello, Guest How can I help you today?" [level=1]
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
      await uploadFile(page, path);

      if (supportedFileTypes.includes(fileExtension)) {
        await uploadAndAssertDuplicate(page, path, name);
      } else {
        await validateFailedUpload(page);
      }
    });
  }
});

test.describe('Conversation', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`${modelBaseUrl}/conversations`, async route => {
      if (route.request().method() === 'GET') {
        const json = { conversations };
        await route.fulfill({ json });
      } else {
        await route.fulfill();
      }
    });
    await page.route(`${modelBaseUrl}/conversations/user*`, async route => {
      const json = { chat_history: contents };
      await route.fulfill({ json });
    });
  });

  test('Bot responds', async ({ page }) => {
    await sendMessage(botQuery, page);

    const userMessage = page.locator('.pf-chatbot__message--user');
    const botMessage = page.locator('.pf-chatbot__message--bot');

    await expect(userMessage).toBeVisible();
    await expect(userMessage).toContainText(botQuery);
    await expect(botMessage).toBeVisible();
    await expect(botMessage).toContainText(botResponse);
  });

  test('Conversation is created and shown in side panel', async ({ page }) => {
    await sendMessage('test', page);
    await verifySidePanelConversation(page);
  });

  test('Verify scroll controls in Conversation', async ({ page }) => {
    await page.route(`${modelBaseUrl}/conversations/user*`, async route => {
      const json = { chat_history: demoChatContent };
      await route.fulfill({ json });
    });

    await openLightspeed(page);

    const message = demoChatContent[0].content;
    await sendMessage(message, page);

    const loadingIndicator = page.locator('div.pf-chatbot__message-loading');
    await loadingIndicator.waitFor({ state: 'visible' });
    await verifySidePanelConversation(page);

    const jumpTopButton = page.getByRole('button', { name: 'Jump top' });
    const jumpBottomButton = page.getByRole('button', { name: 'Jump bottom' });

    await expect(jumpTopButton).toBeVisible();
    await jumpTopButton.click();
    await page.waitForTimeout(500);
    await expect(
      page.locator('span').filter({ hasText: message }),
    ).toBeVisible();

    await expect(jumpBottomButton).toBeVisible();
    await jumpBottomButton.click();

    const responseMessage = page
      .locator('div.pf-chatbot__message-response')
      .last();
    await expect(responseMessage).toHaveText(/OpenShift deployment/);
  });

  test('Filter and switch conversations', async ({ page }) => {
    await page.route(`${modelBaseUrl}/conversations`, async route => {
      if (route.request().method() === 'GET') {
        const json = { conversations: moreConversations };
        await route.fulfill({ json });
      } else {
        await route.fulfill();
      }
    });
    await sendMessage('test', page);
    const sidePanel = page.locator('.pf-v6-c-drawer__panel');

    const currentChat = sidePanel.locator('li.pf-chatbot__menu-item--active');
    await expect(currentChat).toHaveText(moreConversations[0].topic_summary);

    const chats = sidePanel.locator('li.pf-chatbot__menu-item');
    await expect(chats).toHaveCount(2);

    const searchBox = sidePanel.getByPlaceholder(
      'Search previous conversations...',
    );
    await searchBox.fill('new');
    await expect(chats).toHaveCount(1);
    await expect(chats).toHaveText(moreConversations[1].topic_summary);

    await chats.click();

    const userMessage = page.locator('.pf-chatbot__message--user');
    const botMessage = page.locator('.pf-chatbot__message--bot');

    await expect(userMessage).toContainText(contents[0].content);
    await expect(botMessage).toContainText(contents[1].content);
  });
});
