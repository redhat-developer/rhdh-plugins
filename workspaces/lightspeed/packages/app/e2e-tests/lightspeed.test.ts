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

import { test, expect, Page } from '@playwright/test';
import {
  models as fakeModels,
  conversations,
  contents,
  demoChatContent,
  botResponse,
  moreConversations,
  mockedShields,
} from './fixtures/responses';
import {
  openLightspeed,
  sendMessage,
  verifyFeedbackButtons,
  submitFeedback,
  assertClipboardContains,
  switchToLocale,
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
import {
  LightspeedMessages,
  evaluateMessage,
  getTranslations,
} from './utils/translations';
import { runAccessibilityTests } from './utils/accessibility';

test.describe('Lightspeed tests', () => {
  const botQuery = 'Please respond';
  const devMode = !process.env.PLAYWRIGHT_URL;
  let models = fakeModels;
  let translations: LightspeedMessages;
  let sharedPage: Page;
  let locale: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    sharedPage = await context.newPage();
    locale = await sharedPage.evaluate(() => globalThis.navigator.language);
    translations = getTranslations(locale);

    if (!devMode) {
      const response = await fetch(`${process.env.LIGHTSPEED_URL}/models`, {
        headers: {
          Authorization: `Bearer ${process.env.LIGHTSPEED_API_KEY}`,
        },
      });
      models = (await response.json()).data;
    } else {
      await mockModels(sharedPage, models);
      await mockConversations(sharedPage);
      await mockChatHistory(sharedPage);
      await mockQuery(sharedPage, botQuery, conversations);
      await mockShields(sharedPage, mockedShields);
      await mockFeedbackStatus(sharedPage);
    }

    await sharedPage.goto('/');
    await login(sharedPage, process.env.RHDH_USER, process.env.RHDH_PASSWORD);

    await switchToLocale(sharedPage, locale);
    await openLightspeed(sharedPage);
  });

  test('Lightspeed is available', async ({ browser }, testInfo) => {
    expect(sharedPage.url()).toContain('/lightspeed');
    if (devMode) {
      expect(await sharedPage.title()).toContain(
        translations['chatbox.header.title'],
      );
    }

    const headings = sharedPage.getByRole('heading');
    await expect(headings.first()).toContainText(
      translations['chatbox.header.title'],
    );
    await expect(
      headings.filter({ has: sharedPage.locator('.pf-chatbot__question') }),
    ).toContainText(translations['chatbox.welcome.description']);

    await runAccessibilityTests(sharedPage, testInfo);
  });

  test('Verify disclaimer to be visible', async () => {
    await expect(sharedPage.getByLabel('Scrollable message log'))
      .toMatchAriaSnapshot(`
      - 'heading "Info alert: ${translations['aria.important']}" [level=4]'
      - text: ${translations['disclaimer.withValidation']}
      `);
  });

  test('Models are available', async () => {
    const model = models[1].provider_resource_id;
    const dropdown = sharedPage.locator(
      `button[aria-label="${translations['aria.chatbotSelector']}"]`,
    );
    await expect(dropdown).toHaveText(models[0].provider_resource_id);

    await dropdown.click();
    await sharedPage.getByText(model).click();
    await expect(dropdown).toHaveText(model);
  });

  test('Verify sidebar: initial state, close and reopen', async ({
    browser,
  }, testInfo) => {
    await test.step('Verify initial state of sidebar', async () => {
      await assertChatDialogInitialState(sharedPage, translations);
    });

    await test.step('Close the sidebar and verify elements are hidden', async () => {
      await closeChatDrawer(sharedPage);
      await runAccessibilityTests(sharedPage, testInfo);
      await assertDrawerState(sharedPage, 'closed', translations);
    });

    await test.step('Reopen the sidebar and verify elements are visible again', async () => {
      await openChatDrawer(sharedPage);
      await assertDrawerState(sharedPage, 'open', translations);
    });
  });

  test('verify default prompts are visible', async () => {
    await expect(sharedPage.getByLabel('Scrollable message log'))
      .toMatchAriaSnapshot(`
      - heading /${evaluateMessage(translations['chatbox.welcome.greeting'], '')}.+ ${translations['chatbox.welcome.description']}/ [level=1]
      - button 
      - text: ''
      - button 
      - text: ''
      - button 
      - text: ''
    `);
    const messageLog = sharedPage.locator('div.pf-v6-c-card__title-text');
    const textContents = await messageLog.allTextContents();

    const nonEmptyTexts = textContents.filter(text => text.trim().length > 0);

    expect(nonEmptyTexts.length).toBe(3);
  });

  test.describe('File Attachment Validation', () => {
    const testFiles = [
      { path: '../../package.json', name: 'package.json' },
      { path: __filename, name: 'fileAttachment.spec.ts' },
    ];

    function validationTestCase(path: string, name: string) {
      test(`should validate file: ${name}`, async ({ browser }, testInfo) => {
        const fileExtension = `.${name.split('.').pop()}`;
        await uploadFiles(sharedPage, [path]);

        if (supportedFileTypes.includes(fileExtension)) {
          await uploadAndAssertDuplicate(
            sharedPage,
            path,
            name,
            translations,
            testInfo,
          );
        } else {
          await validateFailedUpload(sharedPage, translations);
          // Unsupported files will not be available to preview.
          const filePreview = sharedPage
            .locator('span', { hasText: name.split('.')[0] })
            .first();

          await expect(filePreview).not.toBeVisible();
        }
      });
    }

    for (const { path, name } of testFiles) {
      validationTestCase(path, name);
    }

    test(`Multiple file upload`, async () => {
      const file1 = `packages/app/e2e-tests/fixtures/uploads/${locale}.upload1.json`;
      const file2 = `packages/app/e2e-tests/fixtures/uploads/${locale}.upload2.json`;
      await uploadFiles(sharedPage, [file1, file2]);

      const heading = sharedPage.getByRole('heading', {
        name: `Danger alert: ${translations['chatbox.fileUpload.failed']}`,
      });
      const text = sharedPage.getByText(
        translations['file.upload.error.multipleFiles'],
      );
      const closeBtn = sharedPage.getByRole('button', {
        name: 'Close Danger alert:',
      });

      await assertVisibilityState('visible', heading, text, closeBtn);

      await closeBtn.click();

      await assertVisibilityState('hidden', heading, text, closeBtn);
    });
  });

  const describeFn = devMode ? test.describe : test.describe.serial;
  describeFn('Conversation', () => {
    if (devMode) {
      test.beforeEach(async () => {
        await mockConversations(sharedPage, conversations, true);
        await mockChatHistory(sharedPage, contents);
      });
    }

    test('Bot response, feedback submission, and copy to clipboard', async () => {
      await sendMessage(botQuery, sharedPage, translations);

      const userMessage = sharedPage.locator('.pf-chatbot__message--user');
      const botMessage = sharedPage.locator('.pf-chatbot__message--bot');
      const copyButton = sharedPage.getByRole('button', { name: 'Copy' });

      await expect(userMessage).toBeVisible();
      await expect(userMessage).toContainText(botQuery);

      const response = devMode
        ? botResponse
        : `I'm the Red Hat Developer Hub Lightspeed assistant`;

      await expect(botMessage).toBeVisible();
      await expect(botMessage).toContainText(response);
      await verifyFeedbackButtons(sharedPage);
      await submitFeedback(sharedPage, 'Good response', devMode, translations);
      await submitFeedback(sharedPage, 'Bad response', devMode, translations);
      await copyButton.click();
      await assertClipboardContains(sharedPage, response);
    });

    test('Conversation is created and shown in side panel', async () => {
      await sendMessage('test', sharedPage, translations);
      await verifySidePanelConversation(sharedPage, translations);
    });

    test('Verify scroll controls in Conversation', async ({
      browser,
    }, testInfo) => {
      if (devMode) {
        await mockChatHistory(sharedPage, demoChatContent);
      }

      let message = demoChatContent[0].messages[0].content;
      if (!devMode) {
        message =
          (await sharedPage
            .locator('.pf-v6-c-card__body', { hasText: 'Tekton' })
            .textContent()) || '';
      }
      await sendMessage(message, sharedPage, translations, false);

      const jumpTopButton = sharedPage.getByRole('button', {
        name: 'Back to top',
      });
      const jumpBottomButton = sharedPage.getByRole('button', {
        name: 'Back to bottom',
      });

      await runAccessibilityTests(sharedPage, testInfo);
      await expect(jumpTopButton).toBeVisible();
      await jumpTopButton.click();
      await sharedPage.waitForTimeout(500);
      await expect(
        sharedPage.locator('span').filter({ hasText: message }),
      ).toBeVisible();

      await verifySidePanelConversation(sharedPage, translations);
      await expect(jumpBottomButton).toBeVisible();
      await jumpBottomButton.click();

      const responseText = devMode ? /OpenShift deployment/ : /Tekton/;
      const responseMessage = sharedPage
        .locator('div.pf-chatbot__message-response')
        .last();
      await expect(responseMessage).toHaveText(responseText);
    });

    test('Filter and switch conversations', async () => {
      if (devMode) {
        await mockConversations(sharedPage, moreConversations);
      }
      await sendMessage('test', sharedPage, translations);
      const sidePanel = sharedPage.locator('.pf-v6-c-drawer__panel-main');

      const currentChat = sidePanel.locator('li.pf-chatbot__menu-item--active');
      await expect(currentChat).toHaveText(
        devMode ? moreConversations[0].topic_summary : /<[\w\s]+topic[\w\s]*>/,
      );

      const chats = sidePanel.locator('li.pf-chatbot__menu-item');
      if (devMode) {
        await expect(chats).toHaveCount(2);
      } else {
        expect(await chats.count()).toBeGreaterThanOrEqual(1);
        await sharedPage
          .getByRole('button', { name: translations['button.newChat'] })
          .click();
        await sendMessage('tell me about Backstage', sharedPage, translations);
        await verifySidePanelConversation(sharedPage, translations);
      }

      const searchText = devMode
        ? moreConversations[1].topic_summary
        : 'Backstage';
      const searchBox = sidePanel.getByPlaceholder(
        translations['chatbox.search.placeholder'],
      );
      await searchBox.fill(devMode ? 'new' : 'Backstage');
      for (const chat of await chats.all()) {
        expect(chat).toContainText(searchText);
      }
      await chats.first().click();

      const userMessage = sharedPage.locator('.pf-chatbot__message--user');
      const botMessage = sharedPage.locator('.pf-chatbot__message--bot');

      await expect(userMessage).toContainText(
        devMode ? contents[0].messages[0].content : 'tell me about Backstage',
      );
      await expect(botMessage).toContainText(
        devMode ? contents[0].messages[1].content : 'Backstage',
      );
    });
  });
});
