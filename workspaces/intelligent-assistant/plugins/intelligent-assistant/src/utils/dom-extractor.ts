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
  '[aria-hidden="true"]:not([aria-label^="Status"])',
  '[data-screen-capture-exclude]',
  '[hidden]',
  'footer',
  '.MuiCollapse-hidden',
  '[data-testid="techdocs-native-shadowroot"]',
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
 * Extraction priority:
 *   header > overlay > search inputs > filters >
 *   alerts > stepper > headings > status >
 *   forms > tables > description lists > empty state > pagination >
 *   body text > shadow DOM.
 *
 * Stops appending when maxChars budget is reached.
 */
export function extractPageContext(options?: DomExtractionOptions): string {
  const maxChars = options?.maxChars ?? DEFAULT_MAX_CHARS;

  const root = document.querySelector('#root');
  if (!root) {
    return '';
  }

  const clone = root.cloneNode(true) as HTMLElement;

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

  // 1. Header -- always included (reads from live DOM for accurate selectors)
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

  const breadcrumb = document.querySelector(
    '[aria-label="breadcrumb"], .MuiBreadcrumbs-root, [class*="bui-HeaderBreadcrumb"]',
  );
  if (breadcrumb) {
    const crumbs = Array.from(breadcrumb.querySelectorAll('li, a, p'))
      .map(el => el.textContent?.trim())
      .filter(Boolean);
    if (crumbs.length > 0) {
      headerLines.push(`Breadcrumb: ${crumbs.join(' > ')}`);
    }
  }

  const activeNav = document
    .querySelector('[aria-current="page"]')
    ?.textContent?.trim();
  if (activeNav) {
    headerLines.push(`Nav: ${activeNav}`);
  }

  headerLines.push(`Document: ${document.title}`);

  const header = headerLines.join('\n');
  if (!appendSection(header)) {
    return redactText(sections.join('\n\n'));
  }

  // 2. Active overlay -- dialog/modal/drawer content takes priority
  const overlayText = extractActiveOverlay();
  if (overlayText && !appendSection(overlayText)) {
    return redactText(sections.join('\n\n'));
  }

  // 3. Search inputs (from live DOM, before nav removal strips the header)
  const searchText = extractSearchInputs();
  if (searchText && !appendSection(searchText)) {
    return redactText(sections.join('\n\n'));
  }

  // 4. Filter sections (accordion lists, menu pickers — from live DOM)
  const filterText = extractFilterSections();
  if (filterText && !appendSection(filterText)) {
    return redactText(sections.join('\n\n'));
  }

  // 5. Remove navigation noise (after breadcrumb/search extraction above)
  clone.querySelectorAll('nav, [role="navigation"]').forEach(el => el.remove());

  // 6. Alerts / Toasts
  const alertText = extractAlerts(clone);
  if (alertText && !appendSection(alertText)) {
    return redactText(sections.join('\n\n'));
  }

  // 7. Stepper state
  const stepperText = extractStepperState(clone);
  if (stepperText && !appendSection(stepperText)) {
    return redactText(sections.join('\n\n'));
  }

  // 8. Headings
  const headingsText = extractHeadings(clone);
  if (headingsText && !appendSection(headingsText)) {
    return redactText(sections.join('\n\n'));
  }

  // 9. Status indicators
  const statusText = extractStatusIndicators(clone);
  if (statusText && !appendSection(statusText)) {
    return redactText(sections.join('\n\n'));
  }

  // 10. Form fields
  const formsText = extractFormFields(clone);
  if (formsText && !appendSection(formsText)) {
    return redactText(sections.join('\n\n'));
  }

  // 11. Tables (also captures StructuredMetadataTable)
  const tablesText = extractTables(clone);
  if (tablesText && !appendSection(tablesText)) {
    return redactText(sections.join('\n\n'));
  }

  // 12. Description lists (dl/dt/dd key-value pairs)
  const dlText = extractDescriptionLists(clone);
  if (dlText && !appendSection(dlText)) {
    return redactText(sections.join('\n\n'));
  }

  // 13. Empty states
  const emptyText = extractEmptyState(clone);
  if (emptyText && !appendSection(emptyText)) {
    return redactText(sections.join('\n\n'));
  }

  // 14. Pagination context
  const paginationText = extractPagination(clone);
  if (paginationText && !appendSection(paginationText)) {
    return redactText(sections.join('\n\n'));
  }

  // 15. Body text (TreeWalker) -- fills remaining budget
  const bodyText = extractBodyText(clone, maxChars - charCount);
  if (bodyText) {
    appendSection(bodyText);
  }

  // 16. TechDocs Shadow DOM (if present on the live DOM)
  const shadowText = extractShadowDomContent();
  if (shadowText) {
    appendSection(shadowText);
  }

  const result = sections.join('\n\n');
  return result ? redactText(result) : '';
}

