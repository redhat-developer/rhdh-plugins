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

import { test, expect, type Browser, type Page } from '@playwright/test';
import { TestUtils } from './utils/testUtils.js';
import { HomePageCustomization } from './pages/homePageCustomization.js';

/** Persona apps started by playwright.config.ts */
const PERSONA = {
  admin: {
    baseURL: 'http://localhost:3001',
    /** UI signal that group-gated defaults have loaded */
    readyWhenVisible: 'Featured Docs',
  },
  developer: {
    baseURL: 'http://localhost:3002',
    readyWhenVisible: 'Starred Catalog Entities',
  },
  overlap: {
    baseURL: 'http://localhost:3003',
    readyWhenVisible: 'Recently Visited',
  },
} as const;

type PersonaKey = keyof typeof PERSONA;

type PersonaCheck = {
  persona: PersonaKey;
  cardsVisible?: string[];
  cardsHidden?: string[];
  /** Exact visible count for a card title (e.g. Featured Docs must be 1, not 2) */
  cardCounts?: Array<{ text: string; count: number }>;
  searchVisible?: boolean;
};

type RuleCase = {
  name: string;
  checks: PersonaCheck[];
};

const VISIT_CARDS = ['Recently Visited', 'Top Visited'] as const;

const CASES: RuleCase[] = [
  {
    name: 'Starred: shown for developers-only, hidden when also in admins',
    checks: [
      {
        persona: 'developer',
        cardsVisible: ['Starred Catalog Entities'],
      },
      {
        persona: 'overlap',
        cardsHidden: ['Starred Catalog Entities'],
      },
    ],
  },
  {
    name: 'Search: shown for non-admins, hidden for admins',
    checks: [
      {
        persona: 'developer',
        searchVisible: true,
      },
      {
        persona: 'admin',
        searchVisible: false,
      },
    ],
  },
  {
    name: 'Visit cards: developers group sees them; developer-user is excluded',
    checks: [
      {
        persona: 'overlap',
        cardsVisible: [...VISIT_CARDS],
      },
      {
        persona: 'developer',
        cardsHidden: [...VISIT_CARDS],
      },
    ],
  },
  {
    name: 'Featured Docs: admins see group-gated card; tag=admin widget is denied for all',
    checks: [
      {
        persona: 'developer',
        cardsHidden: ['Featured Docs'],
      },
      {
        persona: 'admin',
        // Group if adds one Featured Docs; denied tag=admin must not add a second
        cardCounts: [{ text: 'Featured Docs', count: 1 }],
      },
    ],
  },
];

async function loadDefaultHome(
  page: Page,
  home: HomePageCustomization,
): Promise<void> {
  await home.clearHomeLayoutStorage();
  await page.goto('/');
  await home.verifyHomePageLoaded();
  await home.ensureDefaultWidgetsVisible();
}

async function withPersona(
  browser: Browser,
  persona: PersonaKey,
  run: (home: HomePageCustomization, page: Page) => Promise<void>,
): Promise<void> {
  const { baseURL, readyWhenVisible } = PERSONA[persona];
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();
  const home = new HomePageCustomization(page);

  try {
    await page.goto('/');
    await home.clearHomeLayoutStorage();
    await new TestUtils(page).loginAsGuest('/');

    // Reload until the persona's group-gated UI appears (no backend API calls)
    await expect
      .poll(
        async () => {
          await loadDefaultHome(page, home);
          return page
            .getByText(readyWhenVisible, { exact: true })
            .first()
            .isVisible()
            .catch(() => false);
        },
        {
          timeout: 60_000,
          message: `Timed out waiting for "${readyWhenVisible}" (group visibility not applied yet)`,
        },
      )
      .toBe(true);

    await run(home, page);
  } finally {
    await context.close();
  }
}

async function assertPersonaCheck(
  home: HomePageCustomization,
  page: Page,
  check: PersonaCheck,
): Promise<void> {
  for (const card of check.cardsVisible ?? []) {
    await home.verifyCardVisible(card);
  }
  for (const card of check.cardsHidden ?? []) {
    await home.verifyCardHidden(card);
  }
  for (const { text, count } of check.cardCounts ?? []) {
    await expect(page.getByText(text, { exact: true })).toHaveCount(count);
  }

  if (check.searchVisible !== undefined) {
    const search = page.getByPlaceholder('Search', { exact: true });
    if (check.searchVisible) {
      await expect(search).toBeVisible();
    } else {
      await expect(search).toBeHidden();
    }
  }
}

test.describe.configure({ mode: 'serial' });

test.describe('Unless and tag RBAC default widget rules (NFS)', () => {
  for (const ruleCase of CASES) {
    test(ruleCase.name, async ({ browser }) => {
      for (const check of ruleCase.checks) {
        await withPersona(browser, check.persona, (home, page) =>
          assertPersonaCheck(home, page, check),
        );
      }
    });
  }
});
