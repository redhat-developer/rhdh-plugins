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
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { KagentiToolSummary } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { AugmentApi } from '../../../api';
import { getErrorMessage } from '../../../utils';

export type SortField =
  | 'name'
  | 'namespace'
  | 'status'
  | 'workloadType'
  | 'createdAt';
export type SortDir = 'asc' | 'desc';

function compareTools(
  a: KagentiToolSummary,
  b: KagentiToolSummary,
  field: SortField,
): number {
  const valA = a[field] ?? '';
  const valB = b[field] ?? '';
  if (field === 'createdAt') {
    return new Date(valA || 0).getTime() - new Date(valB || 0).getTime();
  }
  return String(valA).localeCompare(String(valB));
}

export function useKagentiToolsList(api: AugmentApi, namespace?: string) {
  const [tools, setTools] = useState<KagentiToolSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const loadTools = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .listKagentiTools(namespace || undefined)
      .then(res => setTools(res.tools ?? []))
      .catch(e => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [api, namespace]);

  useEffect(() => {
    loadTools();
  }, [loadTools]);

  const sortedTools = useMemo(() => {
    let list = tools;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        t =>
          t.name.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)),
      );
    }
    const sorted = [...list].sort((a, b) => compareTools(a, b, sortField));
    return sortDir === 'desc' ? sorted.reverse() : sorted;
  }, [tools, search, sortField, sortDir]);

  const handleSort = useCallback((field: SortField) => {
    setSortField(prevField => {
      if (prevField === field) {
        setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
        return prevField;
      }
      setSortDir('asc');
      return field;
    });
  }, []);

  return {
    tools,
    loading,
    error,
    setError,
    loadTools,
    search,
    setSearch,
    sortField,
    sortDir,
    handleSort,
    sortedTools,
  };
}
