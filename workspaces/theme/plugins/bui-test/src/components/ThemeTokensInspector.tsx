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

import { useEffect, useMemo, useState } from 'react';
import {
  CellText,
  ColumnConfig,
  Table,
  TableItem,
  useTable,
} from '@backstage/ui';

const BUI_TOKENS = [
  { name: 'primary', cssVar: '--bui-bg-solid' },
  { name: 'warning', cssVar: '--bui-fg-warning' },
  { name: 'error', cssVar: '--bui-fg-danger' },
  { name: 'success', cssVar: '--bui-fg-success' },
  { name: 'info', cssVar: '--bui-fg-info' },
  { name: 'fontFamily', cssVar: '--bui-font-regular' },
  { name: 'fontFamilyMonospace', cssVar: '--bui-font-monospace' },
  { name: 'borderColor', cssVar: '--bui-border-1' },
  { name: 'backgroundColor', cssVar: '--bui-bg-neutral-1' },
  { name: 'foregroundPrimary', cssVar: '--bui-fg-primary' },
  { name: 'foregroundSecondary', cssVar: '--bui-fg-secondary' },
  { name: 'foregroundDisabled', cssVar: '--bui-fg-disabled' },
  { name: 'focusRing', cssVar: '--bui-ring' },
  { name: 'shadow', cssVar: '--bui-shadow' },
  { name: '(bg-app)', cssVar: '--bui-bg-app' },
  { name: '(bg-solid-hover)', cssVar: '--bui-bg-solid-hover' },
  { name: '(bg-solid-pressed)', cssVar: '--bui-bg-solid-pressed' },
  { name: '(border-2)', cssVar: '--bui-border-2' },
  { name: '(fg-solid)', cssVar: '--bui-fg-solid' },
  { name: '(bg-solid-disabled)', cssVar: '--bui-bg-solid-disabled' },
  { name: '(fg-solid-disabled)', cssVar: '--bui-fg-solid-disabled' },
];

interface TokenRow extends TableItem {
  name: string;
  cssVar: string;
  value: string;
}

const columnConfig: ColumnConfig<TokenRow>[] = [
  {
    id: 'name',
    label: 'Token',
    cell: item => <CellText title={item.name} />,
    isRowHeader: true,
  },
  {
    id: 'cssVar',
    label: 'CSS Variable',
    cell: item => <CellText title={item.cssVar} />,
  },
  {
    id: 'value',
    label: 'Computed Value',
    cell: item => <CellText title={item.value || '(not set)'} />,
  },
];

export const ThemeTokensInspector = () => {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const styles = window.getComputedStyle(document.documentElement);
    const result: Record<string, string> = {};
    for (const t of BUI_TOKENS) {
      result[t.cssVar] = styles.getPropertyValue(t.cssVar).trim();
    }
    setValues(result);
  }, []);

  const data = useMemo<TokenRow[]>(
    () =>
      BUI_TOKENS.map((t, index) => ({
        id: String(index),
        name: t.name,
        cssVar: t.cssVar,
        value: values[t.cssVar] ?? '',
      })),
    [values],
  );

  const { tableProps } = useTable({ mode: 'complete', data });

  return <Table columnConfig={columnConfig} {...tableProps} />;
};
