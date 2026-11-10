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

const repositoriesTableRowBorder: Pick<CSSProperties, 'borderBottom'> = {
  borderBottom: '1px solid var(--bui-border-1)',
};

export const repositoriesTableCellStyle: CSSProperties = {
  lineHeight: '1.5rem',
  fontSize: '0.875rem',
  padding: '15px 16px 15px 6px',
  textAlign: 'left',
  verticalAlign: 'middle',
  fontWeight: 400,
  ...repositoriesTableRowBorder,
};

export const repositoriesTableOrgCellStyle: CSSProperties = {
  ...repositoriesTableCellStyle,
  padding: '15px 16px 15px 24px',
};

export const repositoriesTableHeaderCellStyle: CSSProperties = {
  lineHeight: '1.5rem',
  fontSize: '0.875rem',
  padding: repositoriesTableCellStyle.padding,
  textAlign: 'left',
  fontWeight: 700,
  ...repositoriesTableRowBorder,
};

export const repositoriesTableOrgHeaderCellStyle: CSSProperties = {
  ...repositoriesTableHeaderCellStyle,
  padding: repositoriesTableOrgCellStyle.padding,
};

export const repositoriesTableRootStyle: CSSProperties = {
  minWidth: 750,
  width: '100%',
  borderCollapse: 'collapse',
};

export const repositoriesTableContainerStyle: CSSProperties = {
  padding: '0 24px var(--bui-space-3)',
  height: '100%',
  width: '100%',
  boxSizing: 'border-box',
};

export const repositoriesTableToolbarLayoutStyle: CSSProperties = {
  paddingTop: '14px',
  paddingBottom: '14px',
  width: '100%',
  boxSizing: 'border-box',
};

export const repositoriesTableToolbarTitleStyle: CSSProperties = {
  flex: '1 1 100%',
  minWidth: 0,
};

/** Replaces former MUI Paper around table panels (border + light elevation). */
export const repositoriesTablePanelStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid var(--bui-border-1)',
  borderRadius: 'var(--bui-radius-2, 6px)',
  boxShadow: 'var(--bui-shadow-1)',
  overflow: 'hidden',
};

/** Column width hints for the four-column add-repositories layout. */
export const repositoriesTableFixedColumnCss = `
  .bulk-import-repositories-table th:nth-child(1),
  .bulk-import-repositories-table td:nth-child(1) {
    width: 20%;
  }
  .bulk-import-repositories-table th:nth-child(2),
  .bulk-import-repositories-table td:nth-child(2) {
    width: 30%;
  }
  .bulk-import-repositories-table th:nth-child(3),
  .bulk-import-repositories-table td:nth-child(3) {
    width: 20%;
  }
  .bulk-import-repositories-table th:nth-child(4),
  .bulk-import-repositories-table td:nth-child(4) {
    width: 30%;
  }
`;
