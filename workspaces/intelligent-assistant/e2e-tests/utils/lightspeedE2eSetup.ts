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
  mockSavedPrompts,
  mockShields,
} from './devMode';
import {
  installIaPermissionsMock,
  waitForIaPermissionAuthorize,
  type IaPermissionMatrix,
} from './iaPermissionsE2e';
import { getTranslations, type LightspeedMessages } from './translations';

/** Default user message used by the shared query mock in Lightspeed e2e. */
export const LIGHTSPEED_E2E_DEFAULT_BOT_QUERY = 'Please respond';

export type LightspeedE2eBootstrap = {
  page: Page;
  locale: string;
  translations: LightspeedMessages;
};

export type BootstrapLightspeedE2eOptions = {
  /** When false, stay on catalog after guest login (overlay/FAB tests). Default true. */
  openFullscreenChat?: boolean;
};

async function waitForLoggedInShell(page: Page) {
  const enter = page.getByRole('button', { name: 'Enter' });
  const legacyMain = page.locator('main[class*="BackstagePage-root"]').first();
  const nfsCatalogTitle = page.locator('.bui-HeaderTitle').first();
  const settings = page.getByRole('link', { name: 'Settings' });
  const deadline = Date.now() + 15_000;

  while (Date.now() < deadline) {
    // Never treat the sign-in page as logged-in (NFS can render titles there).
    if (await enter.isVisible().catch(() => false)) {
      await page.waitForTimeout(250);
      continue;
    }
    if (await legacyMain.isVisible().catch(() => false)) {
      return;
    }
    if (await nfsCatalogTitle.isVisible().catch(() => false)) {
      return;
    }
    if (await settings.isVisible().catch(() => false)) {
      return;
    }
    await page.waitForTimeout(250);
  }

  throw new Error('Timed out waiting for logged-in app shell');
}

/** RBAC e2e uses dedicated backend port 7008 — wait until it accepts requests. */
async function waitForRbacBackendReady(page: Page): Promise<void> {
  const backendBase =
    process.env.PLAYWRIGHT_BACKEND_URL ?? 'http://localhost:7008';
  const deadline = Date.now() + 120_000;

  while (Date.now() < deadline) {
    const status = await page.request
      .get(`${backendBase}/api/catalog/entities`)
      .then(response => response.status())
      .catch(() => 0);
    // 401 = up but unauthenticated; 200 = up with guest/cookie already set.
    if (status === 200 || status === 401) {
      return;
    }
    await page.waitForTimeout(500);
  }

  throw new Error(`RBAC e2e backend not ready at ${backendBase}`);
}

export async function loginAsGuest(page: Page) {
  const enter = page.getByRole('button', { name: 'Enter' });
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (await enter.isVisible().catch(() => false)) {
        await enter.click();
        await enter
          .waitFor({ state: 'hidden', timeout: 15_000 })
          .catch(() => {});
      }
      await waitForLoggedInShell(page);
      return;
    } catch {
      if (attempt === maxAttempts) throw new Error('loginAsGuest failed');
      await page.goto('/catalog');
      await page.waitForTimeout(2000);
    }
  }
}

async function setupLightspeedApiMocks(page: Page) {
  await mockModels(page, models);
  await mockConversations(page);
  await mockChatHistory(page);
  await mockQuery(page, LIGHTSPEED_E2E_DEFAULT_BOT_QUERY, conversations);
  await mockShields(page, mockedShields);
  await mockMcpServers(page);
  await mockFeedbackStatus(page);
  await mockSavedPrompts(page);
  await mockNotebookLightspeedBackend(page);
}

/**
 * One logged-in Lightspeed session with the same dev-mode mocks as the legacy
 * monolithic suite. Each Playwright test file should call this from `beforeAll`.
 */
export async function bootstrapLightspeedE2ePage(
  browser: Browser,
  options: BootstrapLightspeedE2eOptions = {},
): Promise<LightspeedE2eBootstrap> {
  const { openFullscreenChat = true } = options;
  const context = await browser.newContext();
  const page = await context.newPage();
  const locale = await page.evaluate(() => globalThis.navigator.language);
  const translations = getTranslations(locale);

  await setupLightspeedApiMocks(page);

  await page.goto('/catalog');
  await loginAsGuest(page);

  await switchToLocale(page, locale);
  if (openFullscreenChat) {
    await openLightspeed(page);
  }

  return { page, locale, translations };
}

/**
 * Guest session with IA API mocks and a fixed permission matrix.
 * Installs the authorize mock on the browser context before any navigation.
 */
export async function bootstrapLightspeedRbacE2ePage(
  browser: Browser,
  permissions: IaPermissionMatrix,
): Promise<LightspeedE2eBootstrap> {
  const context = await browser.newContext({ locale: 'en-US' });
  await installIaPermissionsMock(context, permissions);

  const page = await context.newPage();
  const translations = getTranslations('en');

  await setupLightspeedApiMocks(page);

  await waitForRbacBackendReady(page);

  // Arm before navigation so the authorize response cannot race past the waiter.
  const authorizeSettled = waitForIaPermissionAuthorize(page);
  await page.goto('/');
  await loginAsGuest(page);
  await authorizeSettled;

  return { page, locale: 'en', translations };
}
