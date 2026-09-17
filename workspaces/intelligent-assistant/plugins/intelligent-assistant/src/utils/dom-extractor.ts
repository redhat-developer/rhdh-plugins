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
  ACCORDION_DETAILS_SELECTOR,
  ACCORDION_ROOT_SELECTOR,
  ACCORDION_SUMMARY_CONTENT_SELECTOR,
  ACTIVE_NAV_SELECTOR,
  ACTIVE_TAB_SELECTOR,
  ALERT_SELECTOR,
  BREADCRUMB_SELECTOR,
  BUI_NAV_ITEM_SELECTOR,
  BUI_NAV_SELECTOR,
  CARD_ITEM_SELECTOR,
  CARD_LAYOUT_SELECTOR,
  CARD_ROOT_SELECTOR,
  CARD_TITLE_SELECTOR,
  CHIP_LABEL_SELECTOR,
  DIALOG_CONTENT_SELECTOR,
  DIALOG_TITLE_SELECTOR,
  DOCKED_DRAWER_BODY_CLASS,
  DRAWER_PAPER_SELECTOR,
  EMPTY_STATE_BODY_SELECTOR,
  EMPTY_STATE_SELECTOR,
  FILTER_BOX_SELECTOR,
  FILTER_CONTAINER_SELECTOR,
  FILTER_NAV_SELECTOR,
  FORM_CONTROL_LABEL_SELECTOR,
  FORM_CONTROL_SELECTOR,
  FORM_HTML_STRIP_SELECTOR,
  FORM_LABEL_SELECTOR,
  LIST_ITEM_TEXT_PRIMARY_SELECTOR,
  LIST_ITEM_TEXT_ROOT_SELECTOR,
  LIST_ITEM_TEXT_SECONDARY_SELECTOR,
  MENU_SELECTOR,
  MODAL_DIALOG_SELECTOR,
  NOISE_SELECTOR,
  PAGE_TITLE_SELECTOR,
  PAGINATION_ACTIONS_SELECTOR,
  PAGINATION_ROOT_SELECTOR,
  PLUGIN_NAME_SELECTOR,
  RECHARTS_LEGEND_SELECTOR,
  RJSF_FORM_SELECTOR,
  SEARCH_INPUT_SELECTOR,
  SELECT_DISPLAY_SELECTOR,
  SELECTED_ITEM_SELECTOR,
  SHADOW_HOST_SELECTOR,
  SHADOW_NOISE_SELECTOR,
  STATUS_INDICATOR_SELECTOR,
  STEPPER_ACTIVE_CLASS,
  STEPPER_COMPLETED_CLASS,
  STEPPER_LABEL_SELECTOR,
  STEPPER_ROOT_SELECTOR,
  TAB_LIST_SELECTOR,
  TAB_SELECTOR,
} from './dom-selectors';
import { isSensitiveElement, redactText } from './sensitive-data-redactor';

const DEFAULT_MAX_CHARS = 8000;
const MAX_TABLE_ROWS = 50;
const MAX_TABLES = 10;
const MAX_CARDS = 10;
const MAX_CARD_CHARS = 500;
const MIN_CARDS_THRESHOLD = 1;
const MAX_FORM_HTML_CHARS = 4000;
const SENSITIVE_VALUE = '[REDACTED]';

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
 *   forms (HTML) > tables > description lists > empty state > pagination >
 *   body text > shadow DOM.
 *
 * Stops appending when maxChars budget is reached.
 */
export function extractPageContext(options?: DomExtractionOptions): string {
  try {
    return extractPageContextInternal(options);
  } catch {
    return '';
  }
}

