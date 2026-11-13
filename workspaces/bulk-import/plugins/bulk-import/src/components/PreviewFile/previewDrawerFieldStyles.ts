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

import { bulkImportOpaqueSurfaceColor } from '../bulkImportSurfaces';

/** Bumped when styles change so dev HMR picks up updates (element id is replaced). */
const STYLE_ID = 'bulk-import-preview-drawer-field-styles-v5';

export const PREVIEW_DRAWER_FIELD_STYLES = `
.bulk-import-right-drawer-content {
  box-sizing: border-box;
  max-width: 100%;
  overflow-x: hidden;
}

.bulk-import-right-drawer-content [class*='Combobox'] {
  flex: 0 0 auto !important;
  max-width: 100%;
}

.bulk-import-right-drawer-content pre,
.bulk-import-right-drawer-content code {
  max-width: 100%;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.bulk-import-preview-pr-card,
.bulk-import-preview-pr-card__body,
.bulk-import-preview-pr-card__title {
  max-width: 100%;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.bulk-import-floating-field {
  position: relative;
  width: 100%;
  flex: 0 0 auto;
  box-sizing: border-box;
}

.bulk-import-floating-field__control {
  position: relative;
  box-sizing: border-box;
  border: 1px solid var(--bui-border-1, #c7c7c7);
  border-radius: var(--bui-radius-2, 6px);
  background-color: ${bulkImportOpaqueSurfaceColor};
  min-height: 2.75rem;
  padding: 0;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.bulk-import-floating-field--shrink-label:not(.bulk-import-floating-field--multiline)
  .bulk-import-floating-field__control {
  min-height: 2.5rem;
}

.bulk-import-floating-field:focus-within .bulk-import-floating-field__control {
  border-color: var(--bui-ring, #004080);
  box-shadow: 0 0 0 1px var(--bui-ring, #004080);
}

.bulk-import-floating-field[data-invalid='true'] .bulk-import-floating-field__control {
  border-color: var(--bui-border-danger, #c9190b);
  box-shadow: 0 0 0 1px var(--bui-border-danger, #c9190b);
}

.bulk-import-floating-field__control > :not(.bulk-import-floating-field__label) {
  position: relative;
  z-index: 1;
}

.bulk-import-floating-field__label {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: 400;
  color: var(--bui-fg-secondary, #6a6e73);
  pointer-events: none;
  z-index: 2;
  transition:
    top 0.15s ease,
    transform 0.15s ease,
    font-size 0.15s ease,
    color 0.15s ease,
    padding 0.15s ease;
  transform-origin: left top;
  max-width: calc(100% - 1.5rem);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bulk-import-floating-field--shrink-label .bulk-import-floating-field__label,
.bulk-import-floating-field:focus-within .bulk-import-floating-field__label {
  top: 0;
  left: 0.625rem;
  z-index: 3;
  transform: translateY(-50%) scale(0.875);
  padding: 0 0.25rem;
  background-color: ${bulkImportOpaqueSurfaceColor};
}

.bulk-import-floating-field:focus-within .bulk-import-floating-field__label {
  color: var(--bui-ring, #004080);
}

.bulk-import-floating-field[data-invalid='true'] .bulk-import-floating-field__label {
  color: var(--bui-border-danger, #c9190b);
}

.bulk-import-floating-field__helper {
  margin-top: 0.25rem;
  padding-left: 0.125rem;
  font-size: 0.75rem;
  line-height: 1.33;
  color: var(--bui-fg-secondary, #6a6e73);
}

.bulk-import-floating-field[data-invalid='true'] .bulk-import-floating-field__helper {
  color: var(--bui-border-danger, #c9190b);
}

.bulk-import-floating-field__control [class*='TextField'],
.bulk-import-floating-field__control [class*='TextAreaField'],
.bulk-import-floating-field__control [class*='Combobox'] {
  flex: 0 0 auto !important;
  width: 100%;
  margin: 0 !important;
}

.bulk-import-floating-field__control [class*='FieldError'] {
  display: none;
}

.bulk-import-floating-field__control input,
.bulk-import-floating-field__control textarea {
  box-shadow: none !important;
  background-color: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  width: 100%;
  box-sizing: border-box;
}

.bulk-import-floating-field__control [data-size='small'] input {
  min-height: 2.75rem;
  padding: 0.625rem 0.75rem;
}

.bulk-import-floating-field--shrink-label .bulk-import-floating-field__control [data-size='small'] input,
.bulk-import-floating-field:focus-within .bulk-import-floating-field__control [data-size='small'] input {
  padding-top: 0.75rem;
  padding-bottom: 0.5rem;
  min-height: 2.5rem;
}

.bulk-import-floating-field:not(.bulk-import-floating-field--shrink-label):not(:focus-within) input::placeholder {
  opacity: 0;
}

.bulk-import-floating-field--multiline .bulk-import-floating-field__control {
  min-height: 3rem;
}

.bulk-import-floating-field--multiline.bulk-import-floating-field--shrink-label
  .bulk-import-floating-field__control textarea,
.bulk-import-floating-field--multiline:focus-within .bulk-import-floating-field__control textarea {
  padding: 0.875rem 0.75rem 0.625rem;
  min-height: 2.75rem;
  line-height: 1.4;
}

.bulk-import-floating-field--combobox .bulk-import-floating-field__control {
  display: flex;
  align-items: stretch;
  min-height: 2.75rem;
}

.bulk-import-floating-field--combobox .bulk-import-floating-field__control [class*='Combobox'] {
  z-index: 1;
}

.bulk-import-floating-field--combobox .bulk-import-floating-field__control [class*='ComboboxInput'] {
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
  border-radius: 0 !important;
  width: 100%;
  height: 2.5rem;
  min-height: 2.5rem;
}

.bulk-import-floating-field--combobox
  [class*='Combobox'][data-invalid]
  [class*='ComboboxInput'] {
  box-shadow: none !important;
}

.bulk-import-floating-field--combobox [class*='ComboboxInputField'] {
  min-height: 1.25rem;
  height: 1.25rem;
  line-height: 1.25rem;
  padding: 0;
  padding-left: 0.75rem;
}

.bulk-import-floating-field--combobox.bulk-import-floating-field--shrink-label
  [class*='ComboboxInputField'],
.bulk-import-floating-field--combobox:focus-within [class*='ComboboxInputField'] {
  padding-top: 0.625rem;
  padding-bottom: 0.375rem;
  height: auto;
  min-height: 1.25rem;
}

.bulk-import-floating-field--combobox:has([class*='ComboboxInputIcon']):not(
    .bulk-import-floating-field--shrink-label
  ):not(:focus-within)
  .bulk-import-floating-field__label {
  left: 2.25rem;
}

.bulk-import-floating-field--combobox [class*='ComboboxInputChevron'] {
  z-index: 2;
  position: relative;
}

.bulk-import-floating-field--combobox:not(.bulk-import-floating-field--shrink-label):not(:focus-within)
  [class*='ComboboxInputField']::placeholder {
  opacity: 0;
}

.bulk-import-preview-auto-resize-textarea {
  width: 100%;
  flex: 0 0 auto;
}

.bulk-import-preview-auto-resize-textarea textarea {
  field-sizing: content;
  overflow-y: hidden !important;
  resize: none !important;
}

.bulk-import-preview-pr-card {
  border: 1px solid var(--bui-border-1, #c7c7c7);
  border-radius: var(--bui-radius-2, 6px);
  background: ${bulkImportOpaqueSurfaceColor};
  overflow: hidden;
}

.bulk-import-preview-pr-card__title {
  margin: 0;
  padding: 1rem 1rem 0.25rem;
  font-size: 1.25rem;
  font-weight: 400;
  line-height: 1.5rem;
}

.bulk-import-preview-pr-card__subheader {
  margin: 0;
  padding: 0 1rem 0.75rem;
  font-size: 0.875rem;
  color: var(--bui-fg-secondary, #6a6e73);
}

.bulk-import-preview-pr-card__body {
  padding: 0 1rem 1rem;
  border-top: none;
}

.bulk-import-preview-pr-card__body > div {
  margin: 0;
}
`;

const LEGACY_STYLE_IDS = [
  'bulk-import-preview-drawer-field-styles',
  'bulk-import-preview-drawer-field-styles-v2',
  'bulk-import-preview-drawer-field-styles-v3',
  'bulk-import-preview-drawer-field-styles-v4',
];

export const injectPreviewDrawerFieldStyles = () => {
  if (typeof document === 'undefined') {
    return;
  }
  for (const id of LEGACY_STYLE_IDS) {
    if (id !== STYLE_ID) {
      document.getElementById(id)?.remove();
    }
  }
  const existing = document.getElementById(STYLE_ID);
  if (existing) {
    existing.textContent = PREVIEW_DRAWER_FIELD_STYLES;
    return;
  }
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = PREVIEW_DRAWER_FIELD_STYLES;
  document.head.appendChild(style);
};
