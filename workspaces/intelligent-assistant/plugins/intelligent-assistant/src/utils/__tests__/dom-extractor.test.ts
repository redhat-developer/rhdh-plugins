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

jest.mock('../sensitive-data-redactor', () => {
  const actual = jest.requireActual('../sensitive-data-redactor');
  return {
    ...actual,
    redactText: jest.fn(text => text),
  };
});

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

  it('should extract active tab and all tabs as a section', () => {
    setRootHtml(`
      <div role="tablist">
        <a role="tab" aria-selected="false">Tree</a>
        <a role="tab" aria-selected="true">Text</a>
        <a role="tab" aria-selected="false">Detailed</a>
      </div>
      <p>Tab content</p>
    `);
    const result = extractPageContext();

    expect(result).toContain('CurrentTab: Text');
    expect(result).toContain('## Tabs');
    expect(result).toContain('- Tree');
    expect(result).toContain('- Text [active]');
    expect(result).toContain('- Detailed');
    // Tab labels removed from clone — should not appear in ## Content
    expect(result).not.toMatch(/## Content[\s\S]*Tree/);
  });

  it('should not include Plugin/Title/CurrentTab lines when elements are absent', () => {
    setRootHtml('<p>Simple page</p>');
    const result = extractPageContext();

    expect(result).not.toContain('Plugin:');
    expect(result).not.toContain('Title:');
    expect(result).not.toContain('CurrentTab:');
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

  // ── Form fields (hybrid HTML) ──

  it('should extract MUI form fields as cleaned HTML with labels and helper text', () => {
    setRootHtml(`
      <div class="MuiFormControl-root">
        <label>Project Name</label>
        <input type="text" />
        <p class="MuiFormHelperText-root">Must be unique</p>
      </div>
      <p>Other content</p>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Form Fields (HTML)');
    expect(result).toContain('<label>Project Name</label>');
    expect(result).toContain('Must be unique');
  });

  it('should extract BUI TextField as cleaned HTML via bui-TextField class', () => {
    setRootHtml(`
      <div class="bui-TextField TextField_bui-TextField__abc123">
        <label>Description</label>
        <input type="text" />
        <div slot="description">Optional field</div>
      </div>
      <p>Other content</p>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Form Fields (HTML)');
    expect(result).toContain('<label>Description</label>');
    expect(result).toContain('Optional field');
  });

  it('should capture live input values in form HTML from the DOM', () => {
    setRootHtml(`
      <div class="MuiFormControl-root">
        <label>Service Name</label>
        <input type="text" />
      </div>
      <p>Content</p>
    `);
    const input = document.querySelector(
      '.MuiFormControl-root input',
    ) as HTMLInputElement;
    input.value = 'my-backend-svc';
    const result = extractPageContext();

    expect(result).toContain('## Form Fields (HTML)');
    expect(result).toContain('value="my-backend-svc"');
  });

  it('should include labeled form fields and omit hidden-only controls in HTML', () => {
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

    expect(result).toContain('<label>Visible Field</label>');
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
      <div class="MuiTablePagination-root">
        Rows per page: 10 1-10 of 42
        <div class="MuiTablePagination-actions">
          <button disabled aria-label="Go to previous page"></button>
          <button aria-label="Go to next page"></button>
        </div>
      </div>
    `);
    const result = extractPageContext();

    expect(result).toContain('Pagination: Rows per page: 10 1-10 of 42');
  });

  it('should extract BUI TablePagination context', () => {
    setRootHtml(`
      <table><tr><td>Row 1</td></tr></table>
      <div class="bui-TablePagination TablePagination_bui-TablePagination__abc123">
        1 - 10 of 100
        <div class="MuiTablePagination-actions">
          <button disabled aria-label="Go to previous page"></button>
          <button aria-label="Go to next page"></button>
        </div>
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

  // ── Shadow DOM (TechDocs) ──

  it('should extract TechDocs shadow DOM content via data-testid selector', () => {
    setRootHtml(`
      <h1 class="bui-PluginHeaderToolbarName"><a href="/docs">Docs</a></h1>
      <div data-testid="techdocs-native-shadowroot" id="shadow-host"></div>
    `);
    const host = document.getElementById('shadow-host')!;
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML =
      '<article class="md-content__inner md-typeset"><h1>Getting Started</h1><p>Follow these steps to set up the plugin.</p></article>';

    const result = extractPageContext();

    expect(result).toContain('## Documentation');
    expect(result).toContain('Getting Started');
    expect(result).toContain('Follow these steps to set up the plugin');
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
    expect(result).toContain('CurrentTab: Overview');
    expect(result).toContain('## Tabs');
    expect(result).toContain('- Overview [active]');
    expect(result).toContain('## Alerts');
    expect(result).toContain('Warning: 2 pipelines failing');
    expect(result).toContain('## Headings');
    expect(result).toContain('Components');
    expect(result).toContain('## Tables');
    expect(result).toContain('| my-svc | team-a |');
    expect(result).toContain('## Content');
    expect(result).toContain('Description of the catalog page');
  });

  // ── Search Inputs ──

  it('should capture search bar with placeholder and value from live DOM', () => {
    setRootHtml(`
      <div class="MuiFormControl-root" data-testid="search-bar-next">
        <div class="MuiInputBase-root">
          <input aria-label="Search" placeholder="Search in Red Hat Developer Hub" type="text" value="api">
        </div>
      </div>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Search');
    expect(result).toContain('- Search in Red Hat Developer Hub: api');
  });

  it('should include search section even when search inputs are empty', () => {
    setRootHtml(`
      <div class="MuiFormControl-root">
        <div class="MuiInputBase-root" aria-label="search">
          <input placeholder="Search" type="text" value="">
        </div>
      </div>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Search');
    expect(result).toContain('- Search: (empty)');
  });

  // ── Filter Sections ──

  it('should extract accordion filter with selected item (SearchType.Accordion pattern)', () => {
    setRootHtml(`
      <div class="MuiBox-root">
        <h2>Result Type</h2>
        <div class="MuiAccordion-root Mui-expanded">
          <div class="MuiAccordionSummary-root Mui-expanded">
            <div class="MuiAccordionSummary-content">Collapse</div>
          </div>
          <div class="MuiCollapse-root MuiCollapse-entered">
            <div class="MuiAccordionDetails-root">
              <nav class="MuiList-root" aria-label="filter by type">
                <div class="MuiListItem-root Mui-selected" role="button">
                  <div class="MuiListItemText-root MuiListItemText-multiline">
                    <span class="MuiListItemText-primary">Software Catalog</span>
                    <p class="MuiListItemText-secondary">131 results</p>
                  </div>
                </div>
                <div class="MuiListItem-root" role="button">
                  <div class="MuiListItemText-root MuiListItemText-multiline">
                    <span class="MuiListItemText-primary">Documentation</span>
                    <p class="MuiListItemText-secondary">15 results</p>
                  </div>
                </div>
              </nav>
            </div>
          </div>
        </div>
      </div>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Filters');
    expect(result).toContain('Software Catalog (131 results)');
  });

  it('should extract menu picker with Mui-selected item (catalog picker pattern)', () => {
    setRootHtml(`
      <div class="MuiCard-root">
        <span class="MuiTypography-subtitle2">Personal</span>
        <ul class="MuiList-root" role="menu" aria-label="Personal">
          <li role="menuitem">
            <div class="MuiMenuItem-root">
              <p>Starred</p>
            </div>
          </li>
        </ul>
      </div>
      <span class="MuiTypography-subtitle2">My Org</span>
      <div class="MuiCard-root">
        <ul class="MuiList-root" role="menu" aria-label="My Org">
          <li role="menuitem">
            <div class="MuiMenuItem-root Mui-selected" data-testid="user-picker-all">
              <p>All</p>
            </div>
          </li>
        </ul>
      </div>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Filters');
    expect(result).toContain('- My Org: All');
  });

  // ── Form Fields: Select visible text (HTML) ──

  it('should include visible Select text in form HTML instead of hidden UUID', () => {
    setRootHtml(`
      <div class="MuiFormControl-root">
        <label>Kind</label>
        <div class="MuiInputBase-root" aria-label="Kind" data-testid="select">
          <div class="MuiSelect-root MuiSelect-select" tabindex="0" role="button">
            <p>All</p>
          </div>
          <input aria-hidden="true" tabindex="-1" class="MuiSelect-nativeInput" value="c30bbd28-16c2-4ad2-b798-47bfcd1e3ace">
        </div>
      </div>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Form Fields (HTML)');
    expect(result).toContain('<label>Kind</label>');
    expect(result).toContain('All');
    expect(result).not.toContain('c30bbd28');
  });

  // ── Form Fields: Autocomplete chips (HTML) ──

  it('should include Autocomplete chip labels in form HTML', () => {
    setRootHtml(`
      <div class="MuiFormControl-root MuiTextField-root">
        <label for="categories-picker">Categories</label>
        <div class="MuiInputBase-root MuiAutocomplete-inputRoot">
          <div class="MuiChip-root MuiAutocomplete-tag">
            <span class="MuiChip-label">service</span>
          </div>
          <div class="MuiChip-root MuiAutocomplete-tag">
            <span class="MuiChip-label">backend</span>
          </div>
          <input id="categories-picker" value="">
        </div>
      </div>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Form Fields (HTML)');
    expect(result).toContain('service');
    expect(result).toContain('backend');
  });

  // ── Form Fields: Checkbox group ──

  it('should extract checked checkboxes with their labels', () => {
    setRootHtml(`
      <div class="MuiFormControl-root" data-testid="search-checkboxfilter-next">
        <label class="MuiFormLabel-root">Lifecycle</label>
        <label class="MuiFormControlLabel-root">
          <span class="MuiCheckbox-root Mui-checked">
            <input name="experimental" type="checkbox" value="experimental" checked>
          </span>
          <span class="MuiFormControlLabel-label">experimental</span>
        </label>
        <label class="MuiFormControlLabel-root">
          <span class="MuiCheckbox-root">
            <input name="production" type="checkbox" value="production">
          </span>
          <span class="MuiFormControlLabel-label">production</span>
        </label>
      </div>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Filters');
    expect(result).toContain('- Lifecycle: experimental');
    expect(result).not.toContain('production');
  });

  // ── Form Fields: placeholder in HTML ──

  it('should include placeholder in form HTML when no label element exists', () => {
    setRootHtml(`
      <div class="MuiFormControl-root">
        <div class="MuiInputBase-root">
          <input placeholder="Filter by name" type="text" value="my-component">
        </div>
      </div>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Form Fields (HTML)');
    expect(result).toContain('placeholder="Filter by name"');
    expect(result).toContain('value="my-component"');
  });

  // ── Status in Table ──

  it('should preserve status indicators inside table cells for table extraction', () => {
    setRootHtml(`
      <table>
        <tr><th>Name</th><th>Status</th></tr>
        <tr>
          <td>my-task</td>
          <td><span aria-label="Status error">failed</span></td>
        </tr>
      </table>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Tables');
    expect(result).toContain('failed');
    expect(result).not.toContain('## Status');
  });

  it('should still extract standalone status indicators outside tables', () => {
    setRootHtml(`
      <div aria-label="Status ok">Running</div>
      <table>
        <tr><th>Name</th></tr>
        <tr><td>my-task</td></tr>
      </table>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Status');
    expect(result).toContain('- ok: Running');
  });

  // ── Empty Form Fields (HTML) ──

  it('should include empty form fields with labels in HTML output', () => {
    setRootHtml(`
      <div class="MuiFormControl-root">
        <label>Username</label>
        <div class="MuiInputBase-root">
          <input type="text" value="">
        </div>
      </div>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Form Fields (HTML)');
    expect(result).toContain('<label>Username</label>');
    expect(result).toContain('value=""');
  });

  it('should include form field with placeholder in HTML when value is empty', () => {
    setRootHtml(`
      <div class="MuiFormControl-root">
        <div class="MuiInputBase-root">
          <input placeholder="Filter" type="text" value="">
        </div>
      </div>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Form Fields (HTML)');
    expect(result).toContain('placeholder="Filter"');
  });

  // ── Filter vs Form Field categorization ──

  it('should categorize Select inside data-testid*="filter" as Filter, not Form Field', () => {
    setRootHtml(`
      <div class="MuiFormControl-root" data-testid="search-selectfilter-next">
        <label>Kind</label>
        <div class="MuiInputBase-root">
          <div class="MuiSelect-root MuiSelect-select" tabindex="0" role="button">
            <p>All</p>
          </div>
          <input aria-hidden="true" tabindex="-1" class="MuiSelect-nativeInput" value="all">
        </div>
      </div>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Filters');
    expect(result).toContain('- Kind: All');
    expect(result).not.toContain('## Form Fields');
  });

  it('should categorize Checkbox inside data-testid*="filter" as Filter, not Form Field', () => {
    setRootHtml(`
      <div class="MuiFormControl-root" data-testid="search-checkboxfilter-next">
        <label class="MuiFormLabel-root">Lifecycle</label>
        <label class="MuiFormControlLabel-root">
          <span class="MuiCheckbox-root Mui-checked">
            <input name="experimental" type="checkbox" value="experimental" checked>
          </span>
          <span class="MuiFormControlLabel-label">experimental</span>
        </label>
        <label class="MuiFormControlLabel-root">
          <span class="MuiCheckbox-root">
            <input name="production" type="checkbox" value="production">
          </span>
          <span class="MuiFormControlLabel-label">production</span>
        </label>
      </div>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Filters');
    expect(result).toContain('- Lifecycle: experimental');
    expect(result).not.toContain('## Form Fields');
  });

  it('should show (empty) for filter with no selection', () => {
    setRootHtml(`
      <div class="MuiFormControl-root" data-testid="search-checkboxfilter-next">
        <label class="MuiFormLabel-root">Lifecycle</label>
        <label class="MuiFormControlLabel-root">
          <span class="MuiCheckbox-root">
            <input name="production" type="checkbox" value="production">
          </span>
          <span class="MuiFormControlLabel-label">production</span>
        </label>
      </div>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Filters');
    expect(result).toContain('- Lifecycle: (empty)');
  });

  it('should keep regular form fields outside filter containers in Form Fields section', () => {
    setRootHtml(`
      <div class="MuiFormControl-root" data-testid="search-selectfilter-next">
        <label>Kind</label>
        <div class="MuiInputBase-root">
          <div class="MuiSelect-root MuiSelect-select" tabindex="0" role="button">
            <p>Component</p>
          </div>
          <input aria-hidden="true" tabindex="-1" class="MuiSelect-nativeInput" value="component">
        </div>
      </div>
      <div class="MuiFormControl-root">
        <label>Name</label>
        <div class="MuiInputBase-root">
          <input type="text" value="my-service">
        </div>
      </div>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Filters');
    expect(result).toContain('- Kind: Component');
    expect(result).toContain('## Form Fields (HTML)');
    expect(result).toContain('value="my-service"');
  });

  // ── Pagination: actionable only ──

  it('should extract pagination when it has enabled navigation buttons', () => {
    setRootHtml(`
      <div class="MuiTablePagination-root">
        <p>1–20 of 100</p>
        <div class="MuiTablePagination-actions">
          <button disabled aria-label="Go to previous page"></button>
          <button aria-label="Go to next page"></button>
        </div>
      </div>
      <p>Other content</p>
    `);
    const result = extractPageContext();

    expect(result).toContain('Pagination:');
  });

  it('should not extract pagination when all navigation buttons are disabled', () => {
    setRootHtml(`
      <div class="MuiTablePagination-root">
        <p>1–5 of 5</p>
        <div class="MuiTablePagination-actions">
          <button disabled aria-label="Go to previous page"></button>
          <button disabled aria-label="Go to next page"></button>
        </div>
      </div>
      <p>Other content</p>
    `);
    const result = extractPageContext();

    expect(result).not.toContain('Pagination:');
  });

  it('should not extract pagination when there are no action buttons', () => {
    setRootHtml(`
      <div class="MuiTablePagination-root">
        <p>Showing 1–5 of 5</p>
      </div>
      <p>Other content</p>
    `);
    const result = extractPageContext();

    expect(result).not.toContain('Pagination:');
  });

  // ── Multi-select Autocomplete ──

  it('should resolve label via label[for] in form HTML for Autocomplete', () => {
    setRootHtml(`
      <div class="MuiBox-root">
        <label for="categories-picker">Categories</label>
        <div class="MuiAutocomplete-root" role="combobox">
          <div class="MuiFormControl-root MuiTextField-root">
            <div class="MuiInputBase-root MuiOutlinedInput-root MuiAutocomplete-inputRoot">
              <div class="MuiChip-root MuiAutocomplete-tag">
                <span class="MuiChip-label">service</span>
              </div>
              <div class="MuiChip-root MuiAutocomplete-tag">
                <span class="MuiChip-label">plugin</span>
              </div>
              <input id="categories-picker" value="">
            </div>
          </div>
        </div>
      </div>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Form Fields (HTML)');
    expect(result).toContain('service');
    expect(result).toContain('plugin');
  });

  it('should include ancestor wrapping label content in form HTML for multi-select Autocomplete', () => {
    setRootHtml(`
      <div class="MuiBox-root">
        <label class="MuiTypography-root MuiTypography-body1">
          <span class="MuiBox-root">Tags</span>
          <div class="MuiAutocomplete-root" role="combobox">
            <div class="MuiFormControl-root MuiTextField-root">
              <div class="MuiInputBase-root MuiOutlinedInput-root MuiAutocomplete-inputRoot">
                <div class="MuiChip-root MuiAutocomplete-tag">
                  <span class="MuiChip-label">aap</span>
                </div>
                <div class="MuiChip-root MuiAutocomplete-tag">
                  <span class="MuiChip-label">argocd</span>
                </div>
                <div class="MuiChip-root MuiAutocomplete-tag">
                  <span class="MuiChip-label">backend-plugin</span>
                </div>
                <input value="" id="mui-12345">
              </div>
            </div>
          </div>
        </label>
      </div>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Form Fields (HTML)');
    expect(result).toContain('aap');
    expect(result).toContain('argocd');
    expect(result).toContain('backend-plugin');
  });

  it('should include preceding sibling label context in form HTML for Autocomplete', () => {
    setRootHtml(`
      <div class="MuiBox-root">
        <span class="MuiTypography-root">Owner</span>
        <div class="MuiAutocomplete-root" role="combobox">
          <div class="MuiFormControl-root MuiTextField-root">
            <div class="MuiInputBase-root MuiOutlinedInput-root MuiAutocomplete-inputRoot">
              <div class="MuiChip-root MuiAutocomplete-tag">
                <span class="MuiChip-label">team-alpha</span>
              </div>
              <input value="">
            </div>
          </div>
        </div>
      </div>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Form Fields (HTML)');
    expect(result).toContain('team-alpha');
  });

  // ── Sensitive field redaction ──

  it('should redact password fields in form HTML output', () => {
    setRootHtml(`
      <div class="MuiFormControl-root">
        <label>API Token</label>
        <input type="password" value="super-secret-token" />
      </div>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Form Fields (HTML)');
    expect(result).toContain('[REDACTED]');
    expect(result).not.toContain('super-secret-token');
  });

  it('should redact sensitive search input values', () => {
    setRootHtml(`
      <div class="MuiFormControl-root">
        <input placeholder="Search API key" type="text" value="ghp_abcdefghijklmnopqrstuvwxyz1234567890" />
      </div>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Search');
    expect(result).toContain('[REDACTED]');
    expect(result).not.toContain('ghp_abcdefghijklmnopqrstuvwxyz1234567890');
  });

  it('should return empty string when extraction throws', () => {
    setRootHtml('<p>content</p>');
    const originalQuerySelector = document.querySelector.bind(document);
    jest.spyOn(document, 'querySelector').mockImplementation(selector => {
      if (selector === '#root') {
        throw new Error('DOM error');
      }
      return originalQuerySelector(selector);
    });

    const result = extractPageContext();
    expect(result).toBe('');

    jest.restoreAllMocks();
  });

  // ── JSS-hashed MUI class names ──

  it('should extract form fields when MUI classes have JSS hash suffixes', () => {
    setRootHtml(`
      <div class="MuiFormControl-root-12213 MuiTextField-root-12217">
        <label class="MuiFormLabel-root-12226" for="root_userId">The user ID</label>
        <input id="root_userId" type="text" value="user:default/guest">
      </div>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Form Fields (HTML)');
    expect(result).toContain('The user ID');
    expect(result).toContain('value="user:default/guest"');
  });

  it('should extract stepper state with v5-MuiStepper hashed class names', () => {
    setRootHtml(`
      <div class="v5-MuiStepper-root v5-MuiStepper-horizontal">
        <span class="v5-MuiStepLabel-label Mui-active">
          <h2>Workflow input data</h2>
        </span>
        <span class="v5-MuiStepLabel-label Mui-disabled">
          <h2>Review</h2>
        </span>
      </div>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Stepper');
    expect(result).toContain('Workflow input data [active]');
    expect(result).toContain('Review');
  });

  // ── RJSF whole-form extraction ──

  it('should serialize entire RJSF form as HTML with live input values', () => {
    setRootHtml(`
      <form class="rjsf" novalidate="">
        <div class="form-group field field-string">
          <div class="MuiFormControl-root-12213 MuiTextField-root-12217">
            <label for="root_userId">The user ID that triggers the workflow</label>
            <input id="root_userId" name="root_userId" type="text" value="user:default/guest">
          </div>
        </div>
        <div class="form-group field field-integer">
          <div class="MuiFormControl-root-12213 MuiTextField-root-12217">
            <label for="root_iterationNum">The iteration number</label>
            <input id="root_iterationNum" name="root_iterationNum" type="number" value="">
          </div>
        </div>
        <div class="form-group field field-array">
          <h5>Recipients</h5>
          <div class="MuiFormControl-root-12213 MuiTextField-root-12217">
            <label for="root_recipients_0">Recipient</label>
            <input id="root_recipients_0" name="root_recipients_0" type="text" value="user:default/jsmith">
          </div>
        </div>
      </form>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Form Fields (HTML)');
    expect(result).toContain('<form');
    expect(result).toContain('The user ID that triggers the workflow');
    expect(result).toContain('value="user:default/guest"');
    expect(result).toContain('Recipients');
    expect(result).toContain('value="user:default/jsmith"');
    expect(result).not.toContain('## Content');
    expect(result).not.toContain('Back');
  });
});

// ── Card Extraction ──

describe('extractPageContext - cards', () => {
  it('should group content by card when 3+ cards exist in a grid layout', () => {
    setRootHtml(`
      <div class="MuiGrid-container">
        <div class="MuiPaper-root MuiPaper-elevation1">
          <h5>Active users</h5>
          <p>Average peak active user count was 1 per week.</p>
        </div>
        <div class="MuiPaper-root MuiPaper-elevation1">
          <h5>Total users</h5>
          <p>1 of 100 have logged in</p>
        </div>
        <div class="MuiPaper-root MuiPaper-elevation1">
          <h5>All templates</h5>
          <table>
            <tr><th>Name</th><th>Executions</th></tr>
            <tr><td>ArgoCD template</td><td>5</td></tr>
          </table>
        </div>
      </div>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Cards');
    expect(result).toContain('### Active users');
    expect(result).toContain('Average peak active user count was 1 per week.');
    expect(result).toContain('### Total users');
    expect(result).toContain('1 of 100 have logged in');
    expect(result).toContain('### All templates');
    expect(result).toContain('| Name | Executions |');
    expect(result).toContain('| ArgoCD template | 5 |');
  });

  it('should extract chart legend series names', () => {
    setRootHtml(`
      <div class="MuiGrid-container">
        <div class="MuiPaper-root">
          <h5>Active users</h5>
          <svg class="recharts-surface"></svg>
          <div class="recharts-legend-wrapper">
            <p>Returning users</p>
            <p>New users</p>
          </div>
        </div>
        <div class="MuiPaper-root">
          <h5>Card B</h5>
          <p>Content B</p>
        </div>
        <div class="MuiPaper-root">
          <h5>Card C</h5>
          <p>Content C</p>
        </div>
      </div>
    `);
    const result = extractPageContext();

    expect(result).toContain('### Active users');
    expect(result).toContain('Chart: Returning users, New users');
  });

  it('should show empty state text inside cards', () => {
    setRootHtml(`
      <div class="MuiGrid-container">
        <div class="MuiPaper-root">
          <h5>Top searches</h5>
          <p>No results for this date range.</p>
        </div>
        <div class="MuiPaper-root">
          <h5>Card 2</h5>
          <p>Data here</p>
        </div>
        <div class="MuiPaper-root">
          <h5>Card 3</h5>
          <p>More data</p>
        </div>
      </div>
    `);
    const result = extractPageContext();

    expect(result).toContain('### Top searches');
    expect(result).toContain('No results for this date range.');
  });

  it('should extract cards even with fewer than 3 (threshold is 1)', () => {
    setRootHtml(`
      <div class="MuiGrid-container">
        <div class="MuiPaper-root">
          <h5>Single Card</h5>
          <p>Some content</p>
        </div>
        <div class="MuiPaper-root">
          <h5>Another Card</h5>
          <p>More content</p>
        </div>
      </div>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Cards');
    expect(result).toContain('### Single Card');
    expect(result).toContain('### Another Card');
  });

  it('should remove card content from downstream extractors', () => {
    setRootHtml(`
      <div class="MuiGrid-container">
        <div class="MuiPaper-root">
          <h5>Card A</h5>
          <table><tr><td>Row 1</td></tr></table>
        </div>
        <div class="MuiPaper-root">
          <h5>Card B</h5>
          <p>Text B</p>
        </div>
        <div class="MuiPaper-root">
          <h5>Card C</h5>
          <p>Text C</p>
        </div>
      </div>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Cards');
    // Table in card should not appear again in ## Tables
    expect(result).not.toContain('## Tables');
    // Card text should not appear in ## Content
    const contentSection = result.split('## Content')[1] || '';
    expect(contentSection).not.toContain('Text B');
    expect(contentSection).not.toContain('Text C');
  });

  it('should work with MuiMasonry-root layout', () => {
    setRootHtml(`
      <div class="MuiMasonry-root">
        <div class="MuiPaper-root"><h5>Card 1</h5><p>Data 1</p></div>
        <div class="MuiPaper-root"><h5>Card 2</h5><p>Data 2</p></div>
        <div class="MuiPaper-root"><h5>Card 3</h5><p>Data 3</p></div>
      </div>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Cards');
    expect(result).toContain('### Card 1');
    expect(result).toContain('### Card 2');
    expect(result).toContain('### Card 3');
  });

  it('should detect cards via fallback when no layout container matches', () => {
    setRootHtml(`
      <div class="jss-random-hash">
        <article class="bui-Card"><h3>About</h3><p>Description here</p></article>
        <article class="bui-Card"><h3>Dependencies</h3><p>None found</p></article>
      </div>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Cards');
    expect(result).toContain('### About');
    expect(result).toContain('### Dependencies');
  });

  it('should extract structured key-value pairs from card grids', () => {
    setRootHtml(`
      <div class="MuiGrid-container">
        <div class="MuiCard-root">
          <h5>About</h5>
          <div>
            <div><h2>Description</h2><p>Role for developers</p></div>
            <div><h2>Modified By</h2><p>user:default/admin</p></div>
            <div><h2>Owner</h2><p>team-platform</p></div>
          </div>
        </div>
        <div class="MuiCard-root">
          <h5>Status</h5>
          <p>Active</p>
        </div>
      </div>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Cards');
    expect(result).toContain('### About');
    expect(result).toContain('Description: Role for developers');
    expect(result).toContain('Modified By: user:default/admin');
    expect(result).toContain('Owner: team-platform');
  });

  it('should not include card-internal headings in ## Headings', () => {
    setRootHtml(`
      <h1>My Page</h1>
      <div class="MuiGrid-container">
        <div class="MuiPaper-root">
          <h5>About</h5>
          <div><h2>Owner</h2><p>team-a</p></div>
          <div><h2>Type</h2><p>service</p></div>
        </div>
        <div class="MuiPaper-root">
          <h5>Relations</h5>
          <p>No relations</p>
        </div>
      </div>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Cards');
    expect(result).toContain('## Headings');
    expect(result).toContain('- My Page');
    // Internal card h2s should NOT appear as headings
    const headingsSection =
      result.split('## Headings')[1]?.split('##')[0] || '';
    expect(headingsSection).not.toContain('Owner');
    expect(headingsSection).not.toContain('Type');
  });
});

describe('extractPageContext - BUI tabs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
    document.body.className = '';
  });

  it('should detect BUI-style navigation tabs via nav[aria-label]', () => {
    setRootHtml(`
      <nav aria-label="Content navigation">
        <ul role="list">
          <li><a href="/overview" aria-current="page">Overview</a></li>
          <li><a href="/docs">TechDocs</a></li>
          <li><a href="/k8s">Kubernetes</a></li>
        </ul>
      </nav>
      <p>Page content</p>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Tabs');
    expect(result).toContain('- Overview [active]');
    expect(result).toContain('- TechDocs');
    expect(result).toContain('- Kubernetes');
  });

  it('should prefer role="tablist" over BUI nav if both present', () => {
    setRootHtml(`
      <div role="tablist">
        <a role="tab" aria-selected="true">Tab A</a>
        <a role="tab" aria-selected="false">Tab B</a>
      </div>
      <nav aria-label="Content navigation">
        <ul role="list">
          <li><a href="/x" aria-current="page">Nav X</a></li>
          <li><a href="/y">Nav Y</a></li>
        </ul>
      </nav>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Tabs');
    expect(result).toContain('- Tab A [active]');
    expect(result).toContain('- Tab B');
    // BUI nav items should not appear in ## Tabs section
    const tabsSection = result.split('## Tabs')[1]?.split('##')[0] || '';
    expect(tabsSection).not.toContain('Nav X');
    expect(tabsSection).not.toContain('Nav Y');
  });
});

describe('extractPageContext - pagination', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
    document.body.className = '';
  });

  it('should strip pagination footer from tables', () => {
    setRootHtml(`
      <table>
        <thead><tr><th>Name</th><th>Type</th></tr></thead>
        <tbody><tr><td>Alice</td><td>User</td></tr></tbody>
        <tfoot>
          <tr><td colspan="2">
            <span class="MuiTablePagination-root">Rows per page: 5 1-3 of 3</span>
          </td></tr>
        </tfoot>
      </table>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Tables');
    expect(result).toContain('| Name | Type |');
    expect(result).toContain('| Alice | User |');
    expect(result).not.toContain('Rows per page');
    expect(result).not.toContain('1-3 of 3');
  });
});
