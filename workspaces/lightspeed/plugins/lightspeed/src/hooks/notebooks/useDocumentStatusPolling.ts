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

import { useApi } from '@backstage/core-plugin-api';

import { useQueries } from '@tanstack/react-query';

import { notebooksApiRef } from '../../api/notebooksApi';
import { DocumentStatus } from '../../types';

export type PendingUpload = {
  fileName: string;
  documentId: string;
};

export type DocumentPollingResult = {
  fileName: string;
  documentId: string;
  status: DocumentStatus['status'] | 'polling';
};

const POLL_INTERVAL_MS = 3000;

export const useDocumentStatusPolling = (
  sessionId: string,
  pendingUploads: PendingUpload[],
): DocumentPollingResult[] => {
  const notebooksApi = useApi(notebooksApiRef);

  const results = useQueries({
    queries: pendingUploads.map(upload => ({
      queryKey: ['notebooks', 'documentStatus', sessionId, upload.documentId],
      queryFn: () =>
        notebooksApi.getDocumentStatus(sessionId, upload.documentId),
      refetchInterval: (query: {
        state: { data?: DocumentStatus; status: string };
      }) => {
        if (query.state.status === 'error') {
          return false;
        }
        const status = query.state.data?.status;
        if (
          status === 'completed' ||
          status === 'failed' ||
          status === 'cancelled'
        ) {
          return false;
        }
        return POLL_INTERVAL_MS;
      },
      retry: 2,
      enabled: Boolean(upload.documentId),
    })),
  });

  return pendingUploads.map((upload, index) => {
    const result = results[index];
    const dataStatus = result?.data?.status;
    const isQueryError = result?.isError;
    return {
      fileName: upload.fileName,
      documentId: upload.documentId,
      status: isQueryError ? 'failed' : (dataStatus ?? 'polling'),
    };
  });
};
