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

import {
  getPageTitleFromDom,
  getScreenContextRouteKind,
  getScreenContextTooltipLine1Text,
  getScreenContextTooltipLine2Key,
  getSearchQueryFromLocation,
  normalizeDocumentTitle,
  resolveScreenContextChipLabel,
  shouldAttachScreenContext,
  truncateChipLabel,
} from '../screen-context-utils';

describe('screen-context-utils', () => {
  describe('truncateChipLabel', () => {
    it('truncates long labels with ellipsis', () => {
      const long = 'A'.repeat(50);
      expect(truncateChipLabel(long, 40)).toHaveLength(40);
      expect(truncateChipLabel(long, 40).endsWith('…')).toBe(true);
    });
  });

  describe('normalizeDocumentTitle', () => {
    it('strips app suffix after pipe', () => {
      expect(normalizeDocumentTitle('My Service | Red Hat Developer Hub')).toBe(
        'My Service',
      );
    });
  });

  describe('getScreenContextRouteKind', () => {
    it('detects template routes', () => {
      expect(getScreenContextRouteKind('/catalog/create/template', '')).toBe(
        'template',
      );
      expect(
        getScreenContextRouteKind('/catalog/default/template/foo', ''),
      ).toBe('template');
    });

    it('detects search routes', () => {
      expect(getScreenContextRouteKind('/search', '?query=foo')).toBe('search');
      expect(
        getScreenContextRouteKind('/catalog', '?filters[kind]=component'),
      ).toBe('search');
    });
  });

  describe('getPageTitleFromDom', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
      document.title = '';
    });

    it('prefers visible BUI title inside main over chatbot title', () => {
      document.body.innerHTML = `
        <div id="root">
          <main>
            <h2 class="bui-HeaderTitle">Prototype — Sample documentation</h2>
          </main>
        </div>
        <div class="pf-chatbot" data-screen-capture-exclude>
          <h2 class="bui-HeaderTitle">Lightspeed</h2>
        </div>
      `;
      expect(getPageTitleFromDom()).toBe('Prototype — Sample documentation');
    });

    it('falls back to legacy header title', () => {
      document.body.innerHTML = `
        <main class="BackstagePage-root">
          <header><h1 class="Header-title-123">Search</h1></header>
        </main>
      `;
      expect(getPageTitleFromDom()).toBe('Search');
    });

    it('uses dialog title when modal is open', () => {
      document.body.innerHTML = `
        <main><h2 class="bui-HeaderTitle">Background Page</h2></main>
        <div role="dialog" aria-modal="true">
          <h2 class="bui-DialogHeaderTitle">Confirm delete</h2>
        </div>
      `;
      expect(getPageTitleFromDom()).toBe('Confirm delete');
    });
  });

  describe('getSearchQueryFromLocation', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
    });

    it('reads query from URL params', () => {
      expect(getSearchQueryFromLocation('?query=my-service')).toBe(
        'my-service',
      );
      expect(getSearchQueryFromLocation('?term=backend')).toBe('backend');
    });

    it('reads query from visible search input', () => {
      document.body.innerHTML = `
        <input aria-label="Search" value="catalog entity" />
      `;
      expect(getSearchQueryFromLocation('')).toBe('catalog entity');
    });
  });

  describe('resolveScreenContextChipLabel', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
      document.title = '';
    });

    it('uses search query as chip label on search routes', () => {
      const result = resolveScreenContextChipLabel({
        pathname: '/search',
        search: '?query=payments-api',
      });
      expect(result.routeKind).toBe('search');
      expect(result.label).toBe('payments-api');
      expect(result.searchQuery).toBe('payments-api');
    });

    it('uses scoped page title for default routes', () => {
      document.body.innerHTML = `
        <div id="root">
          <main>
            <h2 class="bui-HeaderTitle">backstage</h2>
          </main>
        </div>
      `;
      const result = resolveScreenContextChipLabel({
        pathname: '/catalog/default/component/backstage',
        search: '',
      });
      expect(result.routeKind).toBe('default');
      expect(result.label).toBe('backstage');
    });

    it('uses plugin toolbar name when settings breadcrumbs are present', () => {
      document.body.innerHTML = `
        <div id="root">
          <main>
            <div class="bui-PluginHeaderToolbar" data-has-tabs="">
              <div class="bui-PluginHeaderToolbarName PluginHeader_bui-PluginHeaderToolbarName__hash">
                <div class="bui-VisuallyHidden">
                  <h1>Settings</h1>
                </div>
                <nav id="Breadcrumbs" aria-label="Breadcrumbs" class="bui-PluginHeaderBreadcrumbs">
                  <ol aria-label="Breadcrumbs" class="react-aria-Breadcrumbs">
                    <li class="react-aria-Breadcrumb">
                      <a href="/settings">Settings</a>
                    </li>
                    <li class="react-aria-Breadcrumb" data-current="true">
                      <span>General</span>
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </main>
        </div>
      `;
      const result = resolveScreenContextChipLabel({
        pathname: '/settings/general',
        search: '',
      });
      expect(result.label).toBe('Settings');
    });

    it('uses Software templates on template gallery with filters', () => {
      const result = resolveScreenContextChipLabel({
        pathname: '/create/templates',
        search: '?filters%5Bkind%5D=template&filters%5Buser%5D=all',
      });
      expect(result.routeKind).toBe('template');
      expect(result.label).toBe('Software templates');
    });

    it('uses URL slug on software template detail when card title is absent', () => {
      const result = resolveScreenContextChipLabel({
        pathname: '/create/templates/default/argocd-template',
        search: '',
      });
      expect(result.routeKind).toBe('template');
      expect(result.label).toBe('argocd-template');
    });

    it('prefers info card title on software template detail page', () => {
      document.body.innerHTML = `
        <div id="root">
          <main>
            <div class="MuiCardHeader-content BackstageInfoCard-headerContent-2418">
              <h2 class="MuiTypography-root MuiCardHeader-title BackstageInfoCard-headerTitle-2414">
                Ansible Job Template
              </h2>
            </div>
          </main>
        </div>
      `;
      const result = resolveScreenContextChipLabel({
        pathname: '/create/templates/default/argocd-template',
        search: '',
      });
      expect(result.label).toBe('Ansible Job Template');
    });

    it('uses template header title on template routes', () => {
      document.body.innerHTML = `
        <div id="root">
          <main>
            <h2 class="bui-HeaderTitle">Node.js template</h2>
          </main>
        </div>
      `;
      const result = resolveScreenContextChipLabel({
        pathname: '/create/tasks/default/template/nodejs',
        search: '',
      });
      expect(result.routeKind).toBe('template');
      expect(result.label).toBe('Node.js template');
    });
  });

  describe('getScreenContextTooltipLine1Text', () => {
    it('uses search tooltip copy on search routes', () => {
      const text = getScreenContextTooltipLine1Text(
        { chipLabel: 'api', routeKind: 'search' },
        (key, options) => `${key}:${options?.label}`,
      );
      expect(text).toBe('contextChip.tooltip.search:api');
    });

    it('uses template tooltip on software template detail', () => {
      const text = getScreenContextTooltipLine1Text(
        {
          chipLabel: 'argocd-template',
          routeKind: 'template',
          pathname: '/create/templates/default/argocd-template',
        },
        (key, options) => `${key}:${options?.label}`,
      );
      expect(text).toBe('contextChip.tooltip.template:argocd-template');
    });

    it('uses askAbout tooltip on software template gallery', () => {
      const text = getScreenContextTooltipLine1Text(
        {
          chipLabel: 'Software templates',
          routeKind: 'template',
          pathname: '/create/templates',
        },
        (key, options) => `${key}:${options?.label}`,
      );
      expect(text).toBe('contextChip.tooltip.askAbout:Software templates');
    });
  });

  describe('getScreenContextTooltipLine2Key', () => {
    it('returns fullContext when dom and screenshot will be sent', () => {
      expect(
        getScreenContextTooltipLine2Key({
          domEnabled: true,
          screenshotsEnabled: true,
          supportsVision: true,
        }),
      ).toBe('fullContext');
    });

    it('returns textOnlyNoVision when model lacks vision', () => {
      expect(
        getScreenContextTooltipLine2Key({
          domEnabled: true,
          screenshotsEnabled: true,
          supportsVision: false,
        }),
      ).toBe('textOnlyNoVision');
    });

    it('returns screenshotOnly when dom disabled but vision on', () => {
      expect(
        getScreenContextTooltipLine2Key({
          domEnabled: false,
          screenshotsEnabled: true,
          supportsVision: true,
        }),
      ).toBe('screenshotOnly');
    });
  });

  describe('shouldAttachScreenContext', () => {
    it('attaches nothing when paused', () => {
      expect(
        shouldAttachScreenContext({
          adminEnabled: true,
          sharingEnabled: true,
          paused: true,
          isFullscreen: false,
          domEnabled: true,
          screenshotsEnabled: true,
          supportsVision: true,
        }),
      ).toEqual({ attachDom: false, attachScreenshot: false });
    });

    it('attaches dom and screenshot when all gates pass', () => {
      expect(
        shouldAttachScreenContext({
          adminEnabled: true,
          sharingEnabled: true,
          paused: false,
          isFullscreen: false,
          domEnabled: true,
          screenshotsEnabled: true,
          supportsVision: true,
        }),
      ).toEqual({ attachDom: true, attachScreenshot: true });
    });

    it('attaches screenshot without dom when dom disabled', () => {
      expect(
        shouldAttachScreenContext({
          adminEnabled: true,
          sharingEnabled: true,
          paused: false,
          isFullscreen: false,
          domEnabled: false,
          screenshotsEnabled: true,
          supportsVision: true,
        }),
      ).toEqual({ attachDom: false, attachScreenshot: true });
    });
  });
});
