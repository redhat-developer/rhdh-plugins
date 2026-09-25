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

import { Page, expect } from '@playwright/test';
import { LightspeedMessages } from './translations';

/** Header control in overlay/docked modes (`aria.chatHistoryMenu`). */
export function chatHistoryMenuButton(page: Page, t: LightspeedMessages) {
  return page.getByRole('button', { name: t['aria.chatHistoryMenu'] });
}

/** Drawer panel close control (`aria.closeDrawerPanel`). */
export function chatHistoryDrawerCloseButton(
  page: Page,
  t: LightspeedMessages,
) {
  return page.getByRole('button', { name: t['aria.closeDrawerPanel'] });
}

/** Fullscreen collapsed strip expand control. */
export function expandChatHistoryButton(page: Page, t: LightspeedMessages) {
  return page.getByRole('button', { name: t['tooltip.expandHistoryPanel'] });
}

export async function isChatHistoryDrawerOpen(
  page: Page,
  t: LightspeedMessages,
): Promise<boolean> {
  return page
    .getByPlaceholder(t['chatbox.search.placeholder'])
    .isVisible()
    .catch(() => false);
}

export async function openChatHistoryDrawer(page: Page, t: LightspeedMessages) {
  if (await isChatHistoryDrawerOpen(page, t)) {
    return;
  }

  const menu = chatHistoryMenuButton(page, t);
  const expand = expandChatHistoryButton(page, t);

  await expect(menu.or(expand)).toBeVisible({ timeout: 10_000 });

  if (await menu.isVisible().catch(() => false)) {
    await menu.click();
  } else {
    await expand.click();
  }

  await expect(
    page.getByPlaceholder(t['chatbox.search.placeholder']),
  ).toBeVisible({ timeout: 5000 });
}

export async function closeChatHistoryDrawer(
  page: Page,
  t: LightspeedMessages,
) {
  if (!(await isChatHistoryDrawerOpen(page, t))) {
    return;
  }

  const drawerClose = chatHistoryDrawerCloseButton(page, t);
  if (await drawerClose.isVisible().catch(() => false)) {
    await drawerClose.click();
  } else {
    await chatHistoryMenuButton(page, t).click();
  }

  await expect(
    page.getByPlaceholder(t['chatbox.search.placeholder']),
  ).toBeHidden({ timeout: 5000 });
}
