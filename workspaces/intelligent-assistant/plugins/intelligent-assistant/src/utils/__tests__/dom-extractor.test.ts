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

import { extractPageContext } from '../dom-extractor';
import { redactText } from '../sensitive-data-redactor';

jest.mock('../sensitive-data-redactor', () => ({
  redactText: jest.fn(text => text),
}));

const mockRedactText = redactText as unknown as jest.Mock;

function setRootHtml(html: string) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = html;
  } else {
    const el = document.createElement('div');
    el.id = 'root';
    el.innerHTML = html;
    document.body.appendChild(el);
  }
}

describe('extractPageContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
    document.body.className = '';
  });

  // ── Basics ──

  it('should return empty string when #root is not present', () => {
    const result = extractPageContext();
    expect(result).toBe('');
  });

  it('should include page header with pathname and document title', () => {
    setRootHtml('<p>Hello world</p>');
    const result = extractPageContext();

    expect(result).toContain('Page:');
    expect(result).toContain('Document:');
  });

  it('should handle empty #root gracefully', () => {
    setRootHtml('');
    const result = extractPageContext();

    expect(result).toContain('Page:');
  });

  it('should respect maxChars budget and truncate', () => {
    const longContent = 'A'.repeat(500);
    setRootHtml(`
      <h1>Title</h1>
      <p>${longContent}</p>
    `);
    const result = extractPageContext({ maxChars: 200 });

    expect(result.length).toBeLessThanOrEqual(200);
  });

  it('should call redactText on the final output', () => {
    mockRedactText.mockImplementation(text =>
      text.replace(/secret-token/g, '[REDACTED]'),
    );
    setRootHtml('<p>My secret-token is here</p>');
    const result = extractPageContext();

    expect(mockRedactText).toHaveBeenCalled();
    expect(result).toContain('[REDACTED]');
    expect(result).not.toContain('secret-token');
  });

  // ── NOISE_SELECTOR ──

  it('should remove noise elements before extraction', () => {
    setRootHtml(`
      <div class="pf-chatbot">Chat UI content</div>
      <script>var x = 1;</script>
      <style>.foo { color: red; }</style>
      <svg><text>SVG text</text></svg>
      <p>Visible content</p>
    `);
    const result = extractPageContext();

    expect(result).not.toContain('Chat UI content');
    expect(result).not.toContain('var x = 1');
    expect(result).not.toContain('color: red');
    expect(result).not.toContain('SVG text');
    expect(result).toContain('Visible content');
  });

  it('should remove [hidden] elements', () => {
    setRootHtml(`
      <div hidden>Hidden content</div>
      <p>Shown content</p>
    `);
    const result = extractPageContext();

    expect(result).not.toContain('Hidden content');
    expect(result).toContain('Shown content');
  });

  it('should remove footer elements', () => {
    setRootHtml(`
      <p>Main content</p>
      <footer>Footer links and copyright</footer>
    `);
    const result = extractPageContext();

    expect(result).not.toContain('Footer links');
    expect(result).toContain('Main content');
  });

  it('should remove collapsed accordion content (.MuiCollapse-hidden)', () => {
    setRootHtml(`
      <div class="MuiCollapse-hidden">Collapsed panel text</div>
      <p>Visible panel text</p>
    `);
    const result = extractPageContext();

    expect(result).not.toContain('Collapsed panel text');
    expect(result).toContain('Visible panel text');
  });

  it('should preserve Status components with aria-hidden="true"', () => {
    setRootHtml(`
      <span aria-hidden="true" aria-label="Status ok">Running</span>
      <div aria-hidden="true">Decorative icon</div>
      <p>Other content</p>
    `);
    const result = extractPageContext();

    expect(result).not.toContain('Decorative icon');
    expect(result).toContain('ok: Running');
  });

  it('should remove elements matching custom excludeSelector', () => {
    setRootHtml(`
      <div class="sidebar">Sidebar nav</div>
      <p>Main content</p>
    `);
    const result = extractPageContext({ excludeSelector: '.sidebar' });

    expect(result).not.toContain('Sidebar nav');
    expect(result).toContain('Main content');
  });

  it('should remove data-screen-capture-exclude elements', () => {
    setRootHtml(`
      <div data-screen-capture-exclude>Excluded widget</div>
      <p>Included content</p>
    `);
    const result = extractPageContext();

    expect(result).not.toContain('Excluded widget');
    expect(result).toContain('Included content');
  });

  // ── Header ──

  it('should extract plugin name from BUI header toolbar', () => {
    setRootHtml(`
      <h1 class="bui-PluginHeaderToolbarName"><a href="/settings">Settings</a></h1>
      <p>Page content</p>
    `);
    const result = extractPageContext();

    expect(result).toContain('Plugin: Settings');
  });

  it('should extract page title from BUI header title', () => {
    setRootHtml(`
      <h2 class="bui-HeaderTitle">Red Hat Catalog</h2>
      <p>Catalog items</p>
    `);
    const result = extractPageContext();

    expect(result).toContain('Title: Red Hat Catalog');
  });

  it('should extract active tab from aria-selected tab', () => {
    setRootHtml(`
      <div role="tablist">
        <a role="tab" aria-selected="false">Tree</a>
        <a role="tab" aria-selected="true">Text</a>
        <a role="tab" aria-selected="false">Detailed</a>
      </div>
      <p>Tab content</p>
    `);
    const result = extractPageContext();

    expect(result).toContain('Tab: Text');
  });

  it('should not include Plugin/Title/Tab lines when elements are absent', () => {
    setRootHtml('<p>Simple page</p>');
    const result = extractPageContext();

    expect(result).not.toContain('Plugin:');
    expect(result).not.toContain('Title:');
    expect(result).not.toContain('Tab:');
  });

  it('should extract breadcrumbs from legacy aria-label="breadcrumb"', () => {
    setRootHtml(`
      <nav aria-label="breadcrumb">
        <a href="/home">Home</a>
        <a href="/catalog">Catalog</a>
        <p>Current Page</p>
      </nav>
      <p>Page content</p>
    `);
    const result = extractPageContext();

    expect(result).toContain('Breadcrumb:');
    expect(result).toContain('Home');
    expect(result).toContain('Catalog');
  });

  it('should extract breadcrumbs from BUI bui-HeaderBreadcrumbs class', () => {
    setRootHtml(`
      <div class="bui-HeaderBreadcrumbs SomeHash_bui-HeaderBreadcrumbs__abc123">
        <a href="/projects">Projects</a>
        <a href="/projects/my-proj">My Project</a>
      </div>
      <p>Page content</p>
    `);
    const result = extractPageContext();

    expect(result).toContain('Breadcrumb:');
    expect(result).toContain('Projects');
    expect(result).toContain('My Project');
  });

  it('should extract active nav item from aria-current="page"', () => {
    setRootHtml(`
      <nav>
        <a href="/home">Home</a>
        <a href="/catalog" aria-current="page">Catalog</a>
        <a href="/docs">Docs</a>
      </nav>
      <p>Page content</p>
    `);
    const result = extractPageContext();

    expect(result).toContain('Nav: Catalog');
  });

  it('should handle absent breadcrumbs and nav gracefully', () => {
    setRootHtml('<p>Simple page</p>');
    const result = extractPageContext();

    expect(result).not.toContain('Breadcrumb:');
    expect(result).not.toContain('Nav:');
  });

  // ── Nav removal after breadcrumb extraction ──

  it('should remove nav elements after breadcrumb capture to avoid body text noise', () => {
    setRootHtml(`
      <nav aria-label="breadcrumb">
        <a href="/home">Home</a>
      </nav>
      <nav>
        <a href="/page1">Link 1</a>
        <a href="/page2">Link 2</a>
        <a href="/page3">Link 3</a>
      </nav>
      <p>Main page content</p>
    `);
    const result = extractPageContext();

    expect(result).toContain('Breadcrumb:');
    expect(result).toContain('Main page content');
    const linkMatches = result.match(/Link 1/g) || [];
    expect(linkMatches.length).toBe(0);
  });

  // ── Alerts ──

  it('should extract alerts with role="alert"', () => {
    setRootHtml(`
      <div role="alert">Pipeline failed: build-123</div>
      <p>Other content</p>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Alerts');
    expect(result).toContain('- Pipeline failed: build-123');
  });

  it('should extract MuiAlert-root elements as alerts', () => {
    setRootHtml(`
      <div class="MuiAlert-root">Deployment warning: resource quota exceeded</div>
      <p>Other content</p>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Alerts');
    expect(result).toContain('- Deployment warning: resource quota exceeded');
  });

  it('should extract BUI Alert via bui-Alert class', () => {
    setRootHtml(`
      <div class="bui-Alert Alert_bui-Alert__abc123" data-status="warning">
        <div>Configuration is incomplete</div>
      </div>
      <p>Other content</p>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Alerts');
    expect(result).toContain('Configuration is incomplete');
  });

  it('should remove alerts from clone after extraction to avoid duplication in body', () => {
    setRootHtml(`
      <div role="alert">Error message</div>
      <p>Regular content</p>
    `);
    const result = extractPageContext();

    const alertMatches = result.match(/Error message/g) || [];
    expect(alertMatches.length).toBe(1);
  });

  // ── Stepper ──

  it('should extract stepper state with active/completed markers', () => {
    setRootHtml(`
      <div class="MuiStepper-root">
        <div class="MuiStep-root">
          <span class="MuiStepLabel-label Mui-completed">Basics</span>
        </div>
        <div class="MuiStep-root">
          <span class="MuiStepLabel-label Mui-active">Configuration</span>
        </div>
        <div class="MuiStep-root">
          <span class="MuiStepLabel-label">Review</span>
        </div>
      </div>
      <p>Form content</p>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Stepper');
    expect(result).toContain('- Basics [done]');
    expect(result).toContain('- Configuration [active]');
    expect(result).toContain('- Review');
    expect(result).not.toContain('Review [done]');
    expect(result).not.toContain('Review [active]');
  });

  // ── Headings ──

  it('should extract headings with hierarchy', () => {
    setRootHtml(`
      <h1>Overview</h1>
      <h2>Dependencies</h2>
      <h3>Runtime</h3>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Headings');
    expect(result).toContain('- Overview');
    expect(result).toContain('  - Dependencies');
    expect(result).toContain('    - Runtime');
  });

  it('should remove headings from clone after extraction to avoid duplication in body', () => {
    setRootHtml(`
      <h1>Page Title</h1>
      <p>Content below title</p>
    `);
    const result = extractPageContext();

    const titleMatches = result.match(/Page Title/g) || [];
    expect(titleMatches.length).toBe(1);
  });

  // ── Status indicators ──

  it('should extract Backstage Status components via aria-label', () => {
    setRootHtml(`
      <span aria-label="Status ok" aria-hidden="true">Running</span>
      <span aria-label="Status error" aria-hidden="true">Failed</span>
      <p>Other text</p>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Status');
    expect(result).toContain('- ok: Running');
    expect(result).toContain('- error: Failed');
  });

  it('should deduplicate identical status entries', () => {
    setRootHtml(`
      <span aria-label="Status ok" aria-hidden="true">Healthy</span>
      <span aria-label="Status ok" aria-hidden="true">Healthy</span>
      <p>Content</p>
    `);
    const result = extractPageContext();

    const matches = result.match(/ok: Healthy/g) || [];
    expect(matches.length).toBe(1);
  });

  // ── Form fields ──

  it('should extract MUI form fields with labels and helper text', () => {
    setRootHtml(`
      <div class="MuiFormControl-root">
        <label>Project Name</label>
        <input type="text" />
        <p class="MuiFormHelperText-root">Must be unique</p>
      </div>
      <p>Other content</p>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Form Fields');
    expect(result).toContain('- Project Name');
    expect(result).toContain('(Must be unique)');
  });

  it('should extract BUI TextField via bui-TextField class', () => {
    setRootHtml(`
      <div class="bui-TextField TextField_bui-TextField__abc123">
        <label>Description</label>
        <input type="text" />
        <div slot="description">Optional field</div>
      </div>
      <p>Other content</p>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Form Fields');
    expect(result).toContain('- Description');
    expect(result).toContain('(Optional field)');
  });

  it('should skip form fields without labels', () => {
    setRootHtml(`
      <div class="MuiFormControl-root">
        <input type="hidden" />
      </div>
      <div class="MuiFormControl-root">
        <label>Visible Field</label>
        <input type="text" />
      </div>
      <p>Content</p>
    `);
    const result = extractPageContext();

    expect(result).toContain('- Visible Field');
    expect(result).not.toContain('- :');
  });

  // ── Tables ──

  it('should extract tables in pipe-delimited format', () => {
    setRootHtml(`
      <table>
        <tr><th>Name</th><th>Status</th></tr>
        <tr><td>my-service</td><td>Running</td></tr>
        <tr><td>my-db</td><td>Healthy</td></tr>
      </table>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Tables');
    expect(result).toContain('| Name | Status |');
    expect(result).toContain('| my-service | Running |');
    expect(result).toContain('| my-db | Healthy |');
  });

  it('should limit table rows to MAX_TABLE_ROWS (50)', () => {
    const rows = Array.from(
      { length: 100 },
      (_, i) => `<tr><td>Row ${i}</td></tr>`,
    ).join('');
    setRootHtml(`<table>${rows}</table>`);
    const result = extractPageContext();

    expect(result).toContain('| Row 0 |');
    expect(result).toContain('| Row 49 |');
    expect(result).not.toContain('| Row 50 |');
  });

  it('should limit tables to MAX_TABLES (10)', () => {
    const tables = Array.from(
      { length: 15 },
      (_, i) => `<table><tr><td>Table ${i}</td></tr></table>`,
    ).join('');
    setRootHtml(tables);
    const result = extractPageContext();

    expect(result).toContain('| Table 0 |');
    expect(result).toContain('| Table 9 |');
    expect(result).not.toContain('| Table 10 |');
  });

  it('should remove tables from clone to avoid duplication in body', () => {
    setRootHtml(`
      <table><tr><td>Table data</td></tr></table>
      <p>Paragraph content</p>
    `);
    const result = extractPageContext();

    const tableDataMatches = result.match(/Table data/g) || [];
    expect(tableDataMatches.length).toBe(1);
  });

  // ── Description lists ──

  it('should extract dl/dt/dd key-value pairs', () => {
    setRootHtml(`
      <dl>
        <dt>Owner</dt>
        <dd>team-platform</dd>
        <dt>Lifecycle</dt>
        <dd>production</dd>
      </dl>
      <p>Other content</p>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Details');
    expect(result).toContain('- Owner: team-platform');
    expect(result).toContain('- Lifecycle: production');
  });

  it('should extract BUI Header metadata rendered as dl', () => {
    setRootHtml(`
      <dl class="bui-HeaderMetaRow Header_bui-HeaderMetaRow__abc123">
        <div><dt>Type</dt><dd>Service</dd></div>
        <div><dt>System</dt><dd>order-management</dd></div>
      </dl>
      <p>Content</p>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Details');
    expect(result).toContain('- Type: Service');
    expect(result).toContain('- System: order-management');
  });

  // ── Empty state ──

  it('should extract BackstageEmptyState title and description', () => {
    setRootHtml(`
      <div class="BackstageEmptyState-root">
        <h5>No components found</h5>
        <p class="MuiTypography-body1">Try adjusting your search filters</p>
      </div>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Empty State');
    expect(result).toContain('Title: No components found');
    expect(result).toContain('Try adjusting your search filters');
  });

  // ── Pagination ──

  it('should extract MUI TablePagination context', () => {
    setRootHtml(`
      <table><tr><td>Row 1</td></tr></table>
      <div class="MuiTablePagination-root">Rows per page: 10 1-10 of 42</div>
    `);
    const result = extractPageContext();

    expect(result).toContain('Pagination: Rows per page: 10 1-10 of 42');
  });

  it('should extract BUI TablePagination context', () => {
    setRootHtml(`
      <table><tr><td>Row 1</td></tr></table>
      <div class="bui-TablePagination TablePagination_bui-TablePagination__abc123">
        1 - 10 of 100
      </div>
    `);
    const result = extractPageContext();

    expect(result).toContain('Pagination:');
    expect(result).toContain('1 - 10 of 100');
  });

  // ── Body text ──

  it('should extract body text via TreeWalker', () => {
    setRootHtml(`
      <div>
        <span>Component: my-service</span>
        <span>Owner: team-platform</span>
      </div>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Content');
    expect(result).toContain('Component: my-service');
    expect(result).toContain('Owner: team-platform');
  });

  it('should deduplicate identical text nodes', () => {
    setRootHtml(`
      <span>Repeated text</span>
      <span>Repeated text</span>
      <span>Unique text</span>
    `);
    const result = extractPageContext();

    const matches = result.match(/Repeated text/g) || [];
    expect(matches.length).toBe(1);
    expect(result).toContain('Unique text');
  });

  it('should collapse whitespace in extracted text', () => {
    setRootHtml(`
      <p>  Multiple   spaces   and
      newlines  </p>
    `);
    const result = extractPageContext();

    expect(result).toContain('Multiple spaces and newlines');
  });

  it('should preserve pre block content as fenced code', () => {
    setRootHtml(`
      <pre>const x = 1;
const y = 2;</pre>
      <p>Explanation text</p>
    `);
    const result = extractPageContext();

    expect(result).toContain('```');
    expect(result).toContain('const x = 1;');
    expect(result).toContain('const y = 2;');
    expect(result).toContain('Explanation text');
  });

  // ── Overlay (dialog) ──

  it('should extract active MUI dialog content', () => {
    setRootHtml(`<p>Background content</p>`);
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.innerHTML = `
      <div class="MuiDialogTitle-root">Delete Component</div>
      <div class="MuiDialogContent-root">Are you sure you want to delete my-service?</div>
    `;
    document.body.appendChild(dialog);

    const result = extractPageContext();

    expect(result).toContain('## Active Dialog');
    expect(result).toContain('Title: Delete Component');
    expect(result).toContain('Are you sure you want to delete my-service?');
  });

  it('should extract active BUI dialog content via bui-DialogHeaderTitle', () => {
    setRootHtml(`<p>Background content</p>`);
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.innerHTML = `
      <h2 class="bui-DialogHeaderTitle Dialog_bui-DialogHeaderTitle__abc123">Confirm Action</h2>
      <div class="bui-DialogBody Dialog_bui-DialogBody__abc123">This will remove the resource permanently.</div>
    `;
    document.body.appendChild(dialog);

    const result = extractPageContext();

    expect(result).toContain('## Active Dialog');
    expect(result).toContain('Title: Confirm Action');
    expect(result).toContain('This will remove the resource permanently.');
  });

  it('should extract persistent drawer content when docked-drawer-open', () => {
    setRootHtml(`<p>Background content</p>`);
    document.body.classList.add('docked-drawer-open');
    const drawer = document.createElement('div');
    drawer.className = 'MuiDrawer-paper';
    drawer.textContent = 'Quickstart guide for getting started';
    document.body.appendChild(drawer);

    const result = extractPageContext();

    expect(result).toContain('## Active Drawer');
    expect(result).toContain('Quickstart guide for getting started');
  });

  it('should exclude chat drawer (pf-chatbot) from overlay extraction', () => {
    setRootHtml(`<p>Background content</p>`);
    document.body.classList.add('docked-drawer-open');
    const drawer = document.createElement('div');
    drawer.className = 'MuiDrawer-paper';
    drawer.innerHTML = '<div class="pf-chatbot">Chat messages</div>';
    document.body.appendChild(drawer);

    const result = extractPageContext();

    expect(result).not.toContain('## Active Drawer');
    expect(result).not.toContain('Chat messages');
  });

  it('should return no overlay section when no dialog or drawer is active', () => {
    setRootHtml('<p>Regular page content</p>');
    const result = extractPageContext();

    expect(result).not.toContain('## Active Dialog');
    expect(result).not.toContain('## Active Drawer');
  });

  // ── Full integration ──

  it('should extract all sections together in priority order', () => {
    setRootHtml(`
      <h1 class="bui-PluginHeaderToolbarName"><a href="/catalog">Catalog</a></h1>
      <h2 class="bui-HeaderTitle">Red Hat Catalog</h2>
      <div role="tablist">
        <a role="tab" aria-selected="true">Overview</a>
      </div>
      <div role="alert">Warning: 2 pipelines failing</div>
      <h2>Components</h2>
      <table><tr><th>Name</th><th>Owner</th></tr><tr><td>my-svc</td><td>team-a</td></tr></table>
      <p>Description of the catalog page</p>
    `);
    const result = extractPageContext();

    expect(result).toContain('Plugin: Catalog');
    expect(result).toContain('Title: Red Hat Catalog');
    expect(result).toContain('Tab: Overview');
    expect(result).toContain('## Alerts');
    expect(result).toContain('Warning: 2 pipelines failing');
    expect(result).toContain('## Headings');
    expect(result).toContain('Components');
    expect(result).toContain('## Tables');
    expect(result).toContain('| my-svc | team-a |');
    expect(result).toContain('## Content');
    expect(result).toContain('Description of the catalog page');
  });
});
