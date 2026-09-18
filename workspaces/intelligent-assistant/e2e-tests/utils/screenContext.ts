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

import { expect, type Page } from '@playwright/test';
import type { LightspeedMessages } from './translations';
import { openChatbotSettings } from './chatManagement';

export const screenContextChip = (page: Page) =>
  page.locator('.lightspeed-page-context-label');

export const expectScreenContextChipHidden = async (page: Page) => {
  await expect(screenContextChip(page)).toHaveCount(0);
};

export const expectScreenContextRecordingVisible = async (page: Page) => {
  await expect(
    page.locator('.lightspeed-page-context-label-recording'),
  ).toBeVisible();
};

export const expectScreenContextPausedVisible = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await expect(
    page.getByText(translations['contextChip.label.paused']),
  ).toBeVisible();
};

export const expectScreenContextUnavailableVisible = async (
  page: Page,
  _translations: LightspeedMessages,
) => {
  await expect(
    page.locator('.lightspeed-page-context-label-unavailable'),
  ).toBeVisible({ timeout: 15_000 });
};

export const verifyEnableScreenContextOption = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await expect(
    page.getByRole('menuitem', {
      name: `${translations['settings.screenContext.enable']} ${translations['settings.screenContext.disabled.description']}`,
    }),
  ).toBeVisible();
};

export const verifyDisableScreenContextOption = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await expect(
    page.getByRole('menuitem', {
      name: `${translations['settings.screenContext.disable']} ${translations['settings.screenContext.enabled.description']}`,
    }),
  ).toBeVisible();
};

export const selectEnableScreenContext = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await page
    .getByRole('menuitem', {
      name: translations['settings.screenContext.enable'],
    })
    .click();
};

export const selectDisableScreenContext = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await page
    .getByRole('menuitem', {
      name: translations['settings.screenContext.disable'],
    })
    .click();
};

export const enableScreenContextViaKebab = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await openChatbotSettings(page, translations);
  await verifyEnableScreenContextOption(page, translations);
  await selectEnableScreenContext(page, translations);
  await expectScreenContextRecordingVisible(page);
};

export const disableScreenContextViaKebab = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await openChatbotSettings(page, translations);
  await verifyDisableScreenContextOption(page, translations);
  await selectDisableScreenContext(page, translations);
  await expectScreenContextChipHidden(page);
};

export const pauseScreenContextChip = async (page: Page) => {
  await page.locator('.lightspeed-page-context-label-recording').click();
};

export const resumeScreenContextChip = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await page.getByText(translations['contextChip.label.paused']).click();
};
