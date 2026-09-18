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

import type { Attachment } from '../types';
import { extractPageContext } from './dom-extractor';
import {
  DIALOG_TITLE_SELECTOR,
  LEGACY_PAGE_TITLE_SELECTORS,
  MODAL_DIALOG_SELECTOR,
  PAGE_CHROME_ROOT_SELECTORS,
  PAGE_TITLE_SCOPED_SELECTORS,
  PLUGIN_HEADER_BREADCRUMBS_SELECTOR,
  PLUGIN_HEADER_TOOLBAR_NAME_SELECTOR,
  SEARCH_INPUT_SELECTOR,
  TEMPLATE_INFO_CARD_TITLE_SELECTORS,
} from './dom-selectors';
import { captureScreenshot } from './screen-capture';

export const SCREEN_CONTEXT_CHIP_MAX_LABEL_LENGTH = 40;

const SCREEN_CONTEXT_EXCLUDE_SELECTOR =
  '[data-screen-capture-exclude], .pf-chatbot';

const SEARCH_QUERY_PARAM_KEYS = ['query', 'term', 'q'] as const;

export type ScreenContextRouteKind = 'default' | 'template' | 'search';

export type ScreenContextTooltipLine2Key =
  | 'fullContext'
  | 'adminLimited'
  | 'screenshotOnly'
  | 'domOffNoVision'
  | 'textOnlyNoVision'
  | 'textOnlyAdminScreenshotsOff'
  | 'textOnlyCombined';

export type ShouldAttachScreenContextInput = {
  adminEnabled: boolean;
  sharingEnabled: boolean;
  paused: boolean;
  isFullscreen: boolean;
  domEnabled: boolean;
  screenshotsEnabled: boolean;
  supportsVision: boolean;
};

export type ShouldAttachScreenContextResult = {
  attachDom: boolean;
  attachScreenshot: boolean;
};

export type ResolvedScreenContextLabel = {
  label: string;
  routeKind: ScreenContextRouteKind;
  searchQuery?: string;
};

export function truncateChipLabel(
  label: string,
  maxLength = SCREEN_CONTEXT_CHIP_MAX_LABEL_LENGTH,
): string {
  const trimmed = label.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}

export function normalizeDocumentTitle(title: string): string {
  const trimmed = title.trim();
  const pipeIndex = trimmed.indexOf(' | ');
  if (pipeIndex > 0) {
    return trimmed.slice(0, pipeIndex).trim();
  }
  return trimmed;
}

export function isElementVisible(el: Element): boolean {
  if (!(el instanceof HTMLElement)) {
    return false;
  }
  if (el.closest(SCREEN_CONTEXT_EXCLUDE_SELECTOR)) {
    return false;
  }
  const style = window.getComputedStyle(el);
  if (el.hasAttribute('hidden')) {
    return false;
  }
  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    Number.parseFloat(style.opacity) === 0
  ) {
    return false;
  }
  return true;
}

function queryFirstVisibleTitle(
  root: ParentNode,
  selectors: readonly string[],
): string | undefined {
  for (const selector of selectors) {
    const elements = root.querySelectorAll(selector);
    for (const el of elements) {
      if (!isElementVisible(el)) {
        continue;
      }
      const text = el.textContent?.trim();
      if (text) {
        return text;
      }
    }
  }
  return undefined;
}

function getChromeRoots(doc: Document): ParentNode[] {
  const roots: ParentNode[] = [];
  for (const selector of PAGE_CHROME_ROOT_SELECTORS) {
    const node = doc.querySelector(selector);
    if (node && !roots.includes(node)) {
      roots.push(node);
    }
  }
  return roots.length > 0 ? roots : [doc];
}

/**
 * BUI plugin pages (e.g. Settings → General) use toolbar breadcrumbs instead of
 * HeaderTitle. Prefer the plugin name (visually hidden h1 or first crumb link).
 */
export function getPluginHeaderToolbarChipLabel(
  root: ParentNode = document,
): string | undefined {
  const toolbarName = root.querySelector(PLUGIN_HEADER_TOOLBAR_NAME_SELECTOR);
  if (!(toolbarName instanceof Element)) {
    return undefined;
  }
  if (toolbarName.closest(SCREEN_CONTEXT_EXCLUDE_SELECTOR)) {
    return undefined;
  }

  const breadcrumbs = toolbarName.querySelector(
    PLUGIN_HEADER_BREADCRUMBS_SELECTOR,
  );
  if (!breadcrumbs) {
    return undefined;
  }

  const breadcrumbItems = breadcrumbs.querySelectorAll(
    'li.react-aria-Breadcrumb, li[class*="Breadcrumb"]',
  );
  const hasNestedCrumbs = breadcrumbItems.length >= 2;

  const h1Text = toolbarName.querySelector('h1')?.textContent?.trim();
  if (h1Text) {
    return h1Text;
  }

  if (hasNestedCrumbs) {
    const firstLink = breadcrumbs.querySelector('a[href]');
    const linkText = firstLink?.textContent?.trim();
    if (linkText) {
      return linkText;
    }
  }

  const currentCrumb = breadcrumbs.querySelector(
    '[data-current="true"], [aria-current="page"]',
  );
  const currentText = currentCrumb?.textContent?.trim();
  if (currentText) {
    return currentText;
  }

  return undefined;
}

