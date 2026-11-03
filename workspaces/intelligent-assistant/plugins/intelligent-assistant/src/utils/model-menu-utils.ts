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

/** Right gap from the chat panel edge for the open model menu (RHDHBUGS-4005). */
const MENU_PANEL_RIGHT_MARGIN_PX = 16;

/** Portaled menu host — keep under `.pf-chatbot` for correct item padding. */
const MENU_APPEND_SELECTOR = ['.pf-chatbot', '.pf-chatbot-container'].join(
  ', ',
);

/**
 * Prefer drawer / overlay for the right-edge bound; `.pf-chatbot` is nested
 * inside those so a single `closest(a, b)` would always pick the chatbot.
 */
const MENU_BOUND_SELECTORS = [
  '[class*="MuiDrawer-paper"]',
  '.ia-overlay-chatbot-modal',
  '.pf-chatbot',
  '.pf-chatbot-container',
] as const;

function getChatShellElement(
  from: HTMLElement | null,
): HTMLElement | undefined {
  if (!from?.closest) {
    return undefined;
  }
  for (const selector of MENU_BOUND_SELECTORS) {
    const el = from.closest(selector) as HTMLElement | null;
    if (el) {
      return el;
    }
  }
  return undefined;
}

/** Max width so the menu's right edge stays inside the chat panel. */
export function getMenuMaxWidthPx(
  from: HTMLElement | null,
): number | undefined {
  if (!from || typeof from.getBoundingClientRect !== 'function') {
    return undefined;
  }

  const anchorRect = from.getBoundingClientRect();
  const shell = getChatShellElement(from);

  if (shell) {
    const width =
      shell.getBoundingClientRect().right -
      anchorRect.left -
      MENU_PANEL_RIGHT_MARGIN_PX;
    if (width > 0) {
      return Math.floor(width);
    }
  }

  const toViewportRight =
    (typeof window !== 'undefined' ? window.innerWidth : 0) -
    anchorRect.left -
    MENU_PANEL_RIGHT_MARGIN_PX;
  return toViewportRight > 0 ? Math.floor(toViewportRight) : undefined;
}

/** Append target for the model menu (`document.body` if no chatbot host). */
export function getMenuAppendTo(from: HTMLElement | null): HTMLElement {
  if (!from?.closest) {
    return document.body;
  }
  return (
    (from.closest(MENU_APPEND_SELECTOR) as HTMLElement | null) ?? document.body
  );
}

/** `onMouseEnter`: set `title` only when CSS ellipsis clips the label. */
export function setTitleIfClipped(event: { currentTarget: HTMLElement }): void {
  const el = event.currentTarget;
  el.title = el.scrollWidth > el.clientWidth ? (el.textContent ?? '') : '';
}