function extractPageContextInternal(options?: DomExtractionOptions): string {
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
    .querySelector(PLUGIN_NAME_SELECTOR)
    ?.textContent?.trim();
  if (pluginName) {
    headerLines.push(`Plugin: ${pluginName}`);
  }

  const pageTitle = document
    .querySelector(PAGE_TITLE_SELECTOR)
    ?.textContent?.trim();
  if (pageTitle) {
    headerLines.push(`Title: ${pageTitle}`);
  }

  const activeTab = document
    .querySelector(ACTIVE_TAB_SELECTOR)
    ?.textContent?.trim();
  if (activeTab) {
    headerLines.push(`CurrentTab: ${activeTab}`);
  }

  const breadcrumb = document.querySelector(BREADCRUMB_SELECTOR);
  if (breadcrumb) {
    const crumbs = Array.from(breadcrumb.querySelectorAll('li, a, p'))
      .map(el => el.textContent?.trim())
      .filter(Boolean);
    if (crumbs.length > 0) {
      headerLines.push(`Breadcrumb: ${crumbs.join(' > ')}`);
    }
  }

  const activeNav = document
    .querySelector(ACTIVE_NAV_SELECTOR)
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

  // 3. Search inputs (live DOM — cloneNode does not preserve input values)
  const searchText = extractSearchInputs();
  if (searchText && !appendSection(searchText)) {
    return redactText(sections.join('\n\n'));
  }

  // 4. Filter sections (live DOM — needs live checked/selected state)
  const filterText = extractFilterSections();
  if (filterText && !appendSection(filterText)) {
    return redactText(sections.join('\n\n'));
  }

  // 5. Tabs (all tabs including active marker)
  const tabsText = extractTabs(clone);
  if (tabsText && !appendSection(tabsText)) {
    return redactText(sections.join('\n\n'));
  }

  // 6. Remove navigation noise (after breadcrumb/search extraction above)
  clone.querySelectorAll('nav, [role="navigation"]').forEach(el => el.remove());

  // 7. Alerts / Toasts
  const alertText = extractAlerts(clone);
  if (alertText && !appendSection(alertText)) {
    return redactText(sections.join('\n\n'));
  }

  // 8. Stepper state
  const stepperText = extractStepperState(clone);
  if (stepperText && !appendSection(stepperText)) {
    return redactText(sections.join('\n\n'));
  }

  // 9. Cards (dashboard grouped extraction — before headings so card-internal h2/h3 don't leak)
  const cardsText = extractCards(clone);
  if (cardsText && !appendSection(cardsText)) {
    return redactText(sections.join('\n\n'));
  }

  // 10. Headings
  const headingsText = extractHeadings(clone);
  if (headingsText && !appendSection(headingsText)) {
    return redactText(sections.join('\n\n'));
  }

  // 11. Status indicators
  const statusText = extractStatusIndicators(clone);
  if (statusText && !appendSection(statusText)) {
    return redactText(sections.join('\n\n'));
  }

  // 12. Form fields (hybrid HTML — preserves label/input structure)
  const formsText = extractFormFields(clone);
  if (formsText && !appendSection(formsText)) {
    return redactText(sections.join('\n\n'));
  }

  // 13. Tables (also captures StructuredMetadataTable)
  const tablesText = extractTables(clone);
  if (tablesText && !appendSection(tablesText)) {
    return redactText(sections.join('\n\n'));
  }

  // 14. Description lists (dl/dt/dd key-value pairs)
  const dlText = extractDescriptionLists(clone);
  if (dlText && !appendSection(dlText)) {
    return redactText(sections.join('\n\n'));
  }

  // 15. Empty states
  const emptyText = extractEmptyState(clone);
  if (emptyText && !appendSection(emptyText)) {
    return redactText(sections.join('\n\n'));
  }

  // 16. Pagination context
  const paginationText = extractPagination(clone);
  if (paginationText && !appendSection(paginationText)) {
    return redactText(sections.join('\n\n'));
  }

  // 17. Body text (TreeWalker) -- fills remaining budget
  const bodyText = extractBodyText(clone, maxChars - charCount);
  if (bodyText) {
    appendSection(bodyText);
  }

  // 18. TechDocs Shadow DOM (if present on the live DOM)
  const shadowText = extractShadowDomContent();
  if (shadowText) {
    appendSection(shadowText);
  }

  const result = sections.join('\n\n');
  return result ? redactText(result) : '';
}