function extractActiveOverlay(): string {
  // Modal dialog -- MUI Dialog and BUI Dialog both render role="dialog"
  const dialog = document.querySelector('[role="dialog"][aria-modal="true"]');
  if (dialog) {
    const title = dialog
      .querySelector(
        '.MuiDialogTitle-root, [class*="MuiDialogTitle"], [class*="bui-DialogHeaderTitle"]',
      )
      ?.textContent?.trim();
    const content = collapseWhitespace(
      dialog.querySelector(
        '.MuiDialogContent-root, [class*="MuiDialogContent"], [class*="bui-DialogBody"]',
      )?.textContent || '',
    );
    const lines = ['## Active Dialog'];
    if (title) lines.push(`Title: ${title}`);
    if (content) lines.push(content);
    return lines.length > 1 ? lines.join('\n') : '';
  }

  // Persistent drawer (BUI ApplicationDrawer)
  if (document.body.classList.contains('docked-drawer-open')) {
    const drawerPaper = document.querySelector('.MuiDrawer-paper');
    if (drawerPaper && !drawerPaper.querySelector('.pf-chatbot')) {
      const text = collapseWhitespace(drawerPaper.textContent || '');
      if (text) {
        return `## Active Drawer\n${text.slice(0, 2000)}`;
      }
    }
  }

  return '';
}

