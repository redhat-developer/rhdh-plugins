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

/**
 * Centralized CSS selectors for DOM extraction.
 * Library-specific selectors (MUI, BUI, PF) are grouped here so they can be
 * updated in one place when BUI equivalents land upstream.
 *
 * MUI selectors use [class*="..."] because JSS emits hashed class names
 * (e.g. MuiFormControl-root-12213) that do not match exact class selectors.
 */

// ── Noise / exclusion ──

export const NOISE_SELECTORS = [
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
  '[class*="MuiCollapse-hidden"]',
  '[data-testid="techdocs-native-shadowroot"]',
] as const;

export const NOISE_SELECTOR = NOISE_SELECTORS.join(', ');

// ── Header ──

export const PLUGIN_NAME_SELECTOR = '.bui-PluginHeaderToolbarName';
export const PAGE_TITLE_SELECTOR = '.bui-HeaderTitle';
export const ACTIVE_TAB_SELECTOR = '[role="tab"][aria-selected="true"]';
export const BREADCRUMB_SELECTOR =
  '[aria-label="breadcrumb"], [class*="MuiBreadcrumbs-root"], [class*="bui-HeaderBreadcrumb"]';
export const ACTIVE_NAV_SELECTOR = '[aria-current="page"]';

// ── Tabs ──

export const TAB_LIST_SELECTOR = '[role="tablist"]';
export const TAB_SELECTOR = '[role="tab"]';
export const BUI_NAV_SELECTOR =
  'nav[aria-label*="navigation" i], nav[class*="bui-HeaderNav"]';
export const BUI_NAV_ITEM_SELECTOR = 'a[class*="NavItem"], a[href]';

// ── Dialog / overlay ──

export const MODAL_DIALOG_SELECTOR = '[role="dialog"][aria-modal="true"]';
export const DIALOG_TITLE_SELECTOR =
  '[class*="MuiDialogTitle"], [class*="bui-DialogHeaderTitle"]';
export const DIALOG_CONTENT_SELECTOR =
  '[class*="MuiDialogContent"], [class*="bui-DialogBody"]';
export const DRAWER_PAPER_SELECTOR = '[class*="MuiDrawer-paper"]';
export const DOCKED_DRAWER_BODY_CLASS = 'docked-drawer-open';

// ── Alerts ──

export const ALERT_SELECTOR =
  '[role="alert"], [aria-live="assertive"], [class*="MuiAlert-root"], [class*="bui-Alert"]';

// ── Stepper ──

export const STEPPER_ROOT_SELECTOR = '[class*="MuiStepper-root"]';
export const STEPPER_LABEL_SELECTOR =
  '[class*="MuiStepLabel-label"]:not([class*="labelContainer"])';
export const STEPPER_ACTIVE_CLASS = 'Mui-active';
export const STEPPER_COMPLETED_CLASS = 'Mui-completed';

// ── Status ──

export const STATUS_INDICATOR_SELECTOR = '[aria-label^="Status"]';

// ── Forms ──

export const RJSF_FORM_SELECTOR = 'form.rjsf, form[class*="rjsf"]';
export const FORM_CONTROL_SELECTOR =
  '[class*="MuiFormControl-root"], [class*="MuiTextField-root"], [class*="bui-TextField"]';
export const FORM_HELPER_SELECTOR =
  '[class*="MuiFormHelperText-root"], [slot="description"]';
export const AUTOCOMPLETE_ROOT_SELECTOR = '[class*="MuiAutocomplete-root"]';
export const TYPOGRAPHY_SELECTOR = '[class*="MuiTypography"]';
export const CHIP_LABEL_SELECTOR = '[class*="MuiChip-label"]';
export const SELECT_DISPLAY_SELECTOR =
  '[class*="MuiSelect-select"]:not([class*="MuiTablePagination-select"])';