function extractActiveOverlay(): string {
  const dialog = document.querySelector(MODAL_DIALOG_SELECTOR);
  if (dialog) {
    const title = dialog
      .querySelector(DIALOG_TITLE_SELECTOR)
      ?.textContent?.trim();
    const content = collapseWhitespace(
      dialog.querySelector(DIALOG_CONTENT_SELECTOR)?.textContent || '',
    );
    const lines = ['## Active Dialog'];
    if (title) lines.push(`Title: ${title}`);
    if (content) lines.push(content);
    return lines.length > 1 ? lines.join('\n') : '';
  }

  if (document.body.classList.contains(DOCKED_DRAWER_BODY_CLASS)) {
    const drawerPaper = document.querySelector(DRAWER_PAPER_SELECTOR);
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
  const alerts = root.querySelectorAll(ALERT_SELECTOR);
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
  const steppers = root.querySelectorAll(STEPPER_ROOT_SELECTOR);
  if (steppers.length === 0) return '';

  const lines: string[] = ['## Stepper'];
  steppers.forEach(stepper => {
    const labels = stepper.querySelectorAll(STEPPER_LABEL_SELECTOR);
    labels.forEach(label => {
      const text = label.textContent?.trim();
      if (!text) return;
      const className = label.className || '';
      const isActive = className.includes(STEPPER_ACTIVE_CLASS);
      const isCompleted = className.includes(STEPPER_COMPLETED_CLASS);
      let marker = '';
      if (isActive) marker = ' [active]';
      else if (isCompleted) marker = ' [done]';
      lines.push(`- ${text}${marker}`);
    });
    stepper.remove();
  });
  return lines.length > 1 ? lines.join('\n') : '';
}

function extractTabs(root: HTMLElement): string {
  const lines: string[] = ['## Tabs'];

  // Strategy 1: Standard role="tablist" + role="tab"
  const tabLists = root.querySelectorAll(TAB_LIST_SELECTOR);
  tabLists.forEach(tabList => {
    const tabs = tabList.querySelectorAll(TAB_SELECTOR);
    tabs.forEach(tab => {
      const text = collapseWhitespace(tab.textContent || '');
      if (!text) return;
      const isSelected = tab.getAttribute('aria-selected') === 'true';
      lines.push(`- ${text}${isSelected ? ' [active]' : ''}`);
    });
    tabList.remove();
  });

  // Strategy 2: BUI-style nav with <a aria-current="page"> links
  if (lines.length <= 1) {
    const navs = root.querySelectorAll(BUI_NAV_SELECTOR);
    for (const nav of Array.from(navs)) {
      const links = nav.querySelectorAll(BUI_NAV_ITEM_SELECTOR);
      if (links.length < 2) continue;
      links.forEach(link => {
        const text = collapseWhitespace(link.textContent || '');
        if (!text) return;
        const isActive = link.getAttribute('aria-current') === 'page';
        lines.push(`- ${text}${isActive ? ' [active]' : ''}`);
      });
      nav.remove();
      break;
    }
  }

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

function extractCards(root: HTMLElement): string {
  try {
    let cardElements: Element[] = [];

    const hasTitle = (el: Element) => !!el.querySelector(CARD_TITLE_SELECTOR);

    // Strategy 1: Find cards within a recognized layout container
    const layouts = root.querySelectorAll(CARD_LAYOUT_SELECTOR);
    for (const layout of Array.from(layouts)) {
      const directCards = Array.from(layout.children).filter(el => {
        try {
          return el.matches(CARD_ITEM_SELECTOR) && hasTitle(el);
        } catch {
          return false;
        }
      });
      if (directCards.length >= MIN_CARDS_THRESHOLD) {
        cardElements = directCards;
        break;
      }
      // Also check one level deeper (grid item > card)
      const nestedCards: Element[] = [];
      for (const child of Array.from(layout.children)) {
        for (const grandchild of Array.from(child.children)) {
          try {
            if (
              grandchild.matches(CARD_ITEM_SELECTOR) &&
              hasTitle(grandchild)
            ) {
              nestedCards.push(grandchild);
            }
          } catch {
            /* skip */
          }
        }
      }
      if (nestedCards.length >= MIN_CARDS_THRESHOLD) {
        cardElements = nestedCards;
        break;
      }
    }

    // Strategy 2: Fallback — find all card items in root regardless of layout container
    if (cardElements.length < MIN_CARDS_THRESHOLD) {
      const allCards = Array.from(
        root.querySelectorAll(CARD_ITEM_SELECTOR),
      ).filter(el => {
        // Exclude nested cards (card within card)
        if (el.parentElement?.closest(CARD_ITEM_SELECTOR)) return false;
        return hasTitle(el);
      });
      if (allCards.length >= MIN_CARDS_THRESHOLD) {
        cardElements = allCards;
      }
    }

    if (cardElements.length < MIN_CARDS_THRESHOLD) return '';

    const sections: string[] = ['## Cards'];
    let totalChars = 0;
    let cardCount = 0;

    for (const card of cardElements) {
      if (cardCount >= MAX_CARDS) break;

      const titleEl = card.querySelector(CARD_TITLE_SELECTOR);
      const title = collapseWhitespace(titleEl?.textContent || '').replace(
        /\s*\*$/,
        '',
      );
      if (!title) {
        card.remove();
        continue;
      }

      const cardLines: string[] = [`### ${title}`];

      // Extract chart legend (before SVG removal in body text)
      const legendItems = card.querySelectorAll(RECHARTS_LEGEND_SELECTOR);
      if (legendItems.length > 0) {
        const seriesNames = Array.from(legendItems)
          .map(el => collapseWhitespace(el.textContent || ''))
          .filter(Boolean);
        if (seriesNames.length > 0) {
          cardLines.push(`Chart: ${seriesNames.join(', ')}`);
        }
      }

      // Remove noise from within card for text extraction
      card
        .querySelectorAll('svg, button, [aria-hidden="true"], hr, tfoot')
        .forEach(el => el.remove());
      // Remove the title element itself to avoid duplication
      titleEl?.remove();

      // Extract table if present
      const table = card.querySelector('table');
      if (table) {
        const rows = table.querySelectorAll('tr');
        const tableLines: string[] = [];
        let rowCount = 0;
        rows.forEach(row => {
          if (rowCount >= MAX_TABLE_ROWS) return;
          const cells = row.querySelectorAll('th, td');
          const cellTexts = Array.from(cells).map(cell =>
            collapseWhitespace(cell.textContent || ''),
          );
          if (cellTexts.some(Boolean)) {
            tableLines.push(`| ${cellTexts.join(' | ')} |`);
          }
          rowCount++;
        });
        if (tableLines.length > 0) {
          cardLines.push(tableLines.join('\n'));
        }
        table.remove();
      }

      // Extract structured key-value pairs from h2/h3 + value grids (e.g. About cards)
      const innerHeadings = card.querySelectorAll('h2, h3');
      if (innerHeadings.length >= 2) {
        let extractedKV = false;
        innerHeadings.forEach(h => {
          const key = collapseWhitespace(h.textContent || '');
          if (!key) return;
          // Get value from next sibling or parent container (after heading)
          const parent = h.parentElement;
          if (!parent) return;
          const cloned = parent.cloneNode(true) as HTMLElement;
          const hClone = cloned.querySelector(h.tagName.toLowerCase());
          hClone?.remove();
          const val = collapseWhitespace(cloned.textContent || '') || '--';
          cardLines.push(`${key}: ${val}`);
          extractedKV = true;
          h.remove();
        });
        if (extractedKV) {
          // Remove already-extracted content from raw text pass
          innerHeadings.forEach(h => h.remove());
        }
      }

      // Extract remaining text content (stats, summaries, empty states)
      const textContent = collapseWhitespace(card.textContent || '');
      if (textContent && textContent !== title) {
        cardLines.push(textContent);
      }

      const cardText = cardLines.join('\n');
      if (totalChars + cardText.length > MAX_CARD_CHARS * MAX_CARDS) break;

      sections.push(
        cardText.length > MAX_CARD_CHARS
          ? cardText.slice(0, MAX_CARD_CHARS)
          : cardText,
      );
      totalChars += Math.min(cardText.length, MAX_CARD_CHARS);
      cardCount++;
      card.remove();
    }

    return sections.length > 1 ? sections.join('\n\n') : '';
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('[DOM Cards] Error in extractCards:', e);
    return '';
  }
}

function extractStatusIndicators(root: HTMLElement): string {
  const indicators = root.querySelectorAll(STATUS_INDICATOR_SELECTOR);
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
  const htmlParts: string[] = [];
  let totalChars = 0;

  const appendHtml = (html: string): boolean => {
    if (!html) return false;
    if (totalChars + html.length > MAX_FORM_HTML_CHARS) {
      const remaining = MAX_FORM_HTML_CHARS - totalChars;
      if (remaining > 100) {
        htmlParts.push(html.slice(0, remaining));
        totalChars = MAX_FORM_HTML_CHARS;
      }
      return false;
    }
    htmlParts.push(html);
    totalChars += html.length;
    return true;
  };

  // Strategy 1: serialize whole RJSF / standard forms (preserves array fields, nesting)
  // Search live DOM first (allows syncing runtime input values), then fallback to clone
  const liveForms = document.querySelectorAll(RJSF_FORM_SELECTOR);
  const cloneForms = root.querySelectorAll(RJSF_FORM_SELECTOR);
  const forms = liveForms.length > 0 ? liveForms : cloneForms;
  const formsSource = liveForms.length > 0 ? 'live' : 'clone';
  // eslint-disable-next-line no-console
  console.debug('[DOM Forms] Strategy 1:', {
    selector: RJSF_FORM_SELECTOR,
    liveFound: liveForms.length,
    cloneFound: cloneForms.length,
    using: formsSource,
  });
  if (forms.length > 0) {
    forms.forEach((form, idx) => {
      if (form.closest(FILTER_CONTAINER_SELECTOR)) {
        // eslint-disable-next-line no-console
        console.debug(
          `[DOM Forms] Form ${idx} skipped: inside filter container`,
        );
        return;
      }
      try {
        const html = serializeFormControlHtml(form as HTMLElement);
        // eslint-disable-next-line no-console
        console.debug(`[DOM Forms] Form ${idx} serialized:`, {
          length: html.length,
          preview: html.slice(0, 200),
        });
        appendHtml(html);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.debug(`[DOM Forms] Form ${idx} serialization error:`, e);
      }
    });
    if (htmlParts.length > 0) {
      root.querySelectorAll(RJSF_FORM_SELECTOR).forEach(el => el.remove());
      return `## Form Fields (HTML)\n${htmlParts.join('\n')}`;
    }
  }

  // Strategy 2: individual leaf form controls
  const liveControls = Array.from(
    document.querySelectorAll(FORM_CONTROL_SELECTOR),
  );
  const cloneControls = Array.from(
    root.querySelectorAll(FORM_CONTROL_SELECTOR),
  );
  // Use live controls when available (allows syncLiveValuesToClone), fall back to clone
  const controlsSource = liveControls.length > 0 ? liveControls : cloneControls;
  // eslint-disable-next-line no-console
  console.debug('[DOM Forms] Strategy 2:', {
    selector: FORM_CONTROL_SELECTOR,
    liveCount: liveControls.length,
    cloneCount: cloneControls.length,
    using: liveControls.length > 0 ? 'live' : 'clone',
  });
  if (controlsSource.length === 0) return '';

  const leafControls = controlsSource.filter(
    control => !control.querySelector(FORM_CONTROL_SELECTOR),
  );

  leafControls.forEach(control => {
    if (control.closest(FILTER_CONTAINER_SELECTOR)) return;
    if (control.closest(RJSF_FORM_SELECTOR)) return;

    const searchInput = control.querySelector(SEARCH_INPUT_SELECTOR);
    if (
      searchInput &&
      !control.querySelector(
        `${SELECT_DISPLAY_SELECTOR}, ${CHIP_LABEL_SELECTOR}, input[type="checkbox"]`,
      )
    ) {
      return;
    }

    try {
      appendHtml(serializeFormControlHtml(control as HTMLElement));
    } catch {
      // individual control serialization failure is non-fatal
    }
  });

  root.querySelectorAll(FORM_CONTROL_SELECTOR).forEach(el => el.remove());
  return htmlParts.length > 0
    ? `## Form Fields (HTML)\n${htmlParts.join('\n')}`
    : '';
}

function serializeFormControlHtml(control: HTMLElement): string {
  const clone = control.cloneNode(true) as HTMLElement;

  clone.querySelectorAll(FORM_HTML_STRIP_SELECTOR).forEach(el => el.remove());

  syncLiveValuesToClone(control, clone);
  redactSensitiveInClone(clone);
  stripPresentationAttributes(clone);
  unwrapNoiseDivs(clone);

  const html = clone.outerHTML.replace(/\s+/g, ' ').trim();
  // eslint-disable-next-line no-console
  console.debug('[DOM Forms] serializeFormControlHtml result:', {
    inputTag: control.tagName,
    inputClass: control.className?.slice(0, 80),
    outputLength: html.length,
  });
  return html.length > 0 ? html : '';
}

function syncLiveValuesToClone(
  liveRoot: HTMLElement,
  cloneRoot: HTMLElement,
): void {
  const liveInputs = liveRoot.querySelectorAll('input, textarea, select');
  const cloneInputs = cloneRoot.querySelectorAll('input, textarea, select');

  liveInputs.forEach((liveEl, i) => {
    const cloneEl = cloneInputs[i] as
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | undefined;
    if (!cloneEl) return;

    if (cloneEl instanceof HTMLSelectElement) {
      cloneEl.value = (liveEl as HTMLSelectElement).value;
    } else if (
      cloneEl instanceof HTMLInputElement &&
      (cloneEl.type === 'checkbox' || cloneEl.type === 'radio')
    ) {
      cloneEl.checked = (liveEl as HTMLInputElement).checked;
      if (cloneEl.checked) {
        cloneEl.setAttribute('checked', '');
      } else {
        cloneEl.removeAttribute('checked');
      }
    } else {
      const liveValue = (liveEl as HTMLInputElement | HTMLTextAreaElement)
        .value;
      cloneEl.value = liveValue;
      cloneEl.setAttribute('value', liveValue);
    }
  });
}

function redactSensitiveInClone(root: HTMLElement): void {
  root.querySelectorAll('input, textarea, select').forEach(el => {
    if (isSensitiveElement(el, document)) {
      (el as HTMLInputElement).value = SENSITIVE_VALUE;
      el.setAttribute('value', SENSITIVE_VALUE);
      if ((el as HTMLInputElement).type === 'checkbox') {
        (el as HTMLInputElement).checked = false;
        el.removeAttribute('checked');
      }
    }
  });
}

function stripPresentationAttributes(root: HTMLElement): void {
  root.removeAttribute('class');
  root.removeAttribute('style');
  root.querySelectorAll('*').forEach(el => {
    el.removeAttribute('class');
    el.removeAttribute('style');
    el.removeAttribute('data-testid');
  });
}

/**
 * Recursively unwraps wrapper divs/spans that have no semantic meaning
 * (no id, no aria-*, no role). Replaces the wrapper with its children in-place.
 * This flattens MUI's deeply nested grid/box structure to reduce HTML size.
 */
function unwrapNoiseDivs(root: HTMLElement): void {
  const isSemanticTag = (tag: string) => !['DIV', 'SPAN'].includes(tag);

  const hasSemanticAttrs = (el: Element) =>
    el.hasAttribute('id') ||
    el.hasAttribute('role') ||
    el.hasAttribute('aria-label') ||
    el.hasAttribute('aria-describedby') ||
    el.hasAttribute('for') ||
    el.hasAttribute('novalidate');

  let changed = true;
  while (changed) {
    changed = false;
    const wrappers = root.querySelectorAll('div, span');
    for (const el of Array.from(wrappers)) {
      if (isSemanticTag(el.tagName)) continue;
      if (hasSemanticAttrs(el)) continue;
      if (el === root) continue;

      const parent = el.parentNode;
      if (!parent) continue;

      while (el.firstChild) {
        parent.insertBefore(el.firstChild, el);
      }
      parent.removeChild(el);
      changed = true;
    }
  }
}

function extractSearchInputs(): string {
  const searchInputs = document.querySelectorAll(SEARCH_INPUT_SELECTOR);
  if (searchInputs.length === 0) return '';

  const lines: string[] = ['## Search'];
  const seen = new Set<string>();

  searchInputs.forEach(el => {
    const input = el as HTMLInputElement;
    if (input.type === 'hidden') return;

    const label =
      input.getAttribute('placeholder') ||
      input.getAttribute('aria-label') ||
      input.closest('[aria-label]')?.getAttribute('aria-label') ||
      'Search';

    const value = isSensitiveElement(input, document)
      ? SENSITIVE_VALUE
      : input.value;

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

  const filterNavs = document.querySelectorAll(FILTER_NAV_SELECTOR);
  filterNavs.forEach(nav => {
    const heading =
      nav
        .closest(ACCORDION_ROOT_SELECTOR)
        ?.previousElementSibling?.textContent?.trim() ||
      nav
        .closest(ACCORDION_DETAILS_SELECTOR)
        ?.closest(ACCORDION_ROOT_SELECTOR)
        ?.querySelector(ACCORDION_SUMMARY_CONTENT_SELECTOR)
        ?.textContent?.trim();
    const groupLabel =
      heading ||
      nav
        .closest(FILTER_BOX_SELECTOR)
        ?.querySelector('h2')
        ?.textContent?.trim();

    const selected = nav.querySelector(SELECTED_ITEM_SELECTOR);
    if (selected) {
      const primary = selected
        .querySelector(LIST_ITEM_TEXT_PRIMARY_SELECTOR)
        ?.textContent?.trim();
      const secondary = selected
        .querySelector(LIST_ITEM_TEXT_SECONDARY_SELECTOR)
        ?.textContent?.trim();
      const text = secondary ? `${primary} (${secondary})` : primary;
      if (groupLabel && text) {
        lines.push(`- ${groupLabel}: ${text}`);
      }
    }
  });

  const menus = document.querySelectorAll(MENU_SELECTOR);
  menus.forEach(menu => {
    const groupLabel =
      menu.getAttribute('aria-label') ||
      (
        menu.closest(CARD_ROOT_SELECTOR)?.previousElementSibling as HTMLElement
      )?.textContent?.trim();
    const selected = menu.querySelector(SELECTED_ITEM_SELECTOR);
    if (selected) {
      const selectedText = selected
        .querySelector(`p, ${LIST_ITEM_TEXT_ROOT_SELECTOR}`)
        ?.textContent?.trim();
      if (groupLabel && selectedText) {
        lines.push(`- ${groupLabel}: ${selectedText}`);
      }
    }
  });

  const filterContainers = document.querySelectorAll(FILTER_CONTAINER_SELECTOR);
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
  const labelEl = container.querySelector(`label, ${FORM_LABEL_SELECTOR}`);
  let label =
    labelEl?.textContent?.trim() || container.getAttribute('aria-label') || '';

  const selectDisplay = container.querySelector(SELECT_DISPLAY_SELECTOR);
  if (selectDisplay) {
    if (!label) {
      label =
        container.querySelector('[aria-label]')?.getAttribute('aria-label') ||
        '';
    }
    return { label, value: selectDisplay.textContent?.trim() || '' };
  }

  const chips = container.querySelectorAll(CHIP_LABEL_SELECTOR);
  if (chips.length > 0) {
    const chipValues = Array.from(chips)
      .map(c => c.textContent?.trim())
      .filter(Boolean);
    return { label, value: chipValues.join(', ') };
  }

  const checkboxes = container.querySelectorAll('input[type="checkbox"]');
  if (checkboxes.length > 0) {
    const checked: string[] = [];
    checkboxes.forEach(cb => {
      const input = cb as HTMLInputElement;
      if (input.checked) {
        const cbLabel =
          cb
            .closest('label')
            ?.querySelector(FORM_CONTROL_LABEL_SELECTOR)
            ?.textContent?.trim() || input.value;
        checked.push(cbLabel);
      }
    });
    return { label, value: checked.join(', ') };
  }

  const input = container.querySelector(
    'input:not([type="checkbox"]):not([type="radio"]):not([aria-hidden="true"]):not([placeholder*="earch" i]), textarea',
  ) as HTMLInputElement | null;
  if (input) {
    if (!label) {
      label = input.getAttribute('placeholder') || '';
    }
    const value = isSensitiveElement(input, document)
      ? SENSITIVE_VALUE
      : input.value || '';
    return { label, value };
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

    // Strip pagination footers and empty spacer rows
    table.querySelectorAll('tfoot').forEach(el => el.remove());
    table
      .querySelectorAll('[class*="TablePagination"]')
      .forEach(el => el.remove());

    const rows = table.querySelectorAll('tr');
    const tableLines: string[] = [];
    let rowCount = 0;

    rows.forEach(row => {
      if (rowCount >= MAX_TABLE_ROWS) return;
      // Skip empty spacer rows (height-only, no content)
      if (!row.querySelector('th, td') || row.children.length === 0) return;
      const cells = row.querySelectorAll('th, td');
      const cellTexts = Array.from(cells).map(cell =>
        collapseWhitespace(cell.textContent || ''),
      );
      if (cellTexts.some(Boolean)) {
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
  const emptyState = root.querySelector(EMPTY_STATE_SELECTOR);
  if (!emptyState) return '';

  const title = emptyState.querySelector('h5')?.textContent?.trim();
  const desc = emptyState
    .querySelector(EMPTY_STATE_BODY_SELECTOR)
    ?.textContent?.trim();
  const lines = ['## Empty State'];
  if (title) lines.push(`Title: ${title}`);
  if (desc) lines.push(desc);
  emptyState.remove();
  return lines.length > 1 ? lines.join('\n') : '';
}

function extractPagination(root: HTMLElement): string {
  const paginations = root.querySelectorAll(PAGINATION_ROOT_SELECTOR);
  if (paginations.length === 0) return '';

  const lines: string[] = [];
  paginations.forEach(pg => {
    const hasActions = pg.querySelector(PAGINATION_ACTIONS_SELECTOR);
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
  const shadowHosts = document.querySelectorAll(SHADOW_HOST_SELECTOR);
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
      .querySelectorAll(SHADOW_NOISE_SELECTOR)
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
