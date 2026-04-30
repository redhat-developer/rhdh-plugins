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
import { useState, useCallback } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { augmentApiRef } from '../../api';
import { useDocuments } from '../../hooks';

export interface UseStoreDocumentsParams {
  selectedStoreId: string | null;
  onRefresh: () => void;
}

export function useStoreDocuments({
  selectedStoreId,
  onRefresh,
}: UseStoreDocumentsParams) {
  const api = useApi(augmentApiRef);
  const {
    documents,
    loading: docsLoading,
    error: docsError,
    refresh: refreshDocs,
  } = useDocuments(selectedStoreId);

  const [deleteInProgress, setDeleteInProgress] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = useCallback(
    async (fileId: string) => {
      setDeleteInProgress(fileId);
      setDeleteError(null);
      try {
        await api.deleteDocument(fileId, selectedStoreId ?? undefined);
      } catch (err) {
        setDeleteError(
          err instanceof Error ? err.message : 'Failed to delete document',
        );
        return;
      } finally {
        setDeleteInProgress(null);
      }
      await refreshDocs();
      onRefresh();
    },
    [api, refreshDocs, selectedStoreId, onRefresh],
  );

  return {
    documents,
    docsLoading,
    docsError,
    refreshDocs,
    deleteInProgress,
    deleteError,
    handleDelete,
  };
}
