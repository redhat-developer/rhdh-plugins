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

import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';

import { notebooksApiRef } from '../../api/notebooksApi';
import { NOTEBOOK_EXTENSION_TO_FILE_TYPE } from '../../const';
import { UploadDocumentResponse } from '../../types';

type UploadDocumentParams = {
  sessionId: string;
  file: File;
};

const getFileType = (fileName: string): string => {
  const lastDot = fileName.lastIndexOf('.');
  const ext = lastDot >= 0 ? fileName.slice(lastDot).toLowerCase() : '';
  return NOTEBOOK_EXTENSION_TO_FILE_TYPE[ext] ?? 'txt';
};

export const useUploadDocument = (): UseMutationResult<
  UploadDocumentResponse,
  Error,
  UploadDocumentParams
> => {
  const notebooksApi = useApi(notebooksApiRef);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, file }: UploadDocumentParams) => {
      const fileType = getFileType(file.name);
      return notebooksApi.uploadDocument(sessionId, file, fileType, file.name);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['notebooks', 'documents', variables.sessionId],
      });
    },
  });
};
