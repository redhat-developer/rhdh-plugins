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

/// <reference types="node" />
import type { Browser, Page } from '@playwright/test';
import { models, conversations, mockedShields } from '../fixtures/responses';
import { openLightspeed, switchToLocale } from './testHelper';
import {
  mockChatHistory,
  mockConversations,
  mockFeedbackStatus,
  mockMcpServers,
  mockModels,
  mockNotebookLightspeedBackend,
  mockQuery,
  mockShields,
} from './devMode';
import { getTranslations, type LightspeedMessages } from './translations';

/** Default user message used by the shared query mock in Lightspeed e2e. */
export const LIGHTSPEED_E2E_DEFAULT_BOT_QUERY = 'Please respond';

export type LightspeedE2eBootstrap = {
  page: Page;
  locale: string;
  translations: LightspeedMessages;
};

async function loginAsGuest(page: Page) {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const enter = page.getByRole('button', { name: 'Enter' });
    await enter.click();

    try {
      if (process.env.APP_MODE !== 'nfs') {
        await page
          .getByRole('heading', { name: 'Red Hat Catalog' })
          .waitFor({ state: 'visible', timeout: 15_000 });
      } else {
        // NFS has no catalog heading. Wait until the guest session is actually
        // established — a fixed sleep is not enough when several workers log
        // in during the first NFS compile, and English skips switchToLocale.
        await enter.waitFor({ state: 'hidden', timeout: 15_000 });
        await page
          .getByRole('link', { name: 'Settings' })
          .waitFor({ state: 'visible', timeout: 15_000 });
      }
      return;
    } catch {
      if (attempt === maxAttempts) throw new Error('loginAsGuest failed');
      await page.reload();
      await page.waitForTimeout(2000);
    }
  }
}
/**
 * One logged-in Lightspeed session with the same dev-mode mocks as the legacy
 * monolithic suite. Each Playwright test file should call this from `beforeAll`.
 */
export async function bootstrapLightspeedE2ePage(
  browser: Browser,
): Promise<LightspeedE2eBootstrap> {
  const context = await browser.newContext();
  const page = await context.newPage();
  const locale = await page.evaluate(() => globalThis.navigator.language);
  const translations = getTranslations(locale);

  await mockModels(page, models);
  await mockConversations(page);
  await mockChatHistory(page);
  await mockQuery(page, LIGHTSPEED_E2E_DEFAULT_BOT_QUERY, conversations);
  await mockShields(page, mockedShields);
  await mockMcpServers(page);
  await mockFeedbackStatus(page);
  await mockNotebookLightspeedBackend(page);

  await page.goto('/');
  await loginAsGuest(page);

  await switchToLocale(page, locale);
  await openLightspeed(page);

  return { page, locale, translations };
}
