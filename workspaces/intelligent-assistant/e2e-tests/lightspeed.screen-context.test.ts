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

import { test, expect, type Page } from '@playwright/test';
import {
  openChatbot,
  selectDisplayMode,
  waitForBackstageCatalogReady,
} from './pages/LightspeedPage';
import {
  bootstrapLightspeedE2ePage,
  LIGHTSPEED_E2E_DEFAULT_BOT_QUERY,
} from './utils/lightspeedE2eSetup';
import { sendMessage } from './utils/testHelper';
import { openChatbotSettings } from './utils/chatManagement';
import {
  disableScreenContextViaKebab,
  enableScreenContextViaKebab,
  expectScreenContextChipHidden,
  expectScreenContextPausedVisible,
  expectScreenContextRecordingVisible,
  expectScreenContextUnavailableVisible,
  pauseScreenContextChip,
  resumeScreenContextChip,
  verifyEnableScreenContextOption,
} from './utils/screenContext';
import type { LightspeedMessages } from './utils/translations';

test.describe('Intelligent assistant screen context', () => {
  let translations: LightspeedMessages;
  let sharedPage: Page;

  test.beforeAll(async ({ browser }) => {
    const boot = await bootstrapLightspeedE2ePage(browser);
    sharedPage = boot.page;
    translations = boot.translations;
  });

  test.beforeEach(async () => {
    await sharedPage.goto('/catalog');
    await waitForBackstageCatalogReady(sharedPage);
    await openChatbot(sharedPage, translations);
  });

  test('kebab Enable shows recording chip; Disable hides it', async () => {
    await expectScreenContextChipHidden(sharedPage);

    await openChatbotSettings(sharedPage, translations);
    await verifyEnableScreenContextOption(sharedPage, translations);
    await sharedPage.keyboard.press('Escape');

    await enableScreenContextViaKebab(sharedPage, translations);
    await expectScreenContextRecordingVisible(sharedPage);

    await disableScreenContextViaKebab(sharedPage, translations);
    await expectScreenContextChipHidden(sharedPage);
  });

  test('chip pause/resume toggles Context: paused label', async () => {
    await enableScreenContextViaKebab(sharedPage, translations);
    await pauseScreenContextChip(sharedPage);
    await expectScreenContextPausedVisible(sharedPage, translations);

    await resumeScreenContextChip(sharedPage, translations);
    await expectScreenContextRecordingVisible(sharedPage);

    await disableScreenContextViaKebab(sharedPage, translations);
  });

  test('fullscreen shows Context: unavailable', async () => {
    await enableScreenContextViaKebab(sharedPage, translations);
    await selectDisplayMode(sharedPage, translations, 'Fullscreen');
    await expectScreenContextUnavailableVisible(sharedPage, translations);
  });

  test('paused send omits screen-context attachments', async () => {
    await enableScreenContextViaKebab(sharedPage, translations);
    await pauseScreenContextChip(sharedPage);
    await expectScreenContextPausedVisible(sharedPage, translations);

    const queryPromise = sharedPage.waitForRequest(request => {
      try {
        return (
          request.method() === 'POST' &&
          request.url().includes('/api/intelligent-assistant') &&
          request.url().includes('/v1/query')
        );
      } catch {
        return false;
      }
    });

    await sendMessage(
      LIGHTSPEED_E2E_DEFAULT_BOT_QUERY,
      sharedPage,
      translations,
    );

    const request = await queryPromise;
    const payload = request.postDataJSON() as {
      attachments?: Array<{ attachment_type?: string }>;
    };
    const attachments = payload.attachments ?? [];
    expect(
      attachments.some(
        a =>
          a.attachment_type === 'image' ||
          a.attachment_type === 'configuration',
      ),
    ).toBe(false);

    await disableScreenContextViaKebab(sharedPage, translations);
  });
});