export const SELECT_NATIVE_INPUT_SELECTOR = '[class*="MuiSelect-nativeInput"]';
export const FORM_CONTROL_LABEL_SELECTOR =
  '[class*="MuiFormControlLabel-label"]';
export const FORM_LABEL_SELECTOR =
  '[class*="MuiFormLabel-root"], [class*="MuiInputLabel-root"]';

/** Nodes stripped when serializing form controls to compact HTML */
export const FORM_HTML_STRIP_SELECTOR = [
  'script',
  'style',
  'svg',
  'input[aria-hidden="true"]',
  '[aria-hidden="true"]',
  '[class*="MuiTouchRipple-root"]',
  '[class*="MuiInputAdornment-root"]',
  'fieldset',
  'button',
].join(', ');

// ── Search ──

export const SEARCH_INPUT_SELECTOR =
  'input[placeholder*="earch" i], input[aria-label*="earch" i], [aria-label="search" i] input';

// ── Filters ──

export const FILTER_CONTAINER_SELECTOR = '[data-testid*="filter"]';
export const FILTER_NAV_SELECTOR =
  'nav[aria-label*="filter"], [class*="MuiAccordionDetails-root"] nav';
export const ACCORDION_ROOT_SELECTOR = '[class*="MuiAccordion-root"]';
export const ACCORDION_DETAILS_SELECTOR = '[class*="MuiAccordionDetails-root"]';
export const ACCORDION_SUMMARY_CONTENT_SELECTOR =
  '[class*="MuiAccordionSummary-content"]';
export const FILTER_BOX_SELECTOR = '[class*="MuiBox-root"]';
export const SELECTED_ITEM_SELECTOR = '[class*="Mui-selected"]';
export const LIST_ITEM_TEXT_PRIMARY_SELECTOR =
  '[class*="MuiListItemText-primary"]';
export const LIST_ITEM_TEXT_SECONDARY_SELECTOR =
  '[class*="MuiListItemText-secondary"]';
export const MENU_SELECTOR = 'ul[role="menu"]';
export const CARD_ROOT_SELECTOR = '[class*="MuiCard-root"]';
export const LIST_ITEM_TEXT_ROOT_SELECTOR = '[class*="MuiListItemText-root"]';

// ── Pagination ──

export const PAGINATION_ROOT_SELECTOR =
  '[class*="MuiTablePagination-root"], [class*="TablePagination"], [class*="bui-TablePagination"]';
export const PAGINATION_ACTIONS_SELECTOR =
  '[class*="MuiTablePagination-actions"] button:not([disabled]), [class*="PaginationActions"] button:not([disabled])';

// ── Cards / Dashboard layout ──

export const CARD_LAYOUT_SELECTOR = [
  '[class*="MuiMasonry-root"]',
  '[class*="MuiGrid-container"]',
  '[class*="pf-l-gallery"]',
  '[class*="bui-Grid"]',
].join(', ');

export const CARD_ITEM_SELECTOR = [
  '[class*="MuiPaper-root"]',
  '[class*="MuiCard-root"]',
  '.pf-v5-c-card, [class*="pf-c-card"]',
  '[class*="bui-Card"]',
].join(', ');

export const CARD_TITLE_SELECTOR =
  'h3, h4, h5, h6, [class*="CardHeader-title"]';

export const RECHARTS_LEGEND_SELECTOR =
  '.recharts-legend-wrapper p, .recharts-legend-wrapper span[class*="Text"]';

// ── Empty state ──

export const EMPTY_STATE_SELECTOR = '[class*="BackstageEmptyState"]';
export const EMPTY_STATE_BODY_SELECTOR = '[class*="body1"]';

// ── Shadow DOM (TechDocs) ──

export const SHADOW_HOST_SELECTOR =
  '[data-testid="techdocs-native-shadowroot"], [class*="shadowDom" i]';
export const SHADOW_NOISE_SELECTOR =
  'style, script, link, noscript, svg, img, template';
