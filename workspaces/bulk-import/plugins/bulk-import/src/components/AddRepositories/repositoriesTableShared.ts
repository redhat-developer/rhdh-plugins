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
/** Compact BUI TablePagination: tighter row-size select and even gaps between controls. */
export const bulkImportTablePaginationCss = `
.bulk-import-table-pagination {
  width: 100%;
  box-sizing: border-box;
  padding: var(--bui-space-2, 0.5rem) var(--bui-space-6, 1.5rem)
    var(--bui-space-3, 0.75rem);
  display: flex;
  justify-content: flex-end;
}

.bulk-import-table-pagination > [class*='bui-TablePagination'] {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--bui-space-4, 1rem);
  width: auto;
  max-width: 100%;
  padding-top: 0;
}

.bulk-import-table-pagination [class*='bui-TablePaginationLeft'],
.bulk-import-table-pagination [class*='bui-TablePaginationRight'] {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: var(--bui-space-3, 0.75rem);
  flex: 0 0 auto;
}

.bulk-import-table-pagination [class*='bui-TablePaginationSelect'] {
  flex: 0 0 auto;
  width: auto;
  min-width: 7.75rem;
  max-width: 11rem;
}

.bulk-import-table-pagination
  [class*='bui-TablePaginationSelect']
  > [class*='bui-Select']:not([class*='Popover']) {
  width: 100%;
  min-width: 100%;
  flex: 0 0 auto;
}

.bulk-import-table-pagination
  [class*='bui-TablePaginationSelect']
  [class*='SelectTrigger'] {
  min-height: 2rem;
  font-size: 0.8125rem;
}

.bulk-import-table-pagination
  [class*='bui-TablePaginationSelect']
  [class*='SelectValue'] {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bulk-import-table-pagination [class*='bui-TablePaginationRight'] p {
  margin: 0;
  white-space: nowrap;
  font-size: 0.8125rem;
  line-height: 1.25rem;
}

.bulk-import-table-pagination [class*='bui-TablePaginationRight'] [class*='ButtonIcon'] {
  width: 2rem;
  height: 2rem;
  min-width: 2rem;
}
`;

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
