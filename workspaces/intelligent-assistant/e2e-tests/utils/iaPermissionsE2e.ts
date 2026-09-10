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

import type { BrowserContext, Page } from '@playwright/test';

export type IaPermissionMatrix = {
  chat: boolean;
  notebooks: boolean;
  mcp: boolean;
};

export const IA_PERMISSIONS_ALL_ALLOWED: IaPermissionMatrix = {
  chat: true,
  notebooks: true,
  mcp: true,
};

const IA_PERMISSION_AUTHORIZE_ROUTE = '**/api/permission/authorize';

const IA_PERMISSION_NAMES = {
  chat: 'intelligent-assistant.chat',
  notebooks: 'intelligent-assistant.notebooks',
  mcp: 'intelligent-assistant.mcp.tools',
  skills: 'intelligent-assistant.skills',
} as const;

const IA_PERMISSION_NAME_SET = new Set<string>(
  Object.values(IA_PERMISSION_NAMES),
);

function isIaPermissionName(name: string | undefined): boolean {
  return name !== undefined && IA_PERMISSION_NAME_SET.has(name);
}

function isIaPermissionAllowed(
  permissionName: string | undefined,
  matrix: IaPermissionMatrix,
): boolean {
  switch (permissionName) {
    case IA_PERMISSION_NAMES.chat:
      return matrix.chat;
    case IA_PERMISSION_NAMES.notebooks:
      return matrix.notebooks;
    case IA_PERMISSION_NAMES.mcp:
      return matrix.mcp;
    case IA_PERMISSION_NAMES.skills:
      return false;
    default:
      return true;
  }
}

type AuthorizeRequestItem = {
  id: string;
  permission?: { name?: string };
};

/**
 * Install before the first page is created on the context. Intercepts IA
 * permission checks while allowing other authorize items through as ALLOW.
 */
export async function installIaPermissionsMock(
  context: BrowserContext,
  matrix: IaPermissionMatrix,
): Promise<void> {
  const matrixRef = { current: matrix };

  await context.route(IA_PERMISSION_AUTHORIZE_ROUTE, async route => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }

    let body: { items?: AuthorizeRequestItem[] };
    try {
      body = route.request().postDataJSON() as {
        items?: AuthorizeRequestItem[];
      };
    } catch {
      await route.continue();
      return;
    }

    const items = body?.items ?? [];
    const touchesIaPermission = items.some(item =>
      isIaPermissionName(item.permission?.name),
    );

    if (!touchesIaPermission) {
      await route.continue();
      return;
    }

    const activeMatrix = matrixRef.current;
    await route.fulfill({
      json: {
        items: items.map(item => {
          const permissionName = item.permission?.name;
          const result =
            isIaPermissionName(permissionName) &&
            !isIaPermissionAllowed(permissionName, activeMatrix)
              ? 'DENY'
              : 'ALLOW';
          return { id: item.id, result };
        }),
      },
    });
  });
}

/** Wait until the FAB has resolved IA permission checks on the catalog page. */
export async function waitForIaPermissionAuthorize(page: Page): Promise<void> {
  await page.waitForResponse(
    response =>
      response.url().includes('/api/permission/authorize') &&
      response.request().method() === 'POST',
    { timeout: 30_000 },
  );
}
