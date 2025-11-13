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
import { Page, Locator, FileChooser, expect } from '@playwright/test';

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
  const attachButton = page.getByRole('button', { name: 'Attach' });
  await expect(attachButton).toBeVisible();

  const fileChooser = await triggerFileChooser(page, attachButton);
  await fileChooser.setFiles(filePath);
}

export async function uploadAndAssertDuplicate(
  page: Page,
  filePath: string,
  fileName: string,
) {
  await validateSuccessfulUpload(page, fileName);
  await uploadFiles(page, [filePath]);
  await expect(
    page.getByRole('heading', { name: 'File upload failed' }),
  ).toBeVisible();
  await expect(page.getByText('File already exists.')).toBeVisible();
}

export async function validateSuccessfulUpload(page: Page, fileName: string) {
  const trimmerFilename = fileName.split('.')[0];

  await expect(page.getByRole('button', { name: fileName })).toBeVisible();

  const spanWithText = page
    .locator('span', { hasText: trimmerFilename })
    .first();
  await spanWithText.click();

  const jsonStarter = page.locator('div', { hasText: /^\{$/ }).first();
  await jsonStarter.waitFor();

  await expect(page.getByRole('banner')).toContainText('Preview attachment');
  await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible();
  await expect(
    page.getByRole('contentinfo').getByRole('button', { name: 'Close' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Edit' }).click();

  await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();

  await page.getByRole('button', { name: 'Save' }).click();
  await page
    .getByRole('contentinfo')
    .locator('role=button[name="Close"]')
    .click();
}

export async function validateFailedUpload(page: Page) {
  const alertHeader = page.getByText('File upload failed');
  const alertText = page.getByText(
    'Unsupported file type. Supported types are: .txt, .yaml, and .json.',
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
