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

const mockRedactText = redactText as jest.MockedFunction<typeof redactText>;

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
  });

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

  it('should extract alerts', () => {
    setRootHtml(`
      <div role="alert">Pipeline failed: build-123</div>
      <p>Other content</p>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Alerts');
    expect(result).toContain('- Pipeline failed: build-123');
  });

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

  it('should remove elements matching custom excludeSelector', () => {
    setRootHtml(`
      <div class="sidebar">Sidebar nav</div>
      <p>Main content</p>
    `);
    const result = extractPageContext({ excludeSelector: '.sidebar' });

    expect(result).not.toContain('Sidebar nav');
    expect(result).toContain('Main content');
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

  it('should remove aria-hidden elements', () => {
    setRootHtml(`
      <div aria-hidden="true">Hidden decorative content</div>
      <p>Visible to screen reader</p>
    `);
    const result = extractPageContext();

    expect(result).not.toContain('Hidden decorative content');
    expect(result).toContain('Visible to screen reader');
  });

  it('should handle empty #root gracefully', () => {
    setRootHtml('');
    const result = extractPageContext();

    expect(result).toContain('Page:');
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

  it('should remove headings from clone after extraction to avoid duplication in body', () => {
    setRootHtml(`
      <h1>Page Title</h1>
      <p>Content below title</p>
    `);
    const result = extractPageContext();

    const titleMatches = result.match(/Page Title/g) || [];
    expect(titleMatches.length).toBe(1);
  });

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

  it('should extract MuiAlert-root elements as alerts', () => {
    setRootHtml(`
      <div class="MuiAlert-root">Deployment warning: resource quota exceeded</div>
      <p>Other content</p>
    `);
    const result = extractPageContext();

    expect(result).toContain('## Alerts');
    expect(result).toContain('- Deployment warning: resource quota exceeded');
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

  it('should remove data-screen-capture-exclude elements', () => {
    setRootHtml(`
      <div data-screen-capture-exclude>Excluded widget</div>
      <p>Included content</p>
    `);
    const result = extractPageContext();

    expect(result).not.toContain('Excluded widget');
    expect(result).toContain('Included content');
  });

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
