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
  generateQueryResponse,
  botResponse,
  moreConversations,
} from './fixtures/responses';
import { openLightspeed, sendMessage } from './utils/testHelper';

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

    const sidePanel = page.locator('.pf-v6-c-drawer__panel');
    await expect(sidePanel).toBeVisible();

    const newButton = sidePanel.getByRole('button', { name: 'new chat' });
    await expect(newButton).toBeEnabled();

    const conversation = sidePanel.locator('li.pf-chatbot__menu-item--active');
    await expect(conversation).toBeVisible();
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
