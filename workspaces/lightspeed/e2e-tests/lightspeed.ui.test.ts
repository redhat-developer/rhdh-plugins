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
import { modelBaseUrl, models } from './fixtures/responses';
import { openLightspeed } from './utils/testHelper';
import {
  openChatbot,
  selectDisplayMode,
  openChatHistoryDrawer,
  closeChatHistoryDrawer,
  expectBackstagePageVisible,
  expectChatbotControlsVisible,
  verifyDisplayModeMenuOptions,
  expectChatInputAreaVisible,
  expectEmptyChatHistory,
  expectConversationArea,
} from './pages/LightspeedPage';
import {
  assertChatDialogInitialState,
  closeChatDrawer,
  openChatDrawer,
  assertDrawerState,
} from './utils/sidebar';
import {
  uploadFiles,
  uploadAndAssertDuplicate,
  supportedFileTypes,
  validateFailedUpload,
  assertVisibilityState,
} from './utils/fileUpload';
import { LightspeedMessages, evaluateMessage } from './utils/translations';
import { runAccessibilityTests } from './utils/accessibility';
import { bootstrapLightspeedE2ePage } from './utils/lightspeedE2eSetup';
import { mockModels, mockShields } from './utils/devMode';

test.describe('Lightspeed UI', () => {
  let translations: LightspeedMessages;
  let sharedPage: Page;
  let locale: string;

  test.beforeAll(async ({ browser }) => {
    const boot = await bootstrapLightspeedE2ePage(browser);
    sharedPage = boot.page;
    locale = boot.locale;
    translations = boot.translations;
  });

  test.describe('Chatbot Display Modes', () => {
    test.beforeEach(async () => {
      await sharedPage.goto('/');
    });

    test('should display chatbot in overlay mode with backstage page visible', async () => {
      await expectBackstagePageVisible(sharedPage);
      await openChatbot(sharedPage);

      await expectConversationArea(sharedPage, translations, 'Overlay');
      await expectChatInputAreaVisible(sharedPage, translations);
      await expectBackstagePageVisible(sharedPage);
      await expectChatbotControlsVisible(sharedPage, translations);

      await openChatHistoryDrawer(sharedPage, translations);
      await expectEmptyChatHistory(sharedPage, translations);
      await closeChatHistoryDrawer(sharedPage, translations);

      await verifyDisplayModeMenuOptions(sharedPage, translations);
    });

    test('should display chatbot in dock to window mode with backstage page visible', async () => {
      await openChatbot(sharedPage);
      await selectDisplayMode(sharedPage, translations, 'Dock to window');

      await expectConversationArea(sharedPage, translations, 'Dock to window');
      await expectBackstagePageVisible(sharedPage);
      await expectChatInputAreaVisible(sharedPage, translations);
      await expectChatbotControlsVisible(sharedPage, translations);

      await openChatHistoryDrawer(sharedPage, translations);
      await expectEmptyChatHistory(sharedPage, translations);
      await closeChatHistoryDrawer(sharedPage, translations);
    });

    test('should display chatbot in fullscreen mode with backstage page hidden', async () => {
      await openChatbot(sharedPage);
      await selectDisplayMode(sharedPage, translations, 'Fullscreen');

      await expectConversationArea(sharedPage, translations, 'Fullscreen');
      await expectEmptyChatHistory(sharedPage, translations);
      await expectBackstagePageVisible(sharedPage, false);
    });
  });

  test('Lightspeed is available', async ({ browser }, testInfo) => {
    await openLightspeed(sharedPage);
    await expect(sharedPage).toHaveURL(/\/lightspeed/);

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
      await closeChatDrawer(sharedPage, translations);
      await runAccessibilityTests(sharedPage, testInfo);
      await assertDrawerState(sharedPage, 'closed', translations);
    });

    await test.step('Reopen the sidebar and verify elements are visible again', async () => {
      await openChatDrawer(sharedPage, translations);
      await assertDrawerState(sharedPage, 'open', translations);
    });
  });

  test('verify default prompts are visible', async () => {
    const greeting = evaluateMessage(
      translations['chatbox.welcome.greeting'],
      translations['user.guest'],
    );
    await expect(sharedPage.getByLabel('Scrollable message log'))
      .toMatchAriaSnapshot(`
      - region "Scrollable message log":
        - 'heading "Info alert: ${translations['aria.important']}" [level=4]'
        - text: ${translations['disclaimer.withValidation']}
        - heading "${greeting} ${translations['chatbox.welcome.description']}" [level=1]
        - button /.+/
        - text: /.+/
        - button /.+/
        - text: /.+/
        - button /.+/
        - text: /.+/
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
      const file1 = `e2e-tests/fixtures/uploads/${locale}.upload1.json`;
      const file2 = `e2e-tests/fixtures/uploads/${locale}.upload2.json`;
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

  test('Validate Empty State', async () => {
    await sharedPage.unroute(`${modelBaseUrl}/v1/shields`);
    await sharedPage.unroute(`${modelBaseUrl}/v1/models`);
    await mockShields(sharedPage, []);
    await mockModels(sharedPage, []);

    await sharedPage.goto('/lightspeed');
    await sharedPage
      .getByTestId('lightspeed-lcore-not-configured')
      .waitFor({ state: 'visible' });

    await expect(
      sharedPage.getByLabel(translations['lcore.notConfigured.title']),
    ).toMatchAriaSnapshot(`
    - region "${translations['lcore.notConfigured.title']}":
      - heading "${translations['lcore.notConfigured.title']}" [level=2]
      - paragraph: ${translations['lcore.notConfigured.description']}
      - link "${translations['lcore.notConfigured.developerLightspeedDocs']}":
        - /url: https://docs.redhat.com/en/documentation/red_hat_developer_hub/latest/html/interacting_with_red_hat_developer_lightspeed_for_red_hat_developer_hub/developer-lightspeed#proc-installing-and-configuring-lightspeed_developer-lightspeed
      - link "${translations['lcore.notConfigured.backendDocs']}":
        - /url: https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/lightspeed/plugins/lightspeed-backend/README.md
    `);
  });
});
