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

import { redactText } from './sensitive-data-redactor';

const DEFAULT_MAX_CHARS = 8000;
const MAX_TABLE_ROWS = 50;
const MAX_TABLES = 10;

const NOISE_SELECTOR = [
  '.pf-chatbot',
  'script',
  'style',
  'noscript',
  'svg',
  'canvas',
  'img',
  'video',
  'iframe',
  '[aria-hidden="true"]',
  '[data-screen-capture-exclude]',
].join(', ');

export interface DomExtractionOptions {
  /** Maximum characters in the output (default: 8000) */
  maxChars?: number;
  /** Additional CSS selector for elements to exclude */
  excludeSelector?: string;
}

/**
 * Extracts structured page context from the current RHDH viewport.
 * Returns a plain text string suitable for LLM consumption as an attachment.
 *
 * Extraction priority: header > alerts > headings > tables > body text.
 * Stops appending when maxChars budget is reached.
 */
export function extractPageContext(options?: DomExtractionOptions): string {
  const maxChars = options?.maxChars ?? DEFAULT_MAX_CHARS;

  const root = document.querySelector('#root');
  if (!root) {
    return '';
  }

  const clone = root.cloneNode(true) as HTMLElement;

  // Remove noise elements
  clone.querySelectorAll(NOISE_SELECTOR).forEach(el => el.remove());
  if (options?.excludeSelector) {
    clone.querySelectorAll(options.excludeSelector).forEach(el => el.remove());
  }

  const sections: string[] = [];
  let charCount = 0;

  const appendSection = (content: string): boolean => {
    if (!content.trim()) return true;
    if (charCount + content.length > maxChars) {
      const remaining = maxChars - charCount;
      if (remaining > 50) {
        sections.push(content.slice(0, remaining));
        charCount = maxChars;
      }
      return false;
    }
    sections.push(content);
    charCount += content.length;
    return true;
  };

  // 1. Header -- always included
  const headerLines = [`Page: ${window.location.pathname}`];

  const pluginName = document
    .querySelector('.bui-PluginHeaderToolbarName')
    ?.textContent?.trim();
  if (pluginName) {
    headerLines.push(`Plugin: ${pluginName}`);
  }

  const pageTitle = document
    .querySelector('.bui-HeaderTitle')
    ?.textContent?.trim();
  if (pageTitle) {
    headerLines.push(`Title: ${pageTitle}`);
  }

  const activeTab = document
    .querySelector('[role="tab"][aria-selected="true"]')
    ?.textContent?.trim();
  if (activeTab) {
    headerLines.push(`Tab: ${activeTab}`);
  }

  headerLines.push(`Document: ${document.title}`);

  const header = headerLines.join('\n');
  if (!appendSection(header)) {
    return redactText(sections.join('\n\n'));
  }

  // 2. Alerts / Toasts
  const alertText = extractAlerts(clone);
  if (alertText && !appendSection(alertText)) {
    return redactText(sections.join('\n\n'));
  }

  // 3. Headings
  const headingsText = extractHeadings(clone);
  if (headingsText && !appendSection(headingsText)) {
    return redactText(sections.join('\n\n'));
  }

  // 4. Tables
  const tablesText = extractTables(clone);
  if (tablesText && !appendSection(tablesText)) {
    return redactText(sections.join('\n\n'));
  }

  // 5. Body text (TreeWalker) -- fills remaining budget
  const bodyText = extractBodyText(clone, maxChars - charCount);
  if (bodyText) {
    appendSection(bodyText);
  }

  // 6. TechDocs Shadow DOM (if present on the live DOM)
  const shadowText = extractShadowDomContent();
  if (shadowText) {
    appendSection(shadowText);
  }

  const result = sections.join('\n\n');
  return result ? redactText(result) : '';
}

function extractAlerts(root: HTMLElement): string {
  const alerts = root.querySelectorAll(
    '[role="alert"], [aria-live="assertive"], [class*="MuiAlert-root"]',
  );
  if (alerts.length === 0) return '';

  const lines: string[] = ['## Alerts'];
  alerts.forEach(alert => {
    const text = collapseWhitespace(alert.textContent || '');
    if (text) {
      lines.push(`- ${text}`);
    }
    alert.remove();
  });

  return lines.length > 1 ? lines.join('\n') : '';
}

function extractHeadings(root: HTMLElement): string {
  const headings = root.querySelectorAll('h1, h2, h3, h4');
  if (headings.length === 0) return '';

  const lines: string[] = ['## Headings'];
  headings.forEach(heading => {
    const level = parseInt(heading.tagName[1], 10);
    const indent = '  '.repeat(level - 1);
    const text = collapseWhitespace(heading.textContent || '');
    if (text) {
      lines.push(`${indent}- ${text}`);
    }
    heading.remove();
  });

  return lines.length > 1 ? lines.join('\n') : '';
}

function extractTables(root: HTMLElement): string {
  const tables = root.querySelectorAll('table');
  if (tables.length === 0) return '';

  const output: string[] = ['## Tables'];
  let tableCount = 0;

  tables.forEach(table => {
    if (tableCount >= MAX_TABLES) {
      table.remove();
      return;
    }

    const rows = table.querySelectorAll('tr');
    const tableLines: string[] = [];
    let rowCount = 0;

    rows.forEach(row => {
      if (rowCount >= MAX_TABLE_ROWS) return;
      const cells = row.querySelectorAll('th, td');
      const cellTexts = Array.from(cells).map(cell =>
        collapseWhitespace(cell.textContent || ''),
      );
      if (cellTexts.some(t => t)) {
        tableLines.push(`| ${cellTexts.join(' | ')} |`);
      }
      rowCount++;
    });

    if (tableLines.length > 0) {
      output.push(tableLines.join('\n'));
    }

    table.remove();
    tableCount++;
  });

  return output.length > 1 ? output.join('\n') : '';
}

function extractBodyText(root: HTMLElement, budget: number): string {
  if (budget <= 0) return '';

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const lines: string[] = ['## Content'];
  let length = lines[0].length;
  const seen = new Set<string>();

  let node = walker.nextNode();
  while (node) {
    const text = collapseWhitespace(node.textContent || '');
    if (text && text.length > 1 && !seen.has(text)) {
      seen.add(text);
      const lineLength = text.length + 1; // +1 for newline
      if (length + lineLength > budget) {
        break;
      }
      lines.push(text);
      length += lineLength;
    }
    node = walker.nextNode();
  }

  return lines.length > 1 ? lines.join('\n') : '';
}

function extractShadowDomContent(): string {
  const shadowHosts = document.querySelectorAll('[class*="shadowDom" i]');
  if (shadowHosts.length === 0) return '';

  const lines: string[] = ['## Documentation'];

  shadowHosts.forEach(host => {
    if (host.shadowRoot) {
      const text = collapseWhitespace(host.shadowRoot.textContent || '');
      if (text) {
        lines.push(text.slice(0, 2000));
      }
    }
  });

  return lines.length > 1 ? lines.join('\n') : '';
}

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}