function extractAlerts(root: HTMLElement): string {
  const alerts = root.querySelectorAll(
    '[role="alert"], [aria-live="assertive"], [class*="MuiAlert-root"], [class*="bui-Alert"]',
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

function extractStepperState(root: HTMLElement): string {
  const steppers = root.querySelectorAll('.MuiStepper-root');
  if (steppers.length === 0) return '';

  const lines: string[] = ['## Stepper'];
  steppers.forEach(stepper => {
    const labels = stepper.querySelectorAll('.MuiStepLabel-label');
    labels.forEach(label => {
      const text = label.textContent?.trim();
      if (!text) return;
      const isActive = label.classList.contains('Mui-active');
      const isCompleted = label.classList.contains('Mui-completed');
      let marker = '';
      if (isActive) marker = ' [active]';
      else if (isCompleted) marker = ' [done]';
      lines.push(`- ${text}${marker}`);
    });
    stepper.remove();
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

function extractStatusIndicators(root: HTMLElement): string {
  const indicators = root.querySelectorAll('[aria-label^="Status"]');
  if (indicators.length === 0) return '';

  const lines: string[] = ['## Status'];
  const seen = new Set<string>();
  indicators.forEach(el => {
    if (el.closest('td, th')) return;
    const status = el.getAttribute('aria-label')?.replace('Status ', '') || '';
    const text = el.textContent?.trim();
    const entry = text ? `${status}: ${text}` : status;
    if (entry && !seen.has(entry)) {
      seen.add(entry);
      lines.push(`- ${entry}`);
    }
    el.remove();
  });
  return lines.length > 1 ? lines.join('\n') : '';
}

function extractFormFields(root: HTMLElement): string {
  const FORM_SELECTOR =
    '.MuiFormControl-root, .MuiTextField-root, [class*="bui-TextField"]';
  const liveControls = Array.from(document.querySelectorAll(FORM_SELECTOR));
  const cloneControls = root.querySelectorAll(FORM_SELECTOR);
  if (liveControls.length === 0) return '';

  // Only process leaf-level controls (those not containing another matched control)
  const leafControls = liveControls.filter(
    control => !control.querySelector(FORM_SELECTOR),
  );

  const lines: string[] = ['## Form Fields'];
  const seen = new Set<string>();

  leafControls.forEach(control => {
    // Skip controls already captured by extractFilterSections
    if (control.closest('[data-testid*="filter"]')) return;

    // Skip search inputs already captured by extractSearchInputs
    const searchInput = control.querySelector(
      'input[placeholder*="earch" i], input[aria-label*="earch" i]',
    );
    if (
      searchInput &&
      !control.querySelector(
        '.MuiSelect-select, .MuiChip-label, input[type="checkbox"]',
      )
    )
      return;

    const { label, value } = resolveFormField(control as HTMLElement);
    if (!label) return;
    const key = `${label}:${value}`;
    if (seen.has(key)) return;
    seen.add(key);

    const helper = control
      .querySelector('.MuiFormHelperText-root, [slot="description"]')
      ?.textContent?.trim();
    let line = `- ${label}: ${value || '(empty)'}`;
    if (helper) line += ` (${helper})`;
    lines.push(line);
  });
  cloneControls.forEach(el => el.remove());
  return lines.length > 1 ? lines.join('\n') : '';
}

function resolveFormField(control: HTMLElement): {
  label: string;
  value: string;
} {
  // --- Label resolution ---
  let label = '';
  const labelEl = control.querySelector('label');
  if (labelEl) {
    label = labelEl.textContent?.trim() || '';
  }
  if (!label) {
    // Autocomplete pattern: label wraps the autocomplete as a parent
    const parentLabel = control.closest('label');
    if (parentLabel) {
      const span = parentLabel.querySelector(':scope > span');
      label =
        span?.textContent?.trim() ||
        parentLabel.childNodes[0]?.textContent?.trim() ||
        '';
    }
  }
  if (!label) {
    // label[for] pointing at an input inside this control
    const input = control.querySelector('input[id]') as HTMLInputElement | null;
    if (input?.id) {
      const forLabel = document.querySelector(
        `label[for="${input.id}"]`,
      ) as HTMLElement | null;
      if (forLabel) {
        label = forLabel.textContent?.trim() || '';
      }
    }
  }
  if (!label) {
    // Sibling label preceding the Autocomplete ancestor
    const autocomplete = control.closest('.MuiAutocomplete-root');
    if (autocomplete) {
      const prev = autocomplete.previousElementSibling;
      if (
        prev?.tagName === 'LABEL' ||
        prev?.matches?.('[class*="MuiTypography"]')
      ) {
        label = prev.textContent?.trim() || '';
      }
    }
  }
  if (!label) {
    const input = control.querySelector('input');
    label =
      control.closest('[aria-label]')?.getAttribute('aria-label') ||
      input?.getAttribute('aria-label') ||
      input?.getAttribute('placeholder') ||
      '';
  }

  // --- Value resolution (chips > select display > checkbox group > input) ---

  // Autocomplete chips (multi-select)
  const chips = control.querySelectorAll('.MuiChip-label');
  if (chips.length > 0) {
    const chipValues = Array.from(chips)
      .map(c => c.textContent?.trim())
      .filter(Boolean);
    return { label, value: chipValues.join(', ') };
  }

  // MUI Select visible text
  const selectDisplay = control.querySelector(
    '.MuiSelect-select:not(.MuiTablePagination-select)',
  );
  if (selectDisplay) {
    return { label, value: selectDisplay.textContent?.trim() || '' };
  }

  // Checkbox group — collect checked values
  const checkboxes = control.querySelectorAll('input[type="checkbox"]');
  if (checkboxes.length > 0) {
    const checked: string[] = [];
    checkboxes.forEach(cb => {
      const input = cb as HTMLInputElement;
      if (input.checked) {
        const cbLabel =
          cb
            .closest('label')
            ?.querySelector('.MuiFormControlLabel-label')
            ?.textContent?.trim() || input.value;
        checked.push(cbLabel);
      }
    });
    return { label, value: checked.join(', ') };
  }

  // Standard input/textarea
  const input = control.querySelector(
    'input:not([type="checkbox"]):not([type="radio"]):not([aria-hidden="true"]), textarea, select',
  ) as HTMLInputElement | null;
  return { label, value: input?.value || '' };
}

function extractSearchInputs(): string {
  const searchInputs = document.querySelectorAll(
    'input[placeholder*="earch" i], input[aria-label*="earch" i], [aria-label="search" i] input',
  );
  if (searchInputs.length === 0) return '';

  const lines: string[] = ['## Search'];
  const seen = new Set<string>();

  searchInputs.forEach(el => {
    const input = el as HTMLInputElement;
    if (input.type === 'hidden') return;
    const value = input.value;
    const label =
      input.getAttribute('placeholder') ||
      input.getAttribute('aria-label') ||
      input.closest('[aria-label]')?.getAttribute('aria-label') ||
      'Search';
    const key = `${label}:${value}`;
    if (!seen.has(key)) {
      seen.add(key);
      lines.push(`- ${label}: ${value || '(empty)'}`);
    }
  });
  return lines.length > 1 ? lines.join('\n') : '';
}

function extractFilterSections(): string {
  const lines: string[] = ['## Filters'];

  // Pattern 1: Accordion filter lists (SearchType.Accordion)
  // Selected item has Mui-selected inside a nav[aria-label="filter by type"]
  const filterNavs = document.querySelectorAll(
    'nav[aria-label*="filter"], .MuiAccordionDetails-root nav',
  );
  filterNavs.forEach(nav => {
    const heading =
      nav
        .closest('.MuiAccordion-root')
        ?.previousElementSibling?.textContent?.trim() ||
      nav
        .closest('.MuiAccordionDetails-root')
        ?.closest('.MuiAccordion-root')
        ?.querySelector('.MuiAccordionSummary-content')
        ?.textContent?.trim();
    const groupLabel =
      heading ||
      nav.closest('.MuiBox-root')?.querySelector('h2')?.textContent?.trim();

    const selected = nav.querySelector('.Mui-selected');
    if (selected) {
      const primary = selected
        .querySelector('.MuiListItemText-primary')
        ?.textContent?.trim();
      const secondary = selected
        .querySelector('.MuiListItemText-secondary')
        ?.textContent?.trim();
      const text = secondary ? `${primary} (${secondary})` : primary;
      if (groupLabel && text) {
        lines.push(`- ${groupLabel}: ${text}`);
      }
    }
  });

  // Pattern 2: Menu pickers (role="menu" with Mui-selected — catalog pickers)
  const menus = document.querySelectorAll('ul[role="menu"]');
  menus.forEach(menu => {
    const groupLabel =
      menu.getAttribute('aria-label') ||
      (
        menu.closest('.MuiCard-root')?.previousElementSibling as HTMLElement
      )?.textContent?.trim();
    const selected = menu.querySelector('.Mui-selected');
    if (selected) {
      const selectedText = selected
        .querySelector('p, .MuiListItemText-root')
        ?.textContent?.trim();
      if (groupLabel && selectedText) {
        lines.push(`- ${groupLabel}: ${selectedText}`);
      }
    }
  });

  // Pattern 3: Form controls inside data-testid*="filter" containers (Select, Checkbox)
  const filterContainers = document.querySelectorAll('[data-testid*="filter"]');
  filterContainers.forEach(container => {
    const resolved = resolveFilterControl(container as HTMLElement);
    if (resolved && resolved.label) {
      lines.push(`- ${resolved.label}: ${resolved.value || '(empty)'}`);
    }
  });

  return lines.length > 1 ? lines.join('\n') : '';
}

function resolveFilterControl(
  container: HTMLElement,
): { label: string; value: string } | null {
  const labelEl = container.querySelector(
    'label, .MuiFormLabel-root, .MuiInputLabel-root',
  );
  let label =
    labelEl?.textContent?.trim() || container.getAttribute('aria-label') || '';

  // MUI Select visible text
  const selectDisplay = container.querySelector(
    '.MuiSelect-select:not(.MuiTablePagination-select)',
  );
  if (selectDisplay) {
    if (!label) {
      label =
        container.querySelector('[aria-label]')?.getAttribute('aria-label') ||
        '';
    }
    return { label, value: selectDisplay.textContent?.trim() || '' };
  }

  // Autocomplete chips
  const chips = container.querySelectorAll('.MuiChip-label');
  if (chips.length > 0) {
    const chipValues = Array.from(chips)
      .map(c => c.textContent?.trim())
      .filter(Boolean);
    return { label, value: chipValues.join(', ') };
  }

  // Checkbox group
  const checkboxes = container.querySelectorAll('input[type="checkbox"]');
  if (checkboxes.length > 0) {
    const checked: string[] = [];
    checkboxes.forEach(cb => {
      const input = cb as HTMLInputElement;
      if (input.checked) {
        const cbLabel =
          cb
            .closest('label')
            ?.querySelector('.MuiFormControlLabel-label')
            ?.textContent?.trim() || input.value;
        checked.push(cbLabel);
      }
    });
    return { label, value: checked.join(', ') };
  }

  // Standard input/textarea (not search)
  const input = container.querySelector(
    'input:not([type="checkbox"]):not([type="radio"]):not([aria-hidden="true"]):not([placeholder*="earch" i]), textarea',
  ) as HTMLInputElement | null;
  if (input) {
    if (!label) {
      label = input.getAttribute('placeholder') || '';
    }
    return { label, value: input.value || '' };
  }

  return null;
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

function extractDescriptionLists(root: HTMLElement): string {
  const dls = root.querySelectorAll('dl');
  if (dls.length === 0) return '';

  const lines: string[] = ['## Details'];
  dls.forEach(dl => {
    const terms = dl.querySelectorAll('dt');
    terms.forEach(dt => {
      const key = collapseWhitespace(dt.textContent || '');
      const dd = dt.nextElementSibling;
      const val =
        dd?.tagName === 'DD' ? collapseWhitespace(dd.textContent || '') : '';
      if (key) lines.push(`- ${key}: ${val}`);
    });
    dl.remove();
  });
  return lines.length > 1 ? lines.join('\n') : '';
}

function extractEmptyState(root: HTMLElement): string {
  const emptyState = root.querySelector('[class*="BackstageEmptyState"]');
  if (!emptyState) return '';

  const title = emptyState.querySelector('h5')?.textContent?.trim();
  const desc = emptyState
    .querySelector('[class*="body1"]')
    ?.textContent?.trim();
  const lines = ['## Empty State'];
  if (title) lines.push(`Title: ${title}`);
  if (desc) lines.push(desc);
  emptyState.remove();
  return lines.length > 1 ? lines.join('\n') : '';
}

function extractPagination(root: HTMLElement): string {
  const paginations = root.querySelectorAll(
    '.MuiTablePagination-root, [class*="TablePagination"], [class*="bui-TablePagination"]',
  );
  if (paginations.length === 0) return '';

  const lines: string[] = [];
  paginations.forEach(pg => {
    // Only extract pagination that has actionable navigation buttons
    const hasActions = pg.querySelector(
      '.MuiTablePagination-actions button:not([disabled]), [class*="PaginationActions"] button:not([disabled])',
    );
    if (hasActions) {
      const text = collapseWhitespace(pg.textContent || '');
      if (text) lines.push(`Pagination: ${text}`);
    }
    pg.remove();
  });
  return lines.length > 0 ? lines.join('\n') : '';
}

function extractBodyText(root: HTMLElement, budget: number): string {
  if (budget <= 0) return '';

  const preBlocks = root.querySelectorAll('pre');
  const preTexts: string[] = [];
  preBlocks.forEach(pre => {
    const text = pre.textContent || '';
    if (text.trim()) {
      preTexts.push(text.slice(0, 500));
    }
    pre.remove();
  });

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const lines: string[] = ['## Content'];
  let length = lines[0].length;
  const seen = new Set<string>();

  for (const preText of preTexts) {
    const block = `\`\`\`\n${preText}\n\`\`\``;
    const blockLength = block.length + 1;
    if (length + blockLength > budget) break;
    lines.push(block);
    length += blockLength;
  }

  let node = walker.nextNode();
  while (node) {
    const text = collapseWhitespace(node.textContent || '');
    if (text && text.length > 1 && !seen.has(text)) {
      seen.add(text);
      const lineLength = text.length + 1;
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
  const shadowHosts = document.querySelectorAll(
    '[data-testid="techdocs-native-shadowroot"], [class*="shadowDom" i]',
  );
  if (shadowHosts.length === 0) return '';

  const lines: string[] = ['## Documentation'];

  shadowHosts.forEach(host => {
    const root = host.shadowRoot;
    if (!root) return;

    const container =
      root.querySelector('article.md-content__inner') ||
      root.querySelector('.md-content__inner') ||
      root.querySelector('.md-typeset') ||
      root.querySelector('.md-content') ||
      root.querySelector('main');

    if (!container) return;

    container
      .querySelectorAll('style, script, link, noscript, svg, img, template')
      .forEach(el => el.remove());

    const headings = container.querySelectorAll('h1, h2, h3, h4');
    if (headings.length > 0) {
      headings.forEach(h => {
        const level = parseInt(h.tagName[1], 10);
        const indent = '  '.repeat(level - 1);
        const text = h.textContent?.trim().replace(/¶/g, '');
        if (text) lines.push(`${indent}- ${text}`);
      });
      lines.push('');
    }

    container.querySelectorAll('p').forEach(p => {
      if (p.closest('.md-nav, .md-sidebar, .md-footer')) return;
      const text = collapseWhitespace(p.textContent || '').replace(/¶/g, '');
      if (text && text.length > 2) lines.push(text);
    });

    container.querySelectorAll('ul, ol').forEach(list => {
      if (list.closest('.md-nav, .md-sidebar, .md-footer')) return;
      list.querySelectorAll(':scope > li').forEach(li => {
        const text = collapseWhitespace(li.textContent || '').replace(/¶/g, '');
        if (text && text.length > 2) lines.push(`- ${text}`);
      });
    });

    container.querySelectorAll('pre').forEach(pre => {
      const code = pre.textContent?.trim();
      if (code) {
        lines.push(`\`\`\`\n${code.slice(0, 500)}\n\`\`\``);
      }
    });
  });

  return lines.length > 1 ? lines.join('\n') : '';
}

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}
