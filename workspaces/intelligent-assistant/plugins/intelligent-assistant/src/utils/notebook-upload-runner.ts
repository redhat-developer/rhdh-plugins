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

type UploadMutation = {
  mutateAsync: (args: {
    sessionId: string;
    file: File;
  }) => Promise<{ document_id: string }>;
};

type UploadCallbacks = {
  onUploading?: (files: File[]) => void;
  onStarted?: (info: { fileName: string; documentId: string }) => void;
  onFailed?: (fileName: string) => void;
};

export function runFileUploads(
  mutation: UploadMutation,
  sessionId: string,
  files: File[],
  callbacks: UploadCallbacks,
): void {
  callbacks.onUploading?.(files);
  for (const file of files) {
    mutation
      .mutateAsync({ sessionId, file })
      .then(data => {
        callbacks.onStarted?.({
          fileName: file.name,
          documentId: data.document_id,
        });
      })
      .catch(() => {
        callbacks.onFailed?.(file.name);
      });
  }
}
