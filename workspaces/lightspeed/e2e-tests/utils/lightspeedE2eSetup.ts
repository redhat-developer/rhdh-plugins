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

import type { Browser, Page } from '@playwright/test';
import { models, conversations, mockedShields } from '../fixtures/responses';
import { openLightspeed, switchToLocale } from './testHelper';
import {
  mockChatHistory,
  mockConversations,
  mockFeedbackStatus,
  mockMcpServers,
  mockModels,
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
  const enter = page.getByRole('button', { name: 'Enter' });
  await enter.click();
  await page.waitForTimeout(2000);

  if (process.env.APP_MODE !== 'nfs') {
    await page
      .getByRole('heading', { name: 'Red Hat Catalog' })
      .waitFor({ state: 'visible', timeout: 5_000 });
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

  await page.goto('/');
  await loginAsGuest(page);

  await switchToLocale(page, locale);
  await openLightspeed(page);

  return { page, locale, translations };
}
