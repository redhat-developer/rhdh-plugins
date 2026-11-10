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

import type { CSSProperties } from 'react';

/** Matches Material UI default `Typography` variant="h5". */
export const bulkImportTypographyH5: CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 400,
  lineHeight: 1.334,
  letterSpacing: '0em',
  margin: 0,
};

/** Matches Material UI default `Typography` variant="h6". */
export const bulkImportTypographyH6: CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 500,
  lineHeight: 1.6,
  letterSpacing: '0.0075em',
  margin: 0,
};

/** Subsection titles in the preview PR drawer (below main h6 section headers). */
export const bulkImportTypographyPreviewSection: CSSProperties = {
  fontSize: '1rem',
  fontWeight: 400,
  lineHeight: 1.5,
  margin: 0,
};

/** Matches add-repositories approval tool title (`fontSize="14px" fontWeight="500"`). */
export const bulkImportTypographyApprovalToolTitle: CSSProperties = {
  fontSize: '14px',
  fontWeight: 500,
  lineHeight: 1.5,
  margin: 0,
};

/** Matches Material UI `Typography` variant="h3" on the missing-config empty state. */
export const bulkImportTypographyH3: CSSProperties = {
  fontSize: '2rem',
  fontWeight: 400,
  lineHeight: 1.167,
  letterSpacing: '0em',
  margin: '0 0 1rem 0',
};

/** Table / status cell body text (0.875rem). */
export const bulkImportTypographyBody2: CSSProperties = {
  fontSize: '0.875rem',
  lineHeight: '1.5rem',
  fontWeight: 400,
  margin: 0,
};

/** Toolbar titles such as "Selected repositories (N)" on add-repositories tables. */
export const bulkImportTypographyTableToolbarTitle: CSSProperties = {
  fontSize: '1.125rem',
  fontWeight: 600,
  lineHeight: '1.5rem',
  margin: 0,
};

export const bulkImportTypographySecondary: CSSProperties = {
  ...bulkImportTypographyBody2,
  color: 'var(--bui-fg-secondary, #6a6e73)',
};
