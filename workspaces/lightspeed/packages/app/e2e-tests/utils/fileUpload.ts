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
import { Page, Locator, FileChooser, expect, TestInfo } from '@playwright/test';
import { LightspeedMessages } from './translations';
import { runAccessibilityTests } from './accessibility';

export const supportedFileTypes = ['.txt', '.yaml', '.json'];

export async function triggerFileChooser(
  page: Page,
  buttonLocator: Locator,
): Promise<FileChooser> {
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    buttonLocator.click(),
  ]);
  return fileChooser;
}

export async function uploadFiles(page: Page, filePath: string[]) {
  // button name stays the same, only tooltip is translated
  const attachButton = page.getByRole('button', { name: 'Attach' });
  await expect(attachButton).toBeVisible();

  const fileChooser = await triggerFileChooser(page, attachButton);
  await fileChooser.setFiles(filePath);
}

export async function uploadAndAssertDuplicate(
  page: Page,
  filePath: string,
  fileName: string,
  translations: LightspeedMessages,
  testInfo: TestInfo,
) {
  await validateSuccessfulUpload(page, fileName, translations, testInfo);
  await uploadFiles(page, [filePath]);
  await expect(
    page.getByRole('heading', {
      name: translations['chatbox.fileUpload.failed'],
    }),
  ).toBeVisible();
  await expect(
    page.getByText(translations['file.upload.error.alreadyExists']),
  ).toBeVisible();
}

export async function validateSuccessfulUpload(
  page: Page,
  fileName: string,
  translations: LightspeedMessages,
  testInfo: TestInfo,
) {
  const trimmerFilename = fileName.split('.')[0];

  await expect(page.getByRole('button', { name: fileName })).toBeVisible();

  const spanWithText = page
    .locator('span', { hasText: trimmerFilename })
    .first();
  await spanWithText.click();

  const jsonStarter = page.locator('div', { hasText: /^\{$/ }).first();
  await jsonStarter.waitFor();

  await expect(page.getByRole('banner')).toContainText(
    translations['modal.title.preview'],
  );
  await expect(
    page.getByRole('button', { name: translations['modal.edit'] }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('contentinfo')
      .getByRole('button', { name: translations['modal.close'] }),
  ).toBeVisible();

  await page.getByRole('button', { name: translations['modal.edit'] }).click();
  await runAccessibilityTests(page, testInfo);

  await expect(
    page.getByRole('button', { name: translations['modal.save'] }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: translations['modal.cancel'] }),
  ).toBeVisible();

  await page.getByRole('button', { name: translations['modal.save'] }).click();
  await page
    .getByRole('contentinfo')
    .locator(`role=button[name="${translations['modal.close']}"]`)
    .click();
}

export async function validateFailedUpload(
  page: Page,
  translations: LightspeedMessages,
) {
  const alertHeader = page.getByText(translations['chatbox.fileUpload.failed']);
  const alertText = page.getByText(
    translations['file.upload.error.unsupportedType'],
  );

  await expect(alertHeader).toBeVisible();
  await expect(alertText).toBeVisible();

  await page.getByRole('button', { name: 'Close Danger alert' }).click();
  await expect(alertHeader).toBeHidden();
  await expect(alertText).toBeHidden();
}

export async function assertVisibilityState(
  state: 'visible' | 'hidden',
  ...locators: Locator[]
) {
  for (const locator of locators) {
    await expect(locator)[state === 'visible' ? 'toBeVisible' : 'toBeHidden']();
  }
}