export function getPageTitleFromDom(doc: Document = document): string {
  const dialog = doc.querySelector(MODAL_DIALOG_SELECTOR);
  if (dialog) {
    const dialogTitle = dialog.querySelector(DIALOG_TITLE_SELECTOR);
    if (dialogTitle && isElementVisible(dialogTitle)) {
      const text = dialogTitle.textContent?.trim();
      if (text) {
        return text;
      }
    }
  }

  const roots = getChromeRoots(doc);
  for (const root of roots) {
    const buiTitle = queryFirstVisibleTitle(root, PAGE_TITLE_SCOPED_SELECTORS);
    if (buiTitle) {
      return buiTitle;
    }
    const pluginToolbarLabel = getPluginHeaderToolbarChipLabel(root);
    if (pluginToolbarLabel) {
      return pluginToolbarLabel;
    }
    const legacyTitle = queryFirstVisibleTitle(
      root,
      LEGACY_PAGE_TITLE_SELECTORS,
    );
    if (legacyTitle) {
      return legacyTitle;
    }
  }

  const normalized = normalizeDocumentTitle(doc.title);
  return normalized || 'Current page';
}

export function getScreenContextRouteKind(
  pathname: string,
  search: string,
): ScreenContextRouteKind {
  if (
    pathname.includes('/create/') ||
    pathname.includes('/template/') ||
    /\/template\/[^/]+/.test(pathname) ||
    (pathname.includes('/edit/') && pathname.includes('template'))
  ) {
    return 'template';
  }
  if (
    pathname.includes('/search') ||
    SEARCH_QUERY_PARAM_KEYS.some(key => new URLSearchParams(search).has(key)) ||
    search.includes('filters[') ||
    (pathname.includes('/catalog') && /[?&](query|term|filters\[)/.test(search))
  ) {
    return 'search';
  }
  return 'default';
}

export function getSearchQueryFromLocation(
  search: string,
  doc: Document = document,
): string | undefined {
  const params = new URLSearchParams(
    search.startsWith('?') ? search : `?${search}`,
  );
  for (const key of SEARCH_QUERY_PARAM_KEYS) {
    const fromUrl = params.get(key)?.trim();
    if (fromUrl) {
      return fromUrl;
    }
  }

  const inputs = doc.querySelectorAll(SEARCH_INPUT_SELECTOR);
  for (const input of inputs) {
    if (!(input instanceof HTMLInputElement)) {
      continue;
    }
    if (!isElementVisible(input)) {
      continue;
    }
    const fromInput = input.value?.trim();
    if (fromInput) {
      return fromInput;
    }
  }

  return undefined;
}

/** @deprecated Prefer resolveScreenContextChipLabel */
export function getSearchQueryFromPage(): string | undefined {
  return getSearchQueryFromLocation(window.location.search);
}

/** Chip label for `/create/templates` gallery (filters in query string). */
export const SOFTWARE_TEMPLATES_LIST_CHIP_LABEL = 'Software templates';

const SOFTWARE_TEMPLATES_GALLERY_PATH = '/create/templates';

function normalizePathname(pathname: string): string {
  const trimmed = pathname.trim();
  if (!trimmed || trimmed === '/') {
    return '/';
  }
  return trimmed.replace(/\/+$/, '') || '/';
}

export function isSoftwareTemplatesListPath(pathname: string): boolean {
  return normalizePathname(pathname) === SOFTWARE_TEMPLATES_GALLERY_PATH;
}

export function parseSoftwareTemplateDetailSlug(
  pathname: string,
): string | undefined {
  const normalized = normalizePathname(pathname);
  const prefix = `${SOFTWARE_TEMPLATES_GALLERY_PATH}/`;
  if (!normalized.startsWith(prefix)) {
    return undefined;
  }
  const segments = normalized.slice(prefix.length).split('/').filter(Boolean);
  if (segments.length < 2) {
    return undefined;
  }
  return segments[segments.length - 1];
}

export function getSoftwareTemplateTitleFromDom(
  doc: Document = document,
): string | undefined {
  const roots = getChromeRoots(doc);
  for (const root of roots) {
    const title = queryFirstVisibleTitle(
      root,
      TEMPLATE_INFO_CARD_TITLE_SELECTORS,
    );
    if (title) {
      return title;
    }
  }
  return undefined;
}

/**
 * Resolves chip text for software template gallery and template entity pages.
 */
export function resolveSoftwareTemplateChipLabel(
  pathname: string,
  doc: Document = document,
): string | undefined {
  if (isSoftwareTemplatesListPath(pathname)) {
    return SOFTWARE_TEMPLATES_LIST_CHIP_LABEL;
  }
  const slug = parseSoftwareTemplateDetailSlug(pathname);
  if (!slug) {
    return undefined;
  }
  return getSoftwareTemplateTitleFromDom(doc) ?? slug;
}

export function resolveScreenContextChipLabel(options: {
  pathname: string;
  search: string;
  document?: Document;
}): ResolvedScreenContextLabel {
  const doc = options.document ?? document;
  const routeKind = getScreenContextRouteKind(options.pathname, options.search);

  if (routeKind === 'search') {
    const searchQuery = getSearchQueryFromLocation(options.search, doc);
    if (searchQuery) {
      return {
        label: truncateChipLabel(searchQuery),
        routeKind,
        searchQuery,
      };
    }
  }

  if (routeKind === 'template') {
    const softwareTemplateLabel = resolveSoftwareTemplateChipLabel(
      options.pathname,
      doc,
    );
    if (softwareTemplateLabel) {
      return {
        label: truncateChipLabel(softwareTemplateLabel),
        routeKind,
      };
    }
  }

  const pageTitle = getPageTitleFromDom(doc);
  return {
    label: truncateChipLabel(pageTitle),
    routeKind,
    searchQuery:
      routeKind === 'search'
        ? getSearchQueryFromLocation(options.search, doc)
        : undefined,
  };
}

export function getScreenContextChipLabel(): string {
  return resolveScreenContextChipLabel({
    pathname: window.location.pathname,
    search: window.location.search,
  }).label;
}

export type TooltipLine1Params = {
  chipLabel: string;
  routeKind: ScreenContextRouteKind;
  pathname?: string;
  searchQuery?: string;
};

export function getScreenContextTooltipLine1Key(
  routeKind: ScreenContextRouteKind,
  pathname?: string,
):
  | 'contextChip.tooltip.askAbout'
  | 'contextChip.tooltip.template'
  | 'contextChip.tooltip.search' {
  switch (routeKind) {
    case 'template':
      if (pathname && isSoftwareTemplatesListPath(pathname)) {
        return 'contextChip.tooltip.askAbout';
      }
      return 'contextChip.tooltip.template';
    case 'search':
      return 'contextChip.tooltip.search';
    default:
      return 'contextChip.tooltip.askAbout';
  }
}

export function getScreenContextTooltipLine1Text(
  params: TooltipLine1Params,
  t: (key: string, options?: Record<string, string>) => string,
): string {
  const label = params.chipLabel;
  const key = getScreenContextTooltipLine1Key(
    params.routeKind,
    params.pathname,
  );
  return t(key, { label });
}

export type TooltipLine2Input = {
  domEnabled: boolean;
  screenshotsEnabled: boolean;
  supportsVision: boolean;
};

export function getScreenContextTooltipLine2Key(
  input: TooltipLine2Input,
): ScreenContextTooltipLine2Key {
  const { domEnabled, screenshotsEnabled, supportsVision } = input;

  const willSendDom = domEnabled;
  const willSendScreenshot = screenshotsEnabled && supportsVision;

  if (willSendDom && willSendScreenshot) {
    return 'fullContext';
  }

  if (!domEnabled && !screenshotsEnabled) {
    return 'adminLimited';
  }

  if (!domEnabled && screenshotsEnabled && supportsVision) {
    return 'screenshotOnly';
  }

  if (willSendDom) {
    const adminOff = !screenshotsEnabled;
    const noVision = !supportsVision;
    if (adminOff && noVision) {
      return 'textOnlyCombined';
    }
    if (noVision) {
      return 'textOnlyNoVision';
    }
    if (adminOff) {
      return 'textOnlyAdminScreenshotsOff';
    }
  }

  // DOM off, screenshots on, but model lacks vision — nothing attaches.
  if (!domEnabled && screenshotsEnabled && !supportsVision) {
    return 'domOffNoVision';
  }

  return 'adminLimited';
}

export function shouldAttachScreenContext(
  input: ShouldAttachScreenContextInput,
): ShouldAttachScreenContextResult {
  const baseGate =
    input.adminEnabled &&
    input.sharingEnabled &&
    !input.paused &&
    !input.isFullscreen;

  if (!baseGate) {
    return { attachDom: false, attachScreenshot: false };
  }

  return {
    attachDom: input.domEnabled,
    attachScreenshot: input.screenshotsEnabled && input.supportsVision,
  };
}

export type BuildScreenContextAttachmentsInput =
  ShouldAttachScreenContextInput & {
    domExtractionMaxChars: number;
  };

export async function buildScreenContextAttachments(
  input: BuildScreenContextAttachmentsInput,
): Promise<Attachment[]> {
  const { attachDom, attachScreenshot } = shouldAttachScreenContext(input);
  const attachments: Attachment[] = [];

  if (attachDom) {
    try {
      const domContext = extractPageContext({
        maxChars: input.domExtractionMaxChars,
      });
      if (domContext) {
        attachments.push({
          attachment_type: 'configuration',
          content_type: 'text/plain',
          content: domContext,
        });
      }
    } catch {
      // non-fatal
    }
  }

  if (attachScreenshot) {
    const result = await captureScreenshot({
      excludeSelector: '[data-screen-capture-exclude]',
    });
    if (result.success) {
      attachments.push({
        attachment_type: 'image',
        content_type: result.contentType,
        content: result.base64,
      });
    }
  }

  return attachments;
}
