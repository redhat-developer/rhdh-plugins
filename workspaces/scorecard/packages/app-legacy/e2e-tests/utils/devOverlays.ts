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

import type { Page } from '@playwright/test';

const HIDE_OVERLAY_STYLE_ID = 'scorecard-e2e-hide-react-refresh-overlay';

const HIDE_OVERLAY_CSS = `#react-refresh-overlay { display: none !important; pointer-events: none !important; }`;

/**
 * Run via `context.addInitScript(...)` so every document load hides the overlay early.
 * Use only string literals inside the function body so Playwright's serialization keeps them.
 */
export function installWebpackDevOverlayGuards(): void {
  const apply = () => {
    if (document.getElementById('scorecard-e2e-hide-react-refresh-overlay'))
      return;
    const style = document.createElement('style');
    style.id = 'scorecard-e2e-hide-react-refresh-overlay';
    style.textContent =
      '#react-refresh-overlay { display: none !important; pointer-events: none !important; }';
    (document.head ?? document.documentElement).appendChild(style);
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply, { once: true });
  } else {
    apply();
  }
}

/**
 * Webpack / react-refresh can inject an iframe overlay on top of the app that
 * intercepts pointer events. Playwright then retries clicks until the test times out.
 * The overlay can be re-injected (e.g. parallel workers + HMR), so we remove it and
 * ensure the hide rule exists (e.g. after in-app navigations that drop init-injected head).
 */
export async function dismissWebpackDevOverlay(page: Page): Promise<void> {
  await page.evaluate(
    ([styleId, css]) => {
      document.getElementById('react-refresh-overlay')?.remove();
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = css;
        (document.head ?? document.documentElement).appendChild(style);
      }
    },
    [HIDE_OVERLAY_STYLE_ID, HIDE_OVERLAY_CSS] as const,
  );
}
