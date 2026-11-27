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
import {
  clickPreferenceSwitch,
  closeSettingsPanel,
  openPreferencesFromOptionsMenu,
  preferenceSwitch,
} from './chatManagement';

/** Accessible-name prefix from `contextChip.aria.pause` (`Pause screen context: {{label}}`). */
const pauseScreenContextLabelPrefix = (translations: LightspeedMessages) =>
  translations['contextChip.aria.pause']
    .split('{{')[0]
    .replace(/:\s*$/, '')
    .trim();

export const screenContextChip = (page: Page) =>
  page.locator('.lightspeed-page-context-label');

export const screenContextPauseControl = (
  page: Page,
  translations: LightspeedMessages,
) => page.getByLabel(pauseScreenContextLabelPrefix(translations));

export const expectScreenContextChipHidden = async (page: Page) => {
  await expect(screenContextChip(page)).toHaveCount(0);
};

export const expectScreenContextRecordingVisible = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await expect(screenContextPauseControl(page, translations)).toBeVisible();
};

export const expectScreenContextPausedVisible = async (
  page: Page,
  _translations: LightspeedMessages,
) => {
  await expect(
    page.locator('.lightspeed-page-context-label-paused'),
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
    preferenceSwitch(
      page,
      translations['settings.preferences.screenContext.label'],
    ),
  ).not.toBeChecked();
};

export const verifyDisableScreenContextOption = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await expect(
    preferenceSwitch(
      page,
      translations['settings.preferences.screenContext.label'],
    ),
  ).toBeChecked();
};

export const selectEnableScreenContext = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await clickPreferenceSwitch(
    page,
    translations['settings.preferences.screenContext.label'],
  );
};

export const selectDisableScreenContext = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await clickPreferenceSwitch(
    page,
    translations['settings.preferences.screenContext.label'],
  );
};

export const enableScreenContextViaKebab = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await openPreferencesFromOptionsMenu(page, translations);
  await verifyEnableScreenContextOption(page, translations);
  await selectEnableScreenContext(page, translations);
  await closeSettingsPanel(page, translations);
  await expectScreenContextRecordingVisible(page, translations);
};

export const disableScreenContextViaKebab = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await openPreferencesFromOptionsMenu(page, translations);
  await verifyDisableScreenContextOption(page, translations);
  await selectDisableScreenContext(page, translations);
  await closeSettingsPanel(page, translations);
  await expectScreenContextChipHidden(page);
};

export const pauseScreenContextChip = async (
  page: Page,
  translations: LightspeedMessages,
) => {
  await screenContextPauseControl(page, translations).click();
};

export const resumeScreenContextChip = async (
  page: Page,
  _translations: LightspeedMessages,
) => {
  await page.locator('.lightspeed-page-context-label-paused').click();
};
