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

type MonacoEnvironmentLike = {
  getWorker?: (workerId: string, label: string) => Worker;
  getWorkerUrl?: (workerId: string, label: string) => string;
};

/**
 * Configures Monaco to use only the base editor worker.
 *
 * PatternFly's `@patternfly/chatbot/monaco-environment` also wires JSON/CSS/HTML/
 * TypeScript language workers. Those dominate app chunk size (~6MB for the TS
 * worker alone) and are unnecessary for chat attachment preview/edit.
 *
 * Call before opening PreviewAttachment / AttachmentEdit (CodeModal).
 */
export function ensureMonacoEditorWorkerEnvironment(): void {
  if (typeof globalThis === 'undefined') {
    return;
  }

  const globalWithMonaco = globalThis as typeof globalThis & {
    MonacoEnvironment?: MonacoEnvironmentLike;
  };

  if (
    globalWithMonaco.MonacoEnvironment?.getWorker ||
    globalWithMonaco.MonacoEnvironment?.getWorkerUrl
  ) {
    return;
  }

  globalWithMonaco.MonacoEnvironment = {
    getWorker(_workerId: string, _label: string) {
      // Always the base editor worker. Relative path reaches the workspace
      // `node_modules/monaco-editor` from `src/` (and `dist/` after package build).
      // Must stay as inline `new URL` so webpack/rspack emit a worker chunk.
      return new Worker(
        new URL(
          '../../../node_modules/monaco-editor/esm/vs/editor/editor.worker.js',
          import.meta.url,
        ),
        { type: 'module' },
      );
    },
  };
}
